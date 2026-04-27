<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\VarietyController;
use App\Http\Controllers\BlogController;

// Homepage
Route::get('/', [HomeController::class, 'index'])->name('home');

// Blog
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');

// Kategorie + odrůdy
// Pořadí je důležité — blog musí být před {category}
Route::get('/{category}', [CategoryController::class, 'show'])->name('category.show');
Route::get('/{category}/{variety}', [VarietyController::class, 'show'])->name('variety.show');
