<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Lehký klient pro OpenAI Chat Completions API
 * Používá structured outputs (response_format: json_schema) pro garantované JSON.
 */
class OpenAiClient
{
    private string $apiKey;
    private string $model;
    private int $timeoutSec = 60;

    public function __construct(?string $apiKey = null, ?string $model = null)
    {
        $this->apiKey = $apiKey ?? (string) env('OPENAI_API_KEY', '');
        $this->model  = $model  ?? (string) env('OPENAI_MODEL', 'gpt-4o-mini');

        if (empty($this->apiKey)) {
            throw new RuntimeException('OPENAI_API_KEY není nastaven v .env');
        }
    }

    /**
     * Pošle request s JSON schema a vrátí dekódovaný objekt.
     *
     * @param  string  $systemPrompt  Pokyn pro model (kontext, role)
     * @param  string  $userPrompt    Vstupní data (text odrůdy)
     * @param  array   $jsonSchema    JSON Schema pro structured output
     * @return array<string,mixed>    Dekódovaný JSON
     */
    public function extractJson(
        string $systemPrompt,
        string $userPrompt,
        array  $jsonSchema,
        string $schemaName = 'extraction'
    ): array {
        $response = Http::withToken($this->apiKey)
            ->timeout($this->timeoutSec)
            ->retry(3, 2000, function ($exception, $request) {
                // Retry jen na network/5xx, ne na 4xx
                return $exception instanceof \Illuminate\Http\Client\ConnectionException
                    || ($exception->response && $exception->response->status() >= 500);
            })
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user',   'content' => $userPrompt],
                ],
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name'   => $schemaName,
                        'strict' => true,
                        'schema' => $jsonSchema,
                    ],
                ],
                'temperature' => 0.1,
            ]);

        if ($response->failed()) {
            throw new RuntimeException(
                'OpenAI API chyba: ' . $response->status() . ' — ' . $response->body()
            );
        }

        $json    = $response->json();
        $content = $json['choices'][0]['message']['content'] ?? null;

        if ($content === null) {
            throw new RuntimeException('OpenAI: prázdná odpověď');
        }

        $decoded = json_decode($content, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('OpenAI: nelze parsovat JSON: ' . $content);
        }

        return [
            'data'   => $decoded,
            'usage'  => $json['usage'] ?? [],
        ];
    }
}
