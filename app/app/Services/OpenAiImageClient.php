<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Klient pro OpenAI Image Generation API (gpt-image-1).
 *
 * Modelová cena (duben 2025):
 *   - low quality 1024×1024:    ~$0.011
 *   - medium quality 1024×1024: ~$0.042
 *   - high quality 1024×1024:   ~$0.167
 */
class OpenAiImageClient
{
    private string $apiKey;
    private int $timeoutSec = 180; // image generation může trvat dlouho

    public function __construct(?string $apiKey = null)
    {
        $this->apiKey = $apiKey ?? (string) env('OPENAI_API_KEY', '');

        if (empty($this->apiKey)) {
            throw new RuntimeException('OPENAI_API_KEY není nastaven v .env');
        }
    }

    /**
     * Vygeneruje obrázek a vrátí binární PNG data.
     *
     * @param  string  $prompt   Popis obrázku
     * @param  string  $quality  "low" | "medium" | "high"
     * @param  string  $size     "1024x1024" | "1024x1536" | "1536x1024"
     * @return array{image:string, usage:array}  image = binární PNG, usage = tokenové statistiky
     */
    public function generate(
        string $prompt,
        string $quality = 'low',
        string $size = '1024x1024'
    ): array {
        $response = Http::withToken($this->apiKey)
            ->timeout($this->timeoutSec)
            ->retry(2, 3000)
            ->post('https://api.openai.com/v1/images/generations', [
                'model'   => 'gpt-image-1',
                'prompt'  => $prompt,
                'n'       => 1,
                'size'    => $size,
                'quality' => $quality,
            ]);

        if ($response->failed()) {
            throw new RuntimeException(
                'OpenAI Image API chyba: ' . $response->status() . ' — ' . $response->body()
            );
        }

        $json = $response->json();
        $b64  = $json['data'][0]['b64_json'] ?? null;

        if ($b64 === null) {
            throw new RuntimeException('OpenAI Image: chybí b64_json: ' . json_encode($json));
        }

        $binary = base64_decode($b64, true);
        if ($binary === false) {
            throw new RuntimeException('OpenAI Image: nelze dekódovat base64');
        }

        return [
            'image' => $binary,
            'usage' => $json['usage'] ?? [],
        ];
    }

    /**
     * Vygeneruje obrázek a uloží do souboru.
     */
    public function generateToFile(
        string $prompt,
        string $outputPath,
        string $quality = 'low',
        string $size = '1024x1024'
    ): array {
        $result = $this->generate($prompt, $quality, $size);

        $dir = dirname($outputPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $written = file_put_contents($outputPath, $result['image']);
        if ($written === false) {
            throw new RuntimeException("Nelze zapsat obrázek do {$outputPath}");
        }

        return [
            'path'  => $outputPath,
            'bytes' => $written,
            'usage' => $result['usage'],
        ];
    }
}
