@extends('admin.layouts.app')
@section('title', 'Odrůdy')
@section('page_title', 'Odrůdy')

@section('page_actions')
    <a href="{{ route('admin.varieties.create') }}"
       class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm">
        + Nová odrůda
    </a>
@endsection

@section('content')

{{-- ── Filtry ── --}}
<form method="GET" class="bg-white rounded-xl shadow-sm p-4 mb-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input type="text" name="q" value="{{ request('q') }}" placeholder="Hledat název..."
               class="px-3 py-2 border border-gray-300 rounded-lg text-sm">

        <select name="category_id" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">— Všechny kategorie —</option>
            @foreach($categories as $cat)
                <option value="{{ $cat->id }}" {{ request('category_id') == $cat->id ? 'selected' : '' }}>
                    {{ $cat->name }}
                </option>
            @endforeach
        </select>

        <select name="status" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">— Vše —</option>
            <option value="published" {{ request('status') === 'published' ? 'selected' : '' }}>Publikované</option>
            <option value="draft" {{ request('status') === 'draft' ? 'selected' : '' }}>Drafty</option>
        </select>

        <div class="flex gap-2">
            <label class="flex items-center gap-1 text-sm">
                <input type="checkbox" name="no_image" value="1" {{ request('no_image') ? 'checked' : '' }}> bez obrázku
            </label>
            <button type="submit" class="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">Filtrovat</button>
            <a href="{{ route('admin.varieties.index') }}" class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Reset</a>
        </div>
    </div>
</form>

{{-- ── Bulk přesun (mini-form) ── --}}
<form id="bulkForm" method="POST" action="{{ route('admin.varieties.bulkMove') }}"
      class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 hidden">
    @csrf
    <div class="flex items-center gap-3">
        <span class="text-sm text-blue-900 font-medium" id="bulkCount">0 vybráno</span>
        <select name="target_category_id" required
                class="px-3 py-2 border border-blue-300 rounded-lg text-sm flex-1">
            <option value="">Přesunout do kategorie...</option>
            @foreach($categories as $cat)
                <option value="{{ $cat->id }}">{{ $cat->name }}</option>
            @endforeach
        </select>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Přesunout
        </button>
    </div>
</form>

{{-- ── Tabulka ── --}}
<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-600 uppercase">
            <tr>
                <th class="px-3 py-3"><input type="checkbox" id="selectAll"></th>
                <th class="px-3 py-3 text-left">Obr.</th>
                <th class="px-3 py-3 text-left">Název</th>
                <th class="px-3 py-3 text-left">Kategorie</th>
                <th class="px-3 py-3 text-center">Status</th>
                <th class="px-3 py-3 text-center">Kvalita</th>
                <th class="px-3 py-3 text-right">Akce</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
            @foreach($varieties as $v)
                <tr class="hover:bg-gray-50">
                    <td class="px-3 py-2"><input type="checkbox" class="bulk-check" name="ids[]" value="{{ $v->id }}" form="bulkForm"></td>
                    <td class="px-3 py-2">
                        @if($v->hero_image_url)
                            <img src="{{ $v->hero_image_url }}" class="w-10 h-10 object-cover rounded">
                        @else
                            <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">—</div>
                        @endif
                    </td>
                    <td class="px-3 py-2">
                        <a href="{{ route('admin.varieties.edit', $v) }}" class="text-gray-900 hover:text-brand-600 font-medium">
                            {{ $v->short_name }}
                        </a>
                        <div class="text-xs text-gray-400 font-mono">{{ $v->slug }}</div>
                    </td>
                    <td class="px-3 py-2 text-gray-500 text-xs">{{ $v->category->name }}</td>
                    <td class="px-3 py-2 text-center">
                        @if($v->status === 'published')
                            <span class="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Live</span>
                        @else
                            <span class="inline-block px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Draft</span>
                        @endif
                    </td>
                    <td class="px-3 py-2 text-center text-xs text-gray-500">
                        {{ $v->quality_score ? str_repeat('⭐', $v->quality_score) : '—' }}
                    </td>
                    <td class="px-3 py-2 text-right whitespace-nowrap">
                        <a href="{{ route('admin.varieties.edit', $v) }}" class="text-blue-600 hover:underline text-xs">Upravit</a>
                        <a href="{{ route('variety.show', ['category' => $v->category->slug, 'variety' => $v->slug]) }}"
                           target="_blank" class="text-gray-500 hover:text-gray-700 text-xs ml-2">↗ Web</a>
                        <form method="POST" action="{{ route('admin.varieties.destroy', $v) }}" class="inline ml-2"
                              onsubmit="return confirm('Smazat „{{ $v->name }}"?');">
                            @csrf @method('DELETE')
                            <button class="text-red-600 hover:underline text-xs">Smazat</button>
                        </form>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>

<div class="mt-4">
    {{ $varieties->links() }}
</div>

@endsection

@section('scripts')
<script>
const selectAll = document.getElementById('selectAll');
const bulkForm = document.getElementById('bulkForm');
const bulkCount = document.getElementById('bulkCount');

function refreshBulk() {
    const checked = document.querySelectorAll('.bulk-check:checked').length;
    bulkCount.textContent = `${checked} vybráno`;
    bulkForm.classList.toggle('hidden', checked === 0);
}

selectAll?.addEventListener('change', e => {
    document.querySelectorAll('.bulk-check').forEach(cb => cb.checked = e.target.checked);
    refreshBulk();
});

document.querySelectorAll('.bulk-check').forEach(cb => cb.addEventListener('change', refreshBulk));
</script>
@endsection
