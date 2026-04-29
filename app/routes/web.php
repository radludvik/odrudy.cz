<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\VarietyController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\VarietyController as AdminVarietyController;
use App\Http\Controllers\Admin\BlogPostController as AdminBlogPostController;

// ════════════════════════════════════════════
// ADMINISTRACE — musí být před public routy
// ════════════════════════════════════════════
Route::prefix('admin')->name('admin.')->group(function () {
    // Veřejné — login
    Route::get('login',  [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    // Chráněné — vyžaduje auth + is_admin
    Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        Route::resource('categories', AdminCategoryController::class)->except(['show']);
        Route::resource('varieties',  AdminVarietyController::class)->except(['show']);
        Route::resource('blog',       AdminBlogPostController::class)->except(['show'])
            ->parameters(['blog' => 'blogPost']);

        // Bulk akce
        Route::post('varieties/bulk-move', [AdminVarietyController::class, 'bulkMove'])->name('varieties.bulkMove');
    });
});

// ════════════════════════════════════════════
// PUBLIC routy
// ════════════════════════════════════════════
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');

// Pořadí důležité — blog/admin už nahoře
Route::get('/{category}', [CategoryController::class, 'show'])->name('category.show');
Route::get('/{category}/{variety}', [VarietyController::class, 'show'])->name('variety.show');
