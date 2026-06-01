<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index()
    {
        $clients = Client::withCount('projects')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'client_id'      => $c->client_id,
                'name'           => $c->name,
                'photo_path'     => $c->photo_path,
                'mobile'         => $c->mobile,
                'email'          => $c->email,
                'city'           => $c->city,
                'status'         => $c->status,
                'projects_count' => $c->projects_count,
                'map_location'   => $c->map_location,
                'created_at'     => $c->created_at->format('d M Y'),
            ]);

        return Inertia::render('Clients/Index', compact('clients'));
    }

    public function show(Client $client)
    {
        $client->load(['projects' => fn($q) => $q->withCount('tasks')]);

        return Inertia::render('Clients/Show', [
            'client' => [
                ...$client->toArray(),
                'projects' => $client->projects->map(fn($p) => [
                    'id'         => $p->id,
                    'project_id' => $p->project_id,
                    'title'      => $p->title,
                    'type'       => $p->type,
                    'start_date' => $p->start_date?->format('d M Y'),
                    'deadline'   => $p->deadline?->format('d M Y'),
                    'status'     => $p->status,
                    'completion' => $p->completion_percentage,
                ]),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'mobile'           => 'required|string|max:20',
            'alternate_mobile' => 'nullable|string|max:20',
            'email'            => 'nullable|email|max:255',
            'address'          => 'nullable|string',
            'city'             => 'nullable|string|max:100',
            'state'            => 'nullable|string|max:100',
            'pincode'          => 'nullable|string|max:10',
            'pan_number'       => 'nullable|string|max:20',
            'gst_number'       => 'nullable|string|max:20',
            'aadhaar_number'   => 'nullable|string|max:20',
            'notes'            => 'nullable|string',
            'map_location'     => 'nullable|string',
            'latitude'         => 'nullable|numeric',
            'longitude'        => 'nullable|numeric',
            'photo'            => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('clients', 'public');
            $validated['photo_path'] = '/storage/' . $path;
        }

        unset($validated['photo']);

        $client = Client::create([...$validated, 'created_by' => Auth::id()]);

        if ($request->wantsJson()) {
            return response()->json(['client' => $client]);
        }

        return redirect()->route('clients.index')
            ->with('success', "Client {$client->name} created successfully.");
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'mobile'           => 'required|string|max:20',
            'alternate_mobile' => 'nullable|string|max:20',
            'email'            => 'nullable|email|max:255',
            'address'          => 'nullable|string',
            'city'             => 'nullable|string|max:100',
            'state'            => 'nullable|string|max:100',
            'pincode'          => 'nullable|string|max:10',
            'pan_number'       => 'nullable|string|max:20',
            'gst_number'       => 'nullable|string|max:20',
            'aadhaar_number'   => 'nullable|string|max:20',
            'notes'            => 'nullable|string',
            'status'           => 'sometimes|in:active,inactive',
            'map_location'     => 'nullable|string',
            'latitude'         => 'nullable|numeric',
            'longitude'        => 'nullable|numeric',
            'photo'            => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('clients', 'public');
            $validated['photo_path'] = '/storage/' . $path;
        }

        unset($validated['photo']);

        $client->update($validated);
        $client->refresh();

        if ($request->wantsJson()) {
            return response()->json(['client' => $client]);
        }

        return back()->with('success', 'Client updated successfully.');
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return redirect()->route('clients.index')
            ->with('success', 'Client deleted successfully.');
    }

    /** JSON autocomplete search for wizard */
    public function search(Request $request)
    {
        $term = $request->get('q', '');
        $clients = Client::where('status', 'active')
            ->where(fn($q) => $q
                ->where('name', 'like', "%{$term}%")
                ->orWhere('mobile', 'like', "%{$term}%")
                ->orWhere('client_id', 'like', "%{$term}%")
            )
            ->limit(10)
            ->get(['id', 'client_id', 'name', 'photo_path', 'mobile', 'city']);

        return response()->json($clients);
    }
}
