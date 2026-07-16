/* Spárování produktů databáze s produktovými stránkami na Heureka.cz.
 *
 * Pro každý produkt z data/products.json položí dotaz do vyhledávání
 * Heureky (brand + název), z výsledků vybere odkazy na produktové detaily
 * (<kategorie>.heureka.cz/<slug>/) a vybere nejlepší shodu podle překryvu
 * normalizovaných tokenů názvu (značka musí sedět vždy).
 *
 * Výstup: data/heureka-map.json — { [slug]: { url, title, score } | null }
 * Nic nezapisuje do products.json; aplikace mapy je samostatný krok,
 * aby šly shody zkontrolovat.
 *
 * Env: LIMIT (max produktů ke zpracování; přeskočené = už jsou v mapě),
 *      FORCE=1 (znovu i už spárované), DELAY_MS (výchozí 1500).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = JSON.parse(readFileSync(join(ROOT, 'data/products.json'), 'utf8'));
const MAP_FILE = join(ROOT, 'data/heureka-map.json');
const MAP = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, 'utf8')) : {};

const LIMIT = Number(process.env.LIMIT || 400);
const FORCE = process.env.FORCE === '1';
const DELAY = Number(process.env.DELAY_MS || 1500);
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const norm = (s) => s
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

/* Slova, která o identitě produktu nic neříkají (obaly, jednotky, spojky). */
const STOP = new Set(['ml', 'g', 'ks', 'a', 'na', 's', 'pro', 'the', 'of', 'and', 'plus', 'new']);
const tokens = (s) => norm(s).split(' ').filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t));

/* Podvodné subdomény, které nejsou produktovým detailem. */
const BAD_SUB = new Set(['www', 'blog', 'info', 'muj', 'ucet', 'obchody', 'm', 'im9', 'im1', 'affiliate']);

async function searchHeureka(query) {
  const url = `https://www.heureka.cz/?h%5Bfraze%5D=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html', 'accept-language': 'cs' }, redirect: 'follow' });
  if (!res.ok) return { status: res.status, anchors: [] };
  const html = await res.text();
  const anchors = [];
  const re = /<a[^>]+href="(https:\/\/([a-z0-9-]+)\.heureka\.cz\/([a-z0-9][a-z0-9-]*)\/)(?:[?#][^"]*)?"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, href, sub, slug, inner] = m;
    if (BAD_SUB.has(sub)) continue;
    const text = inner.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    anchors.push({ href, slug, text });
  }
  return { status: res.status, anchors };
}

function bestMatch(product, anchors) {
  const brandToks = tokens(product.brand || '');
  const nameToks = tokens(product.name).filter((t) => !brandToks.includes(t));
  let best = null;
  for (const a of anchors) {
    const hay = `${norm(a.slug.replace(/-/g, ' '))} ${norm(a.text)}`;
    const hayToks = new Set(hay.split(' '));
    const brandOk = brandToks.length === 0 || brandToks.every((t) => hayToks.has(t));
    if (!brandOk) continue;
    const hit = nameToks.filter((t) => hayToks.has(t)).length;
    const score = nameToks.length ? hit / nameToks.length : 0;
    if (!best || score > best.score) best = { url: a.href, title: a.text.slice(0, 120), score: Number(score.toFixed(2)) };
  }
  /* Shoda pod 50 % tokenů názvu = spíš jiný produkt stejné značky → nespárovat. */
  return best && best.score >= 0.5 ? best : null;
}

let done = 0, found = 0, miss = 0;
for (const p of PRODUCTS) {
  if (!FORCE && p.slug in MAP) continue;
  if (done >= LIMIT) break;
  done++;
  const query = `${p.brand || ''} ${p.name}`.replace(new RegExp(`^${p.brand} ${p.brand}`, 'i'), p.brand || '').trim();
  try {
    const { status, anchors } = await searchHeureka(query);
    const best = bestMatch(p, anchors);
    MAP[p.slug] = best; // null = nenalezeno
    if (best) { found++; console.log(`✓ ${p.slug} → ${best.url} (${best.score})`); }
    else { miss++; console.log(`✗ ${p.slug} (HTTP ${status}, kandidátů: ${anchors.length})`); }
  } catch (e) {
    MAP[p.slug] = null;
    miss++;
    console.log(`✗ ${p.slug} (chyba: ${e.message})`);
  }
  writeFileSync(MAP_FILE, JSON.stringify(MAP, null, 2) + '\n');
  await new Promise((r) => setTimeout(r, DELAY));
}
console.log(`\nHotovo — zpracováno: ${done}, nalezeno: ${found}, nenalezeno: ${miss}.`);
