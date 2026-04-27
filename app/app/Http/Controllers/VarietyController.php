<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Variety;

class VarietyController extends Controller
{
    public function show(string $categorySlug, string $varietySlug)
    {
        $category = Category::where('slug', $categorySlug)
            ->where('visible', true)
            ->firstOrFail();

        $variety = Variety::where('category_id', $category->id)
            ->where('slug', $varietySlug)
            ->where('status', 'published')
            ->firstOrFail();

        // Příbuzné odrůdy (stejná kategorie, podobné zrání, max 4)
        $related = Variety::where('category_id', $category->id)
            ->where('id', '!=', $variety->id)
            ->where('status', 'published')
            ->where('ripening_sort_key', $variety->ripening_sort_key)
            ->take(4)
            ->get();

        // Fallback — jen abecedně ze stejné kategorie
        if ($related->isEmpty()) {
            $related = Variety::where('category_id', $category->id)
                ->where('id', '!=', $variety->id)
                ->where('status', 'published')
                ->inRandomOrder()
                ->take(4)
                ->get();
        }

        return view('variety', compact('category', 'variety', 'related'));
    }
}
