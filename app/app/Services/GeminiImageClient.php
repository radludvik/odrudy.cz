<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Klient pro Google Gemini Image Generation API.
 *
 * Free tier (duben 2026):
 *   - 10 RPM (requests per minute)
 *   - Cena: $0
 *
 * Model: gemini-2.5-flash-image-preview (stable as of 2025)
 *   nebo nastavitelný přes env GEMINI_IMAGE_MODEL
 */
class GeminiImageClient
{
    private string $apiKey;
    private string $model;
    private int $timeoutSec = 180;

    public function __construct(?string $apiKey = null, ?string $model = null)
    {
        $this->apiKey = $apiKey ?? (string) env('GEMINI_API_KEY', '');
        $this->model  = $model  ?? (string) env('GEMINI_IMAGE_MODEL', 'gemini-2.5-flash-image-preview');

        if (empty($this->apiKey)) {
            throw new RuntimeException('GEMINI_API_KEY není nastaven v .env');
        }
    }

    /**
     * Vygeneruje obrázek a vrátí binární data (PNG).
     *
     * @return array{image: string, mime: string}
     */
    public function generate(string $prompt): array
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";

        $response = Http::withHeaders([
                'x-goog-api-key' => $this->apiKey,
                'Content-Type'   => 'application/json',
            ])
            ->timeout($this->timeoutSec)
            ->retry(2, 3000)
            ->post($url, [
                'contents' => [[
                    'parts' => [['text' => $prompt]],
                ]],
                'generationConfig' => [
                    'responseModalities' => ['IMAGE'],
                ],
            ]);

        if ($response->failed()) {
            throw new RuntimeException(
                'Gemini Image API chyba: ' . $response->status() . ' — ' . substr($response->body(), 0, 500)
            );
        }

        $json  = $response->json();
        $parts = $json['candidates'][0]['content']['parts'] ?? [];

        $b64  = null;
        $mime = 'image/png';
        foreach ($parts as $part) {
            if (isset($part['inlineData']['data'])) {
                $b64  = $part['inlineData']['data'];
                $mime = $part['inlineData']['mimeType'] ?? 'image/png';
                break;
            }
            // Některé verze API používají 'inline_data' (snake_case)
            if (isset($part['inline_data']['data'])) {
                $b64  = $part['inline_data']['data'];
                $mime = $part['inline_data']['mime_type'] ?? 'image/png';
                break;
            }
        }

        if ($b64 === null) {
            throw new RuntimeException(
                'Gemini Image: chybí inlineData v odpovědi: ' . substr(json_encode($json), 0, 500)
            );
        }

        $binary = base64_decode($b64, true);
        if ($binary === false) {
            throw new RuntimeException('Gemini Image: nelze dekódovat base64');
        }

        return [
            'image' => $binary,
            'mime'  => $mime,
        ];
    }

    /**
     * Vygeneruje obrázek a uloží do souboru.
     */
    public function generateToFile(string $prompt, string $outputPath): array
    {
        $result = $this->generate($prompt);

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
            'mime'  => $result['mime'],
        ];
    }
}
