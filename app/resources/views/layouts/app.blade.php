<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Odrůdy.cz') – Odrůdy zeleniny, ovoce a vína</title>
    <meta name="description" content="@yield('description', 'Průvodce odrůdami zeleniny, ovoce a vína pro české zahrádkáře. Popisy, vlastnosti, tipy na pěstování.')">
    @yield('meta')

    {{-- Tailwind (zkompilovaný přes npm run dev/prod) --}}
    <link rel="stylesheet" href="/css/app.css">
    {{-- Google Fonts: Inter --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    @yield('head')
</head>
<body class="bg-gray-50 text-gray-800 font-sans antialiased">

{{-- ═══ NAVIGACE ═══ --}}
<header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

            {{-- Logo --}}
            <a href="/" class="flex items-center gap-2 font-bold text-xl text-brand-700 hover:text-brand-800">
                <svg class="w-7 h-7 text-brand-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2 2-4 8-3 8-3-3-1-7.5 0-9.5 2C5.5 8 4 13 4 13l1.5.5C6 10 8 8 17 8z"/>
                </svg>
                Odrůdy.cz
            </a>

            {{-- Desktop nav --}}
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
                <a href="/" class="text-gray-600 hover:text-brand-700 transition-colors">Domů</a>
                <div class="relative group">
                    <button class="text-gray-600 hover:text-brand-700 transition-colors flex items-center gap-1">
                        Katalog
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    {{-- Dropdown --}}
                    <div class="absolute top-full left-0 mt-1 w-56 bg-white shadow-lg rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        @php
                            $navCategories = \App\Models\Category::visible()->orderBy('sort_order')->get();
                        @endphp
                        @foreach($navCategories as $cat)
                            <a href="{{ $cat->url }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700">
                                {{ $cat->name }}
                            </a>
                        @endforeach
                    </div>
                </div>
                <a href="/blog" class="text-gray-600 hover:text-brand-700 transition-colors">Blog</a>
            </nav>

            {{-- Hledání --}}
            <form action="/hledat" method="GET" class="hidden md:flex items-center">
                <input type="search" name="q" placeholder="Hledat odrůdu…"
                    class="w-52 px-3 py-1.5 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent">
                <button type="submit" class="px-3 py-1.5 bg-brand-600 text-white rounded-r-lg hover:bg-brand-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </button>
            </form>

            {{-- Hamburger (mobile) --}}
            <button id="menu-btn" class="md:hidden p-2 text-gray-600 hover:text-brand-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
            </button>
        </div>
    </div>

    {{-- Mobile menu --}}
    <div id="mobile-menu" class="hidden md:hidden bg-white border-t px-4 py-3 space-y-2">
        <a href="/" class="block py-2 text-gray-700">Domů</a>
        @foreach($navCategories ?? \App\Models\Category::visible()->orderBy('sort_order')->get() as $cat)
            <a href="{{ $cat->url }}" class="block py-2 text-gray-700 pl-4 text-sm">{{ $cat->name }}</a>
        @endforeach
        <a href="/blog" class="block py-2 text-gray-700">Blog</a>
    </div>
</header>

{{-- ═══ HLAVNÍ OBSAH ═══ --}}
<main>
    @yield('content')
</main>

{{-- ═══ PATIČKA ═══ --}}
<footer class="bg-brand-900 text-brand-100 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div class="col-span-2 md:col-span-1">
                <p class="font-bold text-white text-lg mb-2">Odrůdy.cz</p>
                <p class="text-sm text-brand-300">Průvodce odrůdami zeleniny, ovoce a vína pro české zahrádkáře.</p>
            </div>
            <div>
                <p class="font-semibold text-white mb-3">Zelenina</p>
                <ul class="space-y-1 text-sm text-brand-300">
                    <li><a href="/rajcata" class="hover:text-white">Rajčata</a></li>
                    <li><a href="/okurky" class="hover:text-white">Okurky</a></li>
                    <li><a href="/brambory" class="hover:text-white">Brambory</a></li>
                    <li><a href="/papriky" class="hover:text-white">Papriky</a></li>
                    <li><a href="/cibule" class="hover:text-white">Cibule</a></li>
                </ul>
            </div>
            <div>
                <p class="font-semibold text-white mb-3">Ovoce</p>
                <ul class="space-y-1 text-sm text-brand-300">
                    <li><a href="/jablka" class="hover:text-white">Jablka</a></li>
                    <li><a href="/jahody" class="hover:text-white">Jahody</a></li>
                    <li><a href="/maliny" class="hover:text-white">Maliny</a></li>
                    <li><a href="/hrushky" class="hover:text-white">Hrušky</a></li>
                </ul>
            </div>
            <div>
                <p class="font-semibold text-white mb-3">Informace</p>
                <ul class="space-y-1 text-sm text-brand-300">
                    <li><a href="/blog" class="hover:text-white">Blog</a></li>
                    <li><a href="/o-projektu" class="hover:text-white">O projektu</a></li>
                </ul>
            </div>
        </div>
        <div class="border-t border-brand-800 mt-8 pt-6 text-sm text-brand-400 flex flex-col md:flex-row justify-between gap-2">
            <p>&copy; {{ date('Y') }} Odrůdy.cz</p>
            <p>Obsah má informační charakter. Pěstitelské výsledky se mohou lišit dle podmínek stanoviště.</p>
        </div>
    </div>
</footer>

<script>
    document.getElementById('menu-btn')?.addEventListener('click', () => {
        document.getElementById('mobile-menu')?.classList.toggle('hidden');
    });
</script>
@yield('scripts')
</body>
</html>
