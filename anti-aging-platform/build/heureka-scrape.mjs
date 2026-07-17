/* Heureka scraper (běží na CI přes Playwright/Chromium).
 *
 * Sandbox Heureku nedosáhne (egress policy) a prostý fetch z CI dostane
 * Cloudflare JS výzvu. Reálný prohlížeč výzvu projde, takže katalogovou
 * kategorii načteme headless Chromiem a vytáhneme produkty (název, URL,
 * cena, obrázek) napříč stránkami.
 *
 * Env:
 *   URL    – výchozí URL kategorie (bez ?page=)
 *   PAGES  – kolik stránek projít (výchozí 5)
 *   OUT    – kam zapsat JSON (výchozí data/heureka-category.json)
 *   DELAY  – prodleva mezi stránkami v ms (výchozí 2500)
 *
 * Výstup: JSON pole { name, url, price, image } + krátký log do stdout.
 */
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { writeFileSync } from 'node:fs';

chromium.use(stealth());

const URL = process.env.URL || 'https://pletova-sera-emulze.heureka.cz/f:17467:22508611/';
const PAGES = Number(process.env.PAGES || 5);
const OUT = process.env.OUT || 'anti-aging-platform/data/heureka-category.json';
const DELAY = Number(process.env.DELAY || 2500);
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Sestavení URL pro stránku N. Heureka řadí stránkování do cesty jako ;p:N,
 * ale akceptuje i ?page=N — použijeme ?page (robustnější). */
function pageUrl(base, n) {
  if (n <= 1) return base;
  const u = new URL(base);
  u.searchParams.set('page', String(n));
  return u.toString();
}

/* Počká, až se stránka „usadí" a projde případnou Cloudflare výzvu.
 * Cloudflare interstitial (titulek „Okamžik…" / „Just a moment") se pod
 * stealth prohlížečem obvykle sám pročistí během ~5–15 s. */
async function waitReady(page) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const title = (await page.title().catch(() => '')) || '';
    const challenged = /just a moment|checking|attention required|okamžik|moment…/i.test(title);
    const hasProducts = await page.locator('a[href*=".heureka.cz/"]').count().catch(() => 0);
    if (!challenged && hasProducts > 3) return true;
    await sleep(4000);
    if (attempt === 3) await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  }
  return false;
}

async function extract(page) {
  return page.evaluate(() => {
    const BAD_SUB = new Set(['www', 'blog', 'info', 'obchody', 'muj', 'ucet', 'm']);
    const rx = /^https:\/\/([a-z0-9-]+)\.heureka\.cz\/([a-z0-9][a-z0-9-]+)\/(?:$|\?|#)/;
    const seen = new Map();
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
      const href = a.href;
      const m = href.match(rx);
      if (!m) continue;
      const [, sub, slug] = m;
      if (BAD_SUB.has(sub)) continue;
      if (/^f:/.test(slug) || slug.length < 6) continue; // filtry, ne produkty
      const clean = `https://${sub}.heureka.cz/${slug}/`;
      const name = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!name || name.length < 8) continue;
      // najdi nejbližší obrázek a cenu v rámci karty produktu
      const card = a.closest('article, li, div');
      let image = '';
      let price = '';
      if (card) {
        const img = card.querySelector('img');
        if (img) image = img.getAttribute('src') || img.getAttribute('data-src') || '';
        const pr = card.textContent.match(/(\d[\d\s]{1,7})\s*Kč/);
        if (pr) price = pr[1].replace(/\s+/g, ' ').trim() + ' Kč';
      }
      const prev = seen.get(clean);
      if (!prev || name.length > prev.name.length) seen.set(clean, { name, url: clean, price, image });
    }
    return Array.from(seen.values());
  });
}

const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1366, height: 900 }, locale: 'cs-CZ' });
const page = await ctx.newPage();

const all = new Map();
let categoryTitle = '';
for (let n = 1; n <= PAGES; n++) {
  const url = pageUrl(URL, n);
  process.stdout.write(`\n[${n}/${PAGES}] ${url}\n`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => process.stdout.write(`  goto chyba: ${e.message}\n`));
  const ready = await waitReady(page);
  if (!categoryTitle) categoryTitle = (await page.title().catch(() => '')) || '';
  if (!ready) { process.stdout.write('  ⚠ stránka se nenačetla (Cloudflare?), končím.\n'); break; }
  const items = await extract(page);
  process.stdout.write(`  nalezeno na stránce: ${items.length}\n`);
  for (const it of items) if (!all.has(it.url)) all.set(it.url, it);
  if (items.length === 0) break;
  await sleep(DELAY);
}

const out = { source: URL, categoryTitle, scrapedAt: new Date().toISOString(), count: all.size, products: Array.from(all.values()) };
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
process.stdout.write(`\nHotovo — unikátních produktů: ${all.size}, zapsáno do ${OUT}\n`);

await browser.close();
