# 02 — Navigace a struktura webu

## Sitemap

```
ADHD bez chaosu
├── / ............................ Hlavní stránka
├── /co-je-adhd-u-dospelych ...... Co je ADHD u dospělých
├── /priznaky-adhd ............... Příznaky ADHD
├── /adhd-test ................... ADHD test / orientační sebehodnocení
├── /prakticke-tipy .............. Praktické tipy
├── /ebook ....................... E-book (hlavní prodejní stránka)
├── /blog ........................ Blog (přehled článků)
│   └── /blog/{slug} ............. Detail článku
├── /o-projektu .................. O projektu
└── /kontakt ..................... Kontakt
```

Doplňkové (právní) stránky dostupné z patičky:

```
├── /obchodni-podminky
├── /ochrana-osobnich-udaju ...... (GDPR)
├── /pravni-upozorneni ........... (disclaimer – obsah nenahrazuje odbornou péči)
└── /cookies
```

## Hlavní navigace (header)

Pořadí v menu odpovídá přirozené cestě uživatele: **porozumět → ověřit → řešit → koupit**.

| Pořadí | Text v menu | Cíl |
|--------|-------------|-----|
| 1 | Co je ADHD | `/co-je-adhd-u-dospelych` |
| 2 | Příznaky | `/priznaky-adhd` |
| 3 | Test | `/adhd-test` |
| 4 | Praktické tipy | `/prakticke-tipy` |
| 5 | Blog | `/blog` |
| 6 | O projektu | `/o-projektu` |
| 7 | Kontakt | `/kontakt` |

**Vpravo v headeru (vždy viditelné):**

- Primární CTA tlačítko (oranžové): **„E-book za 190 Kč“** → `/ebook`

**Logo** vlevo → odkazuje na hlavní stránku. Logo = textové „ADHD bez chaosu“
(tmavě modrá + tyrkysový akcent), případně s jednoduchým symbolem řádu.

### Chování navigace

- **Sticky header** (lepkavý při scrollu), zmenší se po odscrollování.
- Na mobilu **hamburger menu**; CTA „E-book za 190 Kč“ zůstává viditelné mimo menu.
- Aktivní položka menu zvýrazněná tyrkysovým podtržením.

## Microcopy — texty tlačítek (CTA)

Konzistentní sada textů tlačítek napříč webem:

| Kontext | Text tlačítka | Styl |
|---------|---------------|------|
| Hero – primární | **Chci pochopit ADHD** | sekundární (outline) |
| Hero – konverzní | **Zobrazit e-book za 190 Kč** | primární (oranžová) |
| Header (stálé) | **E-book za 190 Kč** | primární (oranžová) |
| Hlavní prodejní CTA | **Koupit e-book za 190 Kč** | primární (oranžová) |
| Závěrečné CTA | **Chci e-book ADHD bez chaosu** | primární (oranžová) |
| Test – spuštění | **Spustit orientační test** | primární (oranžová) |
| Test – výsledek | **Získat praktická řešení (e-book 190 Kč)** | primární (oranžová) |
| Blog → produkt | **Stáhnout e-book za 190 Kč** | primární (oranžová) |
| Kontakt | **Odeslat zprávu** | primární (oranžová) |
| Sekundární akce | **Přečíst příznaky** / **Zjistit více** | sekundární / textové |

> **Pravidlo:** u konverzních tlačítek **vždy uvádět cenu 190 Kč** — snižuje to
> nejistotu a zvyšuje míru prokliku. Oranžová barva je rezervovaná pro tato tlačítka.

## Uživatelské cesty (user flows)

1. **„Mám podezření“** → Hlavní stránka → checklist „Poznáváte se?“ → Test →
   výsledek doporučí E-book → nákup.
2. **„Chci porozumět“** → Co je ADHD → Příznaky → Praktické tipy → E-book.
3. **„Hledám řešení (mám diagnózu)“** → Praktické tipy / Blog → E-book.
4. **„Přišel jsem z Googlu na článek“** → Blog detail → související odkazy →
   E-book (CTA v článku i na konci).

Každá obsahová stránka má na konci **kontextové CTA na e-book** — nenásilné,
navazující na obsah stránky.

## Konverzní prvky napříč webem

- Sticky CTA na mobilu (spodní lišta s „E-book za 190 Kč“).
- Opakovaná zmínka ceny 190 Kč u všech nákupních tlačítek.
- Sekce e-booku dostupná z hlavní stránky i jako samostatná stránka `/ebook`.
- Sociální důkaz (reference / počet čtenářů) — viz stránka E-book, pokud bude
  k dispozici (zatím neuvádět smyšlené reference).
