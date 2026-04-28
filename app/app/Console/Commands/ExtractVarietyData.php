<?php

namespace App\Console\Commands;

use App\Models\Variety;
use App\Services\OpenAiClient;
use Illuminate\Console\Command;
use Throwable;

class ExtractVarietyData extends Command
{
    protected $signature = 'extract:variety-data
                            {--limit=5 : Kolik odrůd zpracovat (0 = všechny)}
                            {--only= : Slug konkrétní kategorie (např. rajcata)}
                            {--force : Re-extrakce i odrůd, které už mají strukturovaná data}
                            {--dry-run : Jen vypsat výsledky, neukládat do DB}';

    protected $description = 'Extrakce strukturovaných polí z textu odrůdy pomocí OpenAI';

    private OpenAiClient $ai;

    /**
     * JSON Schema pro structured output.
     * Garantuje že odpověď bude vždy validní podle této struktury.
     */
    private array $jsonSchema = [
        'type' => 'object',
        'additionalProperties' => false,
        'required' => [
            'ripening_label', 'ripening_sort_key',
            'color', 'fruit_size', 'fruit_weight', 'taste_profile',
            'plant_height', 'yield_rating', 'storage_days',
            'use_cases', 'disease_resistance', 'characteristics',
            'origin_country', 'year_registered',
        ],
        'properties' => [
            'ripening_label' => [
                'type' => ['string', 'null'],
                'enum' => [
                    null, 'velmi raná', 'raná', 'středně raná',
                    'středně pozdní', 'pozdní', 'velmi pozdní',
                ],
                'description' => 'Doba zrání odrůdy. null pokud z textu nejasné.',
            ],
            'ripening_sort_key' => [
                'type' => 'integer',
                'minimum' => 1,
                'maximum' => 99,
                'description' => '1=velmi raná, 2=raná, 3=středně raná, 4=středně pozdní, 5=pozdní, 6=velmi pozdní, 99=neuvedeno',
            ],
            'color' => [
                'type' => ['string', 'null'],
                'description' => 'Barva plodu/květu jednoslovně či krátce (např. "červená", "tmavě červená", "žlutá s červeným nádechem"). null pokud neuvedeno.',
            ],
            'fruit_size' => [
                'type' => ['string', 'null'],
                'enum' => [null, 'velmi malé', 'malé', 'střední', 'velké', 'velmi velké'],
                'description' => 'Velikost plodu. null pokud neuvedeno.',
            ],
            'fruit_weight' => [
                'type' => ['string', 'null'],
                'description' => 'Hmotnost plodu jako rozsah s jednotkou (např. "60-80 g", "150-220 g"). null pokud neuvedeno.',
            ],
            'taste_profile' => [
                'type' => ['string', 'null'],
                'description' => 'Krátký popis chuti (max 5 slov, např. "sladká, aromatická", "kyselá s ovocnými tóny"). null pokud neuvedeno.',
            ],
            'plant_height' => [
                'type' => ['string', 'null'],
                'description' => 'Vzrůst rostliny — buď číselně ("80-120 cm") nebo slovně ("nízká", "tyčková", "polotrpasličí"). null pokud neuvedeno.',
            ],
            'yield_rating' => [
                'type' => ['integer', 'null'],
                'minimum' => 1,
                'maximum' => 5,
                'description' => 'Hodnocení výnosu 1-5 (1=nízký, 5=velmi vysoký). null pokud z textu nelze určit.',
            ],
            'storage_days' => [
                'type' => ['integer', 'null'],
                'minimum' => 1,
                'maximum' => 365,
                'description' => 'Skladovatelnost ve dnech (např. 30, 90, 180). null pokud neuvedeno.',
            ],
            'use_cases' => [
                'type' => 'array',
                'items' => [
                    'type' => 'string',
                    'enum' => [
                        'konzum', 'saláty', 'zavařování', 'kompoty', 'džemy',
                        'mošty', 'sušení', 'zpracování', 'pečení', 'grilování',
                        'mrazení', 'kvašení', 'krmné', 'okrasné',
                        'stolní víno', 'sladká vína', 'šumivá vína',
                    ],
                ],
                'description' => 'Možnosti použití odrůdy. Vyber jen ty, které jsou v textu zmíněny nebo jednoznačně plynou z popisu.',
            ],
            'disease_resistance' => [
                'type' => 'array',
                'items' => [
                    'type' => 'string',
                    'enum' => [
                        'plíseň bramborová', 'šedá plíseň', 'fusarium', 'verticilium',
                        'virové choroby', 'strupovitost', 'padlí',
                        'rakovina', 'moniliové hniloby', 'bakteriální spála',
                        'mšice', 'puklice', 'mrazuvzdornost',
                    ],
                ],
                'description' => 'Choroby a škůdci, vůči kterým je odrůda odolná dle textu.',
            ],
            'characteristics' => [
                'type' => 'array',
                'items' => [
                    'type' => 'string',
                    'enum' => [
                        'samosprašná', 'cizosprašná', 'mrazuvzdorná', 'sucho odolná',
                        'tyčková', 'keříčková', 'determinantní', 'indeterminantní',
                        'F1 hybrid', 'historická', 'česká odrůda',
                        'pro skleník', 'pro venkovní pěstování', 'pro balkon',
                        'celoročně skladovatelná', 'rychloplodná', 'plodící každý rok',
                    ],
                ],
                'description' => 'Obecné charakteristiky odrůdy zmíněné v textu.',
            ],
            'origin_country' => [
                'type' => ['string', 'null'],
                'description' => 'Země původu (např. "ČR", "Nizozemsko", "Itálie"). null pokud neuvedeno.',
            ],
            'year_registered' => [
                'type' => ['integer', 'null'],
                'minimum' => 1700,
                'maximum' => 2030,
                'description' => 'Rok registrace nebo vyšlechtění (4-místný). null pokud neuvedeno.',
            ],
        ],
    ];

    private string $systemPrompt = <<<'PROMPT'
Jsi expertní asistent pro extrakci strukturovaných dat z popisů odrůd zeleniny, ovoce, vína a okrasných rostlin v češtině.

PRAVIDLA:
1. Vždy vrať JSON podle zadaného schématu — žádné jiné výstupy.
2. Pokud informace v textu NENÍ explicitně uvedena, vrať null (u stringů) nebo prázdné pole (u arrays). NIKDY si nic nedomýšlej ani nehádej.
3. Pole `use_cases`, `disease_resistance`, `characteristics`: vyber JEN hodnoty z předem dané enum listy. Pokud kategorie není v listu, ignoruj.
4. `ripening_sort_key` musí odpovídat `ripening_label` (1=velmi raná, 2=raná, 3=středně raná, 4=středně pozdní, 5=pozdní, 6=velmi pozdní, 99=neuvedeno).
5. Tvoje odpověď MUSÍ být v češtině pro stringové hodnoty.
6. Při hmotnosti/velikosti plodu používej český formát (60-80 g, ne 60-80g).

Buď konzervativní — lepší vrátit null než si vymyslet hodnotu.
PROMPT;

    public function __construct()
    {
        parent::__construct();
    }

    public function handle(): int
    {
        try {
            $this->ai = new OpenAiClient();
        } catch (\Throwable $e) {
            $this->error('❌ ' . $e->getMessage());
            $this->line('   Zkontroluj OPENAI_API_KEY v app/.env');
            return 1;
        }

        $query = Variety::query()->where('status', 'published');

        if ($this->option('only')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $this->option('only')));
        }

        if (!$this->option('force')) {
            // Re-extrahuj jen ty, které ještě nemají strukturovaná data
            $query->whereNull('color')->whereNull('taste_profile');
        }

        $limit = (int) $this->option('limit');
        if ($limit > 0) {
            $query->limit($limit);
        }

        $varieties = $query->get();
        $total = $varieties->count();

        if ($total === 0) {
            $this->info('Nic ke zpracování.');
            return 0;
        }

        $this->info("🤖 Extrakce dat pro {$total} odrůd (model: " . env('OPENAI_MODEL') . ")");
        $this->line('');

        $stats = [
            'success' => 0, 'failed' => 0,
            'tokens_in' => 0, 'tokens_out' => 0,
        ];

        $bar = $this->output->createProgressBar($total);
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%%  %message%');
        $bar->setMessage('startuji...');
        $bar->start();

        foreach ($varieties as $variety) {
            $bar->setMessage(mb_substr($variety->name, 0, 40, 'UTF-8'));

            try {
                $userPrompt = $this->buildUserPrompt($variety);
                $result = $this->ai->extractJson(
                    $this->systemPrompt,
                    $userPrompt,
                    $this->jsonSchema,
                    'variety_extraction'
                );

                $data  = $result['data'];
                $usage = $result['usage'];

                $stats['tokens_in']  += $usage['prompt_tokens']     ?? 0;
                $stats['tokens_out'] += $usage['completion_tokens'] ?? 0;

                if (!$this->option('dry-run')) {
                    $variety->update([
                        'ripening_label'    => $data['ripening_label'],
                        'ripening_sort_key' => $data['ripening_sort_key'],
                        'color'             => $data['color'],
                        'fruit_size'        => $data['fruit_size'],
                        'fruit_weight'      => $data['fruit_weight'],
                        'taste_profile'     => $data['taste_profile'],
                        'plant_height'      => $data['plant_height'],
                        'yield_rating'      => $data['yield_rating'],
                        'storage_days'      => $data['storage_days'],
                        'use_cases'         => $data['use_cases']         ?: null,
                        'disease_resistance'=> $data['disease_resistance']?: null,
                        'characteristics'   => $data['characteristics']   ?: null,
                        'origin_country'    => $data['origin_country'],
                        'year_registered'   => $data['year_registered'],
                    ]);
                } else {
                    $this->newLine();
                    $this->line("  → " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
                }

                $stats['success']++;
            } catch (Throwable $e) {
                $stats['failed']++;
                $this->newLine();
                $this->warn("  ⚠️  {$variety->name}: " . $e->getMessage());
            }

            $bar->advance();

            // Šetrný rate limit — ~50 req/min, OpenAI zvládne klidně 500
            usleep(150_000); // 150 ms
        }

        $bar->finish();
        $this->newLine(2);

        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line("✅ Úspěšně:    {$stats['success']}");
        if ($stats['failed'] > 0) {
            $this->line("❌ Selhalo:    {$stats['failed']}");
        }
        $this->line("📊 Tokeny IN:  " . number_format($stats['tokens_in'],  0, ',', ' '));
        $this->line("📊 Tokeny OUT: " . number_format($stats['tokens_out'], 0, ',', ' '));
        // Cena gpt-4o-mini: $0.15 / $0.60 per M tokens
        $cost = ($stats['tokens_in'] / 1_000_000) * 0.15
              + ($stats['tokens_out'] / 1_000_000) * 0.60;
        $this->line("💰 Odhad ceny: $" . number_format($cost, 4, '.', ''));

        return $stats['failed'] > 0 ? 1 : 0;
    }

    private function buildUserPrompt(Variety $variety): string
    {
        $cleanText = $this->htmlToPlainText($variety->description_html);
        // Zkrátit vstup na ~6000 znaků (cca 1500 tokenů) — víc není třeba
        if (mb_strlen($cleanText, 'UTF-8') > 6000) {
            $cleanText = mb_substr($cleanText, 0, 6000, 'UTF-8') . '…';
        }

        return <<<TXT
Kategorie: {$variety->category->name}
Název odrůdy: {$variety->name}

POPIS:
{$cleanText}

Extrahuj strukturovaná data z výše uvedeného popisu.
TXT;
    }

    private function htmlToPlainText(string $html): string
    {
        $s = preg_replace('/<br\s*\/?>/u', "\n", $html);
        $s = preg_replace('/<\/(p|h[1-6]|li)>/u', "\n", $s);
        $s = strip_tags($s);
        $s = html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $s = preg_replace('/[ \t]+/u', ' ', $s);
        $s = preg_replace('/\n{3,}/u', "\n\n", $s);
        return trim($s);
    }
}
