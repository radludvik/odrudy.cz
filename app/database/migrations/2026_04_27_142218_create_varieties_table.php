<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateVarietiesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('varieties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('slug');
            $table->string('name');

            // Strukturovaná data odrůdy
            $table->unsignedTinyInteger('ripening_sort_key')->default(99); // 1=velmi raná … 6=velmi pozdní, 99=neuvedeno
            $table->string('ripening_label')->nullable();
            $table->string('color')->nullable();
            $table->string('fruit_size')->nullable();
            $table->string('fruit_weight')->nullable();
            $table->string('taste_profile')->nullable();
            $table->string('plant_height')->nullable();
            $table->unsignedTinyInteger('yield_rating')->nullable();      // 1–5
            $table->unsignedSmallInteger('storage_days')->nullable();
            $table->json('use_cases')->nullable();                         // ["konzum","kompot"]
            $table->json('disease_resistance')->nullable();                // ["plíseň","fusarium"]
            $table->json('characteristics')->nullable();                   // ["mrazuvzdorná","samosprašná"]
            $table->string('origin_country')->nullable();
            $table->unsignedSmallInteger('year_registered')->nullable();

            // Obsah
            $table->longText('description_html')->nullable();
            $table->text('excerpt')->nullable();

            // Média
            $table->string('hero_image_url')->nullable();
            $table->string('hero_image_alt')->nullable();
            $table->timestamp('hero_image_generated_at')->nullable();

            // Affiliate
            $table->json('affiliate_links')->nullable(); // [{"partner":"semo","url":"...","label":"..."}]

            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('focus_keyword')->nullable();

            // Systém
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->unsignedTinyInteger('quality_score')->nullable();     // 1–5
            $table->unsignedInteger('wp_post_id')->nullable();
            $table->string('wp_url')->nullable();                         // původní URL pro 301 redirect
            $table->timestamps();

            $table->unique(['category_id', 'slug']);
            $table->index(['category_id', 'status']);
            $table->index('status');
            $table->index('ripening_sort_key');
            $table->index('wp_post_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('varieties');
    }
}
