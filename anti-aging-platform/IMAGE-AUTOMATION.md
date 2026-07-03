# Automatické generování obrázků

Vizuály se generují **automaticky přes API** — nic se ručně nestahuje ani neukládá. Skript `build/generate-images.mjs` projde chybějící obrázky v prioritním pořadí (og-default → bannery → technologie → procedury → typy pleti → věk → face yoga → produkty → zbytek), zavolá image API a výsledek uloží rovnou na cílovou cestu v `build/assets/img/`. Web je při dalším buildu zobrazí sám; co ještě chybí, drží elegantní placeholder.

## Varianta A — jedním kliknutím na GitHubu (doporučeno)

1. Jednorázově: **Settings → Secrets and variables → Actions → New repository secret** → `IMAGE_API_KEY` = tvůj API klíč.
2. **Actions → „Generate images (AI)" → Run workflow** — zvol vrstvu (`banners`, `technologies`, … nebo `all`), limit (kolik obrázků max.) a kvalitu.
3. Workflow obrázky vygeneruje, **commitne do main** a tím se web sám přebuilduje a nasadí. Hotovo — žádné ukládání.

Opakovaným spouštěním (klidně po 20–40 kusech) postupně doplníš všech ~355 vizuálů. Skript přeskakuje, co už existuje, takže je to bezpečně idempotentní.

## Varianta B — lokálně z počítače

```bash
export IMAGE_API_KEY=sk-...
node build/gen-image-prompts.mjs                       # aktualizuje plán z databáze
node build/generate-images.mjs --layer=banners         # vygeneruje vrstvu
node build/build.mjs                                   # rebuild webu
git add -A && git commit -m "images" && git push       # deploy proběhne sám
```

Užitečné přepínače: `--dry-run` (jen vypíše plán), `--limit=40`, `--quality=high`, `--force` (přegeneruje i existující).

## Poskytovatelé API

| Poskytovatel | Nastavení | Stav |
|---|---|---|
| **OpenAI (GPT Image)** | jen `IMAGE_API_KEY` | ✅ výchozí, funguje hned (`gpt-image-1`) |
| **Jiný OpenAI-kompatibilní** (Flux přes gateway, Azure OpenAI, …) | + `IMAGE_API_BASE`, `IMAGE_MODEL` | ✅ podporováno |
| **DeepSeek** | — | ⚠️ DeepSeek zatím **nenabízí API pro generování obrázků** (jen text/vision). Jakmile ho vydá v OpenAI-kompatibilním formátu, stačí nastavit `IMAGE_API_BASE` + `IMAGE_MODEL` — kód se měnit nemusí. |

Na GitHubu se `IMAGE_API_BASE` a `IMAGE_MODEL` nastavují jako další secrets (volitelné — bez nich se použije OpenAI).

## Náklady pod kontrolou

- Výchozí **limit 10–20 obrázků na běh** a kvalita `medium` (u GPT Image řádově jednotky Kč za obrázek; `high` je znatelně dražší).
- Orientačně: celý web (~355 obrázků) v `medium` vyjde řádově na nižší stovky Kč; generuj po vrstvách a průběžně kontroluj výsledky.
- Nikdy negeneruje dvakrát totéž (bez `--force`).

## Co API neumí

- **Ikony (.svg)** — image API vrací rastry; sadu 12 ikon vyřešíme ručně jako SVG (prompty jsou v `IMAGE-PROMPTS.md`).
- **Oficiální produktové fotky** — API generuje jen neznačkové ilustrace kategorie (fallback dle `VISUAL-STYLE.md`); oficiální fotky výrobců se řeší podle `OFFICIAL-PHOTO-SOURCING.md`.
- **Konzistence tváří napříč sérií** (typy pleti, věk, face yoga) je u generativních API omezená — prompty ji maximalizují zamčeným popisem modelky/pozadí/světla, ale výsledky po vygenerování zkontroluj a případné odchylky přegeneruj (`--force` + úprava promptu).
