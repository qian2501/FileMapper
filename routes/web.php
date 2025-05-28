<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use Inertia\Inertia;
use App\Http\Controllers\MappingController;

Route::get('/', function () {
    return view('app');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile');
    Route::post('/profile', [ProfileController::class, 'store'])->name('profile.save');
});

Route::middleware([
    'auth',
    'verified'
])->group(function () {
    Route::get('/', [MappingController::class, 'index'])->name('index');
    Route::get('/rule', [MappingController::class, 'create'])->name('rule.create');
    Route::get('/rule/{rule}', [MappingController::class, 'edit'])->name('rule.edit');
    Route::get('/apply-once', [MappingController::class, 'onetime'])->name('rule.onetime');

    Route::post('/scan', [MappingController::class, 'scan'])->name('scan');
    Route::post('/preview', [MappingController::class, 'preview'])->name('preview');
    Route::post('/apply', [MappingController::class, 'apply'])->name('apply');
    Route::post('/update', [MappingController::class, 'update'])->name('apply.update');
    Route::post('/onetime', [MappingController::class, 'applyOnce'])->name('apply.onetime');
    Route::post('/remove', [MappingController::class, 'delete'])->name('delete');
});

require __DIR__.'/auth.php';
