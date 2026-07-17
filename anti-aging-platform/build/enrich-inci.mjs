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
const STOP = new Set(['ml', 'g', 'serum', 'pletove', 'plet', 'pro', 'a', 's', 'na', 'the', 'of']);
const toks = (s) => norm(s).split(' ').filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t));

/* Najde na incidecoderu URL produktu nejlépe odpovídajícího názvu. */
async function findProduct(name) {
  const q = encodeURIComponent(name.replace(/\d+\s*ml|\d+\s*g/gi, '').trim());
  const { html } = await fetchText(`https://incidecoder.com/search?query=${q}`);
  if (!html) return null;
  const wanted = toks(name);
  const brand = wanted[0];
  const re = /href="(\/products\/[a-z0-9-]+)"[^>]*>([^<]{3,120})</gi;
  let m, best = null;
  while ((m = re.exec(html))) {
    const href = m[1];
    const text = m[2].replace(/\s+/g, ' ').trim();
    const hay = new Set(toks(text + ' ' + href.replace(/-/g, ' ')));
    if (brand && !hay.has(brand)) continue;                 // značka musí sedět
    const hit = wanted.filter((t) => hay.has(t)).length;
    const score = wanted.length ? hit / wanted.length : 0;
    if (!best || score > best.score) best = { url: 'https://incidecoder.com' + href, text, score };
  }
  return best && best.score >= 0.45 ? best : null;
}

/* Z HTML produktové stránky vytáhne INCI text (nejdelší blok s Aqua/Water). */
function extractInci(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  // hledej sekvenci "Aqua/Water, ..., ..." — dlouhý seznam oddělený čárkami
  let best = '';
  for (const chunk of text.split(/\n|\.\s/)) {
    const t = chunk.replace(/\s+/g, ' ').trim();
    if (/\b(aqua|water|glycerin)\b/i.test(t) && (t.match(/,/g) || []).length > 6 && t.length > best.length) best = t.slice(0, 3000);
  }
  return best;
}

function detectActives(inci, name) {
  const hay = `${inci} ${name}`;
  const found = new Set();
  const matched = [];
  for (const [slug, re] of ACTIVE_PATTERNS) {
    if (re.test(hay)) { found.add(slug); matched.push(re.source); }
  }
  return { actives: [...found], matched };
}

const data = JSON.parse(readFileSync(FILE, 'utf8'));
const todo = data.products.filter((p) => !p.inciDone);
const limit = LIMIT > 0 ? Math.min(LIMIT, todo.length) : todo.length;
process.stdout.write(`Obohacení INCI: ${limit} z ${todo.length} (celkem ${data.products.length}).\n`);

let hit = 0, miss = 0;
for (let i = 0; i < limit; i++) {
  const p = todo[i];
  try {
    const found = await findProduct(p.name);
    if (!found) { p.inciDone = true; miss++; process.stdout.write(`  [${i + 1}/${limit}] ✗ ${p.name} (nenalezeno)\n`); await sleep(DELAY); continue; }
    const { html } = await fetchText(found.url);
    const inci = extractInci(html);
    const { actives, matched } = detectActives(inci, p.name);
    p.incidecoderUrl = found.url;
    p.inci = inci;
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
