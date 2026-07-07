# Produktové fotky z oficiálních zdrojů

Fotky produktů se **nestahují ve vývojovém sandboxu** (jeho síťová politika
blokuje weby výrobců). Stahují se **v GitHub Actions**, kde je otevřený internet.

## Jak to funguje

1. U produktu v `data/products.json` je pole **`productUrl`** — odkaz na
   konkrétní produktovou stránku výrobce (ne domovská stránka značky).
2. Workflow **Actions → „Fetch product images (official)" → Run workflow**
   spustí `build/fetch-product-images.mjs`, který u každého produktu s
   `productUrl`:
   - zkusí Shopify JSON (`<url>.json` → `product.images[0].src`),
   - jinak vytáhne `og:image` z HTML,
   - stáhne fotku do `build/assets/img/products/<slug>.<ext>` a doplní do dat
     atribuci (`Zdroj: výrobce (oficiální)`).
3. Fotky + data se commitnou a spustí se běžný build & deploy.
   Build fotku automaticky použije (konvence `img/products/<slug>.<ext>`);
   pokud fotka chybí, zůstane elegantní placeholder.

Parametry běhu: `limit` (kolik nových fotek za běh) a `force` (přestáhnout i
existující).

## Přidání dalších produktů

Stačí doplnit `productUrl` u dalších produktů v `data/products.json` a znovu
spustit workflow. Odkaz musí mířit na **konkrétní produkt** (ideálně stránku
výrobce; funguje i Shopify e-shop značky).

## ⚠️ Autorská práva

Produktové fotky výrobců jsou **autorsky chráněné**. Jejich použití na webu je
na **odpovědnosti provozovatele**. Na affiliate/recenzních webech je to běžně
tolerované (fotky pomáhají prodeji), ale nejde o výslovnou licenci. Legálně
nejčistší cesta je **obrázkový feed z affiliate programu** dané značky/sítě —
ten dodává licencované fotky i odkazy.
