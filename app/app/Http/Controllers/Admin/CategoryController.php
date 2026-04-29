<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('varieties')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
        return view('admin.categories.index', compact('categories'));
    }

    public function create()
    {
        $category = new Category();
        return view('admin.categories.form', compact('category'));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['hero_image_url'] = $this->handleImage($request, null);
        $category = Category::create($data);
        return redirect()->route('admin.categories.index')
            ->with('success', 'Kategorie „' . $category->name . '" byla vytvořena.');
    }

    public function edit(Category $category)
    {
        return view('admin.categories.form', compact('category'));
    }

    public function update(Request $request, Category $category)
    {
        $data = $this->validateData($request, $category);
        $data['hero_image_url'] = $this->handleImage($request, $category);
        $category->update($data);
        return redirect()->route('admin.categories.index')
            ->with('success', 'Kategorie „' . $category->name . '" byla uložena.');
    }

    public function destroy(Category $category)
    {
        if ($category->varieties()->count() > 0) {
            return back()->with('error', "Kategorie obsahuje {$category->varieties()->count()} odrůd. Nejdřív je přesuň jinam.");
        }
        $category->delete();
        return redirect()->route('admin.categories.index')
            ->with('success', 'Kategorie smazána.');
    }

    private function validateData(Request $request, ?Category $category = null): array
    {
        $rules = [
            'name'             => ['required', 'string', 'max:255'],
            'name_plural'      => ['nullable', 'string', 'max:255'],
            'slug'             => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'description'      => ['nullable', 'string'],
            'sort_order'       => ['nullable', 'integer', 'between:0,9999'],
            'visible'          => ['nullable', 'boolean'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'hero_image_alt'   => ['nullable', 'string', 'max:255'],
            'image'            => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
        ];

        // Unique slug — kromě editovaného záznamu
        if ($category) {
            $rules['slug'][] = "unique:categories,slug,{$category->id}";
        } else {
            $rules['slug'][] = 'unique:categories,slug';
        }

        $data = $request->validate($rules);
        $data['visible']    = $request->boolean('visible');
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);
        if (!empty($data['description'])) {
            $data['description'] = $this->sanitizeRichText($data['description']);
        }
        unset($data['image']);
        return $data;
    }

    /**
     * Vyčistí HTML — povolí jen tagy které generuje Trix.
     * Brání XSS přes <script>, on* atributy, javascript: URL atd.
     */
    private function sanitizeRichText(string $html): string
    {
        // Whitelist tagů (Trix 2.x používá tyto)
        $allowed = '<p><br><strong><b><em><i><u><s><strike><del>'
                 . '<a><ul><ol><li><h1><h2><h3><h4><blockquote><pre><code>';
        $clean = strip_tags($html, $allowed);
        // Odstranit on* event handlery (onclick, onmouseover, ...)
        $clean = preg_replace('/\s+on[a-z]+\s*=\s*"[^"]*"/iu', '', $clean);
        $clean = preg_replace("/\s+on[a-z]+\s*=\s*'[^']*'/iu", '', $clean);
        // Odstranit javascript: a data: schémata v href/src
        $clean = preg_replace('/(href|src)\s*=\s*"\s*javascript:[^"]*"/iu', '$1="#"', $clean);
        $clean = preg_replace("/(href|src)\s*=\s*'\s*javascript:[^']*'/iu", '$1="#"', $clean);
        return trim($clean);
    }

    private function handleImage(Request $request, ?Category $category): ?string
    {
        if (!$request->hasFile('image')) {
            return $category?->hero_image_url;
        }
        $slug = $request->input('slug', $category?->slug ?? Str::random(8));
        $file = $request->file('image');
        $ext  = $file->getClientOriginalExtension() ?: 'png';
        $relPath = "/images/categories/{$slug}.{$ext}";
        $absPath = base_path('public' . $relPath);
        if (!is_dir(dirname($absPath))) {
            mkdir(dirname($absPath), 0755, true);
        }
        $file->move(dirname($absPath), basename($absPath));
        return $relPath;
    }
}
