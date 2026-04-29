@extends('admin.layouts.app')
@section('title', $variety->exists ? 'Upravit odrůdu' : 'Nová odrůda')
@section('page_title', $variety->exists ? 'Upravit: ' . $variety->name : 'Nová odrůda')

@section('page_actions')
    <div class="flex items-center gap-2">
        @if($variety->exists)
            <a href="{{ route('variety.show', ['category' => $variety->category->slug, 'variety' => $variety->slug]) }}"
               target="_blank" class="text-sm text-gray-500 hover:text-brand-600">↗ Náhled na webu</a>
        @endif
        <a href="{{ route('admin.varieties.index') }}" class="text-sm text-gray-500 hover:text-gray-700">← Zpět</a>
    </div>
@endsection

@section('content')

<form method="POST"
      action="{{ $variety->exists ? route('admin.varieties.update', $variety) : route('admin.varieties.store') }}"
      enctype="multipart/form-data">
    @csrf
    @if($variety->exists) @method('PUT') @endif

    @if($errors->any())
        <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            <ul class="list-disc ml-5 text-sm">
                @foreach($errors->all() as $err)<li>{{ $err }}</li>@endforeach
            </ul>
        </div>
    @endif

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {{-- Hlavní sloupec --}}
        <div class="lg:col-span-2 space-y-6">

            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">Základní údaje</h2>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Název odrůdy *</label>
                    <input type="text" name="name" value="{{ old('name', $variety->name) }}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                        <input type="text" name="slug" value="{{ old('slug', $variety->slug) }}" required pattern="[a-z0-9-]+"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
                        <select name="category_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            @foreach($categories as $cat)
                                <option value="{{ $cat->id }}"
                                        {{ old('category_id', $variety->category_id) == $cat->id ? 'selected' : '' }}>
                                    {{ $cat->name }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Krátký popis (excerpt)</label>
                    <textarea name="excerpt" rows="2" maxlength="500"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg">{{ old('excerpt', $variety->excerpt) }}</textarea>
                    <p class="text-xs text-gray-500 mt-1">Zobrazí se v listu kategorie a jako excerpt.</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Plný popis (HTML)</label>
                    <textarea name="description_html" rows="14"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs">{{ old('description_html', $variety->description_html) }}</textarea>
                    <p class="text-xs text-gray-500 mt-1">Povolen HTML: &lt;p&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;ul&gt;, &lt;strong&gt;, &lt;em&gt; …</p>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">Strukturovaná data</h2>

                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Barva</label>
                        <input type="text" name="color" value="{{ old('color', $variety->color) }}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Velikost</label>
                        <input type="text" name="fruit_size" value="{{ old('fruit_size', $variety->fruit_size) }}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Hmotnost</label>
                        <input type="text" name="fruit_weight" value="{{ old('fruit_weight', $variety->fruit_weight) }}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Doba zrání</label>
                        <input type="text" name="ripening_label" value="{{ old('ripening_label', $variety->ripening_label) }}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Chuť</label>
                        <input type="text" name="taste_profile" value="{{ old('taste_profile', $variety->taste_profile) }}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Výška</label>
                        <input type="text" name="plant_height" value="{{ old('plant_height', $variety->plant_height) }}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Země původu</label>
                        <input type="text" name="origin_country" value="{{ old('origin_country', $variety->origin_country) }}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Rok registrace</label>
                        <input type="number" name="year_registered" value="{{ old('year_registered', $variety->year_registered) }}" min="1700" max="2100"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">SEO</h2>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meta title</label>
                    <input type="text" name="meta_title" value="{{ old('meta_title', $variety->meta_title) }}" maxlength="70"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meta description</label>
                    <textarea name="meta_description" rows="2" maxlength="200"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg">{{ old('meta_description', $variety->meta_description) }}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Hlavní klíčové slovo</label>
                    <input type="text" name="focus_keyword" value="{{ old('focus_keyword', $variety->focus_keyword) }}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
        </div>

        {{-- Sidebar --}}
        <div class="space-y-6">
            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">Status</h2>
                <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="published" {{ old('status', $variety->status ?? 'published') === 'published' ? 'selected' : '' }}>Publikováno</option>
                    <option value="draft" {{ old('status', $variety->status) === 'draft' ? 'selected' : '' }}>Draft</option>
                </select>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">Hero obrázek</h2>
                @if($variety->hero_image_url)
                    <img src="{{ $variety->hero_image_url }}" class="w-full aspect-square object-cover rounded-lg">
                    @if($variety->hero_image_generated_at)
                        <p class="text-xs text-gray-400">AI vygenerováno {{ $variety->hero_image_generated_at->diffForHumans() }}</p>
                    @endif
                @endif
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nahrát nový</label>
                    <input type="file" name="image" accept="image/png,image/jpeg,image/webp"
                           class="w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Alt text</label>
                    <input type="text" name="hero_image_alt" value="{{ old('hero_image_alt', $variety->hero_image_alt) }}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>

            <button type="submit"
                    class="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg shadow-sm">
                {{ $variety->exists ? 'Uložit změny' : 'Vytvořit odrůdu' }}
            </button>
        </div>
    </div>
</form>

@endsection
