# Návod: přesun webu na vlastní hosting (PHP + MariaDB)

Krok za krokem pro přesun antiagelab.cz z GitHub Pages na tvůj vlastní hosting. Psáno pro laika — stačí umět FTP a kliknout na pár tlačítek.

---

## Nejdřív dobrá zpráva

**Web je statický** — hotové HTML soubory, obrázky, styly a skripty. To znamená:

- ✅ **PHP nemusíš vůbec řešit** — hosting ho sice nabízí, ale web ho nepotřebuje.
- ✅ **MariaDB / phpMyAdmin nemusíš vůbec řešit** — žádná databáze se nezakládá, nic se neimportuje. „Databáze" webu jsou data zabudovaná přímo ve stránkách.
- ✅ Stačí **nakopírovat soubory přes FTP** — a web pojede a bude vypadat úplně stejně.
- ✅ Statický web je rychlejší a bezpečnější než cokoli s PHP — není co hacknout, není co aktualizovat.

Jediné, co je důležité: **nesmí se nahrát verze postavená pro GitHub Pages** (ta má adresy s `/odrudy.cz/` v cestě). Pro vlastní doménu se web staví znovu s tvou doménou — na to jsem připravil tlačítko, viz níže.

---

## Co budeš potřebovat

1. **Hosting** s podporou FTP (máš) — ideálně s možností zapnout HTTPS/Let's Encrypt (má dnes každý český hosting: Wedos, Forpsi, Webglobe, Savana…).
2. **Doménu** (např. `antiagelab.cz`) nasměrovanou na hosting — to se dělá u registrátora domény nastavením DNS na servery hostingu; hosting ti k tomu vždy dá přesný návod (obvykle 2 řádky typu `ns1.hosting.cz`).
3. **FTP údaje** z administrace hostingu: *server (host)*, *uživatelské jméno*, *heslo* a případně *složku webu* (bývá `www/`, `web/` nebo `public_html/`).

---

## Varianta A — plně automaticky (doporučeno) 🚀

Jednou nastavíš FTP údaje a pak se web nahrává na tvůj hosting **jedním kliknutím** (a po každé změně obsahu znovu — bez ručního kopírování).

### 1. Ulož FTP údaje na GitHub (jednorázově)

1. Otevři **github.com/radludvik/odrudy.cz → Settings → Secrets and variables → Actions**.
2. Klikni **New repository secret** a postupně vytvoř:

| Název secretu | Hodnota (příklad) |
|---|---|
| `FTP_SERVER` | `ftp.tvujhosting.cz` |
| `FTP_USERNAME` | `w12345` |
| `FTP_PASSWORD` | tvoje FTP heslo |
| `FTP_SERVER_DIR` | `www/` *(jen pokud hosting používá podsložku; jinak vynech)* |

Volitelné: `FTP_PROTOCOL` (`ftp` / `ftps` / `sftp`), `FTP_PORT` — viz recept níže a „Řešení problémů".

### 📦 Konkrétní recept: Český hosting (cesky-hosting.cz / thinline.cz)

Český hosting blokuje klasické FTP ze zahraničních IP (GitHub servery běží mimo ČR), ale nabízí **SFTP na portu 3320** — ten použij. Secrets nastav takto:

| Název secretu | Hodnota |
|---|---|
| `FTP_SERVER` | `replikantXXXX.thinline.cz` *(tvůj server z administrace, sekce FTP)* |
| `FTP_USERNAME` | přístupové jméno z administrace (např. `antiagelab_cz`) |
| `FTP_PASSWORD` | tvoje heslo |
| `FTP_PROTOCOL` | `sftp` |
| `FTP_PORT` | `3320` |
| `FTP_SERVER_DIR` | `www/` *(kořen webu; ověř po přihlášení, že web patří do složky `www`)* |

Pak stačí **Actions → „Build pro vlastní hosting" → Run workflow**. První nahrání trvá déle (~190 MB), další už jen kopírují změny. Chceš-li, aby se na serveru mazaly soubory, které už v novém buildu nejsou (plné zrcadlení), přidej ještě secret `RSYNC_DELETE` = `true` — ale až po ověření, že `FTP_SERVER_DIR` míří na správnou složku.

### 2. Spusť nasazení

1. **Actions → „Build pro vlastní hosting" → Run workflow**.
2. Do pole *domain* napiš adresu webu včetně https, např. `https://antiagelab.cz`.
3. Klikni **Run workflow** a počkej ~2–5 minut (u prvního nahrání i déle — kopíruje se ~30 MB obrázků).

Hotovo — web je na hostingu. Při další změně obsahu prostě klikneš znovu; nahrají se jen změněné soubory.

---

## Varianta B — ručně přes FTP (bez ukládání hesla na GitHub)

1. **Actions → „Build pro vlastní hosting" → Run workflow** — do *domain* dej svou adresu (např. `https://antiagelab.cz`). FTP secrets nemusí existovat; workflow pak jen připraví balíček.
2. Po doběhnutí otevři detail běhu a dole v sekci **Artifacts** stáhni **antiagelab-web** (zip).
3. Zip rozbal na svém počítači.
4. Připoj se FTP klientem (např. FileZilla, Total Commander) na hosting a **obsah rozbalené složky** nahraj do kořene webu (`www/`, `web/` nebo `public_html/` — podle hostingu).
   - Nahráváš **obsah** složky, ne složku samotnou — v kořeni webu musí skončit přímo `index.html`, `assets/`, `.htaccess` atd.
   - Pozor na soubor **`.htaccess`** — začíná tečkou, někteří FTP klienti skryté soubory nezobrazují (ve FileZille: *Server → Vynutit zobrazení skrytých souborů*). Je důležitý (HTTPS, 404, kešování).
5. Pokud v kořeni webu leží výchozí soubor hostingu (`index.php`, „stránka se připravuje" apod.), smaž ho.

---

## Zapni HTTPS

V administraci hostingu najdi **SSL certifikát / Let's Encrypt** a zapni ho pro svou doménu (bývá zdarma a na jedno kliknutí). Přesměrování z `http://` na `https://` už za tebe řeší nahraný `.htaccess`.

---

## Kontrola po nasazení ✅

Projdi si tento checklist v prohlížeči:

- [ ] `https://tvoje-domena.cz/` — načte se homepage se styly a obrázky
- [ ] `https://tvoje-domena.cz/ingredience/` — funguje vyhledávač ingrediencí (filtry, karty s obrázky)
- [ ] `https://tvoje-domena.cz/produkty/` — funguje filtrování produktů
- [ ] `https://tvoje-domena.cz/clanky/retinol-vs-retinal/` — článek s prokliky do databáze
- [ ] `https://tvoje-domena.cz/neexistuje` — ukáže se hezká stránka „Chyba 404"
- [ ] adresní řádek ukazuje zámeček (HTTPS)

Pokud něco z toho nefunguje, mrkni níž do „Řešení problémů".

---

## Jak web aktualizovat do budoucna

Obsah webu (články, produkty, hodnocení…) žije v repozitáři na GitHubu — tam se dělají úpravy (třeba se mnou v Claude Code, jako dosud). Po každé změně:

- **Varianta A:** Actions → „Build pro vlastní hosting" → Run workflow. Hotovo.
- **Varianta B:** totéž + stáhnout zip + nahrát FTP.

Stejně funguje i generování obrázků („Generate images (AI)") — po něm stačí znovu spustit „Build pro vlastní hosting".

---

## Co s PHP a MariaDB?

Nic 🙂. Nech je vypnuté/nevyužité. Kdybys někdy v budoucnu chtěl(a) např. kontaktní formulář, newsletter nebo měření návštěvnosti, dá se to doplnit — ale k provozu tohohle webu není potřeba ani řádek PHP, ani žádná tabulka v databázi. V phpMyAdmin není co dělat.

---

## Stará adresa na GitHubu (volitelné)

Původní web na `radludvik.github.io/odrudy.cz` může běžet dál souběžně, ničemu nevadí. Až bude vlastní doména ověřená a funkční, můžeme:

- na GitHub Pages verzi doplnit přesměrování na novou doménu, nebo
- GitHub Pages úplně vypnout (Settings → Pages).

Řekni si, až budeš chtít — udělám to.

---

## Řešení problémů

| Problém | Příčina a řešení |
|---|---|
| **Stránka je bílá / bez stylů** | Soubory jsou nahrané do špatné složky. V kořeni webu musí být přímo `index.html` a složka `assets/` — ne složka `site/`. |
| **Prokliky vedou na `/odrudy.cz/...` a končí 404** | Nahrála se verze postavená pro GitHub Pages. Použij balíček z workflow „Build pro vlastní hosting" (ten se staví pro kořen domény). |
| **Rozbité české znaky (Ã©, Å¾…)** | Chybí `.htaccess` (nastavuje UTF-8). Zkontroluj, že se nahrál — je skrytý, začíná tečkou. |
| **404 ukazuje ošklivou chybu hostingu** | Totéž — chybí `.htaccess` (obsahuje `ErrorDocument 404`). |
| **Obrázky se nenačítají** | Nejspíš se nenahrála celá složka `assets/img/` (je velká, ~30 MB). Nahraj ji znovu; ve FileZille zkontroluj frontu chyb. |
| **Vidím starou verzi webu** | Kešování prohlížeče — zkus Ctrl+F5. HTML se kešuje jen krátce, obrázky déle. |
| **FTP deploy ve workflow selhal** | Zkontroluj secrets (překlepy v serveru/jménu/hesle) a `FTP_SERVER_DIR` (musí končit lomítkem, např. `www/`). Detail chyby je v logu workflow. **Důležité:** i když FTP krok selže, balíček webu (artifact `antiagelab-web`) se v tom samém běhu vytvořil — stáhni ho z detailu běhu a nahraj ručně (Varianta B). |
| **FTP selhal s `ETIMEDOUT ...:21` (vypršení spojení)** | GitHub se k FTP serveru vůbec nedostal. Nejčastější příčina u českých hostingů: **FTP je povolené jen z českých IP adres** — GitHub servery běží v zahraničí. Řešení: v administraci hostingu povol FTP přístup ze zahraničí / ze všech IP (např. u Wedosu „FTP — povolit zahraniční IP"), nebo se hostingu zeptej, jak FTP zpřístupnit externí službě. Alternativně nastav secrets `FTP_PROTOCOL` (`ftps`) a `FTP_PORT`, pokud hosting používá jiný port. Když nic z toho nejde, použij Variantu B — balíček je hotový i ze selhaného běhu. |
| **Hosting nabízí jen FTPS/SFTP** | FTPS nastav secretem `FTP_PROTOCOL` = `ftps` (případně `FTP_PORT`). SFTP nastav `FTP_PROTOCOL` = `sftp` + `FTP_PORT` (např. Český hosting používá port `3320`) — nasazení pak jede přes rsync/SSH. |

---

*Technická poznámka pro budoucí správce: web generuje `anti-aging-platform/build/build.mjs` (Node 22, bez závislostí). Pro vlastní hosting se staví s `BASE_PATH=""` a `SITE_ORIGIN=https://doména` — přesně to dělá workflow `.github/workflows/build-hosting.yml`. Výstup je čistá statika ve složce `site/`.*
