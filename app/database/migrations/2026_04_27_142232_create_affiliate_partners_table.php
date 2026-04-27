<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAffiliatePartnersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('affiliate_partners', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();           // "semo", "hortus", "starkl"
            $table->string('name');
            $table->string('base_url')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('tracking_param')->nullable(); // UTM nebo affiliate ID
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('affiliate_partners');
    }
}
