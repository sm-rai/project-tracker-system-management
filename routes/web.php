<?php

use App\Http\Controllers\BriefFeatureController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeatureRequestController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReportSnapshotController;
use App\Http\Controllers\ReportSnapshotExportController;
use App\Http\Controllers\SlaConfigController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('dashboard'))
    ->middleware('auth')
    ->name('home');

Route::middleware('auth')->group(function (): void {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/reports', [ReportSnapshotController::class, 'index'])->name('reports.index');
    Route::post('/reports', [ReportSnapshotController::class, 'store'])->name('reports.store');
    Route::get('/reports/{reportSnapshot}/export/pdf', [ReportSnapshotExportController::class, 'pdf'])
        ->name('reports.export.pdf');
    Route::get('/reports/{reportSnapshot}/export/png', [ReportSnapshotExportController::class, 'png'])
        ->name('reports.export.png');
    Route::get('/reports/{reportSnapshot}', [ReportSnapshotController::class, 'show'])->name('reports.show');

    // SLA Configuration
    Route::get('/settings/sla', [SlaConfigController::class, 'index'])->name('sla.index');
    Route::put('/settings/sla', [SlaConfigController::class, 'update'])->name('sla.update');

    // Issues CRUD & Actions
    Route::resource('issues', IssueController::class);
    Route::patch('/issues/{issue}/resolve', [IssueController::class, 'resolve'])->name('issues.resolve');
    Route::patch('/issues/{issue}/reopen', [IssueController::class, 'reopen'])->name('issues.reopen');

    Route::resource('feature-requests', FeatureRequestController::class);
    Route::patch('/feature-requests/{feature_request}/start', [FeatureRequestController::class, 'start'])->name('feature-requests.start');
    Route::patch('/feature-requests/{feature_request}/fulfill', [FeatureRequestController::class, 'fulfill'])->name('feature-requests.fulfill');
    Route::patch('/feature-requests/{feature_request}/reopen', [FeatureRequestController::class, 'reopen'])->name('feature-requests.reopen');

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
