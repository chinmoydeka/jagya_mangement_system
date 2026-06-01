<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class FrontOfficeController extends Controller
{
    public function index()
    {
        return Inertia::render('FrontOffice');
    }
}
