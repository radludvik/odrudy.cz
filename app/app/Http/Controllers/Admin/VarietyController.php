<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Variety;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VarietyController extends Controller
{
    public function index(Request $request)
    {
        $query = Variety::with('category');

        // Filtr: kategorie
        if ($categoryId = (int) $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        // Fulltext
        if ($search = trim((string) $request->input('q'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Filtr: status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filtr: bez obrázku
        if ($request->boolean('no_image')) {
            $query->whereNull('hero_image_url');
        }

        $varieties = $query->orderBy('name')->paginate(40)->withQueryString();
        $categories = Category::orderBy('sort_order')->orderBy('name')->get();

        return view('admin.varieties.index', compact('varieties', 'categories'));
    }

    public function create()
    {
        $variety = new Variety();
        $categories = Category::orderBy('sort_order')->orderBy('name')->get();
        return view('admin.varieties.form', compact('variety', 'categories'));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['hero_image_url'] = $this->handleImage($request, null, $data);
        if ($data['hero_image_url']) {
            $data['hero_image_generated_at'] = null; // ručně nahráno, ne AI
        }
        $variety = Variety::create($data);
        return redirect()->route('admin.varieties.edit', $variety)
            ->with('success', 'Odrůda „' . $variety->name . '" vytvořena.');
    }

    public function edit(Variety $variety)
    {
        $variety->load('category');
        $categories = Category::orderBy('sort_order')->orderBy('name')->get();
        return view('admin.varieties.form', compact('variety', 'categories'));
    }

    public function update(Request $request, Variety $variety)
    {
        $data = $this->validateData($request, $variety);
        $newImage = $this->handleImage($request, $variety, $data);
        if ($newImage) {
            $data['hero_image_url'] = $newImage;
            $data['hero_image_generated_at'] = null;
        }
        $variety->update($data);
        return redirect()->route('admin.varieties.edit', $variety)
            ->with('success', 'Odrůda uložena.');
    }

    public function destroy(Variety $variety)
    {
        $variety->delete();
        return redirect()->route('admin.varieties.index')
            ->with('success', 'Odrůda smazána.');
    }

    /** Hromadný přesun do jiné kategorie */
    public function bulkMove(Request $request)
    {
        $data = $request->validate([
            'ids'           => ['required', 'array'],
            'ids.*'         => ['integer', 'exists:varieties,id'],
            'target_category_id' => ['required', 'integer', 'exists:categories,id'],
        ]);

        $count = Variety::whereIn('id', $data['ids'])
            ->update(['category_id' => $data['target_category_id']]);

        return back()->with('success', "Přesunuto {$count} odrůd.");
    }

    private function validateData(Request $request, ?Variety $variety = null): array
    {
        $rules = [
            'name'             => ['required', 'string', 'max:255'],
            'slug'             => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'category_id'      => ['required', 'integer', 'exists:categories,id'],
            'status'           => ['required', 'in:draft,published'],
            'description_html' => ['nullable', 'string'],
            'excerpt'          => ['nullable', 'string', 'max:500'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'focus_keyword'    => ['nullable', 'string', 'max:255'],
            'hero_image_alt'   => ['nullable', 'string', 'max:255'],
            'color'            => ['nullable', 'string', 'max:255'],
            'fruit_size'       => ['nullable', 'string', 'max:255'],
            'fruit_weight'     => ['nullable', 'string', 'max:255'],
            'taste_profile'    => ['nullable', 'string', 'max:255'],
            'plant_height'     => ['nullable', 'string', 'max:255'],
            'ripening_label'   => ['nullable', 'string', 'max:255'],
            'origin_country'   => ['nullable', 'string', 'max:255'],
            'year_registered'  => ['nullable', 'integer', 'between:1700,2100'],
            'image'            => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
        ];

        // Slug unique kombinovaně s category_id (záložně)
        $data = $request->validate($rules);
        unset($data['image']);
        return $data;
    }

    private function handleImage(Request $request, ?Variety $variety, array $data): ?string
    {
        if (!$request->hasFile('image')) {
            return null; // signál: ponechat existující
        }
        $catSlug = Category::find($data['category_id'])->slug;
        $slug = $data['slug'] ?? Str::random(8);
        $file = $request->file('image');
        $ext  = $file->getClientOriginalExtension() ?: 'png';
        $relPath = "/images/varieties/{$catSlug}/{$slug}.{$ext}";
        $absPath = base_path('public' . $relPath);
        if (!is_dir(dirname($absPath))) {
            mkdir(dirname($absPath), 0755, true);
        }
        $file->move(dirname($absPath), basename($absPath));
        return $relPath;
    }
}
