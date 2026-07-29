<?php

use App\Http\Controllers\BriefFeatureController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SlaConfigController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('auth')->group(function (): void {
    Route::inertia('/dashboard', 'dashboard')->name('dashboard');

    // SLA Configuration
    Route::get('/settings/sla', [SlaConfigController::class, 'index'])->name('sla.index');
    Route::put('/settings/sla', [SlaConfigController::class, 'update'])->name('sla.update');

    // Projects CRUD
    Route::resource('projects', ProjectController::class);

    // Brief Features Nested Actions
    Route::post('/projects/{project}/brief-features', [BriefFeatureController::class, 'store'])->name('projects.brief-features.store');
    Route::put('/brief-features/{briefFeature}', [BriefFeatureController::class, 'update'])->name('brief-features.update');
    Route::patch('/brief-features/{briefFeature}/status', [BriefFeatureController::class, 'updateStatus'])->name('brief-features.update-status');
    Route::delete('/brief-features/{briefFeature}', [BriefFeatureController::class, 'destroy'])->name('brief-features.destroy');

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/restore', [UserController::class, 'restore'])->name('users.restore');
});
