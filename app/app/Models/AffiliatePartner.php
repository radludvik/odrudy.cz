<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliatePartner extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug', 'name', 'base_url', 'logo_url', 'tracking_param',
        'active', 'sort_order',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('active', true)->orderBy('sort_order');
    }
}
