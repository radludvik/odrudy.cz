@extends('layouts.app')
@section('title', 'Blog – Tipy na pěstování')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Blog – tipy na pěstování</h1>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        @foreach($posts as $post)
        <article class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            @if($post->hero_image_url)
                <img src="{{ $post->hero_image_url }}" alt="{{ $post->title }}"
                     class="w-full h-44 object-cover">
            @else
                <div class="w-full h-44 bg-brand-50 flex items-center justify-center">
                    <svg class="w-10 h-10 text-brand-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                </div>
            @endif
            <div class="p-5 flex flex-col flex-1">
                @if($post->published_at)
                    <p class="text-xs text-gray-400 mb-2">{{ $post->published_at->translatedFormat('j. F Y') }}</p>
                @endif
                <h2 class="font-semibold text-gray-900 hover:text-brand-700 leading-snug mb-2">
                    <a href="{{ $post->url }}">{{ $post->title }}</a>
                </h2>
                @if($post->excerpt)
                    <p class="text-sm text-gray-500 line-clamp-3 flex-1">{{ $post->excerpt }}</p>
                @endif
                <a href="{{ $post->url }}" class="mt-4 text-sm font-medium text-brand-600 hover:text-brand-800">
                    Číst více →
                </a>
            </div>
        </article>
        @endforeach
    </div>

    <div class="mt-8">{{ $posts->links() }}</div>
</div>
@endsection
