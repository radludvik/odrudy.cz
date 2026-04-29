@extends('admin.layouts.app')
@section('title', $category->exists ? 'Upravit kategorii' : 'Nová kategorie')
@section('page_title', $category->exists ? 'Upravit kategorii: ' . $category->name : 'Nová kategorie')

@section('page_actions')
    <a href="{{ route('admin.categories.index') }}" class="text-sm text-gray-500 hover:text-gray-700">← Zpět na seznam</a>
@endsection

@section('content')

<form method="POST"
      action="{{ $category->exists ? route('admin.categories.update', $category) : route('admin.categories.store') }}"
      enctype="multipart/form-data"
      class="space-y-6 max-w-4xl">
    @csrf
    @if($category->exists) @method('PUT') @endif

    @if($errors->any())
        <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <ul class="list-disc ml-5 text-sm">
                @foreach($errors->all() as $err)<li>{{ $err }}</li>@endforeach
            </ul>
        </div>
    @endif

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {{-- Hlavní obsah --}}
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">Základní údaje</h2>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Název *</label>
                    <input type="text" name="name" value="{{ old('name', $category->name) }}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                    <p class="text-xs text-gray-500 mt-1">Např. „Rajčata" — používá se v menu a nadpisech</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Genitiv (množné číslo)</label>
                    <input type="text" name="name_plural" value="{{ old('name_plural', $category->name_plural) }}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <p class="text-xs text-gray-500 mt-1">Např. „rajčat" — pro „12 odrůd rajčat"</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
                    <input type="text" name="slug" value="{{ old('slug', $category->slug) }}" required
                           pattern="[a-z0-9-]+"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm">
                    <p class="text-xs text-gray-500 mt-1">URL: <code>https://odrudy.cz/{slug}</code> — jen malá písmena, čísla a pomlčky</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Popis (intro text)</label>
                    <textarea name="description" rows="4"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg">{{ old('description', $category->description) }}</textarea>
                    <p class="text-xs text-gray-500 mt-1">HTML povoleno. Zobrazí se nad seznamem odrůd.</p>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">SEO</h2>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meta title</label>
                    <input type="text" name="meta_title" value="{{ old('meta_title', $category->meta_title) }}" maxlength="70"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <p class="text-xs text-gray-500 mt-1">Doporučeno 50–60 znaků. Když prázdné, použije se název kategorie.</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meta description</label>
                    <textarea name="meta_description" rows="2" maxlength="200"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg">{{ old('meta_description', $category->meta_description) }}</textarea>
                    <p class="text-xs text-gray-500 mt-1">Doporučeno 140–160 znaků.</p>
                </div>
            </div>
        </div>

        {{-- Sidebar --}}
        <div class="space-y-6">
            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">Nastavení</h2>

                <label class="flex items-center gap-2">
                    <input type="checkbox" name="visible" value="1"
                           {{ old('visible', $category->visible ?? true) ? 'checked' : '' }}
                           class="h-4 w-4 text-brand-600 rounded focus:ring-brand-500">
                    <span class="text-sm text-gray-700">Viditelná na webu</span>
                </label>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pořadí v menu</label>
                    <input type="number" name="sort_order" value="{{ old('sort_order', $category->sort_order ?? 0) }}"
                           min="0" max="9999"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <p class="text-xs text-gray-500 mt-1">Nižší = výš v seznamu</p>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">Hero obrázek</h2>

                @if($category->hero_image_url)
                    <img src="{{ $category->hero_image_url }}" alt="" class="w-full aspect-square object-cover rounded-lg">
                    <p class="text-xs text-gray-500 break-all">{{ $category->hero_image_url }}</p>
                @endif

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nahrát nový obrázek</label>
                    <input type="file" name="image" accept="image/png,image/jpeg,image/webp"
                           class="w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100">
                    <p class="text-xs text-gray-500 mt-1">PNG/JPG/WEBP do 5 MB</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Alt text</label>
                    <input type="text" name="hero_image_alt" value="{{ old('hero_image_alt', $category->hero_image_alt) }}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>

            <button type="submit"
                    class="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg shadow-sm">
                {{ $category->exists ? 'Uložit změny' : 'Vytvořit kategorii' }}
            </button>
        </div>
    </div>
</form>

@endsection
