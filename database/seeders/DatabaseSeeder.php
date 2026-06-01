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
    }
}
