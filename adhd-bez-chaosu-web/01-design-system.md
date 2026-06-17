# 01 — Grafický styl a design systém

Cílem vizuálu je působit **čistě, moderně, důvěryhodně a zároveň lidsky**. Web má
vzbudit pocit klidu a řádu — což je samo o sobě poselství značky „ADHD bez chaosu“.

## Vizuální principy

- **Čistý, moderní, minimalistický** layout s velkým množstvím bílého prostoru.
- **Důvěryhodný, ale ne studený** — vyvážit profesionalitu s vřelostí.
- **NEPOUŽÍVAT** dětské ilustrace (cílovka jsou dospělí, ne děti).
- **NEPOUŽÍVAT** přehnaně lékařský / klinický vzhled (žádné stetoskopy, bílé pláště,
  nemocniční estetika).
- **Zaoblené karty**, jemné stíny, dobře čitelné písmo.
- Hodně **vzduchu** — generózní řádkování a okraje, žádné natěsnané bloky textu.

## Barevná paleta

| Role | Barva | Doporučený HEX | Použití |
|------|-------|----------------|---------|
| Primární | Tmavě modrá | `#163A5F` | Nadpisy, navigace, hlavní plochy, ikony |
| Sekundární | Tyrkysová | `#1FB6C1` | Zvýraznění, odkazy, dekorativní prvky, ikony karet |
| Akcent (CTA) | Oranžová | `#F2762E` | **Pouze tlačítka a klíčové akce** — drží pozornost |
| Pozadí světlé | Bílá | `#FFFFFF` | Hlavní pozadí |
| Pozadí jemné | Světle šedá | `#F4F6F8` | Střídání sekcí, pozadí karet |
| Text hlavní | Tmavě šedá | `#2B2F33` | Běžný text |
| Text doplňkový | Středně šedá | `#5C6670` | Popisky, podnadpisy, méně důležité info |

### Pravidla pro barvy

- **Oranžová je vzácná.** Používej ji výhradně pro hlavní CTA, aby neztratila sílu.
  Sekundární akce řeš tyrkysovou nebo obrysovým (outline) tlačítkem.
- Dbej na **kontrast** (WCAG AA): tmavě šedý text na bílé/světle šedé je v pořádku;
  na tmavě modré ploše používej bílý text.
- Tyrkysová na bílém pozadí má slabší kontrast — pro text používej tmavší odstín
  nebo ji rezervuj pro plochy a ikony, ne pro dlouhý text.

## Typografie

- **Doporučené písmo:** moderní humanistický bezpatkový font — např. **Inter**,
  **Source Sans 3** nebo **Work Sans** (dobrá čitelnost, neutrální, důvěryhodné).
- Nadpisy mohou používat o něco výraznější řez (SemiBold/Bold), tělo textu Regular.
- **Velikost těla textu:** min. 18 px na desktopu kvůli čitelnosti.
- **Řádkování:** 1,6–1,7 pro odstavce.
- **Délka řádku:** max. ~70 znaků (cca 640–720 px sloupec textu).

| Prvek | Velikost (desktop) | Řez |
|-------|--------------------|-----|
| H1 | 44–56 px | SemiBold/Bold |
| H2 | 32–40 px | SemiBold |
| H3 | 24–28 px | SemiBold |
| Tělo | 18–20 px | Regular |
| Popisky | 14–16 px | Regular/Medium |

## Komponenty

### Tlačítka

- **Primární (CTA):** oranžové pozadí, bílý text, zaoblené rohy (radius 8–12 px),
  jemný stín, výrazný hover (ztmavení o ~8 %).
- **Sekundární:** tyrkysový obrys + tyrkysový text na bílé, výplň při hoveru.
- **Terciární / textové:** podtržený odkaz v tyrkysové.
- Dostatečně velká klikací plocha (min. výška 48 px) — důležité pro mobil.

### Karty

- Bílé pozadí na světle šedé sekci (nebo naopak), **radius 16 px**, jemný stín
  (`0 4px 16px rgba(22,58,95,0.08)`).
- Volitelná ikona nahoře v tyrkysové, nadpis v tmavě modré, text v tmavě šedé.
- Hover: jemné zvednutí (translateY −2 px) + o něco výraznější stín.

### Checklist / odrážky příznaků

- Vlastní ikona odrážky (zaoblený čtvereček nebo „check“) v tyrkysové.
- Dostatek vertikálního prostoru mezi položkami.

### Sekce e-booku (klíčová konverzní sekce)

- Vizuálně oddělit — světle šedé nebo jemně tyrkysové pozadí.
- Vlevo **3D mockup obálky e-booku**, vpravo prodejní text + cena + CTA.
- Cena 190 Kč viditelná a opakovaná u každého CTA tlačítka.

## Obraznost a ikony

- **Fotografie:** dospělí lidé v reálných, klidných situacích (psaní poznámek,
  plánování, práce u stolu, oddech). Přirozené, ne stockově falešné úsměvy.
  Žádné dramatizace „chycení za hlavu v zoufalství“.
- **Ikony:** jednolinkové (line icons), zaoblené, v tyrkysové nebo tmavě modré.
- **Ilustrace:** pokud vůbec, pak abstraktní/geometrické (uspořádané tvary,
  jemné vlnky, „chaos → řád“), nikdy dětské.

## Responzivita a přístupnost

- **Mobile-first.** Většina cílovky přijde z mobilu.
- Sticky/lepkavé CTA tlačítko „E-book za 190 Kč“ na mobilu (nenásilné).
- Respektovat `prefers-reduced-motion` — animace jen jemné, vypínatelné.
- Sémantické nadpisy (H1–H3), alt texty u obrázků, focus stavy u tlačítek.
- Cíl: **WCAG 2.1 AA**.

## Pohyb a animace

- Jen jemné: fade-in při scrollu, mírný hover na kartách a tlačítkách.
- Žádné blikání, rychlé pohyby ani rušivé prvky — cílová skupina je citlivá na
  rozptýlení.
