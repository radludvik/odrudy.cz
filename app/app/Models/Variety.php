<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Variety extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 'slug', 'name',
        'ripening_sort_key', 'ripening_label', 'color',
        'fruit_size', 'fruit_weight', 'taste_profile', 'plant_height',
        'yield_rating', 'storage_days',
        'use_cases', 'disease_resistance', 'characteristics',
        'origin_country', 'year_registered',
        'description_html', 'excerpt',
        'hero_image_url', 'hero_image_alt', 'hero_image_generated_at',
        'affiliate_links',
        'meta_title', 'meta_description', 'focus_keyword',
        'status', 'quality_score', 'wp_post_id', 'wp_url',
    ];

    protected $casts = [
        'use_cases'          => 'array',
        'disease_resistance' => 'array',
        'characteristics'    => 'array',
        'affiliate_links'    => 'array',
        'hero_image_generated_at' => 'datetime',
    ];

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeByRipening($query)
    {
        return $query->orderBy('ripening_sort_key')->orderBy('name');
    }

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // URL odrůdy: /rajcata/akron-f1
    public function getUrlAttribute(): string
    {
        return '/' . $this->category->slug . '/' . $this->slug;
    }

    // Zkrácené jméno bez "Odrůda rajčat " prefixu pro zobrazení v kartách
    public function getShortNameAttribute(): string
    {
        return preg_replace('/^odr[uů]da\s+\S+\s+/iu', '', $this->name);
    }
}
