# ADHD bez chaosu — funkční web (statický)

Hotová implementace webu podle zadání ve složkách výše. Jde o **statický web**
(HTML + CSS + vanilla JS), bez build kroku a bez závislostí.

## Spuštění

Otevřete `index.html` přímo v prohlížeči, nebo spusťte lokální server:

```bash
cd adhd-bez-chaosu-web/site
python3 -m http.server 8080
# pak otevřete http://localhost:8080
```

## Stránky

| Soubor | Stránka |
|--------|---------|
| `index.html` | Hlavní stránka (všech 10 sekcí) |
| `co-je-adhd-u-dospelych.html` | Co je ADHD u dospělých |
| `priznaky-adhd.html` | Příznaky ADHD |
| `adhd-test.html` | Orientační sebehodnocení (interaktivní, JS) |
| `prakticke-tipy.html` | Praktické tipy |
| `ebook.html` | Prodejní stránka e-booku (190 Kč) |
| `blog.html` | Blog — 20 článků s filtrem kategorií |
| `o-projektu.html` | O projektu |
| `kontakt.html` | Kontakt (formulář — demo) |
| `pravni-upozorneni.html` | Právní upozornění, obchodní podmínky, GDPR, cookies |

## Co je interaktivní

- **Responzivní navigace** (hamburger na mobilu) + sticky CTA lišta na mobilu.
- **Orientační test** — výběr odpovědí, výpočet slovního pásma (ne diagnóza),
  vše v prohlížeči, nic se neodesílá.
- **Filtr blogu** podle kategorií.
- **Kontaktní formulář** — demo (potvrzení bez odeslání).
- **FAQ akordeon** (nativní `<details>`).

## Implementace designového systému

Vše v `assets/css/style.css` přesně podle zadání:
barvy (tmavě modrá `#163A5F`, tyrkysová `#1FB6C1`, oranžová CTA `#F2762E`),
zaoblené karty, jemné stíny, hodně bílého prostoru, písmo Inter.

## Co je potřeba doplnit před ostrým provozem

- Napojení tlačítka „Koupit“ na platební bránu / pokladnu.
- Odeslání kontaktního formuláře na backend / e-mail.
- Reálné obrázky a mockup obálky e-booku.
- Identifikační a fakturační údaje provozovatele, finální obchodní podmínky a GDPR
  (viz `pravni-upozorneni.html` — schválit právníkem).
- Cookie lišta se souhlasem, analytika, sitemap.xml a OG/strukturovaná data.
