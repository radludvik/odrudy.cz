<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Variety;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'categories_total'    => Category::count(),
            'categories_visible'  => Category::where('visible', true)->count(),
            'varieties_total'     => Variety::count(),
            'varieties_published' => Variety::where('status', 'published')->count(),
            'varieties_with_image' => Variety::whereNotNull('hero_image_url')->count(),
            'varieties_with_meta' => Variety::whereNotNull('meta_description')->count(),
            'blog_total'          => BlogPost::count(),
            'blog_published'      => BlogPost::where('status', 'published')->count(),
        ];

        $top_categories = Category::withCount(['varieties' => function ($q) {
                $q->where('status', 'published');
            }])
            ->orderByDesc('varieties_count')
            ->limit(8)
            ->get();

        $recent_varieties = Variety::with('category')
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get();

        $recent_blog = BlogPost::orderByDesc('updated_at')->limit(5)->get();

        return view('admin.dashboard', compact('stats', 'top_categories', 'recent_varieties', 'recent_blog'));
    }
}
