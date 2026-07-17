/* Obohacení produktů o složení (INCI) z incidecoder.com — běží na CI.
 *
 * Sandbox i Heureka jsou blokované, ale CI runner na incidecoder dosáhne.
 * Pro každý produkt z data/heureka-category.json (bez zjištěného složení):
 *   1) vyhledá ho na incidecoder.com/search
 *   2) vybere nejlepší shodu (musí sedět značka)
 *   3) stáhne INCI z jeho stránky
 *   4) z INCI rozpozná sledované účinné látky (mapování níže)
 * Zapisuje: actives[], inciMatched[], incidecoderUrl, inci (surové), detailDone.
 * Ukládá průběžně a je RESUMOVATELNÝ (přeskočí už hotové).
 *
 * Env: FILE (výchozí data/heureka-category.json), LIMIT (0=vše), DELAY (ms).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = process.env.FILE || 'anti-aging-platform/data/heureka-category.json';
const LIMIT = Number(process.env.LIMIT || 0);
const DELAY = Number(process.env.DELAY || 800);
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Sledované účinné látky → INCI vzory (regexy) pro rozpoznání ve složení. */
const ACTIVE_PATTERNS = [
  ['retinol', /\bretinol\b/i],
  ['retinol', /\bretinal\b|retinaldehyde/i],           // retinal → mapujeme na retinoidy (retinol)
  ['retinol', /hydroxypinacolone retinoate|retinyl retinoate|granactive/i],
  ['niacinamid', /\bniacinamide\b/i],
  ['vitamin-c', /ascorbic acid|ascorbyl|ascorbate|ethyl ascorb/i],
  ['kyselina-hyaluronova', /hyaluron/i],               // Hyaluronic Acid / Sodium Hyaluronate
  ['peptidy', /peptide|tripeptide|hexapeptide|oligopeptide|polypeptide/i],
  ['pdrn', /\bpdrn\b|sodium dna|polynucleotide|deoxyribonucleic/i],
  ['centella', /centella|madecass|asiaticoside|cica/i],
  ['azelaova-kyselina', /azelaic|azeloyl/i],
];

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html', 'accept-language': 'en,cs' }, redirect: 'follow' });
  if (!res.ok) return { status: res.status, html: '' };
  return { status: res.status, html: await res.text() };
}

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
/* České/obecné výplňové slovo → do dotazu i skóre nepatří (kazí hledání). */
const STOP = new Set(['ml', 'g', 'serum', 'sera', 'emulze', 'koncentrat', 'koncentrovane', 'pletove', 'pletovy', 'plet', 'pleti',
  'pro', 'a', 's', 'na', 'the', 'of', 'nocni', 'denni', 'krem', 'krema', 'maska', 'proti', 'starnuti', 'vraskam', 'vrasek',
  'vraskach', 'omlazujici', 'intenzivni', 'hydratacni', 'vyplneni', 'hlubokych', 'ucinkem', 'ucinky', 'ampule', 'esence',
  'kyselinou', 'kyselina', 'vyzivujici', 'zpevnujici', 'liftingove', 'rozjasnujici', 'regeneracni', 'vitaminem', 'obsahem']);
const toks = (s) => norm(s).split(' ').filter((t) => t && !STOP.has(t));

/* Najde na incidecoderu URL produktu. Nejdřív zkusí přímý slug
 * (brand-model → /products/brand-model), pak vyhledávání jako zálohu. */
async function findProduct(name) {
  const base = toks(name);                                   // [medik8, crystal, retinal, 3]
  // 1) přímé slugy (zkus i bez posledního čísla)
  const cands = [base.join('-')];
  if (/^\d+$/.test(base[base.length - 1])) cands.push(base.slice(0, -1).join('-'));
  for (const slug of cands) {
    if (slug.length < 4) continue;
    const r = await fetchText(`https://incidecoder.com/products/${slug}`);
    if (r.status === 200 && /href="\/ingredients\//.test(r.html)) return { url: `https://incidecoder.com/products/${slug}`, direct: true, html: r.html };
  }
  // 2) vyhledávání
  const query = base.filter((t) => !/^\d+$/.test(t) || t.length <= 4).join(' ');
  const { html } = await fetchText(`https://incidecoder.com/search?query=${encodeURIComponent(query)}`);
  if (!html) return null;
  const wanted = toks(name);
  const brand = wanted[0];
  // zachytíme celý obsah <a> (i s vnořenými značkami) a značky odstraníme
  const re = /<a\s+href="(\/products\/[a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m, best = null;
  while ((m = re.exec(html))) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hay = new Set(toks(text + ' ' + href.replace(/-/g, ' ')));
    if (brand && !hay.has(brand)) continue;                 // značka musí sedět
    const hit = wanted.filter((t) => hay.has(t)).length;
    const score = wanted.length ? hit / wanted.length : 0;
    if (!best || score > best.score) best = { url: 'https://incidecoder.com' + href, text, score };
  }
  return best && best.score >= 0.5 ? best : null;
}

/* Seznam složek z produktové stránky — každá je odkaz /ingredients/<slug>. */
function extractIngredients(html) {
  const names = [];
  const re = /<a\s+href="\/ingredients\/[a-z0-9-]+"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const t = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (t.length >= 2 && t.length <= 60) names.push(t);
  }
  return [...new Set(names)];
}

/* Celý viditelný text stránky (bez skriptů) — záloha pro detekci látek. */
function pageText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ');
}

function detectActives(ingredients, name, fullText) {
  // primárně ze seznamu složek; když je krátký, doplň z celého textu stránky
  const hay = `${ingredients.join(', ')} ${name} ${ingredients.length < 5 ? fullText : ''}`;
  const found = new Set();
  const matched = [];
  for (const [slug, re] of ACTIVE_PATTERNS) {
    if (re.test(hay)) { found.add(slug); matched.push(re.source); }
  }
  return { actives: [...found], matched };
}

const FORCE = process.env.FORCE === '1';
const ONLY_MISS = process.env.ONLY_MISS === '1';  // znovu jen ty, co se nenašly
const data = JSON.parse(readFileSync(FILE, 'utf8'));
const todo = data.products.filter((p) => FORCE || !p.inciDone || (ONLY_MISS && !p.incidecoderUrl));
const limit = LIMIT > 0 ? Math.min(LIMIT, todo.length) : todo.length;
process.stdout.write(`Obohacení INCI: ${limit} z ${todo.length} (celkem ${data.products.length}).\n`);

let hit = 0, miss = 0;
for (let i = 0; i < limit; i++) {
  const p = todo[i];
  try {
    const found = await findProduct(p.name);
    if (!found) { p.inciDone = true; miss++; process.stdout.write(`  [${i + 1}/${limit}] ✗ ${p.name} (nenalezeno)\n`); await sleep(DELAY); continue; }
    const html = found.html || (await fetchText(found.url)).html;
    const ingredients = extractIngredients(html);
    const { actives, matched } = detectActives(ingredients, p.name, pageText(html));
    p.incidecoderUrl = found.url;
    p.inci = ingredients.join(', ').slice(0, 3000);
    p.actives = actives;
    p.inciMatched = matched;
    p.inciDone = true;
    hit++;
    if ((i + 1) % 10 === 0 || i === limit - 1) writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
    process.stdout.write(`  [${i + 1}/${limit}] ✓ ${p.name} → aktivní: [${actives.join(', ') || '—'}]\n`);
    await sleep(DELAY);
  } catch (e) {
    process.stdout.write(`  [${i + 1}/${limit}] chyba: ${e.message}\n`);
  }
}
writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
process.stdout.write(`\nHotovo — nalezeno na incidecoderu: ${hit}, nenalezeno: ${miss}. Uloženo do ${FILE}\n`);
