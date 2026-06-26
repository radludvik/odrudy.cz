# Aevia — Architektura platformy a datový model

> **Aevia** je pracovní název platformy (z lat. *aevum* = věk, trvání). Cílem je
> vybudovat nejkomplexnější českou znalostní databázi o neinvazivním anti-agingu —
> encyklopedii, magazín a inteligentní doporučovací systém v jednom.

Tento dokument je **prvním a nejdůležitějším výstupem projektu**. Definuje datový
model, vztahy mezi entitami a principy, podle kterých se obsah automaticky propojuje
do jednoho znalostního grafu. Veškerá implementace (generátor, šablony, nástroje)
z tohoto modelu vychází.

---

## 1. Filozofie: znalostní graf, ne web

Aevia **není** blog, e-shop ani magazín. Je to **znalostní graf**, kde každá stránka
je uzel (node) a každý odkaz je hrana (edge). Obsah se nepíše jako izolované články,
ale jako **entity s atributy a vztahy**. Stránky se z těchto entit **generují**, takže:

- žádná informace neexistuje na dvou místech (single source of truth → bez duplicit),
- přidání jedné entity automaticky obohatí všechny související stránky,
- propojení (interní prolinky) vznikají strojově z definovaných vztahů,
- platforma je škálovatelná z desítek na tisíce stránek beze změny architektury.

```
Ingredience ─┬─ Studie ──── Technologie ─┬─ Produkt ── Výrobce/Značka
             │                           │
             ├─ Problém ── Rutina ── Procedura
             │                           │
             ├─ Typ pleti ── Věková skupina
             │
             └─ Článek ── Porovnání ── Recenze ── FAQ ── Slovník
```

---

## 2. Entity (uzly grafu)

Každá entita je popsána jako JSON objekt v adresáři `data/`. Sdílí **společný základ**
(`BaseEntity`) a přidává typově specifická pole.

### 2.1 Společný základ — `BaseEntity`

| Pole | Typ | Popis |
|------|-----|-------|
| `id` | string | Unikátní stabilní identifikátor (neměnný) |
| `slug` | string | URL část, např. `retinol` |
| `type` | enum | Typ entity (`ingredient`, `technology`, …) |
| `name` | string | Zobrazované jméno |
| `lang` | enum | `cs` (default), připraveno na `en`, … |
| `title` | string | SEO Title (`<title>`) |
| `metaDescription` | string | Meta description |
| `h1` | string | Hlavní nadpis stránky |
| `excerpt` | string | Krátký souhrn (karty, náhledy, AI systémy) |
| `body` | block[] | Strukturovaný obsah (H2/H3, odstavce, tabulky, seznamy) |
| `faq` | QA[] | Pole otázek a odpovědí |
| `sources` | Source[] | Odborné zdroje (název, URL, typ, rok) |
| `evidenceLevel` | enum | `strong` / `moderate` / `limited` / `preliminary` |
| `updated` | date | Datum poslední revize |
| `relations` | Relations | Reference na další entity (viz §3) |
| `image` | Image | Hero/náhledový vizuál (viz §6) |

### 2.2 Typové entity

| Entita | `type` | Klíčová specifická pole |
|--------|--------|--------------------------|
| **Ingredience** | `ingredient` | `mechanism`, `concentrations`, `indications`, `contraindications`, `sideEffects`, `suitableSkinTypes`, `suitableAgeGroups`, `compatibility[]` (s ingrediencemi), `inci` |
| **Technologie** | `technology` | `principle`, `mechanism`, `pros`, `cons`, `contraindications`, `evidenceSummary`, `alternativeTech[]` |
| **Produkt** | `product` | `brand`, `manufacturer`, `category`, `price`, `activeIngredients[]`, `technologies[]`, `pros`, `cons`, `usage`, `affiliate[]`, `alternatives[]` |
| **Procedura** | `procedure` | `principle`, `invasiveness`, `downtime`, `results`, `risks`, `priceRange`, `frequency` |
| **Klinická studie** | `study` | `summary`, `design`, `sampleSize`, `year`, `journal`, `doi`, `outcome`, `practicalTakeaway`, `evidenceLevel` |
| **Typ pleti** | `skinType` | `characteristics`, `recommendedIngredients[]`, `avoid[]`, `routineHints` |
| **Problém** | `problem` | `area`, `causes`, `recommendedIngredients[]`, `recommendedTech[]`, `recommendedProcedures[]` |
| **Věková skupina** | `ageGroup` | `decade`, `focus`, `recommendedIngredients[]`, `recommendedTech[]`, `recommendedRoutines[]` |
| **Rutina** | `routine` | `timeOfDay` (am/pm), `steps[]` (krok → typ produktu/ingredience), `forSkinType`, `forProblem`, `forAgeGroup` |
| **Kategorie** | `category` | `parent`, `entityType` (jaké entity sdružuje) |
| **Výrobce** | `manufacturer` | `country`, `brands[]` |
| **Značka** | `brand` | `manufacturer`, `positioning` |
| **Recenze** | `review` | `product`, `methodology`, `rating`, `pros`, `cons`, `verdict` |
| **Porovnání** | `comparison` | `items[]` (2+ entity), `dimensions[]` (osy srovnání), `verdict` |
| **FAQ** | `faq` | sdílené, vkládané do ostatních entit i samostatná sekce |
| **Slovník** | `term` | `definition`, `seeAlso[]` |
| **Článek** | `article` | `category`, `pillar` (bool), `relatedEntities[]` |

---

## 3. Vztahy (hrany grafu) — `relations`

Vztahy jsou **reference přes `slug`** (cizí klíče). Generátor je při sestavení
**obousměrně rozřeší** — stačí definovat vztah na jedné straně a zpětný odkaz vznikne
automaticky. Tím se eliminuje duplicita a riziko nekonzistence.

```jsonc
"relations": {
  "ingredients":  ["retinol", "niacinamid"],   // → entity typu ingredient
  "technologies": ["led-terapie"],
  "products":     ["medik8-crystal-retinal-6"],
  "studies":      ["mukherjee-2006-retinol"],
  "problems":     ["jemne-vrasky"],
  "skinTypes":    ["citliva", "zrala"],
  "ageGroups":    ["30-plus", "40-plus"],
  "procedures":   ["microneedling"],
  "routines":     ["vecerni-rutina"],
  "articles":     ["jak-zacit-s-retinoidy"],
  "comparisons":  ["retinol-vs-retinal"],
  "terms":        ["fotostabilita", "purging"]
}
```

### Obousměrné rozřešení (back-references)

Pokud ingredience *Retinol* deklaruje `studies: ["mukherjee-2006-retinol"]`, pak se na
stránce studie automaticky objeví zpětný odkaz na *Retinol* v sekci „Související
ingredience". Vývojář ani redaktor nemusí vztah psát dvakrát.

### Speciální typ — kompatibilita ingrediencí

Ingredience mají navíc strukturovanou kompatibilitu (vstup pro nástroj *Kontrola
kombinací*):

```jsonc
"compatibility": [
  { "with": "vitamin-c",   "level": "caution", "note": "Lze, ale ne ideálně ve stejném kroku — zvažte ráno C / večer retinoid." },
  { "with": "niacinamid",  "level": "good",    "note": "Bezpečná a synergická kombinace." },
  { "with": "aha",         "level": "avoid",   "note": "Společně zvyšují riziko podráždění, nepoužívat ve stejné rutině." }
]
```

`level ∈ { good, caution, avoid }`.

---

## 4. Úrovně vědecké evidence (`evidenceLevel`)

Klíčový atribut pro důvěryhodnost. Zobrazuje se jako **vizuální štítek** u každého
tvrzení o účinnosti.

| Úroveň | Štítek | Význam |
|--------|--------|--------|
| `strong` | 🟢 Silné důkazy | Více kvalitních RCT / metaanalýz, konzistentní výsledky |
| `moderate` | 🟡 Středně silné | Menší RCT nebo kontrolované studie, povzbudivé výsledky |
| `limited` | 🟠 Omezené | Malé/krátké studie, in-vitro, nepřímé důkazy |
| `preliminary` | ⚪ Předběžné | Mechanistické úvahy, jednotlivé studie, marketingová tvrzení |

Pravidlo: **u každého tvrzení o účinnosti, bezpečnosti nebo doporučení musí být
evidence jasně označena.** Žádné „zázračné" sliby.

---

## 5. URL struktura a routing

Generátor produkuje statické HTML do `site/`. Schéma URL je odvozeno z `type` + `slug`,
připravené na jazykové mutace.

```
/                              → domovský rozcestník
/ingredience/                  → výpis ingrediencí (+ filtry)
/ingredience/retinol/          → detail ingredience
/technologie/                  → výpis technologií
/technologie/led-terapie/
/produkty/                     → výpis produktů
/produkty/<kategorie>/         → produkty v kategorii
/produkty/<slug>/              → detail produktu
/procedury/<slug>/
/studie/                       → databáze studií
/pece-podle-veku/<decade>/
/pece-podle-typu-pleti/<slug>/
/pece-podle-problemu/<slug>/
/rutiny/<slug>/
/porovnani/<slug>/
/recenze/<slug>/
/slovnik/                      → slovník pojmů (A–Z)
/clanky/<slug>/                → magazín
/nastroje/                     → rozcestník interaktivních nástrojů
/nastroje/poradce/
/nastroje/builder-rutiny/
/nastroje/kompatibilita/
/nastroje/vyhledavac-ingredienci/
/nastroje/porovnani-produktu/

# Jazyková mutace (budoucí):  /en/ingredients/retinol/
```

---

## 6. Vizuální obsah (`image`)

```jsonc
"image": {
  "src": "/assets/img/ingredients/retinol.svg",
  "alt": "Schéma mechanismu účinku retinolu v pokožce",
  "type": "illustration",          // illustration | photo | infographic | hero
  "credit": null,                  // u oficiálních produktových fotek zdroj/licence
  "official": "https://…"          // odkaz na oficiální zdroj k pozdějšímu doplnění
}
```

Vlastní grafika (hero bannery, vrstvy pokožky, schémata, infografiky, ikony kategorií)
se generuje jako **lehké SVG** v jednotném luxusním minimalistickém stylu. U produktů,
kde nejsou licenčně volné fotografie, se ukládá `official` odkaz pro pozdější doplnění.

---

## 7. Vyhledávání a AI dostupnost

- Generátor produkuje `search-index.json` (název, typ, excerpt, URL, klíčová slova)
  pro klientský fulltext bez serveru.
- Každá stránka má JSON-LD strukturovaná data (`Article`, `FAQPage`, `Product`,
  `MedicalWebPage`) → lepší dostupnost pro vyhledávače i AI systémy.
- `sitemap.xml` a `robots.txt` se generují automaticky.

---

## 8. Připravenost na budoucí rozvoj

Architektura je záměrně oddělená **data → generátor → výstup**, což umožňuje:

| Požadavek | Jak to architektura řeší |
|-----------|--------------------------|
| Anglická / další mutace | `lang` na entitě + jazyková větev v URL; generátor iteruje přes jazyky |
| Registrace, oblíbené, personalizace | Statická vrstva zůstává; přidá se API/backend, data zůstávají zdrojem pravdy |
| AI poradce nad databází | `search-index.json` + strukturovaná data jsou rovnou kontext pro RAG |
| Mobilní aplikace | Stejná data konzumuje nativní klient (JSON jako API) |
| Uživatelské recenze, kurzy, členská sekce | Nové typy entit + nové šablony, model se nemění |

> **Princip:** obsah je datový produkt, prezentace je jen jeden z jeho výstupů.
```

