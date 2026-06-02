<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\FrontOfficeController;
use App\Http\Controllers\Settings\AppSettingsController;
use App\Http\Controllers\Settings\AccessController;
use App\Http\Controllers\MediaController;

// Auth Routes (Public)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('home');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Clients
    Route::get('/clients/search', [ClientController::class, 'search'])->name('clients.search');
    Route::resource('clients', ClientController::class)->except(['create', 'edit']);

    // Projects
    Route::get('/projects/team-members', [ProjectController::class, 'teamMembers'])->name('projects.team-members');
    Route::post('/projects/team-members/create', [ProjectController::class, 'createTeamMember'])->name('projects.team-members.create');
    Route::post('/projects/{project}/documents', [ProjectController::class, 'storeDocument'])->name('projects.documents.store');
    Route::post('/projects/{project}/tasks', [ProjectController::class, 'storeTask'])->name('projects.tasks.store');
    Route::post('/tasks/{task}/update', [ProjectController::class, 'updateTask'])->name('tasks.update');
    Route::post('/projects/{project}/setup',           [ProjectController::class, 'setupProject'])->name('projects.setup');
    Route::post('/delete-requests', [ProjectController::class, 'requestDelete'])->name('delete-requests.store');
    Route::post('/projects/{project}/team',           [ProjectController::class, 'addTeamMember'])->name('projects.team.add');
    Route::delete('/projects/{project}/team/{user}',  [ProjectController::class, 'removeTeamMember'])->name('projects.team.remove');
    Route::resource('projects', ProjectController::class)->except(['create', 'edit']);

    // Project Expansion Routes
    Route::post('/projects/{project}/updates', [\App\Http\Controllers\ProjectExpansionController::class, 'storeUpdate'])->name('projects.updates.store');
    Route::post('/projects/{project}/payments', [\App\Http\Controllers\ProjectExpansionController::class, 'storePayment'])->name('projects.payments.store');
    Route::post('/projects/{project}/notices', [\App\Http\Controllers\ProjectExpansionController::class, 'storeNotice'])->name('projects.notices.store');
    Route::post('/projects/{project}/notices/{notice}/resend', [\App\Http\Controllers\ProjectExpansionController::class, 'resendNotice'])->name('projects.notices.resend');
    Route::post('/projects/{project}/events', [\App\Http\Controllers\ProjectExpansionController::class, 'storeEvent'])->name('projects.events.store');

    // Team
    Route::get('/team', [TeamController::class, 'index'])->name('team.index');
    Route::post('/team', [TeamController::class, 'store'])->name('team.store');

    // Front Office
    Route::get('/front-office', [FrontOfficeController::class, 'index'])->name('front-office.index');

    // File Manager / Filesystem
    Route::get('/file-manager', [MediaController::class, 'index'])->name('media.index');
    Route::post('/file-manager/folder', [MediaController::class, 'createFolder'])->name('media.folder.create');
    Route::post('/file-manager/upload', [MediaController::class, 'upload'])->name('media.upload');
    Route::post('/file-manager/file/{file}/rename', [MediaController::class, 'renameFile'])->name('media.file.rename');
    Route::post('/file-manager/folder/{folder}/rename', [MediaController::class, 'renameFolder'])->name('media.folder.rename');
    Route::delete('/file-manager/file/{file}', [MediaController::class, 'destroyFile'])->name('media.file.delete');
    Route::delete('/file-manager/folder/{folder}', [MediaController::class, 'destroyFolder'])->name('media.folder.delete');

    // Settings
    Route::get('/settings/app', [AppSettingsController::class, 'index'])->name('settings.app');
    Route::get('/settings/access', [AccessController::class, 'index'])->name('settings.access');
});
