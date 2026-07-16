/* Zapíše affiliate odkazy na Heureku do products.json.
 *
 * Pro každý produkt, který má v data/heureka-map.json nalezenou shodu,
 * nastaví `affiliateUrl` = URL produktu na Heurece + náš affiliate parametr
 * (haff=279706&utm_medium=affiliate). Build tuto hodnotu upřednostní pro
 * tlačítka „Koupit u ověřeného prodejce" (viz buyHref v build.mjs), takže
 * prokliky povedou na Heureku; původní productUrl zůstává pro stahování fotek.
 *
 * Idempotentní: parametry se do URL vkládají čistě (bez duplikace). Produkty
 * bez shody se přeskočí a jejich případný starý affiliateUrl se odstraní.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PF = join(ROOT, 'data/products.json');
const MF = join(ROOT, 'data/heureka-map.json');

const AFF = { haff: '279706', utm_medium: 'affiliate' };

function withAffiliate(url) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(AFF)) u.searchParams.set(k, v);
  return u.toString();
}

const products = JSON.parse(readFileSync(PF, 'utf8'));
const map = JSON.parse(readFileSync(MF, 'utf8'));

let set = 0, cleared = 0;
for (const p of products) {
  const m = map[p.slug];
  if (m && m.url) {
    p.affiliateUrl = withAffiliate(m.url);
    set++;
  } else if (p.affiliateUrl) {
    delete p.affiliateUrl;
    cleared++;
  }
}

writeFileSync(PF, JSON.stringify(products, null, 2) + '\n');
console.log(`Affiliate odkazy nastaveny: ${set}, odstraněny: ${cleared}, produktů celkem: ${products.length}.`);
