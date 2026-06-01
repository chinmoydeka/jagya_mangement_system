<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class AppSettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/AppSettings');
    }
}
