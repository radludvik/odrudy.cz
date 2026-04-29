@extends('admin.layouts.app')

@section('title', 'Přehled')
@section('page_title', 'Přehled')

@section('content')

{{-- ── Statistické karty ── --}}
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <a href="{{ route('admin.categories.index') }}" class="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-500 uppercase">Kategorie</span>
            <svg class="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
        </div>
        <div class="text-3xl font-bold text-gray-900">{{ $stats['categories_total'] }}</div>
        <div class="text-sm text-gray-500 mt-1">{{ $stats['categories_visible'] }} viditelných</div>
    </a>

    <a href="{{ route('admin.varieties.index') }}" class="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-500 uppercase">Odrůdy</span>
            <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/></svg>
        </div>
        <div class="text-3xl font-bold text-gray-900">{{ $stats['varieties_total'] }}</div>
        <div class="text-sm text-gray-500 mt-1">{{ $stats['varieties_published'] }} publikováno</div>
    </a>

    <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-500 uppercase">S obrázkem</span>
            <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/></svg>
        </div>
        <div class="text-3xl font-bold text-gray-900">{{ $stats['varieties_with_image'] }}</div>
        <div class="text-sm text-gray-500 mt-1">
            {{ round($stats['varieties_with_image'] / max($stats['varieties_total'], 1) * 100) }}% pokrytí
        </div>
    </div>

    <a href="{{ route('admin.blog.index') }}" class="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-500 uppercase">Blog</span>
            <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"/></svg>
        </div>
        <div class="text-3xl font-bold text-gray-900">{{ $stats['blog_total'] }}</div>
        <div class="text-sm text-gray-500 mt-1">{{ $stats['blog_published'] }} publikováno</div>
    </a>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {{-- Top kategorie --}}
    <div class="bg-white rounded-xl shadow-sm p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Největší kategorie</h2>
        <div class="space-y-2">
            @foreach($top_categories as $cat)
                <div class="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                    <a href="{{ route('admin.categories.edit', $cat) }}" class="text-gray-900 hover:text-brand-600 font-medium">
                        {{ $cat->name }}
                    </a>
                    <span class="text-gray-500">{{ $cat->varieties_count }} odrůd</span>
                </div>
            @endforeach
        </div>
    </div>

    {{-- Nedávno upravené odrůdy --}}
    <div class="bg-white rounded-xl shadow-sm p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Nedávno upravené odrůdy</h2>
        <div class="space-y-2">
            @foreach($recent_varieties as $v)
                <div class="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                    <a href="{{ route('admin.varieties.edit', $v) }}" class="text-gray-900 hover:text-brand-600 truncate flex-1 mr-2">
                        {{ $v->short_name }} <span class="text-xs text-gray-400">({{ $v->category->name }})</span>
                    </a>
                    <span class="text-xs text-gray-500 whitespace-nowrap">{{ $v->updated_at->diffForHumans() }}</span>
                </div>
            @endforeach
        </div>
    </div>
</div>

@endsection
