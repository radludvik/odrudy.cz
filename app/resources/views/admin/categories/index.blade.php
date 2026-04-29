@extends('admin.layouts.app')
@section('title', 'Kategorie')
@section('page_title', 'Kategorie odrůd')

@section('page_actions')
    <a href="{{ route('admin.categories.create') }}"
       class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm">
        + Nová kategorie
    </a>
@endsection

@section('content')

<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-600 uppercase">
            <tr>
                <th class="px-4 py-3 text-left">#</th>
                <th class="px-4 py-3 text-left">Obrázek</th>
                <th class="px-4 py-3 text-left">Název</th>
                <th class="px-4 py-3 text-left">Slug</th>
                <th class="px-4 py-3 text-center">Pořadí</th>
                <th class="px-4 py-3 text-center">Viditelná</th>
                <th class="px-4 py-3 text-center">Odrůd</th>
                <th class="px-4 py-3 text-right">Akce</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
            @foreach($categories as $cat)
                <tr class="hover:bg-gray-50 {{ !$cat->visible ? 'opacity-50' : '' }}">
                    <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ $cat->id }}</td>
                    <td class="px-4 py-3">
                        @if($cat->hero_image_url)
                            <img src="{{ $cat->hero_image_url }}" alt="{{ $cat->hero_image_alt }}"
                                 class="w-12 h-12 object-cover rounded-lg">
                        @else
                            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">—</div>
                        @endif
                    </td>
                    <td class="px-4 py-3">
                        <a href="{{ route('admin.categories.edit', $cat) }}" class="font-medium text-gray-900 hover:text-brand-600">
                            {{ $cat->name }}
                        </a>
                        @if($cat->name_plural)
                            <div class="text-xs text-gray-500">{{ $cat->name_plural }}</div>
                        @endif
                    </td>
                    <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ $cat->slug }}</td>
                    <td class="px-4 py-3 text-center text-gray-500">{{ $cat->sort_order }}</td>
                    <td class="px-4 py-3 text-center">
                        @if($cat->visible)
                            <span class="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        @else
                            <span class="inline-block w-2 h-2 bg-gray-300 rounded-full"></span>
                        @endif
                    </td>
                    <td class="px-4 py-3 text-center">
                        <a href="{{ route('admin.varieties.index', ['category_id' => $cat->id]) }}"
                           class="text-brand-600 hover:underline">{{ $cat->varieties_count }}</a>
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                        <a href="{{ route('admin.categories.edit', $cat) }}" class="text-blue-600 hover:underline text-sm">Upravit</a>
                        @if($cat->varieties_count === 0)
                            <form method="POST" action="{{ route('admin.categories.destroy', $cat) }}" class="inline ml-2"
                                  onsubmit="return confirm('Opravdu smazat „{{ $cat->name }}"?');">
                                @csrf @method('DELETE')
                                <button class="text-red-600 hover:underline text-sm">Smazat</button>
                            </form>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>

@endsection
