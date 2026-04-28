<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Variety;
use App\Services\OpenAiImageClient;
use App\Services\GeminiImageClient;
use Illuminate\Console\Command;
use Throwable;

class GenerateImages extends Command
{
    protected $signature = 'generate:images
                            {target : "categories" | "varieties" | "all"}
                            {--limit=0 : Kolik položek max (0 = všechny)}
                            {--only= : Slug konkrétní kategorie nebo odrůdy}
                            {--force : Re-generovat i existující obrázky}
                            {--quality= : Override quality (low/medium/high) — jen OpenAI}
                            {--provider=openai : "openai" | "gemini" (Gemini má free tier 10 RPM)}';

    protected $description = 'Generuje hero obrázky pomocí OpenAI gpt-image-1 nebo Gemini';

    /** @var OpenAiImageClient|GeminiImageClient */
    private $ai;
    private string $provider;
    private string $imagesDir;

    /**
     * Mapování slug kategorie → typ + vizuální kontext pro prompt.
     * Pomáhá modelu vědět, co má zobrazit.
     */
    private array $categoryHints = [
        'rajcata'         => ['type' => 'fruit', 'visual' => 'fresh ripe tomatoes on a wooden table'],
        'okurky'          => ['type' => 'fruit', 'visual' => 'fresh cucumbers with leaves'],
        'papriky'         => ['type' => 'fruit', 'visual' => 'colorful bell peppers'],
        'cukety'          => ['type' => 'fruit', 'visual' => 'fresh zucchini squash with flower'],
        'dyne'            => ['type' => 'fruit', 'visual' => 'pumpkins of various sizes'],
        'fazole'          => ['type' => 'legume', 'visual' => 'fresh green beans pods'],
        'hrasek'          => ['type' => 'legume', 'visual' => 'fresh pea pods opened'],
        'cibule'          => ['type' => 'bulb', 'visual' => 'fresh onions with green tops'],
        'cesnek'          => ['type' => 'bulb', 'visual' => 'garlic bulbs and cloves'],
        'brambory'        => ['type' => 'tuber', 'visual' => 'fresh potatoes from harvest'],
        'hlavkovy-salat'  => ['type' => 'leafy', 'visual' => 'fresh head lettuce with green leaves'],
        'chilli'          => ['type' => 'fruit', 'visual' => 'red and green chili peppers'],
        'jablka'          => ['type' => 'fruit', 'visual' => 'ripe red apples with leaves'],
        'hrusky'          => ['type' => 'fruit', 'visual' => 'fresh pears on a tree branch'],
        'svestky'         => ['type' => 'fruit', 'visual' => 'dark blue plums on branch'],
        'tresne'          => ['type' => 'fruit', 'visual' => 'fresh red cherries with stems'],
        'visne'           => ['type' => 'fruit', 'visual' => 'sour cherries on tree'],
        'broskve'         => ['type' => 'fruit', 'visual' => 'ripe peaches with leaves'],
        'merunky'         => ['type' => 'fruit', 'visual' => 'apricots on tree branch'],
        'jahody'          => ['type' => 'fruit', 'visual' => 'fresh red strawberries with green leaves'],
        'maliny'          => ['type' => 'fruit', 'visual' => 'fresh raspberries on bush'],
        'boruvky'         => ['type' => 'fruit', 'visual' => 'fresh blueberries on bush'],
        'angrest'         => ['type' => 'fruit', 'visual' => 'gooseberries on shrub'],
        'aronie'          => ['type' => 'fruit', 'visual' => 'dark chokeberry fruits'],
        'zimolez'         => ['type' => 'fruit', 'visual' => 'haskap honeyberries blue fruits'],
        'drin'            => ['type' => 'fruit', 'visual' => 'cornelian cherry fruits red'],
        'muchovnik'       => ['type' => 'fruit', 'visual' => 'serviceberry juneberry fruits'],
        'hlosiny'         => ['type' => 'shrub', 'visual' => 'sea buckthorn orange berries'],
        'vina'            => ['type' => 'grape', 'visual' => 'wine grape clusters in vineyard'],
        'okrasne-traviny' => ['type' => 'ornamental', 'visual' => 'ornamental grasses garden'],
        'hortenzie'       => ['type' => 'flower', 'visual' => 'hydrangea flowers in bloom'],
        'rododendrony'    => ['type' => 'flower', 'visual' => 'rhododendron flowers blooming'],
        'javory'          => ['type' => 'tree', 'visual' => 'maple tree colorful leaves'],
        'plevele'         => ['type' => 'plant', 'visual' => 'common garden weeds in soil'],
    ];

    public function __construct()
    {
        parent::__construct();
        $this->imagesDir = base_path('public/images');
    }

    public function handle(): int
    {
        $this->provider = strtolower((string) $this->option('provider'));

        try {
            $this->ai = match ($this->provider) {
                'gemini'         => new GeminiImageClient(),
                'openai', ''     => new OpenAiImageClient(),
                default          => throw new \InvalidArgumentException("Neznámý provider: {$this->provider}"),
            };
            $this->info("🔌 Provider: {$this->provider}");
        } catch (Throwable $e) {
            $this->error('❌ ' . $e->getMessage());
            return 1;
        }

        $target = $this->argument('target');

        if ($target === 'categories' || $target === 'all') {
            $this->generateCategories();
        }
        if ($target === 'varieties' || $target === 'all') {
            $this->generateVarieties();
        }

        return 0;
    }

    private function generateCategories(): void
    {
        $query = Category::query()->where('visible', true);

        if ($only = $this->option('only')) {
            $query->where('slug', $only);
        }

        if (!$this->option('force')) {
            $query->whereNull('hero_image_url');
        }

        if ($limit = (int) $this->option('limit')) {
            $query->limit($limit);
        }

        $categories = $query->orderBy('sort_order')->get();
        if ($categories->isEmpty()) {
            $this->info('📂 Nic ke generování (kategorie).');
            return;
        }

        $this->info("📂 Generuji obrázky pro {$categories->count()} kategorií (medium quality, ~\$0.042/ks)");
        $quality = $this->option('quality') ?? 'medium';

        $bar = $this->output->createProgressBar($categories->count());
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% — %message%');
        $bar->start();

        $stats = ['ok' => 0, 'fail' => 0];
        foreach ($categories as $cat) {
            $bar->setMessage($cat->name);

            $prompt = $this->buildCategoryPrompt($cat);
            $path   = "{$this->imagesDir}/categories/{$cat->slug}.png";
            $url    = "/images/categories/{$cat->slug}.png";

            try {
                $this->callGenerate($prompt, $path, $quality);
                $cat->update([
                    'hero_image_url' => $url,
                    'hero_image_alt' => $cat->name,
                ]);
                $stats['ok']++;
            } catch (Throwable $e) {
                $stats['fail']++;
                $this->newLine();
                $this->warn("⚠️  {$cat->name}: " . substr($e->getMessage(), 0, 200));
            }

            $bar->advance();
            $this->rateLimit();
        }
        $bar->finish();
        $this->newLine();
        $this->info("✅ Kategorie: {$stats['ok']} ok, {$stats['fail']} chyb");
    }

    private function generateVarieties(): void
    {
        $query = Variety::query()->where('status', 'published')->with('category');

        if ($only = $this->option('only')) {
            $query->where('slug', $only);
        }

        if (!$this->option('force')) {
            $query->whereNull('hero_image_url');
        }

        if ($limit = (int) $this->option('limit')) {
            $query->limit($limit);
        }

        $total = (clone $query)->count();
        if ($total === 0) {
            $this->info('🌱 Nic ke generování (odrůdy).');
            return;
        }

        $this->info("🌱 Generuji obrázky pro {$total} odrůd (low quality, ~\$0.011/ks)");
        $quality = $this->option('quality') ?? 'low';

        $bar = $this->output->createProgressBar($total);
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% — %message%');
        $bar->start();

        $stats = ['ok' => 0, 'fail' => 0];

        // chunkById() místo chunk() — bezpečné když UPDATE odstraní řádky z výsledku
        $query->chunkById(50, function ($chunk) use (&$stats, $bar, $quality) {
            foreach ($chunk as $variety) {
                $bar->setMessage(mb_substr($variety->short_name, 0, 40));

                $prompt = $this->buildVarietyPrompt($variety);
                $catSlug = $variety->category->slug;
                $path   = "{$this->imagesDir}/varieties/{$catSlug}/{$variety->slug}.png";
                $url    = "/images/varieties/{$catSlug}/{$variety->slug}.png";

                try {
                    $this->callGenerate($prompt, $path, $quality);
                    $variety->update([
                        'hero_image_url'          => $url,
                        'hero_image_alt'          => $variety->short_name,
                        'hero_image_generated_at' => now(),
                    ]);
                    $stats['ok']++;
                } catch (Throwable $e) {
                    $stats['fail']++;
                    $this->newLine();
                    $this->warn("⚠️  {$variety->name}: " . substr($e->getMessage(), 0, 200));
                }

                $bar->advance();
                $this->rateLimit();
            }
            // Vyčistit DB query log a uvolnit reference
            \DB::connection()->disableQueryLog();
            gc_collect_cycles();
        });

        $bar->finish();
        $this->newLine();
        $this->info("✅ Odrůdy: {$stats['ok']} ok, {$stats['fail']} chyb");
    }

    /**
     * Volá generování přes aktivního providera.
     * OpenAI bere quality, Gemini ne.
     */
    private function callGenerate(string $prompt, string $path, string $quality): void
    {
        if ($this->provider === 'gemini') {
            /** @var GeminiImageClient $ai */
            $ai = $this->ai;
            $ai->generateToFile($prompt, $path);
        } else {
            /** @var OpenAiImageClient $ai */
            $ai = $this->ai;
            $ai->generateToFile($prompt, $path, $quality);
        }
    }

    /**
     * Rate limit podle providera.
     * Gemini free tier = 10 RPM = 6 sekund mezi requesty (pro jistotu 7s).
     * OpenAI = jen šetrná pauza.
     */
    private function rateLimit(): void
    {
        if ($this->provider === 'gemini') {
            sleep(7); // 7s mezi requesty → ~8 RPM (bezpečně pod 10)
        } else {
            usleep(200_000); // 200ms
        }
    }

    private function buildCategoryPrompt(Category $category): string
    {
        $hint = $this->categoryHints[$category->slug] ?? null;
        $visual = $hint['visual'] ?? "fresh {$category->name}";

        return <<<PROMPT
Professional botanical photography of {$visual}, beautiful natural lighting,
shallow depth of field, fresh and vibrant, garden background slightly blurred,
photorealistic, high quality, magazine style, no text, no watermarks, no logos.
PROMPT;
    }

    private function buildVarietyPrompt(Variety $variety): string
    {
        $cat = $variety->category;
        $hint = $this->categoryHints[$cat->slug] ?? null;
        $type = $hint['type'] ?? 'plant';
        $baseVisual = $hint['visual'] ?? "{$cat->name}";

        // Doplníme strukturovaná data, pokud máme
        $detailsParts = [];
        if ($variety->color) {
            $detailsParts[] = "color: {$variety->color}";
        }
        if ($variety->fruit_size) {
            $detailsParts[] = "size: {$variety->fruit_size}";
        }
        if ($variety->fruit_weight) {
            $detailsParts[] = "weight: {$variety->fruit_weight}";
        }
        $details = !empty($detailsParts) ? ' (' . implode(', ', $detailsParts) . ')' : '';

        return <<<PROMPT
Professional product photograph of {$baseVisual}{$details},
single specimen as the main subject, soft natural lighting,
clean blurred background, photorealistic, high detail,
botanical illustration style, no text, no watermarks, no logos.
PROMPT;
    }
}
