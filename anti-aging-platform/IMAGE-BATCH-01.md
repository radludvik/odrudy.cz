# AntiAgeLab — dávka obrázků 01 (prvních 40)

Praktický workflow: procházej položky shora, generuj v GPT Image / Flux podle **promptu**, ukládej **přesně na cílovou cestu** (soubor už tam patří — generátor webu ho pak automaticky zobrazí). Styl viz [VISUAL-STYLE.md](VISUAL-STYLE.md).

> Poměr/rozměr je doporučení; web obrázky ořízne (object-fit: cover), takže drobná odchylka nevadí. Formát WEBP kvůli velikosti; JPG jen u og-default kvůli kompatibilitě sítí.


## 1) Výchozí sdílecí náhled (og:image) — 1 ks

**Formát:** JPG · **Poměr stran:** 1,91:1 · **Rozměr:** 1200 × 630 px

_Sdílecí náhled na sítě; nech střed volný pro logo/titulek._

### 1. og-default (1200×630)

- **Cílová cesta:** `build/assets/img/og-default.jpg`
- **Název souboru:** `og-default.jpg`
- **Formát:** JPG · **Poměr:** 1,91:1 · **Rozměr:** 1200 × 630 px

**Prompt:**

```
Website social-share cover image (1200x630) for a premium Czech anti-aging knowledge platform: elegant abstract composition of soft serum textures and light molecular bokeh on a warm porcelain background, generous empty space in the center for a logo/headline overlay. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```


## 2) Homepage / sekční bannery — 10 ks

**Formát:** WEBP · **Poměr stran:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

_Široký hero pruh sekce; volný prostor po jedné straně pro titulek. Homepage hero může použít nejreprezentativnější z nich._

### 2. Ingredience

- **Cílová cesta:** `build/assets/img/banners/ingredients.webp`
- **Název souboru:** `ingredients.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Ingredience" section: macro serum textures, droplets, glass pipettes, molecular bokeh. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 3. Technologie

- **Cílová cesta:** `build/assets/img/banners/technologies.webp`
- **Název souboru:** `technologies.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Technologie" section: modern at-home skincare devices arranged minimally. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 4. Produkty

- **Cílová cesta:** `build/assets/img/banners/products.webp`
- **Název souboru:** `products.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Produkty" section: row of unbranded premium skincare bottles and jars. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 5. Procedury

- **Cílová cesta:** `build/assets/img/banners/procedures.webp`
- **Název souboru:** `procedures.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Procedury" section: bright modern dermatology clinic interior detail. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 6. Doplňky stravy

- **Cílová cesta:** `build/assets/img/banners/supplements.webp`
- **Název souboru:** `supplements.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Doplňky stravy" section: unbranded supplement capsules and a glass of water, clean nutrition still-life. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 7. Obličejová jóga

- **Cílová cesta:** `build/assets/img/banners/face-yoga.webp`
- **Název souboru:** `face-yoga.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Obličejová jóga" section: serene woman touching her face, wellness studio light. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 8. Průvodci / Magazín

- **Cílová cesta:** `build/assets/img/banners/articles.webp`
- **Název souboru:** `articles.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Průvodci / Magazín" section: open editorial layout feel, calm desk with skincare and soft light. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 9. Anti-aging škola

- **Cílová cesta:** `build/assets/img/banners/skola.webp`
- **Název souboru:** `skola.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Anti-aging škola" section: abstract science-meets-beauty still life, light and molecular bokeh. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 10. Rutiny

- **Cílová cesta:** `build/assets/img/banners/routines.webp`
- **Název souboru:** `routines.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Rutiny" section: morning and evening skincare flat-lay on ivory. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 11. Porovnání produktů

- **Cílová cesta:** `build/assets/img/banners/comparisons.webp`
- **Název souboru:** `comparisons.webp`
- **Formát:** WEBP · **Poměr:** 4:1 (široký banner) · **Rozměr:** 1600 × 400 px

**Prompt:**

```
Wide website hero banner (approx 1600x400) for the "Porovnání produktů" section: two unbranded skincare products side by side, balanced composition. Generous negative space for an overlaid headline, unified with the whole site's look. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```


## 3) Technologie — 18 ks

**Formát:** WEBP · **Poměr stran:** 4:3 · **Rozměr:** 1600 × 1200 px

_Zařízení jasně, čistá klinická estetika, bez osoby. Použije se v detail hero i na kartě._

### 12. LED terapie

- **Cílová cesta:** `build/assets/img/technologies/led-terapie.webp`
- **Název souboru:** `led-terapie.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home LED terapie skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 13. Radiofrekvence (RF)

- **Cílová cesta:** `build/assets/img/technologies/radiofrekvence.webp`
- **Název souboru:** `radiofrekvence.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Radiofrekvence (RF) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 14. Microcurrent

- **Cílová cesta:** `build/assets/img/technologies/microcurrent.webp`
- **Název souboru:** `microcurrent.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Microcurrent skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 15. HIFU

- **Cílová cesta:** `build/assets/img/technologies/hifu.webp`
- **Název souboru:** `hifu.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home HIFU skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 16. Microneedling

- **Cílová cesta:** `build/assets/img/technologies/microneedling.webp`
- **Název souboru:** `microneedling.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Microneedling skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 17. EMS

- **Cílová cesta:** `build/assets/img/technologies/ems.webp`
- **Název souboru:** `ems.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home EMS skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 18. IPL (intenzivní pulzní světlo)

- **Cílová cesta:** `build/assets/img/technologies/ipl.webp`
- **Název souboru:** `ipl.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home IPL (intenzivní pulzní světlo) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 19. Ultrazvuk (kosmetický)

- **Cílová cesta:** `build/assets/img/technologies/ultrazvuk.webp`
- **Název souboru:** `ultrazvuk.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Ultrazvuk (kosmetický) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 20. Near-infrared (blízké infračervené světlo)

- **Cílová cesta:** `build/assets/img/technologies/near-infrared.webp`
- **Název souboru:** `near-infrared.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Near-infrared (blízké infračervené světlo) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 21. Domácí frakční laser

- **Cílová cesta:** `build/assets/img/technologies/domaci-laser.webp`
- **Název souboru:** `domaci-laser.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Domácí frakční laser skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 22. Galvanická péče (iontoforéza)

- **Cílová cesta:** `build/assets/img/technologies/galvanicka-pece.webp`
- **Název souboru:** `galvanicka-pece.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Galvanická péče (iontoforéza) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 23. Plasma pen (fibroblast)

- **Cílová cesta:** `build/assets/img/technologies/plasma-pen.webp`
- **Název souboru:** `plasma-pen.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Plasma pen (fibroblast) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 24. Oxygenoterapie (kyslíková péče)

- **Cílová cesta:** `build/assets/img/technologies/oxygenoterapie.webp`
- **Název souboru:** `oxygenoterapie.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Oxygenoterapie (kyslíková péče) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 25. Kryoterapie (chlazení pleti)

- **Cílová cesta:** `build/assets/img/technologies/kryoterapie.webp`
- **Název souboru:** `kryoterapie.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Kryoterapie (chlazení pleti) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 26. Gua Sha

- **Cílová cesta:** `build/assets/img/technologies/gua-sha.webp`
- **Název souboru:** `gua-sha.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Gua Sha skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 27. Face Roller (obličejový váleček)

- **Cílová cesta:** `build/assets/img/technologies/face-roller.webp`
- **Název souboru:** `face-roller.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Face Roller (obličejový váleček) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 28. Silikonové náplasti

- **Cílová cesta:** `build/assets/img/technologies/silikonove-naplasti.webp`
- **Název souboru:** `silikonove-naplasti.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Silikonové náplasti skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 29. Dermaroller (domácí microneedling)

- **Cílová cesta:** `build/assets/img/technologies/dermaroller.webp`
- **Název souboru:** `dermaroller.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Editorial photograph of a modern at-home Dermaroller (domácí microneedling) skincare device on an ivory surface, clean clinical aesthetic, device shown clearly, no person. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```


## 4) Procedury — 11 ks

**Formát:** WEBP · **Poměr stran:** 4:3 · **Rozměr:** 1600 × 1200 px

_Světlá klinika, ruce + zařízení, nedramatické._

### 30. Botox (botulotoxin)

- **Cílová cesta:** `build/assets/img/procedures/botox.webp`
- **Název souboru:** `botox.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "Botox (botulotoxin)": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 31. Profhilo

- **Cílová cesta:** `build/assets/img/procedures/profhilo.webp`
- **Název souboru:** `profhilo.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "Profhilo": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 32. Microneedling (procedura)

- **Cílová cesta:** `build/assets/img/procedures/microneedling-procedura.webp`
- **Název souboru:** `microneedling-procedura.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "Microneedling (procedura)": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 33. Chemický peeling

- **Cílová cesta:** `build/assets/img/procedures/chemicky-peeling.webp`
- **Název souboru:** `chemicky-peeling.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "Chemický peeling": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 34. Skinboostery

- **Cílová cesta:** `build/assets/img/procedures/skinboostery.webp`
- **Název souboru:** `skinboostery.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "Skinboostery": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 35. PRP (plazma, „vampire facial")

- **Cílová cesta:** `build/assets/img/procedures/prp.webp`
- **Název souboru:** `prp.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "PRP (plazma, „vampire facial")": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 36. Frakční laser (Fraxel)

- **Cílová cesta:** `build/assets/img/procedures/frakcni-laser.webp`
- **Název souboru:** `frakcni-laser.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "Frakční laser (Fraxel)": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 37. CO₂ laser (ablativní)

- **Cílová cesta:** `build/assets/img/procedures/co2-laser.webp`
- **Název souboru:** `co2-laser.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "CO₂ laser (ablativní)": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 38. IPL fotorejuvenace

- **Cílová cesta:** `build/assets/img/procedures/ipl-procedura.webp`
- **Název souboru:** `ipl-procedura.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "IPL fotorejuvenace": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 39. Biostimulátory kolagenu

- **Cílová cesta:** `build/assets/img/procedures/biostimulatory.webp`
- **Název souboru:** `biostimulatory.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "Biostimulátory kolagenu": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```

### 40. Výplně (dermální fillery)

- **Cílová cesta:** `build/assets/img/procedures/vyplne.webp`
- **Název souboru:** `vyplne.webp`
- **Formát:** WEBP · **Poměr:** 4:3 · **Rozměr:** 1600 × 1200 px

**Prompt:**

```
Calm clinical scene representing the aesthetic procedure "Výplně (dermální fillery)": modern bright dermatology clinic, professional performing a facial treatment, tasteful and non-graphic, focus on hands and device, patient relaxed. Premium minimalist anti-aging platform aesthetic. Soft diffused natural light, light neutral palette (warm porcelain #FBFAF7, ivory #F3EEE6, sand #E8DFD2, muted copper-gold #B08D57 accents). Clean, medically credible, editorial, uncluttered. Photorealistic. Shallow depth of field. No text, no logos, no watermarks, no visible brand names, no kitschy beauty-ad styling. Negative: text, watermark, logo, brand name, oversaturated colors, harsh flash, plastic skin, heavy retouching, cluttered background, stock-photo look, collage, borders, frames.
```


---

Hotovo: 40 položek. Po uložení obrázků spusť `node build/build.mjs`. Další dávka: uprav `LIMIT`/vrstvy v `build/gen-image-batch.mjs`.
