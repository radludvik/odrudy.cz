# antiagelab.cz — Obsahová a SEO strategie

Cíl: dlouhodobá organická autorita pro vyhledávače **i AI systémy** a
monetizace přes affiliate. Obsah musí být odborný, propojený a důvěryhodný.

## 1. Pilíře a struktura (topic clusters)

Každý typ entity je samostatný *cluster*. Pilířové stránky (encyklopedické
detaily ingrediencí, technologií, věkových skupin) sbírají odkazy z podpůrných
článků a porovnání. Vnitřní prolinkování vzniká **automaticky z grafu vztahů**,
takže každá nová entita posiluje autoritu celého clusteru.

## 2. Povinné prvky každé stránky

Generátor zajišťuje, aby každá entita měla:

- SEO Title (`title`) a Meta Description (`metaDescription`),
- jeden `h1`, smysluplnou hierarchii `h2`/`h3` (z `body`),
- FAQ (→ `FAQPage` JSON-LD),
- tabulky a přehledy tam, kde dávají smysl,
- interní odkazy (sekce „Související obsah" = znalostní graf),
- doporučené produkty a související články (z vztahů),
- odkazy na odborné zdroje (`sources`),
- **štítek úrovně evidence** u tvrzení o účinnosti.

## 3. Princip evidence (E-E-A-T)

Důvěryhodnost je konkurenční výhoda. Pravidla:

1. Každé tvrzení o účinnosti/bezpečnosti má označenou sílu důkazů
   (`strong` / `moderate` / `limited` / `preliminary`).
2. Žádné „zázračné" sliby; u omezených dat to říkáme otevřeně.
3. Zdroje jsou dohledatelné (časopis, rok, typ studie; cílově DOI).
4. Viditelný disclaimer, že obsah nenahrazuje odbornou péči.

> Citace v ukázkových datech jsou reprezentativní — před publikací nutná
> odborná revize a doplnění přesných referencí.

## 4. Dostupnost pro AI systémy (GEO/AEO)

- `search-index.json` a strukturovaná data jsou rovnou strojově čitelný kontext.
- Jasné definice, FAQ a tabulky se dobře extrahují do AI odpovědí.
- Tentýž datový model je do budoucna kontextem pro vlastního **AI poradce (RAG)**.

## 5. Affiliate (monetizace)

- Affiliate odkazy mají `rel="nofollow sponsored"` a viditelný disclosure.
- Produkty jsou propojené s ingrediencemi, technologiemi a studiemi — uživatel
  k nákupu dojde přirozeně skrz znalostní cestu, ne přes vtíravou reklamu.
- Recenze mají transparentní metodiku a nezávislost.

## 6. Plán rozšiřování obsahu (priorita)

1. **Dokončit databázi ingrediencí** (cíl: 25–30) — nejvyšší vyhledávací zájem.
2. **Technologie a produkty** s reálnými recenzemi a porovnáními.
3. **Pilířové návody** (retinoidy, SPF, kyseliny, péče v menopauze).
4. **Procedury** s realistickými očekáváními a evidencí.
5. **Slovník** — průběžně, posiluje interní prolinkování a long-tail.

## 7. Měření

Sledovat: organické vstupy na detaily entit, prokliky na affiliate, dokončení
interaktivních nástrojů (mikrokonverze), hloubku průchodu znalostním grafem
(počet navštívených propojených stránek na session).
