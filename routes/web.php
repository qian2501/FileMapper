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
    Route::get('/edit/{rule}', [MappingController::class, 'edit'])->name('edit');

    Route::post('/scan', [MappingController::class, 'scan'])->name('scan');
    Route::post('/preview', [MappingController::class, 'preview'])->name('preview');
    Route::post('/apply', [MappingController::class, 'apply'])->name('apply');
    Route::post('/remove', [MappingController::class, 'delete'])->name('delete');
});

require __DIR__.'/auth.php';
