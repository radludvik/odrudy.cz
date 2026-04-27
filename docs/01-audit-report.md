# Audit report — odrudy.cz

**Datum auditu:** 2026-04-27
**Zdroje dat:** `odrudycz.sql` (21 MB MariaDB dump), `odrdycz.WordPress.2026-04-27.xml` (WXR), `wp-content/` (uploads, themes, plugins)
**Stav DB:** Naimportováno do lokální MariaDB jako `odrudy_audit`, prefix tabulek `wp491_`.

---

## 1. Manažerské shrnutí

Web má **dva životní cykly**:

1. **2017–2018** — původní setup (téma, ruční obsah v Gutenberg blocích, ~2 stránky)
2. **2025** — masivní AI-bulk generace obsahu (1113 stránek za jediný rok, 96 % celého obsahu)

**Současný stav:** Z 1148 publikovaných stránek je drtivá většina AI-generovaná, **bez featured image (jen 2 z 1148 mají!)**, **bez strukturovaných dat** (žádný ACF, žádné custom fieldy), s **rozbitou HTML hierarchií nadpisů** a **nekonzistentními slugy**. SEO meta (Rank Math) je nastaveno jen u 12–24 stránek.

**Hlavní rizika rekonstrukce:**

- **Kvalita obsahu**: obsah je AI-generovaný a typograficky/strukturálně rozbitý. Migrace bez čištění by jen přenesla problémy.
- **Ztracený SEO tlak** v Google: web má 1148 indexovatelných URL — při rekonstrukci je nutná pečlivá redirect mapa.
- **Off-topic drafty** (147 ks) o rodičovství/dětech — nutno z migrace vyloučit.
- **Chybějící obrázky** u 1146 odrůd — vizuálně velmi slabá zkušenost, nutno řešit (manuálně, AI generation, partner DB).

---

## 2. Inventář obsahu

### 2.1 Stránky (`wp491_posts`)

| Typ | Status | Počet |
|---|---|---|
| `page` | publish | **1 148** |
| `page` | draft | 147 (off-topic, k vyloučení) |
| `post` (blog) | publish | 20 |
| `attachment` | inherit | 52 |
| `revision` | inherit | 1 113 (ke smazání) |
| `nav_menu_item` | publish | 33 |
| `elementor_library` | publish | 3 |
| `wpr_templates` (Royal Elementor) | publish | 8 |
| `wp_global_styles` | publish | 2 |
| `wpaicg_convert` | publish | 1 |

### 2.2 Hierarchie stránek

Jen **dvouúrovňová** (Lx = úroveň zanoření):

- **L0** (kořenové): **36 kategorií**
- **L1** (děti = odrůdy): **1 112**
- **L2+**: 0

### 2.3 Kategorie a počet odrůd

Z 36 kořenových stránek je **9 prázdných** (nemají žádné child stránky) a zároveň jejich obsah je orphan — ležící na rootu místo logického umístění.

| Kategorie | Slug | Počet odrůd | Ø délka (znaků) | Téměř prázdné |
|---|---|---:|---:|---:|
| Odrůdy javorů | odrudy-javoru | 119 | 2 541 | 0 |
| Odrůdy hrušek | odrudy-hrusek | 108 | 2 292 | 0 |
| Odrůdy rajčat | odrudy-rajcat | 89 | 3 518 | 0 |
| Odrůdy Vín | odrudy-vin | 86 | 4 328 | 0 |
| Odrůdy jablek | odrudy-jablek | 72 | 2 588 | 0 |
| Druhy a odrůdy plevele | druhy-a-odrudy-plevele | 62 | 2 968 | 0 |
| Odrůdy angreštu | odrudy-angrestu | 59 | 2 204 | 0 |
| Odrůdy fazolí | odrudy-fazoli | 56 | 3 142 | 0 |
| Odrůdy okurek | odrudy-okurek-pruvodce-pro-uspesnou-sklizen | 49 | 3 406 | 0 |
| Odrůdy broskví | odrudy-broskvi | 42 | – | – |
| Odrůdy dýní | odrudy-dyni | 41 | – | – |
| Odrůdy hortenzií | odrudy-hortenzii | 39 | – | – |
| Odrůdy malin | odrudy-malin | 38 | – | – |
| Odrůdy meruněk | odrudy-merunek | 28 | – | – |
| Odrůdy cibule | odrudy-cibule | 28 | – | – |
| Odrůdy okrasných travin | odrudy-okrasnych-travin | 27 | – | – |
| Odrůdy jahod | odrudy-jahod | 25 | – | – |
| Odrůdy rododendronů | odrudy-rododendronu | 25 | – | – |
| Odrůdy zimolezu | odrudy-zimolezu-na-zahradu... | 22 | – | – |
| Odrůdy višní | odrudy-visni | 22 | – | – |
| Odrůdy hlávkového salátu | odrudy-hlavkoveho-salatu | 22 | – | – |
| Odrůdy švestek | odrudy-svestek | 21 | – | – |
| Odrůdy dřínu | odrudy-drinu | 17 | – | – |
| Odrůdy hrášku | odrudy-hrasku | 9 | – | – |
| Odrůdy aronie | odrudy-aronie | 6 | – | – |
| **Co jsou to odrůdy?** | zkusebni-stranka | – | – | – |
| **Odrůdy brambor** | odrudy-brambor | **0** | – | – |
| **Odrůdy česneku** | odrudy-cesneku | **0** | – | – |
| **Odrůdy paprik** | odrudy-paprik | **0** | – | – |
| **Odrůdy cuket** | odrudy-cuket | **0** | – | – |
| **Odrůdy třešní** | odrudy-tresni | **0** | – | – |
| **Odrůdy chilli papriček** | odrudy-chilli-papricek | **0** | – | – |
| **Odrůdy borůvek** | odrudy-boruvek | **0** | – | – |
| **Odrůdy Muchovníku** | nejlepsi-odrudy-muchovniku-prehled... | **0** | – | – |
| **Odrůdy hlošin** | odrudy-hlosin | **0** | – | – |
| Blog Odrůdy.cz | blog-odrudy-cz | – | – | – |

> **Plný strom:** `audit/db/categories.tsv` a `audit/db/all_pages.tsv`.

### 2.4 Distribuce délky obsahu (jen publikované stránky)

| Bucket | Počet stránek |
|---|---:|
| < 500 znaků (téměř prázdné stuby) | 13 |
| 500 – 2 000 | 34 |
| **2 000 – 5 000** (typické AI články) | **1 057** |
| 5 000 – 10 000 | 34 |
| 10 000+ | 10 |

### 2.5 Distribuce dle roku publikace

| Rok | Počet stránek | Poznámka |
|---|---:|---|
| 2017 | 1 | původní setup |
| 2018 | 1 | "Odrůdy brambor" v Gutenberg blocích, ručně |
| 2023 | 30 | první AI experimenty (Craiyon obrázky) |
| 2024 | 3 | málo aktivity |
| **2025** | **1 113** | **bulk AI generace** |

→ **96 % obsahu vzniklo v jediném roce strojově**.

### 2.6 Off-topic drafty (147 ks, k vyloučení)

Drafty mají prázdné slugy, chybí parent, a jsou tematicky o **rodičovství, dětech, výchově** — pravděpodobně omylem spuštěný AI batch s jiným promptem. Příklady titulků:

- "Jak rozvíjet u dětí odolnost a schopnost překonávat překážky"
- "Význam rituálů a tradic v životě malých dětí"
- "Jak zvládat hyperaktivitu pomocí struktury a režimu"
- "Praktické nápady na oslavy narozenin dětí doma"
- "Jak vést děti ke sportu bez soutěživého tlaku"

→ **Nemigrovat. Smazat z produkční DB.**

### 2.7 Blog (`post`)

20 publikovaných postů, vše v kategorii "Nezařazené". Tagy nejsou používány. Plný seznam v `audit/db/blog_posts.tsv`.

---

## 3. Strukturovaná data o odrůdách: NEEXISTUJÍ

### 3.1 Co bylo zkontrolováno

Top 30 meta_keys v `wp491_postmeta`:

| meta_key | Výskyt | Účel |
|---|---:|---|
| rank_math_internal_links_processed | 1 314 | jen flag |
| footnotes | 127 | poznámky pod čarou |
| _edit_lock / _edit_last | 87 / 80 | systémové |
| wpbf_options / wpbf_sidebar_position | 80 / 80 | nastavení theme |
| **rank_math_seo_score** | **79** | SEO skóre, ne obsah |
| _wpr_demo_import_item | 68 | demo import zbytky |
| **_wp_attachment_metadata / _wp_attached_file** | **52 / 52** | jen attachments |
| **rank_math_title** | **24** | jen 24 stránek má SEO titulek |
| **rank_math_focus_keyword** | **12** | jen 12 stránek má focus keyword |
| _elementor_data | 10 | starý Elementor |
| _wp_page_template | 18 | template override |
| **_thumbnail_id** | **2** | featured image |

### 3.2 Důsledky

- **Žádná pole jako "doba zrání", "odolnost", "použití", "barva", "chuť"** — všechno je jen volný HTML text v `post_content`.
- **Žádný ACF, žádný Pods, žádné custom taxonomy**.
- Celá "kategorie" odrůdy se odvozuje výhradně z `post_parent`.

→ **Migrace bude muset extrahovat strukturovaná pole z volného textu** (LLM parsing).

---

## 4. Média a obrázky

| Co | Počet | Stav |
|---|---:|---|
| Soubory v `uploads/` celkem | 1 816 (55 MB) | různé typy (jpg, png, css, js…) |
| Reálné obrázky v `2018/`, `2023/`, `2024/`, `2025/` | 331 | většinou velikostní varianty |
| Skutečně registrované attachments v DB | **52** | originály |
| Featured image na publikované stránce | **2 z 1 148** | **drtivá většina stránek nemá obrázek** |

**Detaily:**

- 2018: 186 souborů (logo, několik produktových fotek)
- 2023: 121 souborů (mj. AI-generované obrázky `craiyon_*`)
- 2024–2025: jen 24 souborů celkem
- Zbytek: woocommerce placeholdery, GeoIP DBs, plugin assety, revslider/masterslider artefakty (legacy)

→ **1146 odrůd nemá vlastní vizuál.** Toto je největší vizuální slabina webu.

---

## 5. SEO inventář

### 5.1 Sitemap

8 sub-sitemap (Yoast formát, ale na webu Rank Math — pravděpodobně přepsáno):

| Sitemap | URL |
|---|---:|
| post-sitemap.xml | 21 (blog) |
| page-sitemap1.xml … 6 | 200 + 200 + 200 + 200 + 200 + 147 = 1 147 |
| category-sitemap.xml | 1 |
| **Celkem** | **1 169** |

### 5.2 Pokrytí Rank Math

- 24 stránek má `rank_math_title`
- 12 stránek má `rank_math_focus_keyword`
- 79 stránek má `rank_math_seo_score`
- → **~93 % stránek nemá nastaveno SEO meta**.

### 5.3 URL struktura

- Vzor: `/{kategorie-slug}/{odruda-slug}/` (např. `/odrudy-vin/odruda-vina-welschriesling/`)
- **Nekonzistence**: některé kategorie mají SEO-styl dlouhé slugy (`odrudy-okurek-pruvodce-pro-uspesnou-sklizen`, `odrudy-zimolezu-na-zahradu-proc-stoji-za-to-ho-pestovat`) — k normalizaci.

---

## 6. Technologický inventář

### 6.1 Aktivní pluginy (8)

| Plugin | Účel |
|---|---|
| akismet | antispam |
| google-site-kit | analytika (GA4, Search Console) |
| page-list | výpis stránek |
| really-simple-ssl | HTTPS redirect |
| seo-by-rank-math | SEO |
| wordfence | bezpečnost |
| wp-consent-api | cookie consent |
| wp-super-cache | cache |

### 6.2 Pluginy přítomné, ale neaktivní

- **bulk-page-generator** — nástroj, který vygeneroval bulk pages
- **google-analytics-for-wordpress** (MonsterInsights)

### 6.3 Stopy po starších pluginech v DB

- `wpaicg_*` (8 tabulek) — AI Power Content Generator
- `mwai_*` (3 tabulky) — AI Engine (Meow Apps)
- `revslider_*` (6 tabulek) — Revolution Slider
- `masterslider_*` (2 tabulky)
- `woocommerce_*` (~30 tabulek) — WooCommerce kompletní DB struktura
- `e_events` — Elementor

→ **Web byl historicky jiný projekt** (nejspíš e-shop s Elementorem) a byl přebudován na content portál.

### 6.4 Aktivní theme

- **page-builder-framework** (lehký theme od Themeisle)
- Astra je v záloze (instalovaný, ne aktivní)

### 6.5 Verze

- MariaDB 10.4 (kompatibilní s lokálním XAMPP)
- WP 6.x (dle WXR exportu z 2026-04-27)
- Jazyk: cs_CZ
- Default user role: subscriber, registrace zakázány

---

## 7. Rizika a doporučení pro Fázi 2

### 7.1 Rizika rekonstrukce

| # | Riziko | Závažnost | Mitigace |
|---|---|---|---|
| R1 | Ztráta SEO rankingu při změně URL | **Vysoká** | Pečlivá redirect mapa (1148 URL), Search Console pre-launch crawl |
| R2 | AI-generovaný obsah může být nízké kvality / duplicitní napříč webem | **Vysoká** | Audit similarity (TF-IDF/embeddings), případný rewrite top kategorií ručně |
| R3 | Chybějící obrázky u 1146 odrůd | **Vysoká** | Strategie: (a) ručně doplnit top 100, (b) AI-image pro zbytek, (c) partnerství se semenářstvími |
| R4 | Nezpracovatelné HTML (neplatná hierarchie nadpisů `<p><h2>`) | Střední | LLM-cleanup parser při migraci |
| R5 | 9 orphan kategorií (např. "Odrůdy brambor" bez odrůd) | Střední | Buď rychle naplnit obsahem, nebo skrýt do launch |
| R6 | Off-topic drafty | Nízká | Vyloučit z migrace, smazat ze stará DB |
| R7 | Slugové nekonzistence (krátké vs. dlouhé) | Nízká | Normalizovat na vzor `odrudy-{plodina}/{slug-odrudy}` |
| R8 | Sběr dat / GDPR (Wordfence, Site Kit, GA loguje IP) | Nízká | Při launch zvážit Plausible/Umami místo GA |

### 7.2 Doporučení pro Fázi 2 (datový model a migrace)

**1. Datový model — varieta jako entita**

```sql
Variety (
  id, slug, name (česky),
  category_id (FK na Category),
  scientific_name?,             -- doplněno z externího zdroje
  ripening_period_enum?,        -- raná | středně raná | pozdní
  use_cases[],                  -- konzum, na zpracování, kompot...
  resistance[],                 -- struvitost, plíseň, mráz
  origin_country?, year_registered?,
  yield?, taste_profile?,
  description_html,             -- původní obsah
  description_clean_md,         -- po cleanup
  hero_image_id?,
  status (draft|published),
  source_post_id,               -- pro audit trail
  created_at, updated_at
)

Category (id, slug, name, intro_html, hero_image_id, sort_order)
```

**2. Migrační pipeline**

```
WP DB ──→ raw_pages.json ──→ LLM parse ──→ Variety records
                          │
                          └──→ HTML cleanup (heading fix, wp-block strip)
```

Pro každou stránku:
- Stripnout WP-block komentáře, opravit hierarchii nadpisů
- LLM (Claude Haiku) extrahuje strukturovaná pole z textu (10–15 polí na odrůdu)
- Lidský review pro top 3 kategorie (rajčata, jablka, vína), zbytek validovat samply

**3. Redirect strategie**

- Zachovat URL vzor `/{kategorie-slug}/{odruda-slug}/`
- Pro normalizované slugy (5 kategorií): 301 stará → nová
- Před launchem: porovnat top 100 URL ze Search Console s redirect mapou

**4. Co NEvzít s sebou**

- 147 off-topic draftů
- 1 113 revizí
- Stopy WooCommerce / Elementor / Revslider / Masterslider
- Plugin tabulky `wpaicg_*`, `mwai_*`
- Slug `zkusebni-stranka` (přejmenovat nebo smazat)

### 7.3 Rychlé výhry (quick wins) ještě před úplnou rekonstrukcí

Některé akce jdou udělat hned na současném WP a sníží riziko:

1. **Smazat 147 off-topic draftů** + **vyčistit 1 113 revizí** (snížíme zmatek)
2. **Reparentovat 9 orphan kategorií** (rovnou v admin → Page Attributes)
3. **Doplnit Rank Math meta** alespoň pro 36 kategorií
4. **Disable bulk-page-generator** úplně (deinstalovat)

---

## 8. Výstupy Fáze 1 (přílohy)

V `audit/db/`:

- `categories.tsv` — 36 kategorií s počty
- `all_pages.tsv` — 1 295 stránek (publish + draft) s URL, délkou, parent
- `drafts_offtopic.tsv` — 147 off-topic draftů
- `attachments.tsv` — 52 media záznamů
- `blog_posts.tsv` — 20 blog článků

V `audit/sitemaps/`:

- 8 sub-sitemap XML (zdroj pro křížovou kontrolu URL)

V `audit/api/`:

- `categories.json`, `types.json`, `taxonomies.json` (REST API metadata)

V `audit/samples/`:

- `page_full.json`, `post_full.json` (ukázka REST výstupu)

Lokální databáze: `odrudy_audit` v MariaDB 10.4 (XAMPP).

---

## 9. Co potřebuji od tebe pro Fázi 2

1. **Schválení rozsahu cleanupu**: smazat 147 off-topic draftů? Smazat 1 113 revizí? (Doporučuji ano.)
2. **Rozhodnutí o 9 prázdných kategoriích**: dohnat obsah, nebo z webu skrýt?
3. **Strategie pro obrázky**: máš preference (manuální / AI / partneři)?
4. **Cílová doména**: zůstává `odrudy.cz`? Plánuje se subdoména na staging?
5. **Komu je web určen**: hobby zahrádkáři vs. profi pěstitelé — ovlivňuje jazyk a hloubku obsahu.
6. **Monetizace**: bude reklama / affiliate / žádná?

Až tyto body odsouhlasíš, můžu **otevřít Fázi 2**: navrhnout konkrétní DB schema, vytvořit prototyp migračního skriptu na 1 kategorii (např. rajčata, 89 odrůd) a ukázat výstupní formát.
