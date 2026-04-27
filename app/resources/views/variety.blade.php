@extends('layouts.app')

@section('title', $variety->meta_title ?? $variety->short_name . ' – ' . $category->name)
@section('description', $variety->meta_description ?? $variety->excerpt)

@section('content')

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    {{-- Breadcrumb --}}
    <nav class="text-sm text-gray-400 mb-6">
        <a href="/" class="hover:text-brand-600">Domů</a>
        <span class="mx-2">/</span>
        <a href="{{ $category->url }}" class="hover:text-brand-600">{{ $category->name }}</a>
        <span class="mx-2">/</span>
        <span class="text-gray-700">{{ $variety->short_name }}</span>
    </nav>

    <div class="grid lg:grid-cols-3 gap-8">

        {{-- ═══ LEVÝ SLOUPEC: obrázek + rychlé info ═══ --}}
        <aside class="lg:col-span-1">

            {{-- Obrázek --}}
            <div class="rounded-2xl overflow-hidden mb-6 bg-brand-50">
                @if($variety->hero_image_url)
                    <img src="{{ $variety->hero_image_url }}" alt="{{ $variety->name }}"
                         class="w-full aspect-square object-cover">
                @else
                    <div class="w-full aspect-square flex items-center justify-center">
                        <svg class="w-24 h-24 text-brand-200" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2 2-4 8-3 8-3-3-1-7.5 0-9.5 2C5.5 8 4 13 4 13l1.5.5C6 10 8 8 17 8z"/>
                        </svg>
                    </div>
                @endif
            </div>

            {{-- Přehled vlastností --}}
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3 text-sm">
                <h3 class="font-semibold text-gray-700 text-base">Přehled vlastností</h3>

                @php
                    $props = [
                        'Doba zrání'    => $variety->ripening_label,
                        'Barva'         => $variety->color,
                        'Velikost'      => $variety->fruit_size,
                        'Hmotnost'      => $variety->fruit_weight,
                        'Chuť'          => $variety->taste_profile,
                        'Výška rostliny'=> $variety->plant_height,
                        'Původ'         => $variety->origin_country,
                        'Registrace'    => $variety->year_registered,
                    ];
                @endphp

                @foreach($props as $label => $value)
                    @if($value)
                    <div class="flex justify-between gap-2">
                        <span class="text-gray-400 shrink-0">{{ $label }}</span>
                        <span class="text-gray-800 font-medium text-right">{{ $value }}</span>
                    </div>
                    @endif
                @endforeach

                @if(!empty($variety->use_cases))
                <div>
                    <span class="text-gray-400 block mb-1.5">Použití</span>
                    <div class="flex flex-wrap gap-1">
                        @foreach($variety->use_cases as $uc)
                            <span class="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-full border border-brand-200">{{ $uc }}</span>
                        @endforeach
                    </div>
                </div>
                @endif

                @if(!empty($variety->disease_resistance))
                <div>
                    <span class="text-gray-400 block mb-1.5">Odolnost vůči</span>
                    <div class="flex flex-wrap gap-1">
                        @foreach($variety->disease_resistance as $d)
                            <span class="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200">{{ $d }}</span>
                        @endforeach
                    </div>
                </div>
                @endif
            </div>

            {{-- Affiliate sekce --}}
            @if(!empty($variety->affiliate_links))
            <div class="mt-5 bg-brand-50 rounded-xl p-5 border border-brand-100">
                <p class="text-sm font-semibold text-brand-800 mb-3">Kde koupit semena / sadbu</p>
                <div class="space-y-2">
                    @foreach($variety->affiliate_links as $link)
                    <a href="{{ $link['url'] }}" target="_blank" rel="noopener sponsored"
                       class="flex items-center justify-between w-full px-4 py-2.5 bg-white border border-brand-200 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors">
                        <span>{{ $link['label'] ?? $link['partner'] }}</span>
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                    </a>
                    @endforeach
                </div>
                <p class="text-xs text-brand-400 mt-2">Partnerské odkazy. Cena pro vás stejná.</p>
            </div>
            @endif
        </aside>

        {{-- ═══ PRAVÝ SLOUPEC: název + obsah ═══ --}}
        <div class="lg:col-span-2">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                {{ $variety->short_name }}
            </h1>
            <p class="text-brand-600 font-medium mb-6">{{ $category->name }}</p>

            {{-- Hlavní obsah --}}
            <div class="prose prose-gray prose-headings:font-semibold prose-a:text-brand-600 max-w-none">
                {!! $variety->description_html !!}
            </div>

            {{-- Příbuzné odrůdy --}}
            @if($related->isNotEmpty())
            <div class="mt-12 pt-8 border-t">
                <h2 class="text-xl font-bold text-gray-900 mb-5">Podobné odrůdy</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    @foreach($related as $rel)
                    <a href="{{ $rel->url }}"
                       class="group bg-white rounded-xl border border-gray-100 hover:border-brand-300 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        @if($rel->hero_image_url)
                            <img src="{{ $rel->hero_image_url }}" alt="{{ $rel->short_name }}"
                                 class="w-full h-28 object-cover">
                        @else
                            <div class="w-full h-28 bg-brand-50 flex items-center justify-center">
                                <svg class="w-8 h-8 text-brand-200" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2 2-4 8-3 8-3-3-1-7.5 0-9.5 2C5.5 8 4 13 4 13l1.5.5C6 10 8 8 17 8z"/>
                                </svg>
                            </div>
                        @endif
                        <p class="p-3 text-sm font-medium text-gray-800 group-hover:text-brand-700 leading-snug">
                            {{ $rel->short_name }}
                        </p>
                    </a>
                    @endforeach
                </div>
            </div>
            @endif
        </div>
    </div>
</div>

@endsection
