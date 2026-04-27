/**
 * Migrační skript: WordPress → nová DB
 *
 * Fáze 2 prototyp — kategorie rajčata (post_parent = 756)
 *
 * Spuštění:
 *   npx tsx scripts/migrate-from-wp.ts
 *
 * Env proměnné:
 *   WP_DB_HOST, WP_DB_USER, WP_DB_PASS, WP_DB_NAME — zdrojová WP DB (local MariaDB)
 *   DATABASE_URL — cílová Neon Postgres DB
 */

import mysql from "mysql2/promise";
import { convert } from "html-to-text";
import slugify from "slugify";

// ─────────────────────────────────────────────
// Typy
// ─────────────────────────────────────────────
interface WpPage {
  ID: number;
  post_title: string;
  post_name: string;
  post_content: string;
  post_parent: number;
  post_date: Date;
  post_modified: Date;
  parent_slug: string;
  parent_title: string;
}

interface ParsedVariety {
  wpPostId: number;
  name: string;
  slug: string;
  categoryWpId: number;
  categoryName: string;
  descriptionHtml: string;
  excerpt: string;
  wpUrl: string;

  // Strukturovaná data (z LLM extrakce — placeholder v prototypu)
  ripeningLabel: string | null;
  ripeningSortKey: number;
  color: string | null;
  fruitSize: string | null;
  fruitWeight: string | null;
  tasteProfile: string | null;
  useCases: string[];
  diseaseResistance: string[];
  qualityScore: number;
}

// ─────────────────────────────────────────────
// Konfigurace
// ─────────────────────────────────────────────
const WP_TABLE_PREFIX = "wp491_";
const TARGET_PARENT_ID = 756; // Odrůdy rajčat (post ID)
const TARGET_CATEGORY_SLUG = "rajcata"; // nový slug

// ─────────────────────────────────────────────
// HTML Cleanup
// ─────────────────────────────────────────────
function cleanHtml(raw: string): string {
  return (
    raw
      // Stripnout WP-block komentáře
      .replace(/<!--\s*wp:[^>]*-->/g, "")
      .replace(/<!--\s*\/wp:[^>]*-->/g, "")
      // Opravit špatné <p><h2> — nahradit </p><h2> za <h2>
      .replace(/<p>\s*(<h[1-6][^>]*>)/g, "$1")
      .replace(/(<\/h[1-6]>)\s*<\/p>/g, "$1")
      // Zbývající prázdné odstavce
      .replace(/<p>\s*<\/p>/g, "")
      // Markdown tučné v textu
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .trim()
  );
}

function buildExcerpt(html: string, maxChars = 160): string {
  const plain = convert(html, {
    selectors: [
      { selector: "h1", format: "skip" },   // přeskočit nadpis (nadpis = název odrůdy)
      { selector: "h2", format: "skip" },
      { selector: "h3", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
      { selector: "ul", options: { itemPrefix: "" } },
    ],
    wordwrap: false,
  });
  const stripped = plain.replace(/\s+/g, " ").trim();
  return stripped.length <= maxChars
    ? stripped
    : stripped.slice(0, maxChars - 1) + "…";
}

/** Zkrátit slug — odstranit redundantní prefix "odruda-X-" */
function buildSlug(title: string, categorySlugPrefix?: string): string {
  let slug = slugify(title, {
    lower: true,
    strict: true,
    locale: "cs",
    trim: true,
  });
  // Odstranit prefix "odruda-rajcat-" → "akron-f1"
  if (categorySlugPrefix) {
    const prefixToRemove = `odruda-${categorySlugPrefix}-`;
    if (slug.startsWith(prefixToRemove)) {
      slug = slug.slice(prefixToRemove.length);
    }
  }
  return slug;
}

// ─────────────────────────────────────────────
// Heuristická extrakce strukturovaných dat
// (v produkci nahradit LLM voláním)
// ─────────────────────────────────────────────
const RIPENING_PATTERNS: Array<[RegExp, string, number]> = [
  [/velmi\s+ran[áa]/i, "velmi raná", 1],
  [/extra\s+ran[áa]/i, "velmi raná", 1],
  [/ran[áa]\s+odr/i, "raná", 2],
  [/\bran[áa]\b/i, "raná", 2],
  [/polo.?ran[áa]/i, "poloraná", 3],
  [/st[řr]edn[ěe]\s+ran[áa]/i, "středně raná", 3],
  [/st[řr]edn[ěe]\s+pozdn[íi]/i, "středně pozdní", 4],
  [/\bpozdn[íi]\b/i, "pozdní", 5],
  [/velmi\s+pozdn[íi]/i, "velmi pozdní", 6],
];

function extractRipening(text: string): { label: string | null; sortKey: number } {
  for (const [re, label, key] of RIPENING_PATTERNS) {
    if (re.test(text)) return { label, sortKey: key };
  }
  return { label: null, sortKey: 99 };
}

const USE_CASE_PATTERNS: Array<[RegExp, string]> = [
  [/konzum|čerstv[áe]|jíst\s+syr/i, "konzum"],
  [/zavař/i, "zavařování"],
  [/ketchup|protlak|passata|omáčk/i, "zpracování"],
  [/salát/i, "saláty"],
  [/grilová|pečení/i, "grilování"],
  [/sušení|sušen[áe]/i, "sušení"],
  [/kompot/i, "kompoty"],
  [/džem|marmelád/i, "džemy"],
];

function extractUseCases(text: string): string[] {
  return USE_CASE_PATTERNS
    .filter(([re]) => re.test(text))
    .map(([, label]) => label);
}

const DISEASE_PATTERNS: Array<[RegExp, string]> = [
  [/plíseň\s+bramborová|phytophthora/i, "plíseň bramborová"],
  [/plíseň\s+šedá|botrytis/i, "šedá plíseň"],
  [/fusarium/i, "fusarium"],
  [/verticilium/i, "verticilium"],
  [/viróz|TMV|CMV|mozaik/i, "virové choroby"],
  [/strupovitost/i, "strupovitost"],
  [/padlí/i, "padlí"],
];

function extractDiseaseResistance(text: string): string[] {
  return DISEASE_PATTERNS
    .filter(([re]) => re.test(text))
    .map(([, label]) => label);
}

function assessQuality(page: WpPage): number {
  const len = page.post_content.length;
  const hasH2 = /<h2/i.test(page.post_content);
  const hasUl = /<ul/i.test(page.post_content);
  if (len > 6000 && hasH2 && hasUl) return 4;
  if (len > 3000 && hasH2) return 3;
  if (len > 1500) return 2;
  return 1;
}

// ─────────────────────────────────────────────
// Hlavní migrace
// ─────────────────────────────────────────────
async function migrateCategory(parentId: number, categorySlug: string) {
  const wp = await mysql.createConnection({
    host: process.env.WP_DB_HOST ?? "localhost",
    user: process.env.WP_DB_USER ?? "root",
    password: process.env.WP_DB_PASS ?? "",
    database: process.env.WP_DB_NAME ?? "odrudy_audit",
    charset: "utf8mb4",
  });

  console.log(`\n🔗 Připojeno k WP DB: ${process.env.WP_DB_NAME ?? "odrudy_audit"}`);

  // ── Načíst rodičovskou kategorii ──
  const [catRows] = await wp.execute<mysql.RowDataPacket[]>(
    `SELECT ID, post_title, post_name FROM ${WP_TABLE_PREFIX}posts WHERE ID = ?`,
    [parentId]
  );
  const catRow = catRows[0];
  console.log(`📂 Kategorie: "${catRow.post_title}" (ID ${catRow.ID})`);

  // ── Načíst všechny odrůdy v kategorii ──
  const [rows] = await wp.execute<mysql.RowDataPacket[]>(
    `SELECT
       child.ID,
       child.post_title,
       child.post_name,
       child.post_content,
       child.post_parent,
       child.post_date,
       child.post_modified,
       parent.post_name  AS parent_slug,
       parent.post_title AS parent_title
     FROM ${WP_TABLE_PREFIX}posts child
     JOIN ${WP_TABLE_PREFIX}posts parent ON parent.ID = child.post_parent
     WHERE child.post_parent = ?
       AND child.post_type = 'page'
       AND child.post_status = 'publish'
     ORDER BY child.post_title`,
    [parentId]
  );

  const pages = rows as unknown as WpPage[];
  console.log(`📋 Nalezeno ${pages.length} odrůd\n`);

  const results: ParsedVariety[] = [];
  const slugsSeen = new Set<string>();

  for (const page of pages) {
    // HTML cleanup
    const cleanedHtml = cleanHtml(page.post_content);

    // Textová verze pro NLP
    const plainText = convert(cleanedHtml, {
      selectors: [{ selector: "a", options: { ignoreHref: true } }],
    });

    // Strukturovaná data (heuristika — v produkci = LLM)
    const { label: ripeningLabel, sortKey: ripeningSortKey } = extractRipening(plainText);
    const useCases = extractUseCases(plainText);
    const diseaseResistance = extractDiseaseResistance(plainText);
    const qualityScore = assessQuality(page);

    // Slug normalizace (dedup) — zkrátit prefix "odruda-rajcat-" → "akron-f1"
    let slug = buildSlug(page.post_title, "rajcat");
    if (!slug) slug = buildSlug(page.post_name, "rajcat");
    if (slugsSeen.has(slug)) slug = `${slug}-${page.ID}`;
    slugsSeen.add(slug);

    const variety: ParsedVariety = {
      wpPostId: page.ID,
      name: page.post_title,
      slug,
      categoryWpId: parentId,
      categoryName: page.parent_title,
      descriptionHtml: cleanedHtml,
      excerpt: buildExcerpt(cleanedHtml),
      wpUrl: `https://odrudy.cz/${page.parent_slug}/${page.post_name}/`,

      ripeningLabel,
      ripeningSortKey,
      color: null,       // ← bude LLM
      fruitSize: null,   // ← bude LLM
      fruitWeight: null, // ← bude LLM
      tasteProfile: null,// ← bude LLM
      useCases,
      diseaseResistance,
      qualityScore,
    };

    results.push(variety);
  }

  await wp.end();

  // ── Výpis statistik ──
  console.log("─".repeat(60));
  console.log(`Celkem odrůd:           ${results.length}`);
  console.log(`S datem zrání:          ${results.filter((r) => r.ripeningLabel).length}`);
  console.log(`S use cases:            ${results.filter((r) => r.useCases.length > 0).length}`);
  console.log(`S odolností chorobám:   ${results.filter((r) => r.diseaseResistance.length > 0).length}`);
  console.log(`\nKvalita obsahu:`);
  for (let i = 1; i <= 4; i++) {
    const c = results.filter((r) => r.qualityScore === i).length;
    console.log(`  ⭐${i}: ${c} odrůd`);
  }

  console.log("\n📊 Vzorky (prvních 5):");
  results.slice(0, 5).forEach((v) => {
    console.log(`\n  [${v.wpPostId}] ${v.name}`);
    console.log(`    slug:      ${v.slug}`);
    console.log(`    ripening:  ${v.ripeningLabel ?? "(nedetekováno)"} (key=${v.ripeningSortKey})`);
    console.log(`    useCases:  ${v.useCases.join(", ") || "(žádné)"}`);
    console.log(`    diseases:  ${v.diseaseResistance.join(", ") || "(žádné)"}`);
    console.log(`    quality:   ${"⭐".repeat(v.qualityScore)}`);
    console.log(`    excerpt:   ${v.excerpt.slice(0, 80)}…`);
    console.log(`    wpUrl:     ${v.wpUrl}`);
  });

  // ── Uložit JSON pro kontrolu ──
  const outputPath = `scripts/output-${categorySlug}.json`;
  const fs = await import("fs/promises");
  await fs.writeFile(
    outputPath,
    JSON.stringify({ category: catRow.post_title, count: results.length, varieties: results }, null, 2),
    "utf-8"
  );
  console.log(`\n✅ Uloženo do ${outputPath}`);

  return results;
}

// ─────────────────────────────────────────────
// Spustit
// ─────────────────────────────────────────────
migrateCategory(TARGET_PARENT_ID, TARGET_CATEGORY_SLUG).catch(console.error);
