import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  smallint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────
// KATEGORIE (např. Rajčata, Jablka, Víno…)
// ─────────────────────────────────────────────
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    namePlural: text("name_plural"),           // "Rajčata" vs. "Rajče"
    description: text("description"),          // krátký intro text (HTML)
    heroImageUrl: text("hero_image_url"),
    heroImageAlt: text("hero_image_alt"),
    sortOrder: smallint("sort_order").default(0),
    visible: boolean("visible").default(true), // false = skrytá (9 prázdných)
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    wpPostId: integer("wp_post_id"),           // audit trail → WP ID
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_slug_idx").on(t.slug),
    index("categories_visible_idx").on(t.visible),
  ]
);

// ─────────────────────────────────────────────
// ODRŮDY
// ─────────────────────────────────────────────
export const varieties = pgTable(
  "varieties",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),

    // ── Strukturovaná data (extrahovaná z textu pomocí LLM) ──
    ripeningSortKey: smallint("ripening_sort_key").default(99),
    // 1=velmi raná, 2=raná, 3=poloraná, 4=střední, 5=pozdní, 6=velmi pozdní, 99=neuvedeno
    ripeningLabel: text("ripening_label"),     // "raná", "pozdní"…
    color: text("color"),                       // "červená", "žlutá"…
    fruitSize: text("fruit_size"),              // "malé", "střední", "velké"
    fruitWeight: text("fruit_weight"),          // "150–200 g"
    tasteProfile: text("taste_profile"),        // "sladká, aromatická"
    plantHeight: text("plant_height"),          // "nízká", "tyčková", "80–120 cm"
    yieldRating: smallint("yield_rating"),      // 1–5
    storageDays: smallint("storage_days"),      // orientační počet dní skladovatelnosti
    useCases: text("use_cases").array(),        // ["konzum","kompot","džem"]
    diseaseResistance: text("disease_resistance").array(), // ["plíseň","strupovitost"]
    characteristics: text("characteristics").array(),     // obecné ["mrazuvzdorná","samosprašná"]
    originCountry: text("origin_country"),
    yearRegistered: smallint("year_registered"),

    // ── Obsah ──
    descriptionHtml: text("description_html"), // vyčištěné HTML (po cleanup parseru)
    excerpt: text("excerpt"),                   // ~160 znaků, pro SEO a karty

    // ── Média ──
    heroImageUrl: text("hero_image_url"),
    heroImageAlt: text("hero_image_alt"),
    heroImageGeneratedAt: timestamp("hero_image_generated_at"),

    // ── Affiliate ──
    // JSONB pole: [{partner: "semo", url: "...", label: "Koupit semena"}]
    affiliateLinks: jsonb("affiliate_links").$type<
      Array<{ partner: string; url: string; label: string }>
    >(),

    // ── SEO ──
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    focusKeyword: text("focus_keyword"),

    // ── Systém ──
    status: text("status", { enum: ["draft", "published"] }).default("draft"),
    qualityScore: smallint("quality_score"),    // 1–5 (LLM hodnocení kvality textu)
    wpPostId: integer("wp_post_id"),            // audit trail → WP ID
    wpUrl: text("wp_url"),                      // původní WP URL (pro 301 redirect mapu)
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("varieties_slug_category_idx").on(t.slug, t.categoryId),
    index("varieties_category_status_idx").on(t.categoryId, t.status),
    index("varieties_status_idx").on(t.status),
    index("varieties_ripening_idx").on(t.ripeningSortKey),
    index("varieties_wp_post_id_idx").on(t.wpPostId),
  ]
);

// ─────────────────────────────────────────────
// BLOG PŘÍSPĚVKY
// ─────────────────────────────────────────────
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    contentHtml: text("content_html"),
    heroImageUrl: text("hero_image_url"),
    category: text("category"),                // volný text (sezónní, návod…)
    tags: text("tags").array(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    status: text("status", { enum: ["draft", "published"] }).default("draft"),
    wpPostId: integer("wp_post_id"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("blog_slug_idx").on(t.slug),
    index("blog_status_idx").on(t.status),
  ]
);

// ─────────────────────────────────────────────
// AFFILIATE PARTNEŘI
// ─────────────────────────────────────────────
export const affiliatePartners = pgTable("affiliate_partners", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),              // "semo", "hortus", "starkl"
  name: text("name").notNull(),
  baseUrl: text("base_url"),
  logoUrl: text("logo_url"),
  trackingParam: text("tracking_param"),     // UTM parametr nebo affiliate ID
  active: boolean("active").default(true),
  sortOrder: smallint("sort_order").default(0),
});

// ─────────────────────────────────────────────
// REDIRECT MAPA (WP URL → nová URL)
// ─────────────────────────────────────────────
export const redirects = pgTable(
  "redirects",
  {
    id: serial("id").primaryKey(),
    fromPath: text("from_path").notNull(),   // "/odrudy-rajcat/odruda-rajcata-anca/"
    toPath: text("to_path").notNull(),       // "/rajcata/anca/"
    statusCode: smallint("status_code").default(301),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("redirects_from_path_idx").on(t.fromPath),
  ]
);

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ many }) => ({
  varieties: many(varieties),
}));

export const varietiesRelations = relations(varieties, ({ one }) => ({
  category: one(categories, {
    fields: [varieties.categoryId],
    references: [categories.id],
  }),
}));
