<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProjectExpansionController extends Controller
{
    public function storeUpdate(Request $request, \App\Models\Project $project)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'content' => 'nullable|string',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
            'photos.*' => 'nullable|file|max:51200', // Allow all files, up to 50MB
            'voice_notes.*' => 'nullable|file|max:51200',
        ]);

        $photos = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/updates/photos'), $filename);
                $photos[] = '/uploads/updates/photos/' . $filename;
            }
        }

        $voiceNotes = [];
        if ($request->hasFile('voice_notes')) {
            foreach ($request->file('voice_notes') as $file) {
                $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/updates/voices'), $filename);
                $voiceNotes[] = '/uploads/updates/voices/' . $filename;
            }
        }

        $update = $project->updates()->create([
            'type' => $validated['type'],
            'content' => $validated['content'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'photos' => $photos,
            'voice_notes' => $voiceNotes,
            'created_by' => \Illuminate\Support\Facades\Auth::id(),
        ]);

        return response()->json(['success' => true, 'update' => $update]);
    }

    public function storePayment(Request $request, \App\Models\Project $project)
    {
        $validated = $request->validate([
            'payment_type' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'description' => 'nullable|string',
            'payment_proofs.*' => 'nullable|file|max:51200',
            'voice_notes.*' => 'nullable|file|max:51200',
        ]);

        $proofs = [];
        if ($request->hasFile('payment_proofs')) {
            foreach ($request->file('payment_proofs') as $file) {
                $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/payments/proofs'), $filename);
                $proofs[] = '/uploads/payments/proofs/' . $filename;
            }
        }

        $voiceNotes = [];
        if ($request->hasFile('voice_notes')) {
            foreach ($request->file('voice_notes') as $file) {
                $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/payments/voices'), $filename);
                $voiceNotes[] = '/uploads/payments/voices/' . $filename;
            }
        }

        $payment = $project->payments()->create([
            'payment_type' => $validated['payment_type'],
            'amount' => $validated['amount'],
            'payment_date' => $validated['payment_date'],
            'description' => $validated['description'] ?? null,
            'payment_proofs' => $proofs,
            'voice_notes' => $voiceNotes,
            'created_by' => \Illuminate\Support\Facades\Auth::id(),
        ]);

        return response()->json(['success' => true, 'payment' => $payment]);
    }

    public function storeNotice(Request $request, \App\Models\Project $project)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'methods' => 'nullable|array',
            'attachments.*' => 'nullable|file|max:51200',
        ]);

        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/notices'), $filename);
                $attachments[] = '/uploads/notices/' . $filename;
            }
        }

        $notice = $project->notices()->create([
            'type' => $validated['type'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'methods' => $validated['methods'] ?? [],
            'sent_count' => 1,
            'sent_at' => now(),
            'attachments' => $attachments,
            'created_by' => \Illuminate\Support\Facades\Auth::id(),
        ]);

        return response()->json(['success' => true, 'notice' => $notice]);
    }

    public function resendNotice(Request $request, \App\Models\Project $project, \App\Models\ProjectNotice $notice)
    {
        if ($notice->project_id !== $project->id) {
            abort(404);
        }

        $validated = $request->validate([
            'methods' => 'nullable|array',
        ]);
        
        $methods = $validated['methods'] ?? $notice->methods ?? [];

        $notice->update([
            'methods' => $methods,
            'sent_count' => $notice->sent_count + 1,
            'sent_at' => now(),
        ]);

        return response()->json(['success' => true, 'notice' => $notice]);
    }

    public function storeEvent(Request $request, \App\Models\Project $project)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_date' => 'required|date',
        ]);

        $event = $project->events()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'event_date' => $validated['event_date'],
            'created_by' => \Illuminate\Support\Facades\Auth::id(),
        ]);

        return response()->json(['success' => true, 'event' => $event]);
    }
}
