@extends('admin.layouts.app')
@section('title', $blogPost->exists ? 'Upravit článek' : 'Nový článek')
@section('page_title', $blogPost->exists ? 'Upravit: ' . $blogPost->title : 'Nový článek')

@section('head')
    {{-- Trix editor přes CDN --}}
    <link rel="stylesheet" href="https://unpkg.com/trix@2.1.15/dist/trix.css">
    <script type="text/javascript" src="https://unpkg.com/trix@2.1.15/dist/trix.umd.min.js"></script>
    <style>
        trix-editor {
            min-height: 400px;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
        }
        trix-editor:focus { outline: none; border-color: #16a34a; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); }
        trix-toolbar { background: #f9fafb; border-radius: 0.5rem 0.5rem 0 0; padding: 0.5rem; }
        .trix-button-group { border: 1px solid #d1d5db !important; border-radius: 0.375rem !important; background: white; }
        .trix-button { border: none !important; }
    </style>
@endsection

@section('page_actions')
    <a href="{{ route('admin.blog.index') }}" class="text-sm text-gray-500 hover:text-gray-700">← Zpět</a>
@endsection

@section('content')

<form method="POST"
      action="{{ $blogPost->exists ? route('admin.blog.update', $blogPost) : route('admin.blog.store') }}"
      enctype="multipart/form-data">
    @csrf
    @if($blogPost->exists) @method('PUT') @endif

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
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Titulek *</label>
                    <input type="text" name="title" value="{{ old('title', $blogPost->title) }}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-medium">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                    <input type="text" name="slug" value="{{ old('slug', $blogPost->slug) }}" required pattern="[a-z0-9-]+"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Krátký popis (excerpt)</label>
                    <textarea name="excerpt" rows="2" maxlength="500"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg">{{ old('excerpt', $blogPost->excerpt) }}</textarea>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5 space-y-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Obsah článku</label>
                <input id="content_input" type="hidden" name="content_html" value="{{ old('content_html', $blogPost->content_html) }}">
                <trix-editor input="content_input"></trix-editor>
                <p class="text-xs text-gray-500">Tip: Použij nadpisy <strong>H1</strong>, listy a tučné texty pro lepší čitelnost.</p>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">SEO</h2>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meta title</label>
                    <input type="text" name="meta_title" value="{{ old('meta_title', $blogPost->meta_title) }}" maxlength="70"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meta description</label>
                    <textarea name="meta_description" rows="2" maxlength="200"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg">{{ old('meta_description', $blogPost->meta_description) }}</textarea>
                </div>
            </div>
        </div>

        {{-- Sidebar --}}
        <div class="space-y-6">
            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">Status</h2>
                <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="published" {{ old('status', $blogPost->status ?? 'draft') === 'published' ? 'selected' : '' }}>Publikováno</option>
                    <option value="draft" {{ old('status', $blogPost->status ?? 'draft') === 'draft' ? 'selected' : '' }}>Draft</option>
                </select>
                @if($blogPost->published_at)
                    <p class="text-xs text-gray-500">Publikováno: {{ $blogPost->published_at->format('d.m.Y H:i') }}</p>
                @endif

                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Kategorie/štítek</label>
                    <input type="text" name="category" value="{{ old('category', $blogPost->category) }}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                           placeholder="např. tipy, sezónní">
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h2 class="font-semibold text-gray-900">Hero obrázek</h2>
                @if($blogPost->hero_image_url)
                    <img src="{{ $blogPost->hero_image_url }}" class="w-full aspect-video object-cover rounded-lg">
                @endif
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nahrát</label>
                    <input type="file" name="image" accept="image/png,image/jpeg,image/webp"
                           class="w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700">
                </div>
            </div>

            <button type="submit"
                    class="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg shadow-sm">
                {{ $blogPost->exists ? 'Uložit změny' : 'Vytvořit článek' }}
            </button>
        </div>
    </div>
</form>

@endsection

@section('scripts')
<script>
// Auto-generate slug ze titulku, dokud není ručně upraven
const titleInput = document.querySelector('input[name="title"]');
const slugInput = document.querySelector('input[name="slug"]');
let manualSlug = {{ $blogPost->exists ? 'true' : 'false' }};
slugInput.addEventListener('input', () => manualSlug = true);
titleInput.addEventListener('input', () => {
    if (manualSlug) return;
    slugInput.value = titleInput.value.toLowerCase()
        .replace(/[áä]/g, 'a').replace(/[éě]/g, 'e').replace(/[íï]/g, 'i')
        .replace(/[óö]/g, 'o').replace(/[úůü]/g, 'u').replace(/[ý]/g, 'y')
        .replace(/[čć]/g, 'c').replace(/[ďđ]/g, 'd').replace(/[ňń]/g, 'n')
        .replace(/[řŕ]/g, 'r').replace(/[šś]/g, 's').replace(/[ťţ]/g, 't')
        .replace(/[žź]/g, 'z')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
});
</script>
@endsection
