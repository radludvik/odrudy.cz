# Aevia — Designový systém

Platforma musí působit jako **prémiová značka**: minimalismus, luxusní estetika,
mnoho bílého prostoru, klid. Inspirace: Apple, Aesop, Typology, Medik8, CurrentBody.

## Barevná paleta

| Token | Hex | Použití |
|-------|-----|---------|
| `--porcelain` | `#FBFAF7` | Hlavní pozadí (slonová kost / bílá) |
| `--ivory` | `#F3EEE6` | Sekce, karty |
| `--sand` | `#E8DFD2` | Jemné předěly, okraje |
| `--ink` | `#2A2723` | Hlavní text |
| `--ink-soft` | `#6B655C` | Sekundární text |
| `--gold` | `#B08D57` | Akcent (zlatá / měděná) |
| `--gold-deep` | `#8A6D3F` | Hover, linky |
| `--line` | `#E5DECF` | Linky, ohraničení |

Akcenty zlaté/měděné jsou **střídmé** — používají se na detaily (linky, podtržení,
ikony, štítky), nikoli jako plochy.

## Typografie

- **Nadpisy:** serif — `Cormorant Garamond` (elegantní, vysoký kontrast).
- **Text:** sans-serif — `Inter` (čistá čitelnost).
- Velký řádkový proklad, vzdušnost, výrazné nadpisy s nízkou váhou.

## Komponenty

Eyebrow popisek · hero s jemným přechodem · karty entit (ingredience/technologie/
produkt) · štítek úrovně evidence · tabulky srovnání · FAQ akordeon · „znalostní
graf" sekce souvisejících entit · breadcrumb · CTA s měděným akcentem · sticky
průhledná navigace s rozbalovacím mega-menu.

## Štítky úrovně evidence

```
🟢 Silné důkazy   🟡 Středně silné   🟠 Omezené   ⚪ Předběžné
```
Vždy viditelné u tvrzení o účinnosti — klíč k důvěryhodnosti.

## Principy

Responzivní (mobile-first), rychlé načítání (statické HTML, žádné těžké frameworky,
lazy obrázky, SVG grafika), přístupnost (kontrast, focus stavy, sémantika),
snadná orientace (breadcrumbs, související obsah, vyhledávání).
