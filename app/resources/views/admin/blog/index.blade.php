@extends('admin.layouts.app')
@section('title', 'Blog')
@section('page_title', 'Blogové články')

@section('page_actions')
    <a href="{{ route('admin.blog.create') }}"
       class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm">
        + Nový článek
    </a>
@endsection

@section('content')

<form method="GET" class="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-3">
    <input type="text" name="q" value="{{ request('q') }}" placeholder="Hledat..."
           class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
    <select name="status" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <option value="">— Vše —</option>
        <option value="published" {{ request('status') === 'published' ? 'selected' : '' }}>Publikované</option>
        <option value="draft" {{ request('status') === 'draft' ? 'selected' : '' }}>Drafty</option>
    </select>
    <button class="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">Filtrovat</button>
</form>

<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-600 uppercase">
            <tr>
                <th class="px-4 py-3 text-left">Obr.</th>
                <th class="px-4 py-3 text-left">Titulek</th>
                <th class="px-4 py-3 text-left">Slug</th>
                <th class="px-4 py-3 text-center">Status</th>
                <th class="px-4 py-3 text-left">Upraveno</th>
                <th class="px-4 py-3 text-right">Akce</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
            @foreach($posts as $p)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2">
                        @if($p->hero_image_url)
                            <img src="{{ $p->hero_image_url }}" class="w-10 h-10 object-cover rounded">
                        @else
                            <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">—</div>
                        @endif
                    </td>
                    <td class="px-4 py-2">
                        <a href="{{ route('admin.blog.edit', $p) }}" class="font-medium text-gray-900 hover:text-brand-600">
                            {{ $p->title }}
                        </a>
                        @if($p->excerpt)
                            <div class="text-xs text-gray-500 truncate max-w-md">{{ $p->excerpt }}</div>
                        @endif
                    </td>
                    <td class="px-4 py-2 text-xs text-gray-500 font-mono">{{ $p->slug }}</td>
                    <td class="px-4 py-2 text-center">
                        @if($p->status === 'published')
                            <span class="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Live</span>
                        @else
                            <span class="inline-block px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Draft</span>
                        @endif
                    </td>
                    <td class="px-4 py-2 text-xs text-gray-500">{{ $p->updated_at->format('d.m.Y H:i') }}</td>
                    <td class="px-4 py-2 text-right whitespace-nowrap">
                        <a href="{{ route('admin.blog.edit', $p) }}" class="text-blue-600 hover:underline text-xs">Upravit</a>
                        @if($p->status === 'published')
                            <a href="{{ route('blog.show', $p->slug) }}" target="_blank" class="text-gray-500 hover:text-gray-700 text-xs ml-2">↗ Web</a>
                        @endif
                        <form method="POST" action="{{ route('admin.blog.destroy', $p) }}" class="inline ml-2"
                              onsubmit="return confirm('Smazat „{{ $p->title }}"?');">
                            @csrf @method('DELETE')
                            <button class="text-red-600 hover:underline text-xs">Smazat</button>
                        </form>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>

<div class="mt-4">{{ $posts->links() }}</div>

@endsection
