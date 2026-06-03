<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default admin users
        $admins = [
            [
                'name'     => 'Jagya Admin',
                'email'    => 'admin@jagya.com',
                'password' => Hash::make('password'),
                'role'     => 'Super Admin',
            ],
            [
                'name'     => 'Bikash Kalita',
                'email'    => 'manager@jagya.com',
                'password' => Hash::make('password'),
                'role'     => 'Project Manager',
            ],
        ];

        foreach ($admins as $admin) {
            User::updateOrCreate(['email' => $admin['email']], $admin);
        }

        // Seed departments
        $departments = ['Engineering', 'Architecture', 'Finance', 'HR', 'Front Office', 'IT', 'Marketing'];
        foreach ($departments as $dept) {
            \App\Models\Department::firstOrCreate(['name' => $dept]);
        }

        // Seed designations
        $designations = ['Site Supervisor', 'Junior Architect', 'Senior Engineer', 'Project Manager', 'Accountant', 'Staff'];
        foreach ($designations as $desig) {
            \App\Models\Designation::firstOrCreate(['name' => $desig]);
        }

        // Seed offices
        $offices = ['Guwahati Head Office', 'Dispur Branch', 'Dibrugarh Branch', 'Jorhat Branch'];
        foreach ($offices as $office) {
            \App\Models\Office::firstOrCreate(['name' => $office]);
        }
    }
}
