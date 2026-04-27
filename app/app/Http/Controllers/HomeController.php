<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\BlogPost;

class HomeController extends Controller
{
    public function index()
    {
        $categories = Category::visible()
            ->withCount('publishedVarieties')
            ->orderBy('sort_order')
            ->get();

        $latestPosts = BlogPost::published()->take(3)->get();

        return view('home', compact('categories', 'latestPosts'));
    }
}
