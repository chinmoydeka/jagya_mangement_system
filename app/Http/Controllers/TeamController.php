<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function index()
    {
        $members = User::withCount('projects')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn($u) => [
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
                'office'      => $u->office,
                'gender'      => $u->gender,
                'qualification'=> $u->qualification,
                'experience_years'=> $u->experience_years,
                'address'     => $u->address,
                'emergency_contact_name' => $u->emergency_contact_name,
                'emergency_contact_phone' => $u->emergency_contact_phone,
                'projects'    => $u->projects_count,
                'avatar'      => strtoupper(substr($u->name ?? '', 0, 2)),
                'status'      => 'active',
            ]);

        $pending = User::withCount('projects')
            ->where('is_active', false)
            ->orderBy('name')
            ->get()
            ->map(fn($u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'email'       => $u->email,
                'role'        => $u->role,
                'phone'       => $u->phone,
                'photo_path'  => $u->photo_path ? asset('storage/' . $u->photo_path) : null,
                'designation' => $u->designation,
                'salary'      => $u->salary,
                'joining_date'=> $u->joining_date ? (is_string($u->joining_date) ? substr($u->joining_date, 0, 10) : $u->joining_date->format('Y-m-d')) : null,
                'department'  => $u->department,
                'office'      => $u->office,
                'gender'      => $u->gender,
                'qualification'=> $u->qualification,
                'experience_years'=> $u->experience_years,
                'address'     => $u->address,
                'emergency_contact_name' => $u->emergency_contact_name,
                'emergency_contact_phone' => $u->emergency_contact_phone,
                'projects'    => $u->projects_count,
                'avatar'      => strtoupper(substr($u->name ?? '', 0, 2)),
                'status'      => 'pending',
            ]);

        $departments = \App\Models\Department::orderBy('name')->get()->map(fn($d) => [
            'id' => $d->id,
            'name' => $d->name
        ]);

        $designations = \App\Models\Designation::orderBy('name')->get()->map(fn($d) => [
            'id' => $d->id,
            'name' => $d->name
        ]);

        $offices = \App\Models\Office::orderBy('name')->get()->map(fn($o) => [
            'id' => $o->id,
            'name' => $o->name
        ]);

        return Inertia::render('Team', [
            'members' => $members,
            'pendingMembers' => $pending,
            'departments' => $departments,
            'designations' => $designations,
            'offices' => $offices,
        ]);
    }

    public function store(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name'         => 'required|string|max:255',
            'phone'        => 'nullable|string|max:30',
            'photo'        => 'nullable|image|max:2048', // 2MB Max
            'designation'  => 'nullable|string|max:255',
            'salary'       => 'nullable|numeric|min:0',
            'joining_date' => 'nullable|date',
            'department'   => 'nullable|string|max:255',
            'office'       => 'nullable|string|max:255',
            'email'        => 'required|email|max:255|unique:users,email',
            'password'     => 'required|string|min:6',
            'role'         => 'required|string|max:255',
            'send_email'   => 'nullable',
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
            'office'       => $validated['office'] ?? null,
            'is_active'    => true,
        ]);

        // Send welcome email if selected
        if ($request->boolean('send_email') || $request->input('send_email') === '1') {
            try {
                $name = $user->name;
                $email = $user->email;
                $password = $request->input('password');
                $role = $user->role;
                $designation = $user->designation ?? $user->role;

                Mail::send([], [], function ($message) use ($name, $email, $password, $role, $designation) {
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
                        </div>
                    </div>";

                    $message->to($email)
                            ->subject('🔑 Welcome to Jagya Construction - Your Credentials')
                            ->html($html);
                });
            } catch (\Exception $e) {
                // Keep creating user even if mail fails, but log it
                logger('Welcome mail failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Team member added successfully!',
            'member'  => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'role'        => $user->role,
                'phone'       => $user->phone,
                'photo_path'  => $user->photo_path ? asset('storage/' . $user->photo_path) : null,
                'designation' => $user->designation ?: $user->role,
                'salary'      => $user->salary,
                'joining_date'=> $user->joining_date ? (is_string($user->joining_date) ? substr($user->joining_date, 0, 10) : $user->joining_date->format('Y-m-d')) : null,
                'department'  => $user->department ?: 'Engineering',
                'projects'    => 0,
                'avatar'      => strtoupper(substr($user->name ?? '', 0, 2)),
                'status'      => 'active',
            ]
        ]);
    }

    public function register(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name'                     => 'required|string|max:255',
            'phone'                    => 'nullable|string|max:30',
            'photo'                    => 'nullable|image|max:2048', // 2MB Max
            'department'               => 'nullable|string|max:255',
            'designation'              => 'nullable|string|max:255',
            'joining_date'             => 'nullable|date',
            'office'                   => 'nullable|string|max:255',
            'gender'                   => 'nullable|string|max:30',
            'address'                  => 'nullable|string',
            'emergency_contact_name'   => 'nullable|string|max:255',
            'emergency_contact_phone'  => 'nullable|string|max:30',
            'email'                    => 'required|email|max:255|unique:users,email',
            'password'                 => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('profile-photos', 'public');
        }

        User::create([
            'name'                     => $validated['name'],
            'email'                    => $validated['email'],
            'password'                 => bcrypt($validated['password']),
            'phone'                    => $validated['phone'] ?? null,
            'photo_path'               => $photoPath,
            'role'                     => 'Staff',
            'department'               => $validated['department'] ?? null,
            'designation'              => $validated['designation'] ?? null,
            'joining_date'             => $validated['joining_date'] ?? null,
            'office'                   => $validated['office'] ?? null,
            'gender'                   => $validated['gender'] ?? null,
            'address'                  => $validated['address'] ?? null,
            'emergency_contact_name'   => $validated['emergency_contact_name'] ?? null,
            'emergency_contact_phone'  => $validated['emergency_contact_phone'] ?? null,
            'is_active'                => false, // Pending Approval
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your registration request has been submitted successfully and is pending admin approval!'
        ]);
    }

    public function approve(Request $request, User $user)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'designation'  => 'nullable|string|max:255',
            'salary'       => 'nullable|numeric|min:0',
            'joining_date' => 'nullable|date',
            'department'   => 'nullable|string|max:255',
            'office'       => 'nullable|string|max:255',
            'role'         => 'required|string|max:255',
            'password'     => 'nullable|string|min:6',
            'send_email'   => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        $updateData = [
            'designation'  => $validated['designation'] ?? $user->designation,
            'salary'       => $validated['salary'] ?? $user->salary,
            'joining_date' => $validated['joining_date'] ?? $user->joining_date,
            'department'   => $validated['department'] ?? $user->department,
            'office'       => $validated['office'] ?? $user->office,
            'role'         => $validated['role'],
            'is_active'    => true, // Activate user
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = bcrypt($validated['password']);
        }

        $user->update($updateData);

        // Send welcome email if selected
        if ($request->boolean('send_email') || $request->input('send_email') === '1') {
            try {
                $name = $user->name;
                $email = $user->email;
                $password = $validated['password'] ?? '[Password you registered with]';
                $role = $user->role;
                $designation = $user->designation ?? $user->role;

                Mail::send([], [], function ($message) use ($name, $email, $password, $role, $designation) {
                    $html = "
                    <div style='font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;'>
                        <div style='text-align: center; margin-bottom: 24px;'>
                            <h2 style='color: #d97706; margin: 0; font-size: 24px; font-weight: 800;'>JAGYA CONSTRUCTION</h2>
                            <p style='color: #64748b; font-size: 14px; margin-top: 4px;'>Management Portal Access</p>
                        </div>
                        <div style='background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); padding: 20px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #fde68a;'>
                            <h3 style='margin: 0 0 8px 0; color: #78350f; font-size: 16px;'>Welcome to the Team, {$name}!</h3>
                            <p style='margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;'>
                                Your staff account has been approved and activated. Below are your details to log in and access your projects.
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
                        </div>
                    </div>";

                    $message->to($email)
                            ->subject('🔑 Welcome to Jagya Construction - Account Approved')
                            ->html($html);
                });
            } catch (\Exception $e) {
                logger('Welcome mail failed during approval: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Team member approved and activated successfully!'
        ]);
    }

    public function destroy(User $user)
    {
        if (auth()->id() === $user->id) {
            return response()->json(['success' => false, 'message' => 'You cannot delete yourself.'], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Team member record deleted successfully.'
        ]);
    }

    public function storeDepartment(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name',
        ]);

        $dept = \App\Models\Department::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully!',
            'department' => $dept
        ]);
    }

    public function destroyDepartment(\App\Models\Department $department)
    {
        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully!'
        ]);
    }

    public function storeDesignation(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:designations,name',
        ]);

        $desig = \App\Models\Designation::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Designation created successfully!',
            'designation' => $desig
        ]);
    }

    public function storeOffice(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:offices,name',
        ]);

        $office = \App\Models\Office::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Office created successfully!',
            'office' => $office
        ]);
    }

    public function destroyOffice(\App\Models\Office $office)
    {
        $office->delete();

        return response()->json([
            'success' => true,
            'message' => 'Office deleted successfully!'
        ]);
    }
}
