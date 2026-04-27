@extends('layouts.app')
@section('title', $post->meta_title ?? $post->title)
@section('description', $post->meta_description ?? $post->excerpt)

@section('content')
<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

    <nav class="text-sm text-gray-400 mb-6">
        <a href="/" class="hover:text-brand-600">Domů</a>
        <span class="mx-2">/</span>
        <a href="/blog" class="hover:text-brand-600">Blog</a>
        <span class="mx-2">/</span>
        <span class="text-gray-700">{{ $post->title }}</span>
    </nav>

    @if($post->hero_image_url)
        <img src="{{ $post->hero_image_url }}" alt="{{ $post->title }}"
             class="w-full h-72 object-cover rounded-2xl mb-8">
    @endif

    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">{{ $post->title }}</h1>

    @if($post->published_at)
        <p class="text-sm text-gray-400 mb-8">{{ $post->published_at->translatedFormat('j. F Y') }}</p>
    @endif

    <div class="prose prose-gray prose-headings:font-semibold prose-a:text-brand-600 max-w-none">
        {!! $post->content_html !!}
    </div>

    {{-- Další články --}}
    @if($recent->isNotEmpty())
    <div class="mt-14 pt-8 border-t">
        <h2 class="text-xl font-bold text-gray-900 mb-5">Další články</h2>
        <div class="grid md:grid-cols-3 gap-4">
            @foreach($recent as $r)
            <a href="{{ $r->url }}" class="group bg-white rounded-xl border border-gray-100 hover:border-brand-300 p-4 text-sm font-medium text-gray-800 group-hover:text-brand-700 transition-colors shadow-sm">
                {{ $r->title }}
            </a>
            @endforeach
        </div>
    </div>
    @endif
</div>
@endsection
