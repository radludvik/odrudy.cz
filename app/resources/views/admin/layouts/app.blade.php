<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Administrace') — Odrůdy.cz Admin</title>
    <link rel="stylesheet" href="/css/app.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    @yield('head')
</head>
<body class="bg-gray-100 text-gray-800 font-sans antialiased min-h-screen">

<div class="flex min-h-screen">
    {{-- ═══ SIDEBAR ═══ --}}
    <aside class="w-64 bg-gray-900 text-gray-100 flex flex-col">
        <div class="px-6 py-5 border-b border-gray-800">
            <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-2 text-xl font-bold text-white hover:text-brand-400">
                <svg class="w-6 h-6 text-brand-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2 2-4 8-3 8-3-3-1-7.5 0-9.5 2C5.5 8 4 13 4 13l1.5.5C6 10 8 8 17 8z"/>
                </svg>
                Odrůdy.cz
            </a>
            <span class="text-xs text-gray-500 ml-8">administrace</span>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1">
            @php $current = request()->route()->getName(); @endphp
            <a href="{{ route('admin.dashboard') }}"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium {{ $current === 'admin.dashboard' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white' }}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                Přehled
            </a>

            <a href="{{ route('admin.categories.index') }}"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium {{ str_starts_with($current ?? '', 'admin.categories') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white' }}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                Kategorie
                <span class="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded">{{ \App\Models\Category::count() }}</span>
            </a>

            <a href="{{ route('admin.varieties.index') }}"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium {{ str_starts_with($current ?? '', 'admin.varieties') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white' }}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                Odrůdy
                <span class="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded">{{ \App\Models\Variety::count() }}</span>
            </a>

            <a href="{{ route('admin.blog.index') }}"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium {{ str_starts_with($current ?? '', 'admin.blog') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white' }}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Blog
                <span class="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded">{{ \App\Models\BlogPost::count() }}</span>
            </a>
        </nav>

        <div class="px-3 py-4 border-t border-gray-800 text-sm">
            <div class="px-3 mb-2 text-xs text-gray-500">Přihlášen jako</div>
            <div class="px-3 mb-3 text-gray-300 truncate" title="{{ auth()->user()->email }}">{{ auth()->user()->email }}</div>
            <div class="px-3 mb-3 text-xs text-gray-500">
                Naposledy: {{ auth()->user()->last_login_at?->format('d.m. H:i') ?? '—' }}<br>
                IP: {{ auth()->user()->last_login_ip ?? '—' }}
            </div>
            <form method="POST" action="{{ route('admin.logout') }}">
                @csrf
                <button type="submit"
                        class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Odhlásit se
                </button>
            </form>
            <a href="/" target="_blank"
               class="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-800 hover:text-white">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                Zobrazit web
            </a>
        </div>
    </aside>

    {{-- ═══ CONTENT ═══ --}}
    <main class="flex-1 overflow-auto">
        <div class="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
            <h1 class="text-xl font-semibold text-gray-900">@yield('page_title', 'Přehled')</h1>
            <div>@yield('page_actions')</div>
        </div>

        @if (session('success'))
            <div class="mx-6 mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                {{ session('success') }}
            </div>
        @endif

        @if (session('error'))
            <div class="mx-6 mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {{ session('error') }}
            </div>
        @endif

        <div class="p-6">
            @yield('content')
        </div>
    </main>
</div>

@yield('scripts')

</body>
</html>
