<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug', 'title', 'excerpt', 'content_html',
        'hero_image_url', 'category', 'tags',
        'meta_title', 'meta_description',
        'status', 'wp_post_id', 'published_at',
    ];

    protected $casts = [
        'tags'         => 'array',
        'published_at' => 'datetime',
    ];

    public function scopePublished($query)
    {
        return $query->where('status', 'published')->orderByDesc('published_at');
    }

    public function getUrlAttribute(): string
    {
        return '/blog/' . $this->slug;
    }
}
