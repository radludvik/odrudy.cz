/* Fotkový scraper (běží LOKÁLNĚ u tebe na Macu přes Playwright/Chromium).
 *
 * Pro produkty bez skutečné fotky dohledá packshot přes Bing Images a stáhne
 * ho do build/assets/img/products/<slug>.<ext>. Do products.json zapíše
 * image.src, alt, source a sourceUrl (stránku, ze které fotka pochází).
 *
 * PROČ Bing: ve výsledcích jsou přímé odkazy na originály (atribut `m` u
 * a.iusc obsahuje JSON s `murl`), takže se dají spolehlivě vytáhnout.
 * PROČ lokálně: sandbox/CI weby výrobců i Bing blokují; tvůj prohlížeč projde.
 *
 * NEBERE fotky z Heureky (im9.cz apod.) — jejich affiliate podmínky použití
 * fotek nedovolují. Bere jen z webů výrobců/prodejců.
 *
 * Je RESUMOVATELNÝ: přeskočí produkty, které už soubor s fotkou mají.
 *
 * Env:
 *   LIMIT  – kolik produktů max zpracovat za běh (0 = vše, výchozí 40)
 *   DELAY  – prodleva mezi produkty v ms (výchozí 2500)
 *   ONLY   – zpracovat jen produkt s tímto slugem (ladění)
 *   FORCE  – 1 = přepsat i produkty, které fotku už mají
 *   HEADLESS – 1 = bez okna (výchozí 0, s oknem = spolehlivější)
 */
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

chromium.use(stealth());

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PF = join(ROOT, 'data/products.json');
const IMGDIR = join(ROOT, 'build/assets/img/products');
const LIMIT = Number(process.env.LIMIT || 40);
const DELAY = Number(process.env.DELAY || 2500);
const ONLY = process.env.ONLY || '';
const FORCE = process.env.FORCE === '1';
const HEADLESS = process.env.HEADLESS === '1';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Domény, ze kterých fotky NEBEREME: Heureka CDN (affiliate podmínky) a
 * agregátory s nespolehlivou kvalitou/licencí. */
const BLOCK = /(^|\.)(im9\.cz|heureka|heurekashopping|favim|lookaside|fbcdn|pinimg|pinterest|aliexpress|alicdn|ebayimg|dhresource|wixstatic\.com\/media\/.*_\d+x\d+)/i;
/* Preferované zdroje (výrobci/velcí prodejci) — dostanou přednost. */
const PREFER = /(notino|douglas|sephora|cultbeauty|lookfantastic|beautybay|feelunique|dm\.|drmax|benu|pilulka|iherb|yesstyle|stylevana|olivemarket|oliveyoung|shopify|cdn\.shopify|mykotva|krasa|allbeauty|skinstore|dermstore|boots\.com)/i;

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const extFromType = (ct, url) => {
  if (/jpeg|jpg/i.test(ct)) return 'jpg';
  if (/png/i.test(ct)) return 'png';
  if (/webp/i.test(ct)) return 'webp';
  if (/avif/i.test(ct)) return 'avif';
  if (/gif/i.test(ct)) return 'gif';
  const m = (url.split('?')[0].match(/\.(jpe?g|png|webp|avif)(?:$)/i) || [])[1];
  return m ? m.toLowerCase().replace('jpeg', 'jpg') : 'jpg';
};

const products = JSON.parse(readFileSync(PF, 'utf8'));
const existing = new Set(readdirSync(IMGDIR));
const rasterBase = new Set(
  [...existing].filter((f) => /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(f)).map((f) => f.replace(/\.[^.]+$/, ''))
);

/* Které produkty potřebují fotku: reálná značka, zatím žádný rastrový soubor. */
function needsPhoto(p) {
  if (ONLY) return p.slug === ONLY;
  const brand = (p.brand || '').trim();
  if (!brand || brand === '—') return false;                 // obecné/ilustrační stránky vynech
  if (!FORCE && rasterBase.has(p.slug)) return false;         // fotku už máme
  return true;
}

/* Dotaz pro Bing: značka + název bez duplikace značky, bez balastu. */
function queryFor(p) {
  let name = p.name || '';
  const brand = (p.brand || '').trim();
  if (brand && norm(name).startsWith(norm(brand))) name = name.slice(brand.length).trim();
  const q = `${brand} ${name}`.replace(/\s+/g, ' ').trim();
  return q;
}

/* Vytáhne kandidátní URL originálů z výsledků Bing Images. */
async function candidates(page, query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await sleep(1500);
  // odklikni případný cookies souhlas
  for (const label of [/accept|souhlas|přijmout|agree/i]) {
    try { const b = page.locator('button, a').filter({ hasText: label }); if (await b.count()) await b.first().click({ timeout: 1500 }).catch(() => {}); } catch { /* ignore */ }
  }
  await sleep(800);
  return page.evaluate(() => {
    const out = [];
    for (const a of Array.from(document.querySelectorAll('a.iusc'))) {
      const m = a.getAttribute('m');
      if (!m) continue;
      try {
        const j = JSON.parse(m);
        if (j.murl) out.push({ murl: j.murl, purl: j.purl || '', w: j.mw || 0, h: j.mh || 0 });
      } catch { /* ignore */ }
    }
    return out;
  });
}

/* Stáhne obrázek z URL přes kontext prohlížeče (nese UA/cookies). */
async function download(ctx, imgUrl, referer) {
  try {
    const res = await ctx.request.get(imgUrl, {
      headers: { 'user-agent': UA, accept: 'image/avif,image/webp,image/*,*/*', ...(referer ? { referer } : {}) },
      timeout: 20000,
    });
    if (!res.ok()) return null;
    const ct = res.headers()['content-type'] || '';
    if (!/^image\//i.test(ct)) return null;
    const buf = await res.body();
    if (buf.length < 6000) return null;                        // moc malé = ikonka/placeholder
    return { buf, ext: extFromType(ct, imgUrl) };
  } catch { return null; }
}

const browser = await chromium.launch({ headless: HEADLESS, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1366, height: 900 }, locale: 'cs-CZ' });
const page = await ctx.newPage();

const todo = products.filter(needsPhoto);
const limit = LIMIT > 0 ? Math.min(LIMIT, todo.length) : todo.length;
process.stdout.write(`Fotky k dohledání: ${limit} z ${todo.length} (celkem produktů ${products.length}).\n`);

let ok = 0, fail = 0;
for (let i = 0; i < limit; i++) {
  const p = todo[i];
  const q = queryFor(p);
  process.stdout.write(`\n[${i + 1}/${limit}] ${p.name}\n  hledám: "${q}"\n`);
  try {
    let cands = await candidates(page, q);
    // seřaď: preferované zdroje první, pak větší rozměr; vyhoď blokované
    cands = cands
      .filter((c) => c.murl && !BLOCK.test(c.murl) && !BLOCK.test(c.purl))
      .sort((a, b) => (PREFER.test(b.purl) - PREFER.test(a.purl)) || ((b.w * b.h) - (a.w * a.h)));
    if (!cands.length) { process.stdout.write('  ✗ žádní kandidáti\n'); fail++; await sleep(DELAY); continue; }

    let saved = null;
    for (const c of cands.slice(0, 10)) {
      const dl = await download(ctx, c.murl, c.purl);
      if (dl) { saved = { ...dl, from: c.purl || c.murl, src: c.murl }; break; }
    }
    if (!saved) { process.stdout.write('  ✗ nic se nepodařilo stáhnout\n'); fail++; await sleep(DELAY); continue; }

    const file = `${p.slug}.${saved.ext}`;
    writeFileSync(join(IMGDIR, file), saved.buf);
    p.image = {
      src: `/assets/img/products/${file}`,
      alt: p.name,
      type: 'photo',
      source: 'prodejce/výrobce (web)',
      sourceUrl: saved.from,
    };
    writeFileSync(PF, JSON.stringify(products, null, 2) + '\n');   // ukládej průběžně
    ok++;
    process.stdout.write(`  ✓ uloženo ${file} (${Math.round(saved.buf.length / 1024)} kB) ze ${saved.from}\n`);
    await sleep(DELAY);
  } catch (e) {
    process.stdout.write(`  chyba: ${e.message}\n`);
    fail++;
  }
}

writeFileSync(PF, JSON.stringify(products, null, 2) + '\n');
process.stdout.write(`\nHotovo — staženo: ${ok}, nepovedlo se: ${fail}. Zbývá bez fotky: ${products.filter(needsPhoto).length - ok < 0 ? 0 : products.filter(needsPhoto).length}.\n`);
await browser.close();
