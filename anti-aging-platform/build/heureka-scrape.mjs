/* Heureka scraper (běží na CI/lokálně přes Playwright/Chromium).
 *
 * Sandbox Heureku nedosáhne (egress policy) a prostý fetch dostane Cloudflare
 * JS výzvu. Reálný prohlížeč výzvu projde. Skript má dvě fáze:
 *   1) LIST   – projde celý katalog kategorie (všechny stránky) a posbírá
 *              produkty (název, URL, cena).
 *   2) DETAIL – otevře stránku každého produktu a stáhne složení (INCI),
 *              parametry a přesný název — z toho import pozná aktivní látky
 *              bez hádání z názvu.
 *
 * Ukládá průběžně a je RESUMOVATELNÝ: při opětovném spuštění dočte složení
 * u produktů, které ho ještě nemají.
 *
 * Env:
 *   URL          – URL kategorie (bez ?page=)
 *   OUT          – výstupní JSON (výchozí anti-aging-platform/data/heureka-category.json)
 *   PAGES        – max. stránek katalogu (výchozí 40; kategorie mívá ~29)
 *   LIST         – 1/0, spustit fázi 1 (výchozí 1; při resume dej 0)
 *   DETAIL       – 1/0, spustit fázi 2 (výchozí 1)
 *   DETAIL_LIMIT – kolik detailů max stáhnout za běh (0 = vše)
 *   DELAY        – prodleva mezi akcemi v ms (výchozí 1500)
 */
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

chromium.use(stealth());

const BASE_URL = process.env.URL || 'https://pletova-sera-emulze.heureka.cz/f:17467:22508611/';
const OUT = process.env.OUT || 'anti-aging-platform/data/heureka-category.json';
const PAGES = Number(process.env.PAGES || 40);
const DO_LIST = process.env.LIST !== '0';
const DO_DETAIL = process.env.DETAIL !== '0';
const DETAIL_LIMIT = Number(process.env.DETAIL_LIMIT || 0);
const DELAY = Number(process.env.DELAY || 1500);
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const host = new URL(BASE_URL).host;

/* Načtení předchozího výsledku (resume). Klíč = URL produktu. */
const store = new Map();
let categoryTitle = '';
if (existsSync(OUT)) {
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8'));
    categoryTitle = prev.categoryTitle || '';
    for (const p of prev.products || []) store.set(p.url, p);
    process.stdout.write(`Načteno z ${OUT}: ${store.size} produktů (resume).\n`);
  } catch { /* začneme načisto */ }
}

function save() {
  const products = Array.from(store.values());
  const out = { source: BASE_URL, categoryTitle, scrapedAt: new Date().toISOString(), count: products.length, products };
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
}

/* Počká na načtení a projde případnou Cloudflare výzvu. `sel` = selektor,
 * jehož výskyt značí hotovou stránku. */
async function waitReady(page, sel) {
  for (let attempt = 0; attempt < 16; attempt++) {
    const title = (await page.title().catch(() => '')) || '';
    const challenged = /just a moment|checking|attention required|okamžik|moment…/i.test(title);
    const ok = await page.locator(sel).count().catch(() => 0);
    if (!challenged && ok > 0) return true;
    try {
      const frame = page.frames().find((f) => /challenges\.cloudflare\.com/.test(f.url()));
      if (frame) {
        const box = frame.locator('input[type="checkbox"], .cb-lb, label');
        if (await box.count()) await box.first().click({ timeout: 2000 }).catch(() => {});
      }
    } catch { /* ignore */ }
    await sleep(3000);
    if (attempt === 5) await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  }
  return false;
}

/* Produkty z aktuální stránky výpisu — jen z dané podkategorie. */
async function extractList(page) {
  return page.evaluate((h) => {
    const rx = new RegExp(`^https://${h.replace(/\\./g, '\\.')}/([a-z0-9][a-z0-9-]+)/(?:$|\\?|#)`);
    const seen = new Map();
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
      const m = a.href.match(rx);
      if (!m) continue;
      const slug = m[1];
      if (/^f:/.test(slug) || slug.length < 6) continue;
      const url = `https://${h}/${slug}/`;
      let name = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (/cenopád|ušetříte/i.test(name) || /^\d/.test(name)) name = '';
      if (!name) name = slug.replace(/-/g, ' ');
      const card = a.closest('article, li, div');
      let price = '';
      if (card) { const pr = card.textContent.match(/(\d[\d\s]{1,7})\s*Kč/); if (pr) price = pr[1].replace(/\s+/g, ' ').trim() + ' Kč'; }
      const prev = seen.get(url);
      if (!prev || name.length > prev.name.length) seen.set(url, { name, url, price });
    }
    return Array.from(seen.values());
  }, host);
}

/* Přechod na další stránku katalogu KLIKNUTÍM (routování webu funguje i tam,
 * kde ?page= v URL selhává). Vrací true, když se obsah listingu změnil. */
async function goNext(page, nextNum) {
  const sig = () => page.evaluate((h) => Array.from(document.querySelectorAll(`a[href*="${h}/"]`)).slice(0, 10).map((a) => a.href).join('|'), host);
  const before = await sig();
  // Kandidáti na tlačítko „další stránka". Klikáme jen na prvky uvnitř
  // stránkovací oblasti (ne v hlavní navigaci), ať neutečeme z výpisu.
  const pag = 'nav[aria-label*="ránkov"], nav[aria-label*="aging"], [class*="pagination"], [class*="Pagination"], [class*="paging"], [data-testid*="pagination"]';
  const tries = [
    () => page.locator('a[rel="next"]:not([aria-disabled="true"])').first(),
    () => page.locator(`${pag} a[aria-label*="alší"], ${pag} button[aria-label*="alší"]`).first(),
    () => page.locator(`${pag} a`).last(),                                   // poslední odkaz ve stránkovací liště = „›"
    () => page.getByRole('link', { name: '›' }).first(),
    () => page.getByRole('link', { name: '»' }).first(),
    () => page.getByRole('link', { name: String(nextNum), exact: true }).last(),
  ];
  for (const make of tries) {
    try {
      const loc = make();
      if (!(await loc.count())) continue;
      await loc.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
      await loc.click({ timeout: 4000 });
      for (let i = 0; i < 15; i++) { await sleep(1000); if ((await sig()) !== before) return true; }
    } catch { /* další strategie */ }
  }
  // diagnostika: ulož náhled stránkovací oblasti
  const html = await page.evaluate(() => {
    const el = document.querySelector('[class*="pagination"], [class*="Pagination"], nav');
    return el ? el.outerHTML.slice(0, 1500) : '(pagination element nenalezen)';
  }).catch(() => '');
  process.stdout.write(`  ⚠ další stránka: žádná strategie nezabrala. Pagination HTML:\n${html}\n`);
  return false;
}

/* Popis + parametry + INCI (pokud je) + přesný název z detailu produktu.
 * INCI Heureka u kosmetiky často neuvádí, ale popis („Text výrobce") obvykle
 * jmenuje hlavní účinné látky — z toho import pozná aktivní látky. */
async function extractDetail(page) {
  return page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const title = clean(document.querySelector('h1')?.textContent);
    // INCI: nejdelší text vypadající jako seznam složek (Aqua/Water + hodně čárek)
    let inci = '';
    for (const el of document.querySelectorAll('p, td, li, div, span')) {
      const t = clean(el.textContent);
      if (t.length > 60 && t.length < 4000 && /\b(aqua|water|glycerin)\b/i.test(t) && (t.match(/,/g) || []).length > 5) {
        if (t.length > inci.length) inci = t;
      }
    }
    // popis: nejdelší souvislý textový blok (sekce „Popis"/„Text výrobce")
    let descFull = '';
    for (const el of document.querySelectorAll('p, [class*="description" i], [class*="popis" i], [class*="perex" i], [itemprop="description"], section, article')) {
      const t = clean(el.textContent);
      if (t.length > 120 && t.length < 6000 && / a | s | pro |vrás|pleť|séru|hydrat|kyselin|vitamin|retin|peptid|niacinamid/i.test(t)) {
        if (t.length > descFull.length) descFull = t;
      }
    }
    descFull = descFull.slice(0, 3000);
    // parametry: řádky tabulky/param sekce (často „Účinky", „Typ pleti", „Účinné látky")
    const params = Array.from(document.querySelectorAll('table, dl, [class*="param" i], [class*="spec" i]')).map((e) => clean(e.textContent)).join(' | ').slice(0, 2000);
    const desc = clean(document.querySelector('meta[name="description"]')?.getAttribute('content'));
    return { title, inci, descFull, params, desc };
  });
}

const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1366, height: 900 }, locale: 'cs-CZ' });
const page = await ctx.newPage();

// ---- Fáze 1: katalog ----
if (DO_LIST) {
  process.stdout.write('\n=== Fáze 1: katalog ===\n');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => process.stdout.write(`goto chyba: ${e.message}\n`));
  for (let n = 1; n <= PAGES; n++) {
    const ready = await waitReady(page, `a[href*="${host}/"]`);
    if (!categoryTitle) categoryTitle = (await page.title().catch(() => '')) || '';
    if (!ready) { await page.screenshot({ path: 'heureka-debug.png' }).catch(() => {}); process.stdout.write(`\n[${n}] ⚠ nenačteno (Cloudflare?), končím fázi 1.\n`); break; }
    const items = await extractList(page);
    let added = 0;
    for (const it of items) { if (!store.has(it.url)) { store.set(it.url, it); added++; } else { const ex = store.get(it.url); if (it.price && !ex.price) ex.price = it.price; } }
    process.stdout.write(`\n[${n}/${PAGES}] ${page.url()}\n  produktů: ${items.length} (nových: ${added}, celkem: ${store.size})\n`);
    save();
    if (n === 1) {
      // Jednorázová diagnostika stránkování (ať vidím podobu tlačítka „další").
      const pagHtml = await page.evaluate(() => {
        const cands = Array.from(document.querySelectorAll('nav, [class*="pagination" i], [class*="paging" i], [data-testid*="pagination" i]'));
        const el = cands.filter((e) => /›|»|další|\b2\b/i.test(e.textContent || '')).sort((a, b) => a.textContent.length - b.textContent.length)[0];
        return el ? el.outerHTML.slice(0, 1800) : '(stránkovací prvek nenalezen)';
      }).catch(() => '');
      process.stdout.write(`  --- PAGINATION HTML ---\n${pagHtml}\n  --- /PAGINATION ---\n`);
    }
    if (n >= PAGES) break;
    await sleep(DELAY);
    if (!(await goNext(page, n + 1))) { process.stdout.write('  (konec stránkování)\n'); break; }
  }
}

// ---- Fáze 2: detaily (složení) ----
if (DO_DETAIL) {
  process.stdout.write('\n=== Fáze 2: složení produktů ===\n');
  const todo = Array.from(store.values()).filter((p) => !p.inci && !p.detailDone);
  const limit = DETAIL_LIMIT > 0 ? Math.min(DETAIL_LIMIT, todo.length) : todo.length;
  process.stdout.write(`Ke stažení složení: ${limit} z ${todo.length} chybějících (celkem ${store.size}).\n`);
  for (let i = 0; i < limit; i++) {
    const p = todo[i];
    try {
      await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
      const ready = await waitReady(page, 'h1');
      if (!ready) { process.stdout.write(`  [${i + 1}/${limit}] ⚠ ${p.url} nenačteno\n`); continue; }
      const d = await extractDetail(page);
      if (d.title) p.name = d.title;       // přesný název z detailu
      p.inci = d.inci || '';
      p.descFull = d.descFull || '';
      p.params = d.params || '';
      p.desc = d.desc || '';
      p.detailDone = true;
      if ((i + 1) % 5 === 0 || i === limit - 1) { save(); process.stdout.write(`  [${i + 1}/${limit}] ${p.name} — INCI ${p.inci ? 'ano' : '—'}\n`); }
      await sleep(DELAY);
    } catch (e) {
      process.stdout.write(`  [${i + 1}/${limit}] chyba: ${e.message}\n`);
    }
  }
  save();
}

save();
process.stdout.write(`\nHotovo — produktů: ${store.size}, se složením: ${Array.from(store.values()).filter((p) => p.inci).length}. Zapsáno do ${OUT}\n`);
await browser.close();
