@extends('layouts.app')

@section('title', $category->meta_title ?? $category->name)
@section('description', $category->meta_description ?? 'Přehled odrůd – ' . $category->name)

@section('content')

{{-- ═══ HLAVIČKA KATEGORIE ═══ --}}
<div class="bg-white border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav class="text-sm text-gray-400 mb-3">
            <a href="/" class="hover:text-brand-600">Domů</a>
            <span class="mx-2">/</span>
            <span class="text-gray-700">{{ $category->name }}</span>
        </nav>
        <h1 class="text-3xl font-bold text-gray-900">{{ $category->name }}</h1>
        @if($category->description)
            <div class="mt-3 max-w-3xl prose">
                {!! $category->description !!}
            </div>
        @endif
        <p class="mt-3 text-sm text-gray-400">{{ $varieties->total() }} odrůd</p>
    </div>
</div>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col lg:flex-row gap-8">

        {{-- ═══ FILTROVÁNÍ (sidebar) ═══ --}}
        <aside class="lg:w-56 shrink-0">
            <form method="GET" action="{{ $category->url }}" id="filter-form">

                {{-- Hledání --}}
                <div class="mb-5">
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Hledat v kategorii</label>
                    <input type="search" name="hledat" value="{{ request('hledat') }}"
                        placeholder="Název odrůdy…"
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:outline-none"
                        onchange="this.form.submit()">
                </div>

                {{-- Doba zrání --}}
                @if($ripeningOptions->isNotEmpty())
                <div class="mb-5">
                    <p class="text-sm font-semibold text-gray-700 mb-2">Doba zrání</p>
                    <div class="space-y-1">
                        <label class="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" name="zrani" value="" {{ !request('zrani') ? 'checked' : '' }}
                                class="text-brand-600" onchange="this.form.submit()">
                            <span class="text-gray-600">Všechny</span>
                        </label>
                        @foreach($ripeningOptions as $key => $label)
                        <label class="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" name="zrani" value="{{ $label }}"
                                {{ request('zrani') === $label ? 'checked' : '' }}
                                class="text-brand-600" onchange="this.form.submit()">
                            <span class="text-gray-600">{{ ucfirst($label) }}</span>
                        </label>
                        @endforeach
                    </div>
                </div>
                @endif

                {{-- Použití --}}
                @if($useCaseOptions->isNotEmpty())
                <div class="mb-5">
                    <p class="text-sm font-semibold text-gray-700 mb-2">Použití</p>
                    <div class="space-y-1">
                        @foreach($useCaseOptions as $useCase)
                        <label class="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" name="pouziti" value="{{ $useCase }}"
                                {{ request('pouziti') === $useCase ? 'checked' : '' }}
                                class="rounded text-brand-600" onchange="this.form.submit()">
                            <span class="text-gray-600">{{ ucfirst($useCase) }}</span>
                        </label>
                        @endforeach
                    </div>
                </div>
                @endif

                {{-- Řazení --}}
                <div class="mb-5">
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Řazení</label>
                    <select name="razeni" onchange="this.form.submit()"
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:outline-none">
                        <option value="zrani" {{ request('razeni', 'zrani') === 'zrani' ? 'selected' : '' }}>Podle zrání</option>
                        <option value="name" {{ request('razeni') === 'name' ? 'selected' : '' }}>Abecedně</option>
                    </select>
                </div>

                {{-- Reset --}}
                @if(request()->hasAny(['zrani','pouziti','hledat']))
                <a href="{{ $category->url }}" class="text-xs text-brand-600 hover:underline">Zrušit filtry</a>
                @endif
            </form>
        </aside>

        {{-- ═══ GRID ODRŮD ═══ --}}
        <div class="flex-1 min-w-0">
            @if($varieties->isEmpty())
                <p class="text-gray-500 py-16 text-center">Žádné odrůdy neodpovídají filtrům.</p>
            @else
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                @foreach($varieties as $variety)
                <a href="{{ $variety->url }}"
                   class="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-brand-300 transition-all overflow-hidden flex flex-col">

                    {{-- Obrázek --}}
                    @if($variety->hero_image_url)
                        <img src="{{ $variety->hero_image_url }}" alt="{{ $variety->name }}"
                             class="w-full h-40 object-cover group-hover:opacity-90 transition-opacity">
                    @else
                        <div class="w-full h-40 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                            <svg class="w-12 h-12 text-brand-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2 2-4 8-3 8-3-3-1-7.5 0-9.5 2C5.5 8 4 13 4 13l1.5.5C6 10 8 8 17 8z"/>
                            </svg>
                        </div>
                    @endif

                    <div class="p-4 flex flex-col flex-1">
                        <h2 class="font-semibold text-gray-900 group-hover:text-brand-700 leading-snug mb-1">
                            {{ $variety->short_name }}
                        </h2>

                        {{-- Tagy: zrání + použití --}}
                        <div class="flex flex-wrap gap-1 mt-auto pt-3">
                            @if($variety->ripening_label)
                                <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                    {{ $variety->ripening_label }}
                                </span>
                            @endif
                            @foreach(array_slice($variety->use_cases ?? [], 0, 2) as $uc)
                                <span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {{ $uc }}
                                </span>
                            @endforeach
                        </div>
                    </div>
                </a>
                @endforeach
            </div>

            {{-- Stránkování --}}
            <div class="mt-8">
                {{ $varieties->links() }}
            </div>
            @endif
        </div>
    </div>
</div>

@endsection
