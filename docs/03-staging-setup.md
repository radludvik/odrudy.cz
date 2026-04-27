# Staging setup — GitHub + Vercel

## Krok 1: Vytvořit GitHub repozitář

1. Jdi na https://github.com/new
2. **Owner**: `radludvik`
3. **Repository name**: `odrudy.cz`
4. Nastavení:
   - ☑ Private (zatím soukromý)
   - ✗ NEBRAT "Add a README file" (máme vlastní)
5. Klikni **Create repository**
6. Spusť v terminálu:

```bash
# V: C:\Users\radim\Documents\Claude Code\Odrudy.cz\
git remote add origin https://github.com/radludvik/odrudy.cz.git
git branch -M main
git push -u origin main
```

---

## Krok 2: Nastavit Vercel

1. Jdi na https://vercel.com → přihlas se (Google / GitHub účtem)
2. Klikni **Add New → Project**
3. Vyber GitHub repozitář `radludvik/odrudy.cz`
4. **Root Directory**: nastav na `app` (Next.js projekt je v podsložce!)
5. **Framework Preset**: Next.js (Vercel to pozná automaticky)
6. Klikni **Deploy**

→ Vercel ti dá URL ve tvaru `odrudy-cz-xxx.vercel.app` (nebo vlastní doménu)
  Každý `git push` automaticky deployuje preview.

---

## Krok 3: Neon (PostgreSQL databáze zdarma)

1. Jdi na https://neon.tech → přihlas se
2. **Create Project**: název `odrudy-cz`, region `Frankfurt (eu-central-1)`
3. Po vytvoření zkopíruj **Connection string** (formát `postgres://...`)
4. V Vercel projektu → Settings → Environment Variables:
   ```
   DATABASE_URL = postgres://...tvůj_neon_connection_string...
   ```
5. Stejnou proměnnou přidej do `C:\Users\radim\Documents\Claude Code\Odrudy.cz\app\.env.local`:
   ```
   DATABASE_URL=postgres://...
   ```

---

## Krok 4: Spustit migraci DB schématu

```bash
cd "C:\Users\radim\Documents\Claude Code\Odrudy.cz\app"
npx drizzle-kit generate    # vygeneruje SQL migraci
npx drizzle-kit migrate     # aplikuje na Neon DB
```

→ Vytvoří tabulky: `categories`, `varieties`, `blog_posts`, `affiliate_partners`, `redirects`

---

## Shrnutí výsledku

Po těchto 4 krocích budeš mít:

| Co | Kde |
|---|---|
| Kód | GitHub (soukromý repo) |
| Staging URL | `odrudy-cz-xxx.vercel.app` (automatický deploy) |
| Databáze | Neon Postgres (zdarma do 0.5 GB) |
| Lokální dev | `cd app && npm run dev` → `localhost:3000` |

Celý setup zabere cca 15 minut.
