<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function show(Request $request, string $categorySlug)
    {
        $category = Category::where('slug', $categorySlug)
            ->where('visible', true)
            ->firstOrFail();

        $query = $category->publishedVarieties();

        // Filtrování
        if ($request->filled('zrani')) {
            $query->where('ripening_label', $request->zrani);
        }
        if ($request->filled('pouziti')) {
            $query->whereJsonContains('use_cases', $request->pouziti);
        }
        if ($request->filled('hledat')) {
            $query->where('name', 'like', '%' . $request->hledat . '%');
        }

        // Řazení
        $sort = $request->get('razeni', 'zrani');
        match ($sort) {
            'zrani' => $query->orderBy('ripening_sort_key')->orderBy('name'),
            'name'  => $query->orderBy('name'),
            default => $query->orderBy('name'),
        };

        $varieties = $query->paginate(24)->withQueryString();

        // Hodnoty pro filtry (jen ty, které existují v kategorii)
        $ripeningOptions = $category->publishedVarieties()
            ->whereNotNull('ripening_label')
            ->distinct()
            ->orderBy('ripening_sort_key')
            ->pluck('ripening_label', 'ripening_sort_key');

        $useCaseOptions = $category->publishedVarieties()
            ->whereNotNull('use_cases')
            ->pluck('use_cases')
            ->flatten()
            ->unique()
            ->sort()
            ->values();

        return view('category', compact(
            'category', 'varieties', 'ripeningOptions', 'useCaseOptions'
        ));
    }
}
