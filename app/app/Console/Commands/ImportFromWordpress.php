<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Variety;
use App\Models\BlogPost;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportFromWordpress extends Command
{
    protected $signature = 'import:wp {--fresh : Truncate target tables before import} {--only= : Import only this WP slug (e.g. odrudy-rajcat)}';
    protected $description = 'Import categories, varieties and blog posts from WordPress DB into Laravel DB';

    /** @var array<string,array> */
    private array $categoryMap;
    private array $stats = [
        'categories' => 0, 'varieties' => 0, 'blog_posts' => 0, 'skipped' => 0,
    ];

    public function handle(): int
    {
        $this->categoryMap = config('category-map');

        if ($this->option('fresh')) {
            $this->info('🗑️  Fresh: mažu cílové tabulky…');
            DB::table('varieties')->delete();
            DB::table('categories')->delete();
            DB::table('blog_posts')->delete();
        }

        $this->importCategories();
        $this->importBlogPosts();

        $this->newLine();
        $this->info('✅ Import dokončen:');
        $this->line("   Kategorie:  {$this->stats['categories']}");
        $this->line("   Odrůdy:     {$this->stats['varieties']}");
        $this->line("   Blog posty: {$this->stats['blog_posts']}");
        if ($this->stats['skipped'] > 0) {
            $this->warn("   Přeskočeno: {$this->stats['skipped']} (chybí v category-map)");
        }
        return 0;
    }

    /**
     * Import všech kategorií + jejich odrůd
     */
    private function importCategories(): void
    {
        $only = $this->option('only');

        // Načíst všechny rodičovské stránky (kategorie)
        $categories = DB::connection('wp')->table('posts')
            ->whereIn('post_status', ['publish', 'private'])
            ->where('post_type', 'page')
            ->where('post_parent', 0)
            ->select('ID', 'post_name', 'post_title', 'post_status')
            ->get();

        foreach ($categories as $wpCat) {
            // Přeskočit blog page a zkušební stránku
            if (in_array($wpCat->post_name, ['blog-odrudy-cz', 'zkusebni-stranka'], true)) {
                continue;
            }

            // Najít v mapování
            if (!isset($this->categoryMap[$wpCat->post_name])) {
                $this->warn("⚠️  Kategorie '{$wpCat->post_name}' není v category-map → přeskakuji");
                $this->stats['skipped']++;
                continue;
            }

            if ($only && $wpCat->post_name !== $only) {
                continue;
            }

            $map = $this->categoryMap[$wpCat->post_name];

            // Vytvořit / aktualizovat kategorii
            $category = Category::updateOrCreate(
                ['slug' => $map['slug']],
                [
                    'name'         => $map['name'],
                    'name_plural'  => $map['name_plural'],
                    'visible'      => $map['visible'],
                    'sort_order'   => $map['sort_order'],
                    'wp_post_id'   => $wpCat->ID,
                    'meta_title'   => $map['name'] . ' – Odrůdy.cz',
                    'meta_description' => 'Přehled odrůd ' . $map['name_plural'] . ' s popisem, vlastnostmi a tipy na pěstování.',
                ]
            );
            $this->stats['categories']++;

            $this->line("📂 {$map['name']} (ID {$wpCat->ID})");

            $this->importVarieties($category, (int) $wpCat->ID, $map['strip_prefix']);
        }
    }

    /**
     * Import odrůd v dané kategorii
     */
    private function importVarieties(Category $category, int $wpParentId, string $stripPrefix): void
    {
        $varieties = DB::connection('wp')->table('posts')
            ->where('post_parent', $wpParentId)
            ->where('post_type', 'page')
            ->where('post_status', 'publish')
            ->select('ID', 'post_title', 'post_name', 'post_content', 'post_date', 'post_modified')
            ->orderBy('post_title')
            ->get();

        $bar = $this->output->createProgressBar($varieties->count());
        $bar->start();

        $usedSlugs = [];

        foreach ($varieties as $wp) {
            $cleanedHtml = $this->cleanHtml($wp->post_content);
            $plainText   = $this->htmlToText($cleanedHtml);

            // Slug: odstranit redundantní prefix
            $slug = $this->buildSlug($wp->post_title, $stripPrefix);
            if (empty($slug)) {
                $slug = $this->buildSlug($wp->post_name, $stripPrefix);
            }
            if (empty($slug)) {
                $slug = 'variety-' . $wp->ID;
            }
            // Dedup
            $base = $slug; $i = 2;
            while (in_array($slug, $usedSlugs, true)) {
                $slug = $base . '-' . $i++;
            }
            $usedSlugs[] = $slug;

            // Heuristická extrakce strukturovaných dat
            [$ripeningLabel, $ripeningSortKey] = $this->extractRipening($plainText);
            $useCases   = $this->extractUseCases($plainText);
            $diseases   = $this->extractDiseaseResistance($plainText);
            $qualityScore = $this->assessQuality($wp->post_content);

            Variety::updateOrCreate(
                ['category_id' => $category->id, 'slug' => $slug],
                [
                    'name'              => $wp->post_title,
                    'description_html'  => $cleanedHtml,
                    'excerpt'           => $this->buildExcerpt($plainText),
                    'ripening_label'    => $ripeningLabel,
                    'ripening_sort_key' => $ripeningSortKey,
                    'use_cases'         => $useCases ?: null,
                    'disease_resistance'=> $diseases ?: null,
                    'quality_score'     => $qualityScore,
                    'status'            => 'published',
                    'wp_post_id'        => $wp->ID,
                    'wp_url'            => 'https://odrudy.cz/' . $this->categorySlug($category) . '/' . $wp->post_name . '/',
                    'meta_title'        => $this->shortName($wp->post_title) . ' – ' . $category->name,
                    'meta_description'  => $this->buildExcerpt($plainText, 155),
                ]
            );
            $this->stats['varieties']++;
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();
    }

    /**
     * Import blog příspěvků (post_type = 'post')
     */
    private function importBlogPosts(): void
    {
        $posts = DB::connection('wp')->table('posts')
            ->where('post_type', 'post')
            ->where('post_status', 'publish')
            ->select('ID', 'post_title', 'post_name', 'post_content', 'post_excerpt', 'post_date')
            ->get();

        if ($posts->isEmpty()) {
            return;
        }

        $this->info("📝 Blog: {$posts->count()} příspěvků");
        $bar = $this->output->createProgressBar($posts->count());
        $bar->start();

        foreach ($posts as $wp) {
            $cleanedHtml = $this->cleanHtml($wp->post_content);
            $plainText   = $this->htmlToText($cleanedHtml);

            BlogPost::updateOrCreate(
                ['slug' => $wp->post_name],
                [
                    'title'        => $wp->post_title,
                    'content_html' => $cleanedHtml,
                    'excerpt'      => $wp->post_excerpt ?: $this->buildExcerpt($plainText, 200),
                    'status'       => 'published',
                    'published_at' => $wp->post_date,
                    'wp_post_id'   => $wp->ID,
                    'meta_title'   => $wp->post_title,
                    'meta_description' => $this->buildExcerpt($plainText, 155),
                ]
            );
            $this->stats['blog_posts']++;
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();
    }

    // ═══════════════════════════════════════════════
    // Helpery
    // ═══════════════════════════════════════════════

    private function cleanHtml(string $raw): string
    {
        $s = $raw;
        // Odstranit WP-block komentáře
        $s = preg_replace('/<!--\s*\/?wp:[^>]*-->/u', '', $s);
        // Opravit nevalidní <p><h2> → <h2>
        $s = preg_replace('/<p>\s*(<h[1-6][^>]*>)/u', '$1', $s);
        $s = preg_replace('/(<\/h[1-6]>)\s*<\/p>/u', '$1', $s);

        // Konvertovat markdown nadpisy v textu na HTML (AI generoval texty s markdown)
        // Někdy jsou v <p># Heading</p>, někdy ## Heading mezi odstavci
        $s = preg_replace('/<p>\s*#{1}\s+([^<\n]+?)\s*<\/p>/u', '<h2>$1</h2>', $s);
        $s = preg_replace('/<p>\s*#{2}\s+([^<\n]+?)\s*<\/p>/u', '<h2>$1</h2>', $s);
        $s = preg_replace('/<p>\s*#{3}\s+([^<\n]+?)\s*<\/p>/u', '<h3>$1</h3>', $s);
        $s = preg_replace('/<p>\s*#{4,6}\s+([^<\n]+?)\s*<\/p>/u', '<h4>$1</h4>', $s);
        // Mimo <p> tagy
        $s = preg_replace('/(^|\n)#\s+([^\n]+)/u',  "\n<h2>$2</h2>", $s);
        $s = preg_replace('/(^|\n)##\s+([^\n]+)/u', "\n<h2>$2</h2>", $s);
        $s = preg_replace('/(^|\n)###\s+([^\n]+)/u',"\n<h3>$2</h3>", $s);

        // Strip prázdné odstavce
        $s = preg_replace('/<p>\s*<\/p>/u', '', $s);
        // Markdown bold v textu (nezasahuje strong)
        $s = preg_replace('/\*\*([^*]+)\*\*/u', '<strong>$1</strong>', $s);
        return trim($s);
    }

    private function htmlToText(string $html): string
    {
        // Odstranit HTML nadpisy
        $s = preg_replace('/<h[1-6][^>]*>.*?<\/h[1-6]>/us', '', $html);
        // <br> a </p> → nové řádky
        $s = preg_replace('/<br\s*\/?>/u', "\n", $s);
        $s = preg_replace('/<\/p>/u', "\n\n", $s);
        // Strip HTML tagy
        $s = strip_tags($s);
        $s = html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        // Odstranit markdown nadpisy (#, ##, ###) na začátku řádku
        $s = preg_replace('/^\s*#{1,6}\s+.*$/um', '', $s);
        // Odstranit markdown bold/italic (**text**, *text*, __text__, _text_)
        $s = preg_replace('/\*\*([^*]+)\*\*/u', '$1', $s);
        $s = preg_replace('/__([^_]+)__/u', '$1', $s);
        // Bullet points "- " na začátku řádku
        $s = preg_replace('/^\s*[-*]\s+/um', '', $s);
        // Whitespace cleanup
        $s = preg_replace('/[ \t]+/u', ' ', $s);
        $s = preg_replace('/\n{3,}/u', "\n\n", $s);
        return trim($s);
    }

    private function buildExcerpt(string $plainText, int $maxChars = 160): string
    {
        $clean = preg_replace('/\s+/u', ' ', $plainText);
        $clean = trim($clean);
        if (mb_strlen($clean, 'UTF-8') <= $maxChars) {
            return $clean;
        }
        return mb_substr($clean, 0, $maxChars - 1, 'UTF-8') . '…';
    }

    private function buildSlug(string $title, string $stripPrefix): string
    {
        $slug = \Illuminate\Support\Str::slug($title, '-', 'cs');
        if ($stripPrefix && str_starts_with($slug, $stripPrefix)) {
            $slug = substr($slug, strlen($stripPrefix));
        }
        // Také zkusit obecný "odruda-X-" prefix
        $slug = preg_replace('/^odruda-[a-z]+-/u', '', $slug);
        return $slug;
    }

    private function shortName(string $title): string
    {
        // "Odrůda jablka Bohemia" → "Bohemia"
        return preg_replace('/^Odr[uů]da\s+\S+\s+/u', '', $title);
    }

    private function categorySlug(Category $cat): string
    {
        // Pro WP URL — vrátit původní WP slug. Použijeme reverzní mapu.
        foreach ($this->categoryMap as $wpSlug => $map) {
            if ($map['slug'] === $cat->slug) {
                return $wpSlug;
            }
        }
        return $cat->slug;
    }

    /** @return array{0:?string,1:int} [label, sortKey] */
    private function extractRipening(string $text): array
    {
        $patterns = [
            '/velmi\s+ran[áa]/iu'      => ['velmi raná', 1],
            '/extra\s+ran[áa]/iu'      => ['velmi raná', 1],
            '/\bran[áa]\b/iu'          => ['raná', 2],
            '/polo.?ran[áa]/iu'        => ['poloraná', 3],
            '/st[řr]edn[ěe]\s+ran[áa]/iu' => ['středně raná', 3],
            '/st[řr]edn[ěe]\s+pozdn[íi]/iu' => ['středně pozdní', 4],
            '/velmi\s+pozdn[íi]/iu'    => ['velmi pozdní', 6],
            '/\bpozdn[íi]\b/iu'        => ['pozdní', 5],
        ];
        foreach ($patterns as $re => [$label, $key]) {
            if (preg_match($re, $text)) {
                return [$label, $key];
            }
        }
        return [null, 99];
    }

    private function extractUseCases(string $text): array
    {
        $patterns = [
            '/konzum|čerstv[áe]|jíst\s+syr/iu' => 'konzum',
            '/zavařován/iu'                    => 'zavařování',
            '/ketchup|protlak|passata|omáčk/iu' => 'zpracování',
            '/salát/iu'                        => 'saláty',
            '/grilován|pečení/iu'              => 'grilování',
            '/sušen/iu'                        => 'sušení',
            '/kompot/iu'                       => 'kompoty',
            '/džem|marmelád|povidl/iu'         => 'džemy',
            '/štrúdl|závin/iu'                 => 'pečení',
            '/most|ovocný\s+nápoj/iu'          => 'mošty',
            '/sušen[éý]\s+v[íi]no|stoln[íi]\s+v[íi]no/iu' => 'stolní víno',
        ];
        $found = [];
        foreach ($patterns as $re => $label) {
            if (preg_match($re, $text)) {
                $found[$label] = true;
            }
        }
        return array_keys($found);
    }

    private function extractDiseaseResistance(string $text): array
    {
        $patterns = [
            '/plíseň\s+bramborov|phytophthora/iu' => 'plíseň bramborová',
            '/plíseň\s+šedá|botrytis/iu'          => 'šedá plíseň',
            '/fusarium/iu'                        => 'fusarium',
            '/verticilium/iu'                     => 'verticilium',
            '/viróz|TMV|CMV|mozaik/iu'            => 'virové choroby',
            '/strupovitost/iu'                    => 'strupovitost',
            '/padlí/iu'                           => 'padlí',
            '/rakovin[ay]/iu'                     => 'rakovina',
            '/monilióz/iu'                        => 'moniliové hniloby',
        ];
        $found = [];
        foreach ($patterns as $re => $label) {
            if (preg_match($re, $text)) {
                $found[$label] = true;
            }
        }
        return array_keys($found);
    }

    private function assessQuality(string $html): int
    {
        $len      = mb_strlen($html, 'UTF-8');
        // Hledá <h2> NEBO markdown ## (AI generuje obojí)
        $hasH2    = preg_match('/<h2|^\s*#{2,3}\s+/imu', $html) === 1;
        $hasList  = preg_match('/<ul|^\s*[-*]\s+/imu', $html) === 1;
        if ($len > 6000 && $hasH2 && $hasList) return 5;
        if ($len > 4000 && $hasH2) return 4;
        if ($len > 2500 && $hasH2) return 3;
        if ($len > 1500) return 2;
        return 1;
    }
}
