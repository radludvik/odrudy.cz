# 06 — Patička webu + právní a etická upozornění

## Návrh patičky (footer)

Patička je **tmavě modrá** (`#163A5F`) s bílým/světle šedým textem. Tyrkysové odkazy
na hoveru. Rozdělená do sloupců.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADHD bez chaosu                                                              │
│  Praktický průvodce pro dospělé, kteří chtějí lépe zvládat pozornost,         │
│  prokrastinaci, chaos a každodenní povinnosti.                               │
│                                                                              │
│  [ E-book za 190 Kč ]  ← oranžové CTA                                         │
├──────────────────┬──────────────────┬───────────────────┬───────────────────┤
│  WEB             │  TÉMA            │  PROJEKT          │  PRÁVNÍ           │
│  Co je ADHD      │  Příznaky ADHD   │  O projektu       │  Obchodní podmínky│
│  Praktické tipy  │  Orientační test │  Blog             │  Ochrana údajů    │
│  E-book          │  Praktické tipy  │  Kontakt          │  Právní upozornění│
│                  │                  │                   │  Cookies          │
├──────────────────┴──────────────────┴───────────────────┴───────────────────┤
│  DŮLEŽITÉ UPOZORNĚNÍ                                                          │
│  Obsah webu ADHD bez chaosu slouží ke vzdělávání a podpoře. Nenahrazuje      │
│  lékařskou ani psychologickou péči, diagnostiku ani léčbu a neslouží ke      │
│  stanovení diagnózy. Máte-li podezření na ADHD nebo jiné potíže, obraťte se  │
│  na odborníka (psychiatr nebo klinický psycholog).                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  © 2026 ADHD bez chaosu · [Provozovatel / IČO – doplní zadavatel]            │
│  [E-mail]   ·   [Sociální sítě – volitelně]                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Obsah patičky — položky

**Sloupec „Web“:** Co je ADHD · Praktické tipy · E-book
**Sloupec „Téma“:** Příznaky ADHD · Orientační test · Praktické tipy
**Sloupec „Projekt“:** O projektu · Blog · Kontakt
**Sloupec „Právní“:** Obchodní podmínky · Ochrana osobních údajů · Právní upozornění · Cookies

**Patička dále obsahuje:**
- Logo / název + krátký claim.
- Opakované CTA na e-book (190 Kč).
- **Krátké disclaimer upozornění** (viz výše) — viditelné na každé stránce.
- Copyright, provozovatele a fakturační/identifikační údaje *(povinné u prodeje)*.
- E-mail, případně odkazy na sociální sítě.
- Lišta souhlasu s cookies (samostatný banner při první návštěvě).

---

## Právní a etická upozornění (povinný obsah)

> Tato část je **klíčová** vzhledem k citlivosti tématu (zdraví) i k tomu, že web
> prodává produkt. Texty níže jsou připravené k použití; **finální znění by měl
> zkontrolovat právník** (zejména obchodní podmínky a GDPR pro konkrétního provozovatele).

### 1. Hlavní zdravotní disclaimer (krátká verze – do patičky a boxů)

> **Obsah tohoto webu a e-booku slouží ke vzdělávání a podpoře. Nenahrazuje
> lékařskou ani psychologickou péči, diagnostiku ani léčbu a neslouží ke stanovení
> diagnózy. Při podezření na ADHD nebo jiné zdravotní potíže se obraťte na odborníka.**

Umístění krátké verze:
- patička (každá stránka),
- box na stránkách *Co je ADHD*, *Příznaky*, *E-book*,
- pod hero sekcí hlavní stránky (mikrotext).

### 2. Disclaimer u testu (povinné u `/adhd-test`)

> **Toto sebehodnocení je orientační a neslouží ke stanovení diagnózy.** Výsledek
> není diagnózou ADHD a nenahrazuje odborné vyšetření. ADHD může diagnostikovat
> pouze kvalifikovaný odborník (psychiatr nebo klinický psycholog). Pokud řešíte
> závažné potíže nebo myšlenky, které vás ohrožují, vyhledejte prosím odbornou pomoc
> nebo využijte linku důvěry; v ohrožení života volejte **112**.

### 3. Plné právní upozornění (stránka `/pravni-upozorneni`)

**H1: Právní upozornění**

> **Účel webu.** Web ADHD bez chaosu a e-book stejného názvu poskytují obecné,
> vzdělávací a podpůrné informace o tématu ADHD u dospělých a o praktických
> postupech pro každodenní život. Obsah má informativní charakter.
>
> **Není zdravotní službou.** Provozovatel není poskytovatelem zdravotních služeb
> a obsah webu ani e-booku není zdravotní službou ve smyslu příslušných předpisů.
> Informace zde uvedené **nenahrazují** odborné lékařské či psychologické vyšetření,
> diagnostiku, terapii ani léčbu.
>
> **Žádná diagnóza.** Nic na tomto webu (včetně orientačního testu) neslouží ke
> stanovení diagnózy. Diagnózu ADHD může stanovit výhradně kvalifikovaný odborník.
>
> **Individuální rozdíly.** Každý člověk je jiný. Uvedené tipy a postupy nemusí
> fungovat stejně pro každého a nejsou zárukou konkrétního výsledku.
>
> **Odpovědnost.** Rozhodnutí učiněná na základě informací z webu či e-booku jsou
> na vlastní odpovědnost čtenáře. Provozovatel neodpovídá za případnou újmu vzniklou
> jejich použitím. V případě zdravotních obtíží se vždy poraďte s odborníkem.
>
> **Krizová pomoc.** Pokud se nacházíte v akutní krizi nebo máte myšlenky, které
> vás ohrožují, kontaktujte prosím svého lékaře, linku důvěry nebo tísňovou linku
> **112**.

### 4. Etické zásady obsahu (interní pravidla pro copywritera)

- **Nesugerovat diagnózu.** Vždy formulace „může souviset / bývá spojováno“, nikdy
  „máte ADHD“.
- **Žádné falešné sliby.** Nepoužívat „vyléčení“, „zaručeně“, „zbavte se ADHD“.
  E-book pomáhá *zvládat*, ne „vyléčit“.
- **Nepoužívat strach jako prodejní nástroj.** Žádné strašení následky.
- **Respekt a nestigmatizace.** ADHD je odlišnost, ne defekt; jazyk to musí odrážet.
- **Inkluzivita.** Myslet na ženy s ADHD i na lidi bez diagnózy.
- **Pravdivost referencí a kvalifikací.** Neuvádět smyšlené recenze, čísla ani
  odborné tituly. Pokud reference nejsou, neuvádět je.
- **Soukromí.** Příběhy jen se souhlasem nebo jasně označené jako ilustrativní.

### 5. Povinné prodejní / obchodní náležitosti (e-shop)

Vzhledem k prodeji e-booku spotřebitelům doplnit (a nechat ověřit právníkem):

- **Obchodní podmínky** `/obchodni-podminky` — identifikace prodávajícího, popis
  produktu, cena (190 Kč vč. případného DPH), způsob dodání (digitální stažení),
  platební metody.
- **Odstoupení od smlouvy:** u digitálního obsahu dodaného ihned je třeba **souhlas
  spotřebitele s dodáním před uplynutím lhůty pro odstoupení** a poučení, že tím
  právo na odstoupení zaniká. Toto musí být v objednávkovém procesu zaškrtnutelné.
- **Reklamace / kontakt** na prodávajícího.
- **Ochrana osobních údajů (GDPR)** `/ochrana-osobnich-udaju` — jaké údaje, proč,
  jak dlouho, práva subjektu údajů, kontakt na správce.
- **Cookies** `/cookies` + cookie lišta se souhlasem (analytika/marketing až po souhlasu).
- **Fakturační údaje** provozovatele v patičce a na kontaktu.

> ⚠️ **Doplní zadavatel:** konkrétní identifikační a fakturační údaje provozovatele,
> e-mail, IČO/DIČ a finální znění obchodních podmínek a GDPR. Tyto šablony slouží
> jako podklad, ne jako právně závazné dokumenty.
