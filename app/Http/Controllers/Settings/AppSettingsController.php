<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppSettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/AppSettings', [
            'departments'  => \App\Models\Department::all(),
            'designations' => \App\Models\Designation::all(),
            'offices'      => \App\Models\Office::all(),
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The provided current password does not match our records.'
            ], 422);
        }

        // The User model uses the 'hashed' cast on the password field,
        // so we pass plain text and let the cast hash it automatically.
        $user->update([
            'password' => $request->new_password
        ]);

        // Re-authenticate the user to keep session hash in sync
        Auth::login($user->fresh());

        return response()->json([
            'success' => true,
            'message' => 'Your password has been changed successfully!'
        ]);
    }
}
