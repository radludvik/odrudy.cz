# AntiAgeLab — oficiální fotky k dohledání

Claude v tomto prostředí **neumí spolehlivě stahovat a vkládat** oficiální fotky výrobců (WebFetch je blokovaný proxy). Tento seznam je proto podklad pro ruční / poloautomatické doplnění podle pořadí zdrojů z [VISUAL-STYLE.md](VISUAL-STYLE.md):

**1)** oficiální web výrobce → **2)** press kit → **3)** mediální materiály → **4)** materiály pro prodejce. Fotky z e-shopů/blogů/sociálních sítí jen pokud je výrobce oficiálně poskytuje. U každé fotky ulož zdroj do `data/*.json` (`image.source`, `image.sourceUrl`). Když oficiální fotka není, použij AI ilustraci z `IMAGE-PROMPTS.md` (nekopíruj marketingový materiál).

Cílová cesta: `build/assets/img/products/<slug>.webp` resp. `.../technologies/<slug>.webp`.

## Produkty (195)

| Značka | Produkt | slug | Oficiální odkaz (návrh) |
|---|---|---|---|
| — | Denní krém SPF 50 | `spf-50-denni` | — |
| — | Vitamin C sérum 15 % | `vitamin-c-serum-15` | — |
| 7E Wellness | 7E Wellness MyoLift QT | `7e-wellness-myolift-qt` | — |
| Alpha-H | Alpha-H Liquid Gold | `alpha-h-liquid-gold` | — |
| Avène | Avène Tolérance Control Cream | `avene-tolerance-control-cream` | — |
| Beauty of Joseon | Beauty of Joseon Glow Serum Propolis + Niacinamide | `beauty-of-joseon-glow-serum-propolis-niacinamide` | — |
| Beauty of Joseon | Beauty of Joseon Revive Eye Serum Ginseng + Retinal | `beauty-of-joseon-revive-eye-serum-ginseng-retinal` | — |
| BeautyBio | BeautyBio GloPRO Microneedling Tool | `beautybio-glopro-microneedling-tool` | — |
| BeautyBio | BeautyBio The Patchwork | `beautybio-the-patchwork` | — |
| Beurer | Beurer FC 90 Pureo Ionic | `beurer-fc-90-pureo-ionic` | — |
| Bioderma | Bioderma Hydrabio Gel-Crème | `bioderma-hydrabio-gel-creme` | — |
| BioEffect | BioEffect EGF Serum | `bioeffect-egf-serum` | — |
| BrainMax | BrainMax Astaxanthin | `brainmax-astaxanthin` | — |
| BrainMax | BrainMax Hyaluronová kyselina | `brainmax-hyaluronova-kyselina` | — |
| BrainMax | Brainmax Lipozomální vitamin C | `brainmax-lipozomalni-vitamin-c` | — |
| BrainMax | BrainMax NMN | `brainmax-nmn` | — |
| BrainMax | Brainmax Omega-3 Premium | `brainmax-omega-3-premium` | — |
| BrainMax | BrainMax Resveratrol | `brainmax-resveratrol` | — |
| BrainMax | BrainMax Spermidin | `brainmax-spermidin` | — |
| BrainMax | BrainMax Vitamin D3 + K2 | `brainmax-vitamin-d3-k2` | — |
| Caudalie | Caudalie Resveratrol-Lift Firming Serum | `caudalie-resveratrol-lift-firming-serum` | — |
| CeraVe | CeraVe Eye Repair Cream | `cerave-eye-repair-cream` | — |
| CeraVe | CeraVe Moisturizing Cream | `cerave-moisturizing-cream` | [odkaz](https://www.cerave.com) |
| CeraVe | CeraVe Moisturizing Lotion | `cerave-moisturizing-lotion` | — |
| CeraVe | CeraVe PM Facial Moisturizing Lotion | `cerave-pm-facial-moisturizing-lotion` | — |
| CeraVe | CeraVe Resurfacing Retinol Serum | `cerave-resurfacing-retinol-serum` | — |
| COSRX | COSRX BHA Blackhead Power Liquid | `cosrx-bha-blackhead-power-liquid` | — |
| CurrentBody | CurrentBody Skin Classic IPL | `currentbody-skin-classic-ipl` | — |
| CurrentBody | CurrentBody Skin LED maska | `currentbody-led-mask` | [odkaz](https://www.currentbody.com) |
| Déesse | Déesse PRO LED Mask | `deesse-pro-led-mask` | — |
| Dermaclara | Dermaclara Silicone Fusion Patches | `dermaclara-silicone-fusion-patches` | — |
| Doppelherz | Doppelherz Koenzym Q10 | `doppelherz-koenzym-q10` | — |
| Dr. Dennis Gross | Dr. Dennis Gross DRx SpectraLite FaceWare Pro | `dr-dennis-gross-faceware-pro` | [odkaz](https://drdennisgross.com) |
| Dr. Jart+ | Dr. Jart+ Ceramidin Cream | `dr-jart-ceramidin-cream` | — |
| Dr. Pen | Dr. Pen Ultima A6 | `dr-pen-ultima-a6` | — |
| Drunk Elephant | Drunk Elephant A-Passioni Retinol Cream | `drunk-elephant-a-passioni-retinol-cream` | — |
| Drunk Elephant | Drunk Elephant C-Firma Fresh Day Serum | `drunk-elephant-c-firma-fresh-day-serum` | — |
| Drunk Elephant | Drunk Elephant Lala Retro Whipped Cream | `drunk-elephant-lala-retro-whipped-cream` | — |
| Drunk Elephant | Drunk Elephant Protini Polypeptide Cream | `drunk-elephant-protini-polypeptide-cream` | — |
| Drunk Elephant | Drunk Elephant T.L.C. Framboos Glycolic Night Serum | `drunk-elephant-t-l-c-framboos-glycolic-night-serum` | — |
| Embryolisse | Embryolisse Lait-Crème Concentré | `embryolisse-lait-creme-concentre` | — |
| ESPA | ESPA Cryo Globes | `espa-cryo-globes` | — |
| Estée Lauder | Estée Lauder Advanced Night Repair | `estee-lauder-advanced-night-repair` | — |
| Eucerin | Eucerin Hyaluron-Filler Serum | `eucerin-hyaluron-filler-serum` | — |
| First Aid Beauty | First Aid Beauty Ultra Repair Cream | `first-aid-beauty-ultra-repair-cream` | — |
| Foreo | Foreo FAQ 202 LED Mask | `foreo-faq-202-led-mask` | — |
| Frownies | Frownies Facial Patches | `frownies-facial-patches` | — |
| Garnier | Garnier Vitamin C Brightening Serum | `garnier-vitamin-c-brightening-serum` | — |
| Geek & Gorgeous | Geek & Gorgeous A-Game | `geek-gorgeous-a-game` | [odkaz](https://geekandgorgeous.com) |
| Geek & Gorgeous | Geek & Gorgeous A-Game 10 | `geek-gorgeous-a-game-10` | — |
| Geek & Gorgeous | Geek & Gorgeous C-Glow | `geek-gorgeous-c-glow` | [odkaz](https://geekandgorgeous.com) |
| GESKE | GESKE MicroNeedle Face Roller | `geske-microneedle-face-roller` | — |
| Glossier | Glossier Super Pure Niacinamide + Zinc | `glossier-super-pure-niacinamide-zinc` | — |
| Good Molecules | Good Molecules Discoloration Correcting Serum | `good-molecules-discoloration-correcting-serum` | — |
| Good Molecules | Good Molecules Niacinamide Serum | `good-molecules-niacinamide-serum` | — |
| Healthline Beauty | Healthline Beauty 540 Titanium Derma Roller | `healthline-beauty-540-titanium-derma-roller` | — |
| Herbivore | Herbivore Jade Facial Roller | `herbivore-jade-facial-roller` | — |
| Herbivore | Herbivore Jade Gua Sha | `herbivore-jade-gua-sha` | — |
| JOVS | JOVS Slimax RF Device | `jovs-slimax-rf-device` | — |
| JOVS | JOVS Venus Pro II | `jovs-venus-pro-ii` | — |
| Kiehl's | Kiehl's Creamy Eye Treatment with Avocado | `kiehl-s-creamy-eye-treatment-with-avocado` | — |
| Kiehl's | Kiehl's Powerful-Strength Vitamin C Serum | `kiehl-s-powerful-strength-vitamin-c-serum` | — |
| Kiehl's | Kiehl's Ultra Facial Cream | `kiehl-s-ultra-facial-cream` | — |
| KINGDOMCARES | KINGDOMCARES Ultrasonic Skin Scrubber | `kingdomcares-ultrasonic-skin-scrubber` | — |
| Kitsch | Kitsch Ice Roller | `kitsch-ice-roller` | — |
| Kitsch | Kitsch Rose Quartz Roller | `kitsch-rose-quartz-roller` | — |
| Klairs | Klairs Freshly Juiced Vitamin Drop | `klairs-freshly-juiced-vitamin-drop` | — |
| Koi Beauty | Koi Beauty Derma Roller Set | `koi-beauty-derma-roller-set` | — |
| L'Oréal Paris | L'Oréal Paris Revitalift Filler [HA] Serum | `l-oreal-paris-revitalift-filler-ha-serum` | — |
| L'Oréal Paris | L'Oréal Paris Revitalift Laser Pure Retinol Night Serum | `l-oreal-paris-revitalift-laser-pure-retinol-night-serum` | — |
| La Roche-Posay | La Roche-Posay Anthelios Fluid SPF50+ | `la-roche-posay-anthelios-fluid-spf50` | — |
| La Roche-Posay | La Roche-Posay Anthelios UVMune 400 SPF50+ | `la-roche-posay-anthelios-uvmune-spf50` | [odkaz](https://www.laroche-posay.com) |
| La Roche-Posay | La Roche-Posay Hyalu B5 Serum | `la-roche-posay-hyalu-b5-serum` | — |
| La Roche-Posay | La Roche-Posay Pure Vitamin C10 Serum | `la-roche-posay-pure-vitamin-c10-serum` | — |
| La Roche-Posay | La Roche-Posay Retinol B3 Serum | `la-roche-posay-retinol-b3-serum` | — |
| La Roche-Posay | La Roche-Posay Toleriane Double Repair Moisturizer | `la-roche-posay-toleriane-double-repair-moisturizer` | — |
| LABELLE | LABELLE Skin Spatula | `labelle-skin-spatula` | — |
| Lancôme | Lancôme Génifique | `lancome-genifique` | — |
| Laneige | Laneige Water Sleeping Mask | `laneige-water-sleeping-mask` | — |
| Latme | Latme Ice Roller | `latme-ice-roller` | — |
| Linduray | Linduray Derma Roller | `linduray-derma-roller` | — |
| Lyma | Lyma Laser PRO | `lyma-laser-pro` | — |
| Mad Hippie | Mad Hippie Vitamin C Serum | `mad-hippie-vitamin-c-serum` | — |
| Maelove | Maelove Glow Maker | `maelove-glow-maker` | — |
| Medicube | Medicube PDRN Pink Serum | `medicube-pdrn-pink-serum` | — |
| Medik8 | Medik8 C-Tetra | `medik8-c-tetra` | — |
| Medik8 | Medik8 Crystal Retinal 10 | `medik8-crystal-retinal-10` | — |
| Medik8 | Medik8 Crystal Retinal 3 | `medik8-crystal-retinal-3` | — |
| Medik8 | Medik8 Crystal Retinal 6 | `medik8-crystal-retinal-6` | [odkaz](https://www.medik8.com) |
| Medik8 | Medik8 Liquid Peptides | `medik8-liquid-peptides` | — |
| Michael Todd | Michael Todd Sonicblend | `michael-todd-sonicblend` | — |
| Mount Lai | Mount Lai Jade Facial Roller | `mount-lai-jade-facial-roller` | — |
| Mount Lai | Mount Lai Jade Gua Sha | `mount-lai-jade-gua-sha` | — |
| Murad | Murad Retinol Youth Renewal Serum | `murad-retinol-youth-renewal-serum` | — |
| MZ Skin | MZ Skin Light-Therapy Golden Mask | `mz-skin-light-therapy-golden-mask` | — |
| Naturium | Naturium BHA Liquid Exfoliant 2% | `naturium-bha-liquid-exfoliant-2` | — |
| Naturium | Naturium Niacinamide Serum 12% | `naturium-niacinamide-serum-12` | — |
| Naturium | Naturium Retinol Complex | `naturium-retinol-complex` | — |
| Naturium | Naturium Tranexamic Topical Acid 5% | `naturium-tranexamic-topical-acid-5` | — |
| Naturium | Naturium Vitamin C Complex Serum | `naturium-vitamin-c-complex-serum` | — |
| Neutrogena | Neutrogena Hydro Boost Water Gel | `neutrogena-hydro-boost-water-gel` | — |
| Neutrogena | Neutrogena Rapid Wrinkle Repair Retinol | `neutrogena-rapid-wrinkle-repair-retinol` | — |
| NEWA | NEWA RF Anti-Aging Device | `newa-rf-anti-aging-device` | — |
| Niod | Niod Copper Amino Isolate Serum (CAIS) | `niod-copper-amino-isolate-serum-cais` | — |
| Nivea | Nivea Q10 Power Anti-Wrinkle | `nivea-q10-power-anti-wrinkle` | — |
| Nordic Naturals | Nordic Naturals Ultimate Omega | `nordic-naturals-ultimate-omega` | — |
| NOW Foods | Now Foods Vitamin C-1000 | `now-foods-vitamin-c-1000` | — |
| Nuderma | Nuderma Skin Scrubber | `nuderma-skin-scrubber` | — |
| NuFACE | NuFACE Mini | `nuface-mini` | [odkaz](https://www.mynuface.com) |
| NuFACE | NuFACE Trinity | `nuface-trinity` | [odkaz](https://www.mynuface.com) |
| Nutrend | Nutrend Flexit Gold Drink | `nutrend-flexit-gold-drink` | — |
| Odacité | Odacité Crystal Contour Gua Sha | `odacite-crystal-contour-gua-sha` | — |
| Olay | Olay Regenerist Micro-Sculpting Cream | `olay-regenerist-micro-sculpting-cream` | — |
| Olay | Olay Regenerist Retinol24 Night Serum | `olay-regenerist-retinol24-night-serum` | — |
| Olay | Olay Total Effects 7-in-1 | `olay-total-effects-7-in-1` | — |
| Omnilux | Omnilux Contour Face | `omnilux-contour-face` | [odkaz](https://omniluxled.com) |
| ORA | ORA Microneedle Derma Roller System | `ora-microneedle-derma-roller-system` | — |
| Paula's Choice | Paula's Choice 1% Retinol Treatment | `paula-s-choice-1-retinol-treatment` | — |
| Paula's Choice | Paula's Choice 10% Niacinamide Booster | `paula-s-choice-10-niacinamide-booster` | — |
| Paula's Choice | Paula's Choice 9% BHA Powerful Pore Booster | `paula-s-choice-9-bha-powerful-pore-booster` | — |
| Paula's Choice | Paula's Choice C15 Super Booster | `paula-s-choice-c15-super-booster` | — |
| Paula's Choice | Paula's Choice Skin Perfecting 8% AHA Gel | `paula-s-choice-skin-perfecting-8-aha-gel` | — |
| Paula’s Choice | Paula’s Choice 2% BHA Liquid Exfoliant | `paulas-choice-2-bha` | [odkaz](https://www.paulaschoice.com) |
| Pharma Nord | Pharma Nord Bio-Selen+Zinek | `pharma-nord-bio-selen-zinek` | — |
| Pixi | Pixi Glow Tonic | `pixi-glow-tonic` | — |
| Pretika | Pretika SonicDermPro | `pretika-sonicdermpro` | — |
| Project E Beauty | Project E Beauty EMS Microcurrent Device | `project-e-beauty-ems-microcurrent-device` | — |
| Project E Beauty | Project E Beauty HIFU Device | `project-e-beauty-hifu-device` | — |
| Project E Beauty | Project E Beauty LED maska | `project-e-beauty-led-mask` | — |
| ReFa | ReFa Carat Microcurrent Roller | `refa-carat-microcurrent-roller` | — |
| Reflex Nutrition | Reflex Nutrition Collagen | `reflex-nutrition-collagen` | — |
| Revlon | Revlon Roller Facial Massager | `revlon-roller-facial-massager` | — |
| RoC | RoC Retinol Correxion Deep Wrinkle Night Cream | `roc-retinol-correxion-deep-wrinkle-night-cream` | — |
| RoC | RoC Retinol Correxion Eye Cream | `roc-retinol-correxion-eye-cream` | — |
| Sdara Skincare | Sdara Skincare Derma Roller 0.25 mm | `sdara-skincare-derma-roller-0-25-mm` | — |
| Sensica | Sensica Sensilift | `sensica-sensilift` | — |
| Shark | Shark CryoGlow LED Face Mask | `shark-cryoglow-led-face-mask` | — |
| Silk'n | Silk'n Bright | `silk-n-bright` | — |
| Silk'n | Silk'n FaceTite | `silk-n-facetite` | — |
| Silk'n | Silk'n Titan | `silk-n-titan` | — |
| SiO Beauty | SiO Beauty SuperEye / FaceLift Patches | `sio-beauty-supereye-facelift-patches` | — |
| Skin Gym | Skin Gym Cryo Roller | `skin-gym-cryo-roller` | — |
| Skin Gym | Skin Gym Gua Sha | `skin-gym-gua-sha` | — |
| Skin Gym | Skin Gym Jade Roller | `skin-gym-jade-roller` | — |
| SkinCeuticals | SkinCeuticals A.G.E. Interrupter Advanced | `skinceuticals-a-g-e-interrupter-advanced` | — |
| SkinCeuticals | SkinCeuticals C E Ferulic | `skinceuticals-ce-ferulic` | [odkaz](https://www.skinceuticals.com) |
| SkinCeuticals | SkinCeuticals Discoloration Defense | `skinceuticals-discoloration-defense` | — |
| SkinCeuticals | SkinCeuticals Phloretin CF | `skinceuticals-phloretin-cf` | — |
| SkinCeuticals | SkinCeuticals Retinol 0.5 | `skinceuticals-retinol-0-5` | — |
| Skinfix | Skinfix Barrier+ Triple Lipid-Peptide Cream | `skinfix-barrier-triple-lipid-peptide-cream` | — |
| Stacked Skincare | Stacked Skincare Ice Roller | `stacked-skincare-ice-roller` | — |
| Stacked Skincare | Stacked Skincare Micro-Roller | `stacked-skincare-micro-roller` | — |
| Sunday Riley | Sunday Riley A+ High-Dose Retinoid Serum | `sunday-riley-a-high-dose-retinoid-serum` | — |
| Sunday Riley | Sunday Riley Good Genes Lactic Acid Treatment | `sunday-riley-good-genes-lactic-acid-treatment` | — |
| Sunday Riley | Sunday Riley Luna Sleeping Night Oil | `sunday-riley-luna-sleeping-night-oil` | — |
| Swanson | Swanson Biotin | `swanson-biotin` | — |
| Talika | Talika Skin Booster | `talika-skin-booster` | — |
| Tatcha | Tatcha The Dewy Skin Cream | `tatcha-the-dewy-skin-cream` | — |
| The INKEY List | The INKEY List 15% Vitamin C and EGF Serum | `the-inkey-list-15-vitamin-c-and-egf-serum` | — |
| The INKEY List | The INKEY List Caffeine Eye Cream | `the-inkey-list-caffeine-eye-cream` | — |
| The INKEY List | The INKEY List Niacinamide Serum | `the-inkey-list-niacinamide-serum` | — |
| The INKEY List | The INKEY List Peptide Moisturizer | `the-inkey-list-peptide-moisturizer` | — |
| The INKEY List | The INKEY List PHA Toner | `the-inkey-list-pha-toner` | — |
| The INKEY List | The INKEY List Retinol Serum | `the-inkey-list-retinol-serum` | — |
| The Light Salon | The Light Salon Boost Advanced LED Mask | `the-light-salon-boost-advanced-led-mask` | — |
| The Ordinary | The Ordinary AHA 30% + BHA 2% Peeling Solution | `the-ordinary-aha-30-bha-2-peeling-solution` | — |
| The Ordinary | The Ordinary Alpha Arbutin 2% + HA | `the-ordinary-alpha-arbutin-2-ha` | — |
| The Ordinary | The Ordinary Argireline Solution 10% | `the-ordinary-argireline-solution-10` | — |
| The Ordinary | The Ordinary Ascorbyl Glucoside Solution 12% | `the-ordinary-ascorbyl-glucoside-solution-12` | — |
| The Ordinary | The Ordinary Buffet | `the-ordinary-buffet` | — |
| The Ordinary | The Ordinary Buffet + Copper Peptides 1% | `the-ordinary-buffet-copper-peptides-1` | — |
| The Ordinary | The Ordinary Caffeine Solution 5% + EGCG | `the-ordinary-caffeine-solution-5-egcg` | — |
| The Ordinary | The Ordinary Glycolic Acid 7% Toning Solution | `the-ordinary-glycolic-acid-7-toning-solution` | — |
| The Ordinary | The Ordinary Granactive Retinoid 2% Emulsion | `the-ordinary-granactive-retinoid-2-emulsion` | — |
| The Ordinary | The Ordinary Hyaluronic Acid 2% + B5 | `the-ordinary-hyaluronic-acid-2-b5` | — |
| The Ordinary | The Ordinary Lactic Acid 10% + HA | `the-ordinary-lactic-acid-10-ha` | — |
| The Ordinary | The Ordinary Natural Moisturizing Factors + HA | `the-ordinary-natural-moisturizing-factors-ha` | — |
| The Ordinary | The Ordinary Niacinamide 10% + Zinc 1% | `the-ordinary-niacinamide` | [odkaz](https://theordinary.com) |
| The Ordinary | The Ordinary Resveratrol 3% + Ferulic Acid 3% | `the-ordinary-resveratrol-3-ferulic-acid-3` | — |
| The Ordinary | The Ordinary Retinol 1% in Squalane | `the-ordinary-retinol-1-in-squalane` | — |
| Timeless | Timeless 20% Vitamin C + E Ferulic Acid | `timeless-20-vitamin-c-e-ferulic-acid` | — |
| Tria | Tria Age-Defying Laser | `tria-age-defying-laser` | — |
| Tria | Tria Smooth Beauty Laser | `tria-smooth-beauty-laser` | — |
| TriPollar | TriPollar STOP Vx | `tripollar-stop-vx` | — |
| TriPollar | TriPollar STOP X | `tripollar-stop-x` | — |
| Trophy Skin | Trophy Skin LabelleSkin Spatula | `trophy-skin-labelleskin-spatula` | — |
| Ulike | Ulike Home HIFU Device | `ulike-home-hifu-device` | — |
| Vichy | Vichy Liftactiv Supreme | `vichy-liftactiv-supreme` | — |
| Vichy | Vichy Minéral 89 | `vichy-mineral-89` | — |
| Viridian | Viridian Zinc Citrate | `viridian-zinc-citrate` | — |
| Vivacells | Vivacells Mořský kolagen | `vivacells-morsky-kolagen` | — |
| Wildling | Wildling Empress Stone | `wildling-empress-stone` | — |
| Wrinkles Schminkles | Wrinkles Schminkles Décolletage Patch | `wrinkles-schminkles-decolletage-patch` | — |
| ZGTS | ZGTS Dermaroller 0.5 mm | `zgts-dermaroller-0-5-mm` | — |
| ZIIP | ZIIP Halo | `ziip-halo` | [odkaz](https://ziipbeauty.com) |

## Technologie (18)

| Technologie | slug | Poznámka |
|---|---|---|
| LED terapie | `led-terapie` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Radiofrekvence (RF) | `radiofrekvence` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Microcurrent | `microcurrent` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| HIFU | `hifu` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Microneedling | `microneedling` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| EMS | `ems` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| IPL (intenzivní pulzní světlo) | `ipl` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Ultrazvuk (kosmetický) | `ultrazvuk` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Near-infrared (blízké infračervené světlo) | `near-infrared` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Domácí frakční laser | `domaci-laser` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Galvanická péče (iontoforéza) | `galvanicka-pece` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Plasma pen (fibroblast) | `plasma-pen` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Oxygenoterapie (kyslíková péče) | `oxygenoterapie` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Kryoterapie (chlazení pleti) | `kryoterapie` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Gua Sha | `gua-sha` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Face Roller (obličejový váleček) | `face-roller` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Silikonové náplasti | `silikonove-naplasti` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
| Dermaroller (domácí microneedling) | `dermaroller` | fotka reprezentativního zařízení; při absenci oficiální fotky AI ilustrace |
