@extends('layouts.app')

@section('title', 'Odrůdy.cz – Katalog odrůd zeleniny, ovoce a vína')

@section('content')

{{-- ═══ HERO ═══ --}}
<section class="bg-gradient-to-br from-brand-700 to-brand-900 text-white py-16 md:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Najděte správnou odrůdu<br class="hidden md:block"> pro svoji zahradu
        </h1>
        <p class="text-brand-200 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Přes {{ number_format($categories->sum('published_varieties_count'), 0, ',', ' ') }} odrůd zeleniny, ovoce a vína. Popis, vlastnosti, tipy na pěstování.
        </p>
        <form action="/hledat" method="GET" class="flex max-w-lg mx-auto">
            <input type="search" name="q" placeholder="Např. rajče, Stupické polní…"
                class="flex-1 px-4 py-3 rounded-l-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-brand-400">
            <button type="submit" class="px-6 py-3 bg-brand-500 hover:bg-brand-400 rounded-r-xl font-semibold transition-colors">
                Hledat
            </button>
        </form>
    </div>
</section>

{{-- ═══ KATEGORIE ═══ --}}
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
    <h2 class="text-2xl font-bold text-gray-900 mb-8">Procházet podle druhu</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        @foreach($categories as $category)
        <a href="{{ $category->url }}"
           class="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-brand-300 transition-all p-4 flex flex-col items-center text-center gap-2">
            {{-- Obrázek nebo placeholder ikona --}}
            @if($category->hero_image_url)
                <img src="{{ $category->hero_image_url }}" alt="{{ $category->name }}"
                     class="w-16 h-16 object-cover rounded-full">
            @else
                <div class="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2 2-4 8-3 8-3-3-1-7.5 0-9.5 2C5.5 8 4 13 4 13l1.5.5C6 10 8 8 17 8z"/>
                    </svg>
                </div>
            @endif
            <span class="font-semibold text-gray-800 group-hover:text-brand-700 text-sm leading-tight">
                {{ $category->name }}
            </span>
            <span class="text-xs text-gray-400">
                {{ $category->published_varieties_count }} odrůd
            </span>
        </a>
        @endforeach
    </div>
</section>

{{-- ═══ BLOG ═══ --}}
@if($latestPosts->count())
<section class="bg-white border-t">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl font-bold text-gray-900">Z blogu</h2>
            <a href="/blog" class="text-brand-600 hover:text-brand-800 text-sm font-medium">Všechny články →</a>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
            @foreach($latestPosts as $post)
            <article class="group">
                @if($post->hero_image_url)
                    <img src="{{ $post->hero_image_url }}" alt="{{ $post->title }}"
                         class="w-full h-44 object-cover rounded-xl mb-4 group-hover:opacity-90 transition-opacity">
                @else
                    <div class="w-full h-44 bg-brand-50 rounded-xl mb-4 flex items-center justify-center">
                        <svg class="w-10 h-10 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                    </div>
                @endif
                <h3 class="font-semibold text-gray-900 group-hover:text-brand-700 mb-2 leading-snug">
                    <a href="{{ $post->url }}">{{ $post->title }}</a>
                </h3>
                @if($post->excerpt)
                    <p class="text-sm text-gray-500 line-clamp-2">{{ $post->excerpt }}</p>
                @endif
            </article>
            @endforeach
        </div>
    </div>
</section>
@endif

@endsection
