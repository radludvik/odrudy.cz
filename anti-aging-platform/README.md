# antiagelab.cz — Inteligentní anti-aging platforma

> **antiagelab.cz** je škálovatelná znalostní
> platforma o **neinvazivním anti-agingu**: encyklopedie + luxusní magazín +
> databáze ingrediencí, technologií, produktů a studií + inteligentní
> doporučovací systém + interaktivní nástroje + affiliate vrstva.

Není to blog ani e-shop. Je to **znalostní graf**: každá stránka je entita,
každý odkaz hrana. Stránky se **generují z dat**, takže obsah je propojený,
bez duplicit a libovolně rozšiřitelný.

---

## Jak to funguje

```
data/*.json   →   build/build.mjs   →   site/   →   GitHub Pages
(entity +         (znalostní graf,      (statické
 vztahy)           rozřešení vztahů)     HTML + JSON)
```

- **`data/`** — jediný zdroj pravdy. JSON entity (ingredience, technologie,
  produkty, procedury, studie, typy pleti, problémy, věk, rutiny, porovnání,
  slovník, články, recenze). Vztahy se zapisují jen jednou (přes `slug`) a
  generátor je **obousměrně rozřeší**.
- **`build/build.mjs`** — generátor bez závislostí (Node 18+). Sestaví
  znalostní graf, vyrenderuje všechny stránky, výpisy, domovský rozcestník,
  interaktivní nástroje, `search-index.json`, `tools-data.json`, `sitemap.xml`
  a `robots.txt`.
- **`build/assets/`** — designový systém (CSS), klientské skripty (navigace,
  vyhledávání, interaktivní nástroje), favicon.
- **`site/`** — vygenerovaný výstup (v gitu ignorován, staví se z dat).
- **`docs/`** — architektura, datový model, design, obsahová a SEO strategie.

## Spuštění lokálně

```bash
cd anti-aging-platform
node build/build.mjs          # vygeneruje site/
npx serve site                # nebo: python3 -m http.server -d site 8080
```

## Co je hotové

| Oblast | Stav |
|--------|------|
| Datový model + znalostní graf (obousměrné vztahy) | ✅ |
| 13 typů entit, ~65 propojených stránek (ukázkový obsah s evidencí) | ✅ |
| Domovský rozcestník, výpisy, detaily, breadcrumbs | ✅ |
| Štítky úrovně vědecké evidence u tvrzení | ✅ |
| 6 interaktivních nástrojů (poradce, builder rutiny, kompatibilita, vyhledávač, porovnání, doporučení technologií) | ✅ |
| Fulltextové vyhledávání (klientské) | ✅ |
| JSON-LD strukturovaná data, sitemap, robots | ✅ |
| Prémiový design (serif/sans, paleta slonová kost + zlatá) | ✅ |
| Responzivní, rychlé statické HTML | ✅ |
| Deploy workflow (GitHub Pages, ruční spuštění) | ✅ |
| Připravenost na i18n, registrace, AI poradce, app | ✅ (architektonicky) |

## Jak přidat obsah

Přidání entity = přidání objektu do příslušného `data/*.json` a vztahů přes
`slug`. Žádný zásah do šablon ani generátoru. Po `node build/build.mjs` se
nová stránka i všechny zpětné odkazy vytvoří automaticky.

Detaily v [`docs/01-architektura-a-datovy-model.md`](docs/01-architektura-a-datovy-model.md)
a [`docs/03-obsah-a-seo.md`](docs/03-obsah-a-seo.md).

## Nasazení

GitHub Pages obsluhuje **jeden web na repozitář**. V repu už běží workflow pro
ADHD web, proto se `deploy-aevia.yml` spouští **jen ručně** (workflow_dispatch),
aby ho nepřepsal. Až bude antiagelab.cz hlavním webem, doplňte do workflow trigger
`push` na `main`.

## Důležité upozornění

Veškerý obsah má **vzdělávací charakter** a nenahrazuje odbornou lékařskou ani
dermatologickou konzultaci. U tvrzení o účinnosti je vždy uvedena **úroveň
vědecké evidence**. Citované studie jsou reprezentativní ukázky modelu —
před publikací je nutná odborná revize a doplnění přesných citací/DOI.
