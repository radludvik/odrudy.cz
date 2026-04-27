<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug', 'name', 'name_plural', 'description',
        'hero_image_url', 'hero_image_alt', 'sort_order',
        'visible', 'meta_title', 'meta_description', 'wp_post_id',
    ];

    protected $casts = [
        'visible' => 'boolean',
    ];

    public function scopeVisible($query)
    {
        return $query->where('visible', true);
    }

    public function varieties()
    {
        return $this->hasMany(Variety::class);
    }

    public function publishedVarieties()
    {
        return $this->hasMany(Variety::class)->where('status', 'published');
    }

    public function getUrlAttribute(): string
    {
        return '/' . $this->slug;
    }
}
