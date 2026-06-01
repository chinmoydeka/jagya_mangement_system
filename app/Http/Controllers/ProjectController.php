<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectDocument;
use App\Models\ProjectTask;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::with(['client:id,name,client_id,photo_path', 'team:id,name'])
            ->withCount(['tasks', 'documents'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($p) => [
                'id'             => $p->id,
                'project_id'     => $p->project_id,
                'title'          => $p->title,
                'type'           => $p->type,
                'status'         => $p->status,
                'completion'     => $p->completion_percentage,
                'budget'         => $p->budget,
                'start_date'     => $p->start_date?->format('d M Y'),
                'deadline'       => $p->deadline?->format('d M Y'),
                'location'       => $p->location,
                'tasks_count'    => $p->tasks_count,
                'documents_count'=> $p->documents_count,
                'team_count'     => $p->team->count(),
                'client'         => $p->client ? ['id' => $p->client->id, 'name' => $p->client->name, 'client_id' => $p->client->client_id, 'photo_path' => $p->client->photo_path] : null,
            ]);

        return Inertia::render('Projects', compact('projects'));
    }

    public function show(Project $project)
    {
        $project->load([
            'client', 'team', 'documents', 'tasks.assignee',
            'updates', 'payments', 'notices', 'events',
            'activities.user:id,name,photo_path'
        ]);

        return Inertia::render('Projects/Show', ['project' => $project]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'type'        => 'required|in:client,internal',
            'description' => 'nullable|string',
            'client_id'   => 'required_if:type,client|nullable|exists:clients,id',
            'start_date'  => 'nullable|date',
            'deadline'    => 'nullable|date|after_or_equal:start_date',
            'status'      => 'nullable|in:draft,running,handover,on-hold,cancelled',
            'location'    => 'nullable|string',
            'map_location'=> 'nullable|string',
            'latitude'    => 'nullable|numeric',
            'longitude'   => 'nullable|numeric',
            'budget'      => 'nullable|numeric|min:0',
            'team_ids'    => 'nullable|array',
            'team_ids.*'  => 'exists:users,id',
        ]);

        $project = DB::transaction(function () use ($validated, $request) {
            $project = Project::create([
                ...$validated,
                'status'     => $validated['status'] ?? 'draft',
                'created_by' => Auth::id(),
            ]);

            if (!empty($validated['team_ids'])) {
                $project->team()->sync($validated['team_ids']);
            }

            // ── Save Inline Documents ──
            if ($request->hasFile('document_files')) {
                $files = $request->file('document_files');
                $names = $request->input('document_names', []);
                $descs = $request->input('document_descriptions', []);

                foreach ($files as $i => $file) {
                    $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                    $fileSize = $file->getSize(); // Get size first
                    $file->move(public_path('uploads/projects'), $filename);

                    ProjectDocument::create([
                        'project_id'    => $project->id,
                        'document_name' => $names[$i] ?? $file->getClientOriginalName(),
                        'description'   => $descs[$i] ?? null,
                        'file_path'     => '/uploads/projects/' . $filename,
                        'file_type'     => $file->getClientMimeType(),
                        'file_size'     => $fileSize,
                        'uploaded_by'   => Auth::id(),
                    ]);
                }
            }

            // ── Save Inline Tasks ──
            if ($request->has('tasks')) {
                $tasksData = $request->input('tasks', []);
                foreach ($tasksData as $i => $t) {
                    $task = ProjectTask::create([
                        'project_id'       => $project->id,
                        'title'            => $t['title'] ?? 'Untitled Task',
                        'description'      => $t['description'] ?? null,
                        'priority'         => $t['priority'] ?? 'medium',
                        'status'           => $t['status'] ?? 'to-do',
                        'assignee_id'      => isset($t['assignee_id']) ? intval($t['assignee_id']) : null,
                        'collaborator_ids' => isset($t['collaborator_ids']) ? array_map('intval', $t['collaborator_ids']) : [],
                        'attachments'      => [],
                        'voice_notes'      => [],
                        'comments'         => [],
                        'created_by'       => Auth::id(),
                    ]);

                    // Task specific attachments upload
                    if ($request->hasFile("task_files_{$i}")) {
                        $attachments = [];
                        foreach ($request->file("task_files_{$i}") as $file) {
                            $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                            $fileSize = $file->getSize(); // Get size first
                            $file->move(public_path('uploads/tasks'), $filename);
                            $attachments[] = [
                                'name' => $file->getClientOriginalName(),
                                'path' => '/uploads/tasks/' . $filename,
                                'size' => $fileSize,
                            ];
                        }
                        $task->update(['attachments' => $attachments]);
                    }

                    // Task specific voice notes upload
                    if ($request->hasFile("task_voices_{$i}")) {
                        $voices = [];
                        foreach ($request->file("task_voices_{$i}") as $file) {
                            $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                            $fileSize = $file->getSize(); // Get size first
                            $file->move(public_path('uploads/voices'), $filename);
                            $voices[] = [
                                'name' => 'voice_note_' . rand(10, 99) . '.wav',
                                'path' => '/uploads/voices/' . $filename,
                                'size' => $fileSize,
                            ];
                        }
                        $task->update(['voice_notes' => $voices]);
                    }
                }
            }

            return $project;
        });

        if ($request->wantsJson()) {
            return response()->json(['project' => $project->load('client', 'team', 'documents', 'tasks')]);
        }

        return redirect()->route('projects.show', ['project' => $project->id, 'setup' => 'true'])
            ->with('success', "Project {$project->title} created successfully.");
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title'                  => 'required|string|max:255',
            'type'                   => 'required|in:client,internal',
            'description'            => 'nullable|string',
            'client_id'              => 'nullable|exists:clients,id',
            'start_date'             => 'nullable|date',
            'deadline'               => 'nullable|date',
            'status'                 => 'nullable|in:draft,running,handover,on-hold,cancelled',
            'completion_percentage'  => 'nullable|integer|min:0|max:100',
            'location'               => 'nullable|string',
            'map_location'           => 'nullable|string',
            'latitude'               => 'nullable|numeric',
            'longitude'              => 'nullable|numeric',
            'budget'                 => 'nullable|numeric',
            'team_ids'               => 'nullable|array',
            'team_ids.*'             => 'exists:users,id',
            'payment_milestones'     => 'nullable|array',
        ]);

        DB::transaction(function () use ($project, $validated) {
            $project->update($validated);

            if (isset($validated['team_ids'])) {
                $project->team()->sync($validated['team_ids']);
            }
        });

        $project->load(['client', 'team', 'documents', 'tasks.assignee']);

        if ($request->wantsJson()) {
            return response()->json(['project' => $project]);
        }

        return back()->with('success', 'Project updated.');
    }

    public function destroy(Project $project)
    {
        $project->delete();
        return redirect()->route('projects.index')->with('success', 'Project deleted.');
    }

    /** Add single document to existing project */
    public function storeDocument(Request $request, Project $project)
    {
        $request->validate([
            'file'        => 'required|file|max:10240', // 10MB limit
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $filename = time() . '_' . rand(100, 999) . '_' . $file->getClientOriginalName();
        $fileSize = $file->getSize(); // Get size first
        $file->move(public_path('uploads/projects'), $filename);

        $doc = ProjectDocument::create([
            'project_id'    => $project->id,
            'document_name' => $request->input('name'),
            'description'   => $request->input('description'),
            'file_path'     => '/uploads/projects/' . $filename,
            'file_type'     => $file->getClientMimeType(),
            'file_size'     => $fileSize,
            'uploaded_by'   => Auth::id(),
        ]);

        return response()->json([
            'success'  => true,
            'document' => $doc,
            'project'  => $project->load(['client', 'team', 'documents', 'tasks.assignee']),
        ]);
    }

    /** Add single task to existing project */
    public function storeTask(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'priority'         => 'required|in:low,medium,high,critical',
            'assignee_id'      => 'nullable|exists:users,id',
            'collaborator_ids' => 'nullable|array',
            'collaborator_ids.*' => 'exists:users,id',
        ]);

        $task = ProjectTask::create([
            'project_id'       => $project->id,
            'title'            => $validated['title'],
            'description'      => $validated['description'] ?? null,
            'priority'         => $validated['priority'],
            'status'           => 'to-do',
            'assignee_id'      => $validated['assignee_id'] ?? null,
            'collaborator_ids' => $validated['collaborator_ids'] ?? [],
            'attachments'      => [],
            'voice_notes'      => [],
            'comments'         => [],
            'created_by'       => Auth::id(),
        ]);

        // Upload task attachment if passed
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . rand(100, 999) . '_' . $file->getClientOriginalName();
            $fileSize = $file->getSize(); // Get size first
            $file->move(public_path('uploads/tasks'), $filename);
            $task->update([
                'attachments' => [[
                    'name' => $file->getClientOriginalName(),
                    'path' => '/uploads/tasks/' . $filename,
                    'size' => $fileSize,
                ]]
            ]);
        }

        // Upload task voice note if passed
        if ($request->hasFile('voice')) {
            $file = $request->file('voice');
            $filename = time() . '_' . rand(100, 999) . '_recorded_voice.wav';
            $fileSize = $file->getSize(); // Get size first
            $file->move(public_path('uploads/voices'), $filename);
            $task->update([
                'voice_notes' => [[
                    'name' => 'voice_note_' . rand(10, 99) . '.wav',
                    'path' => '/uploads/voices/' . $filename,
                    'size' => $fileSize,
                ]]
            ]);
        }

        return response()->json([
            'success' => true,
            'task'    => $task->load('assignee'),
            'project' => $project->load(['client', 'team', 'documents', 'tasks.assignee']),
        ]);
    }

    /** Update task details, status, or add comment */
    public function updateTask(Request $request, ProjectTask $task)
    {
        $validated = $request->validate([
            'status'       => 'nullable|in:to-do,in-progress,done',
            'comment_text' => 'nullable|string',
        ]);

        if ($request->input('status')) {
            $task->update(['status' => $request->input('status')]);
        }

        // Handle comment addition
        if ($request->input('comment_text') || $request->hasFile('comment_file') || $request->hasFile('comment_voice')) {
            $comment = [
                'id'         => uniqid('comment_'),
                'user_name'  => Auth::user()?->name ?: 'System User',
                'user_id'    => Auth::id(),
                'text'       => $request->input('comment_text') ?: '',
                'created_at' => now()->format('d M Y, h:i A'),
                'attachment' => null,
                'voice'      => null,
            ];

            // Handle Comment File Upload
            if ($request->hasFile('comment_file')) {
                $file = $request->file('comment_file');
                $filename = time() . '_' . rand(100, 999) . '_' . $file->getClientOriginalName();
                $size = $file->getSize(); // Get size first
                $file->move(public_path('uploads/comments'), $filename);
                $comment['attachment'] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => '/uploads/comments/' . $filename,
                    'size' => $size,
                ];
            }

            // Handle Comment Voice Note Upload
            if ($request->hasFile('comment_voice')) {
                $file = $request->file('comment_voice');
                $filename = time() . '_' . rand(100, 999) . '_voice.wav';
                $size = $file->getSize(); // Get size first
                $file->move(public_path('uploads/comments'), $filename);
                $comment['voice'] = [
                    'name' => 'voice_note_' . rand(10, 99) . '.wav',
                    'path' => '/uploads/comments/' . $filename,
                    'size' => $size,
                ];
            }

            // Append to comments array
            $comments = $task->comments ?: [];
            $comments[] = $comment;
            $task->update(['comments' => $comments]);
        }

        // Return updated project and task
        $project = $task->project->load(['client', 'team', 'documents', 'tasks.assignee']);
        return response()->json([
            'success' => true,
            'task'    => $task->load('assignee'),
            'project' => $project,
        ]);
    }

    /** Get team members list for wizard step 3 */
    public function teamMembers()
    {
        $members = User::select('id', 'name', 'role', 'phone', 'photo_path', 'designation', 'salary', 'joining_date', 'department')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn($u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'role'        => $u->role,
                'phone'       => $u->phone,
                'photo_path'  => $u->photo_path ? asset('storage/' . $u->photo_path) : null,
                'designation' => $u->designation ?: $u->role,
                'salary'      => $u->salary,
                'joining_date'=> $u->joining_date ? (is_string($u->joining_date) ? substr($u->joining_date, 0, 10) : $u->joining_date->format('Y-m-d')) : null,
                'department'  => $u->department ?: 'Engineering',
                'avatar'      => strtoupper(substr($u->name ?? '', 0, 2)),
            ]);

        return response()->json($members);
    }

    /** Submit a delete request with backup copy and auditing explanation */
    public function requestDelete(Request $request)
    {
        $request->validate([
            'item_type' => 'required|in:project,task,document',
            'item_id'   => 'required|integer',
            'reason'    => 'required|string|max:1000',
        ]);

        $type = $request->input('item_type');
        $id = $request->input('item_id');
        $reason = $request->input('reason');
        
        $item = null;
        $name = '';

        if ($type === 'project') {
            $item = Project::find($id);
            $name = $item?->title ?: "Project #{$id}";
        } elseif ($type === 'task') {
            $item = ProjectTask::find($id);
            $name = $item?->title ?: "Task #{$id}";
        } elseif ($type === 'document') {
            $item = ProjectDocument::find($id);
            $name = $item?->document_name ?: "Document #{$id}";
        }

        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found.'], 404);
        }

        // Create the delete request with backup snapshot copy!
        \App\Models\DeleteRequest::create([
            'requested_by' => Auth::id(),
            'item_type'    => $type,
            'item_id'      => $id,
            'item_name'    => $name,
            'reason'       => $reason,
            'backup_data'  => $item->toArray(), // Deep backup copy
            'status'       => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your delete request has been submitted and recorded successfully. An admin will review it shortly.',
        ]);
    }

    // ── Dynamic Team Member Management ─────────────────────────────────────────

    public function addTeamMember(Request $request, Project $project)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $project->team()->syncWithoutDetaching([$request->user_id]);

        $u = User::find($request->user_id);
        $member = [
            'id'          => $u->id,
            'name'        => $u->name,
            'email'       => $u->email,
            'role'        => $u->role,
            'phone'       => $u->phone,
            'photo_path'  => $u->photo_path ? asset('storage/' . $u->photo_path) : null,
            'designation' => $u->designation ?: $u->role,
            'salary'      => $u->salary,
            'joining_date'=> $u->joining_date ? (is_string($u->joining_date) ? substr($u->joining_date, 0, 10) : $u->joining_date->format('Y-m-d')) : null,
            'department'  => $u->department ?: 'Engineering',
            'avatar'      => strtoupper(substr($u->name ?? '', 0, 2)),
        ];

        return response()->json(['success' => true, 'member' => $member]);
    }

    public function removeTeamMember(Project $project, User $user)
    {
        $project->team()->detach($user->id);

        return response()->json(['success' => true]);
    }

    public function createTeamMember(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name'         => 'required|string|max:255',
            'phone'        => 'nullable|string|max:30',
            'photo'        => 'nullable|image|max:2048', // 2MB Max
            'designation'  => 'nullable|string|max:255',
            'salary'       => 'nullable|numeric|min:0',
            'joining_date' => 'nullable|date',
            'department'   => 'nullable|string|max:255',
            'email'        => 'required|email|max:255|unique:users,email',
            'password'     => 'required|string|min:6',
            'role'         => 'required|string|max:255',
            'send_email'   => 'nullable|boolean',
            'project_id'   => 'nullable|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        // Process photo upload
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('profile-photos', 'public');
        }

        // Create new user
        $user = User::create([
            'name'         => $validated['name'],
            'email'        => $validated['email'],
            'password'     => bcrypt($validated['password']),
            'phone'        => $validated['phone'] ?? null,
            'photo_path'   => $photoPath,
            'role'         => $validated['role'],
            'designation'  => $validated['designation'] ?? null,
            'salary'       => $validated['salary'] ?? null,
            'joining_date' => $validated['joining_date'] ?? null,
            'department'   => $validated['department'] ?? null,
            'is_active'    => true,
        ]);

        // If project_id is provided, associate this member with the project team
        if (!empty($validated['project_id'])) {
            $project = Project::find($validated['project_id']);
            if ($project) {
                $project->team()->syncWithoutDetaching([$user->id]);
            }
        }

        // Send password through email if checked
        if ($request->boolean('send_email')) {
            try {
                $name = $user->name;
                $email = $user->email;
                $password = $request->input('password');
                $role = $user->role;
                $designation = $user->designation ?? $user->role;

                \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($name, $email, $password, $role, $designation) {
                    $html = "
                    <div style='font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;'>
                        <div style='text-align: center; margin-bottom: 24px;'>
                            <h2 style='color: #d97706; margin: 0; font-size: 24px; font-weight: 800;'>JAGYA CONSTRUCTION</h2>
                            <p style='color: #64748b; font-size: 14px; margin-top: 4px;'>Management Portal Access</p>
                        </div>
                        <div style='background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); padding: 20px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #fde68a;'>
                            <h3 style='margin: 0 0 8px 0; color: #78350f; font-size: 16px;'>Welcome to the Team, {$name}!</h3>
                            <p style='margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;'>
                                Your staff account has been created successfully. Below are your credentials to log in and access your projects.
                            </p>
                        </div>
                        <table style='width: 100%; border-collapse: collapse; margin-bottom: 24px;'>
                            <tr>
                                <td style='padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;'>Email Address</td>
                                <td style='padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;'>{$email}</td>
                            </tr>
                            <tr>
                                <td style='padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;'>Password</td>
                                <td style='padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #b45309; font-size: 13px; font-weight: 700; font-family: monospace; text-align: right;'>{$password}</td>
                            </tr>
                            <tr>
                                <td style='padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;'>Portal Role</td>
                                <td style='padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;'>{$role}</td>
                            </tr>
                            <tr>
                                <td style='padding: 10px 0; color: #64748b; font-size: 13px;'>Designation</td>
                                <td style='padding: 10px 0; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;'>{$designation}</td>
                            </tr>
                        </table>
                        <div style='text-align: center; margin-bottom: 24px;'>
                            <a href='" . url('/login') . "' style='display: inline-block; padding: 12px 28px; background-color: #d97706; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;'>Log In to Portal</a>
                        </div>
                        <div style='border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;'>
                            <p style='margin: 0; color: #94a3b8; font-size: 11px;'>This is an automated system email. Please keep your login credentials secure.</p>
                            <p style='margin: 4px 0 0 0; color: #94a3b8; font-size: 11px;'>&copy; " . date('Y') . " Jagya Construction. All rights reserved.</p>
                        </div>
                    </div>";

                    $message->to($email)
                        ->subject('Welcome to Jagya Construction — Your Account Details')
                        ->html($html);
                });
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send welcome email: ' . $e->getMessage());
            }
        }

        // Prepare return payload
        $member = [
            'id'          => $user->id,
            'name'        => $user->name,
            'role'        => $user->role,
            'phone'       => $user->phone,
            'photo_path'  => $user->photo_path ? asset('storage/' . $user->photo_path) : null,
            'designation' => $user->designation ?: $user->role,
            'salary'      => $user->salary,
            'joining_date'=> $user->joining_date ? (is_string($user->joining_date) ? substr($user->joining_date, 0, 10) : $user->joining_date->format('Y-m-d')) : null,
            'department'  => $user->department ?: 'Engineering',
            'avatar'      => strtoupper(substr($user->name ?? '', 0, 2)),
        ];

        return response()->json([
            'success' => true,
            'message' => 'New team member created successfully.',
            'member'  => $member,
        ]);
    }

    /** Save or modify project onboarding setup details */
    public function setupProject(Request $request, Project $project)
    {
        // 1. Process agreements
        if ($request->has('agreements_count')) {
            $count = (int)$request->input('agreements_count');
            for ($i = 0; $i < $count; $i++) {
                $type = $request->input("agreement_type_{$i}");
                $note = $request->input("agreement_note_{$i}");
                
                if ($request->hasFile("agreement_files_{$i}")) {
                    foreach ($request->file("agreement_files_{$i}") as $file) {
                        $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                        $fileSize = $file->getSize();
                        $file->move(public_path('uploads/projects'), $filename);
                        
                        $project->documents()->create([
                            'document_name' => $type ?: 'Civil Work Order',
                            'description'   => $note,
                            'category'      => 'agreement',
                            'file_path'     => '/uploads/projects/' . $filename,
                            'file_type'     => $file->getClientMimeType(),
                            'file_size'     => $fileSize,
                            'uploaded_by'   => auth()->id(),
                        ]);
                    }
                } else if ($type || $note) {
                    $project->documents()->create([
                        'document_name' => $type ?: 'Civil Work Order',
                        'description'   => $note,
                        'category'      => 'agreement',
                        'file_path'     => null,
                        'file_type'     => null,
                        'file_size'     => null,
                        'uploaded_by'   => auth()->id(),
                    ]);
                }
            }
        }

        // 2. Process KYCs
        if ($request->has('kycs_count')) {
            $count = (int)$request->input('kycs_count');
            for ($i = 0; $i < $count; $i++) {
                $type = $request->input("kyc_type_{$i}");
                $name = $request->input("kyc_name_{$i}");
                $phone = $request->input("kyc_phone_{$i}");
                $address = $request->input("kyc_address_{$i}");
                $note = $request->input("kyc_note_{$i}");

                $desc = "KYC Details:\nName: {$name}\nPhone: {$phone}\nAddress: {$address}\nNote: {$note}";

                $hasPhoto = $request->hasFile("kyc_photo_{$i}");
                $hasDocs = $request->hasFile("kyc_docs_{$i}");

                // Photo file upload
                if ($hasPhoto) {
                    $file = $request->file("kyc_photo_{$i}");
                    $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                    $fileSize = $file->getSize();
                    $file->move(public_path('uploads/projects/kyc'), $filename);

                    $project->documents()->create([
                        'document_name' => "KYC Photo - {$name} ({$type})",
                        'description'   => $desc,
                        'category'      => 'kyc',
                        'file_path'     => '/uploads/projects/kyc/' . $filename,
                        'file_type'     => $file->getClientMimeType(),
                        'file_size'     => $fileSize,
                        'uploaded_by'   => auth()->id(),
                    ]);
                }

                // Documents files upload
                if ($hasDocs) {
                    foreach ($request->file("kyc_docs_{$i}") as $file) {
                        $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                        $fileSize = $file->getSize();
                        $file->move(public_path('uploads/projects/kyc'), $filename);

                        $project->documents()->create([
                            'document_name' => "KYC Doc - {$name} ({$type}) - " . $file->getClientOriginalName(),
                            'description'   => $desc,
                            'category'      => 'kyc',
                            'file_path'     => '/uploads/projects/kyc/' . $filename,
                            'file_type'     => $file->getClientMimeType(),
                            'file_size'     => $fileSize,
                            'uploaded_by'   => auth()->id(),
                        ]);
                    }
                }

                // If no files uploaded, still save the text info
                if (!$hasPhoto && !$hasDocs && ($name || $phone || $address || $note)) {
                    $project->documents()->create([
                        'document_name' => "KYC Details - {$name} ({$type})",
                        'description'   => $desc,
                        'category'      => 'kyc',
                        'file_path'     => null,
                        'file_type'     => null,
                        'file_size'     => null,
                        'uploaded_by'   => auth()->id(),
                    ]);
                }
            }
        }

        // 3. Process First Payment
        if ($request->input('payment_amount')) {
            $amount = $request->input('payment_amount');
            $date = $request->input('payment_date');
            $note = $request->input('payment_note');

            $proofs = [];
            if ($request->hasFile('payment_proof')) {
                $file = $request->file('payment_proof');
                $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/payments/proofs'), $filename);
                $proofs[] = '/uploads/payments/proofs/' . $filename;
            }

            \App\Models\ProjectPayment::create([
                'project_id' => $project->id,
                'payment_type' => 'client_installment',
                'amount' => $amount,
                'payment_date' => $date ?: now(),
                'description' => $note ?: 'First Installment / Setup Payment',
                'payment_proofs' => $proofs,
                'created_by' => auth()->id(),
            ]);
        }

        // 4. Process Site Engineers / Team Assignment
        if ($request->has('team_assignments')) {
            $assignments = json_decode($request->input('team_assignments'), true);
            if (is_array($assignments)) {
                // Sync roles or add new team members with their roles
                foreach ($assignments as $memberId => $info) {
                    $roleName = ($info['role'] === 'Other' && !empty($info['customRole'])) ? $info['customRole'] : $info['role'];
                    
                    // Attach or update pivot
                    $project->team()->syncWithoutDetaching([
                        $memberId => ['role' => $roleName]
                    ]);
                }
            }
        }

        // Process Payment Milestones & Budget
        if ($request->has('budget')) {
            $project->update(['budget' => $request->input('budget')]);
        }

        if ($request->has('payment_milestones')) {
            $milestones = json_decode($request->input('payment_milestones'), true);
            if (is_array($milestones)) {
                $project->update(['payment_milestones' => $milestones]);
            }
        }

        // Process Work Information
        $workData = [];
        foreach ([
            'work_type', 'rcc_foundation', 'rcc_finishing', 'rcc_class',
            'plinth_area', 'slab_area', 'remarks', 'other_info',
            'road_size', 'road_direction'
        ] as $field) {
            if ($request->has($field)) {
                $workData[$field] = $request->input($field);
            }
        }
        
        if ($request->has('head_room')) {
            $workData['head_room'] = $request->boolean('head_room');
        }

        if ($request->has('assam_type_details')) {
            $workData['assam_type_details'] = json_decode($request->input('assam_type_details'), true);
        }

        if (!empty($workData)) {
            $project->update($workData);
        }

        // 4.5. Process onboarding custom attachments/files
        if ($request->hasFile('setup_files')) {
            foreach ($request->file('setup_files') as $file) {
                $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                $fileSize = $file->getSize();
                $file->move(public_path('uploads/projects'), $filename);
                
                $project->documents()->create([
                    'document_name' => $file->getClientOriginalName(),
                    'description'   => 'Uploaded during onboarding setup',
                    'category'      => 'supporting_files',
                    'file_path'     => '/uploads/projects/' . $filename,
                    'file_type'     => $file->getClientMimeType(),
                    'file_size'     => $fileSize,
                    'uploaded_by'   => auth()->id(),
                ]);
            }
        }

        // Process onboarding custom voice notes
        if ($request->hasFile('setup_voices')) {
            foreach ($request->file('setup_voices') as $file) {
                $filename = \Illuminate\Support\Str::random(16) . '.' . $file->getClientOriginalExtension();
                $fileSize = $file->getSize();
                $file->move(public_path('uploads/voices'), $filename);
                
                $project->documents()->create([
                    'document_name' => 'Voice Note - ' . date('Y-m-d H:i:s'),
                    'description'   => 'Voice recorded during onboarding setup',
                    'category'      => 'voice_note',
                    'file_path'     => '/uploads/voices/' . $filename,
                    'file_type'     => $file->getClientMimeType(),
                    'file_size'     => $fileSize,
                    'uploaded_by'   => auth()->id(),
                ]);
            }
        }

        // 5. Update Project Status (since it is setup, move from draft to running)
        if ($project->status === 'draft') {
            $project->update(['status' => 'running']);
        }

        $project->activities()->create([
            'user_id' => auth()->id(),
            'action' => 'updated',
            'description' => 'Project onboarding setup details were set up/modified successfully.',
            'changes' => []
        ]);

        return response()->json([
            'success' => true,
            'project' => $project->load(['client', 'team', 'documents', 'tasks.assignee', 'payments']),
        ]);
    }
}
