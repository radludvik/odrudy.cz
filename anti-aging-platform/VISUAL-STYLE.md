# AntiAgeLab — vizuální style guide

Závazný designový systém pro **veškerý** vizuální obsah webu. Cílem je, aby celý web působil jako **jeden** premiový, medicínsky důvěryhodný systém — ne jako koláž z různých zdrojů.

## Základní charakter
- minimalistický, luxusní, čistý, medicínsky důvěryhodný
- fotorealistický; **žádné** kýčovité „beauty" fotky, žádné stock fotky s vodoznaky
- světlé, neutrální barvy; měkké, difuzní přirozené světlo

## Paleta (shodná s CSS)
| název | hex |
|---|---|
| porcelán (pozadí) | `#FBFAF7` |
| slonová kost | `#F3EEE6` |
| písková | `#E8DFD2` |
| inkoust (text) | `#2A2723` |
| zlatá–měděná (akcent) | `#B08D57` |
| tmavší zlatá | `#8A6D3F` |

## Kompozice podle typu
- **Produkty** — přednostně oficiální fotka výrobce; AI fallback = generický, neznačkový přípravek dané kategorie na slonovinovém povrchu.
- **Technologie** — zařízení jasně, čistá klinická estetika, bez osoby.
- **Procedury** — světlá klinika, ruce + zařízení, nedramatické, nešokující.
- **Ingredience** — makro textury séra, kapky, laboratorní pipety, molekulární bokeh. **Nikdy** chemické vzorce.
- **Typy pleti / věk** — jedna série portrétů: stejná modelka/styl, stejné světlo a pozadí, přirozená pleť, **bez** přehnané retuše.
- **Problémy** — banner s decentním zvýrazněním dané partie, prostor pro titulek.
- **Face yoga** — jednotná série: stejná modelka, oblečení, pozadí, úhel, světlo. Mění se jen ruce, výraz, pohyb, šipky a zvýrazněný sval.
- **Anatomie** — medicínská ilustrace, jeden sval izolovaně, měděné zvýraznění.
- **Ikony** — jednobarevná linka, 24×24, stroke 1,5 px, `#8A6D3F`, jednotná geometrie.
- **Sekční bannery / hero článků** — široká kompozice, negativní prostor pro text.

## Autorská práva (tvrdé pravidlo)
Pořadí zdrojů pro **produkty a technologie**:
1. oficiální web výrobce → 2. oficiální press kit → 3. oficiální mediální materiály → 4. materiály výrobce pro prodejce.

**Nepoužívat** fotky z e-shopů, blogů ani sociálních sítí, pokud je výrobce oficiálně neposkytuje. U každé fotky uchovat zdroj (viz níže). Pokud oficiální fotka není k dispozici, vytvořit **vlastní** fotorealistickou AI ilustraci, která **nekopíruje** konkrétní marketingový materiál výrobce, jen věrně zobrazuje typ produktu/zařízení.

## Jak obrázky do webu dostat (technicky)
Generátor (`build/build.mjs`) je už napojený. Stačí vložit soubor podle konvence:

```
build/assets/img/<složka>/<slug>.<webp|avif|jpg|png>
```

Složky: `products/ technologies/ ingredients/ procedures/ supplements/ skin-types/ age-groups/ problems/ articles/ face-yoga/ banners/ icons/ anatomy/`

Bez souboru se zobrazí **elegantní placeholder** (monogram + jemný přechod) — web nikdy nevypadá rozbitě.

### Atribuce zdroje
V příslušném `data/*.json` u položky uveď:
```json
"image": { "file": "<slug>.webp", "alt": "popis", "source": "Značka (oficiální)", "sourceUrl": "https://…" }
```
`source`/`sourceUrl` se vypíší jako titulek pod fotkou. (Konvenční cesta funguje i bez `image` bloku; atribuci pak lze dát přes `imageSource`/`imageSourceUrl`.)

## Automatizace
- **Plně automaticky přes API:** viz [IMAGE-AUTOMATION.md](IMAGE-AUTOMATION.md) — GitHub Action „Generate images (AI)" nebo `node build/generate-images.mjs` vygeneruje chybějící obrázky přes OpenAI-kompatibilní API a uloží je rovnou na správné cesty. Nic se neukládá ručně.
- `node build/gen-image-prompts.mjs` → přegeneruje **prompty** pro každou položku databáze do `IMAGE-PROMPTS.md` a `build/image-prompts.json`. Po přidání nové entity/článku vznikne prompt automaticky.
- Každý prompt obsahuje sdílenou stylovou kotvu, takže výstupy drží jednotný styl.
- Ruční alternativa (GPT Image / Flux v chatu): dávky v `IMAGE-BATCH-01.md`.
