<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\MappingController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware([
    'auth',
    'verified'
])->group(function () {
    Route::get('/', [MappingController::class, 'index'])->name('index');
    Route::get('/new', [MappingController::class, 'new'])->name('new');

    Route::post('scan', [MappingController::class, 'scan']);
    Route::post('preview', [MappingController::class, 'preview']);
    Route::post('apply', [MappingController::class, 'apply']);
    Route::post('remove', [MappingController::class, 'delete']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
