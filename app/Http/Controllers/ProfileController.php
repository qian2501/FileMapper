<?php

namespace App\Http\Controllers;

use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show()
    {
        return Inertia::render('Profile', [
            'defaults' => Auth::user()->profile()->firstOrNew()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'source_dir' => 'nullable|string',
            'target_dir' => 'nullable|string',
            'include_pattern' => 'nullable|string',
            'exclude_pattern' => 'nullable|string',
            'target_template' => 'nullable|string',
        ]);

        Auth::user()->profile()->updateOrCreate(
            ['user_id' => Auth::id()],
            $validated
        );

        return redirect()->back()->with('success', 'Profile saved successfully');
    }
}
