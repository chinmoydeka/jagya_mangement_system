<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class AccessController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Access');
    }
}
