/* Stáhne oficiální produktové fotky z URL uvedených u produktů (pole `productUrl`).
 * Běží v prostředí s otevřenou sítí (GitHub Actions) — NE v sandboxu.
 *   node build/fetch-product-images.mjs            # jen chybějící
 *   node build/fetch-product-images.mjs --force    # přestáhnout vše
 *   node build/fetch-product-images.mjs --limit 20 # jen prvních N
 *
 * Postup pro každý produkt s productUrl:
 *   1) zkusí Shopify JSON  (<url>.json → product.images[0].src)
 *   2) jinak og:image z HTML
 * Uloží do build/assets/img/products/<slug>.<ext> a doplní atribuci do dat.
 * Fotky výrobců jsou autorsky chráněné — použití je na odpovědnosti provozovatele.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data', 'products.json');
const OUT = join(ROOT, 'build', 'assets', 'img', 'products');
mkdirSync(OUT, { recursive: true });

const FORCE = process.argv.includes('--force');
const li = process.argv.indexOf('--limit');
const LIMIT = li > -1 ? parseInt(process.argv[li + 1], 10) : Infinity;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const EXTS = ['webp', 'avif', 'jpg', 'jpeg', 'png'];

const products = JSON.parse(readFileSync(DATA, 'utf8'));

async function get(url, accept) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    return await fetch(url, { headers: { 'User-Agent': UA, Accept: accept || '*/*', 'Accept-Language': 'en' }, redirect: 'follow', signal: ctrl.signal });
  } finally { clearTimeout(t); }
}
function extFor(ct) { ct = ct || ''; if (/png/.test(ct)) return 'png'; if (/webp/.test(ct)) return 'webp'; if (/avif/.test(ct)) return 'avif'; return 'jpg'; }

// Z JSON-LD (schema.org Product) vytáhne obrázek — to bývá skutečný packshot,
// ne marketingový/lifestyle og:image.
function jsonLdImage(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const pick = (v) => {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) { for (const x of v) { const r = pick(x); if (r) return r; } return null; }
    if (typeof v === 'object') return v.url || v.contentUrl || null;
    return null;
  };
  const scan = (node) => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) { for (const n of node) { const r = scan(n); if (r) return r; } return null; }
    const t = node['@type'];
    const isProduct = t === 'Product' || (Array.isArray(t) && t.includes('Product'));
    if (isProduct && node.image) { const r = pick(node.image); if (r) return r; }
    for (const k of ['@graph', 'mainEntity', 'itemListElement', 'hasVariant']) { if (node[k]) { const r = scan(node[k]); if (r) return r; } }
    return null;
  };
  for (const b of blocks) {
    let data; try { data = JSON.parse(b[1].trim()); } catch { continue; }
    const r = scan(data);
    if (r) return r;
  }
  return null;
}

async function findImage(productUrl) {
  const base = productUrl.replace(/[?#].*$/, '').replace(/\/$/, '');
  let ogFallback = null;
  // 1) JSON-LD Product.image (nejspolehlivější packshot)
  try {
    const r = await get(productUrl, 'text/html');
    if (r.ok) {
      const html = await r.text();
      const ld = jsonLdImage(html);
      if (ld) return ld;
      const m = html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
        || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      if (m) ogFallback = m[1];
    }
  } catch {}
  // 2) Shopify product JSON
  try {
    const r = await get(base + '.json', 'application/json');
    if (r.ok) { const d = await r.json(); const src = d?.product?.images?.[0]?.src; if (src) return src.split('?')[0]; }
  } catch {}
  // 3) og:image (nouzově — může být banner/lifestyle)
  return ogFallback;
}

let ok = 0, skip = 0, fail = 0, changed = false, done = 0;
for (const p of products) {
  const url = p.productUrl || (p.image && p.image.productUrl);
  if (!url) continue;
  if (done >= LIMIT) break;
  const existing = EXTS.map((e) => join(OUT, `${p.slug}.${e}`)).find((f) => existsSync(f));
  if (existing && !FORCE) { skip++; continue; }
  done++;
  try {
    const imgUrl = await findImage(url);
    if (!imgUrl) { console.log('✗ bez obrázku:', p.slug); fail++; continue; }
    const abs = imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl;
    const r = await get(abs, 'image/*');
    if (!r.ok) { console.log('✗ stažení', r.status + ':', p.slug); fail++; continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 2000) { console.log('✗ příliš malé:', p.slug); fail++; continue; }
    const ext = extFor(r.headers.get('content-type'));
    writeFileSync(join(OUT, `${p.slug}.${ext}`), buf);
    p.image = Object.assign({}, p.image, { src: `/assets/img/products/${p.slug}.${ext}`, alt: p.name, type: 'photo', source: 'výrobce (oficiální)', sourceUrl: url });
    changed = true; ok++;
    console.log('✓', p.slug, `${(buf.length / 1024) | 0} kB`);
  } catch (e) { console.log('✗ chyba:', p.slug, e.message); fail++; }
}
if (changed) writeFileSync(DATA, JSON.stringify(products, null, 2) + '\n');
console.log(`\nHotovo — staženo: ${ok}, přeskočeno: ${skip}, selhalo: ${fail}.`);
