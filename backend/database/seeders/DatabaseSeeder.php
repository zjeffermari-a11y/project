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
        User::create([
            'name' => 'System Director',
            'email' => 'director@dilg.gov.ph',
            'password' => Hash::make('password'),
            'role' => 'auditor',
            'designation' => 'director',
            'approval_status' => 'approved',
            'agency_name' => 'DILG Central',
        ]);

        User::create([
            'name' => 'Division Chief',
            'email' => 'chief@dilg.gov.ph',
            'password' => Hash::make('password'),
            'role' => 'auditor',
            'designation' => 'division_chief',
            'approval_status' => 'approved',
            'agency_name' => 'DILG Central',
        ]);

        User::create([
            'name' => 'Lead Auditor',
            'email' => 'admin@dilg.gov.ph',
            'password' => Hash::make('password'),
            'role' => 'auditor',
            'designation' => 'lead_auditor',
            'approval_status' => 'approved',
            'agency_name' => 'DILG Central',
        ]);

        User::create([
            'name' => 'BFP Admin',
            'email' => 'admin@bfp.gov.ph',
            'password' => Hash::make('password'),
            'role' => 'auditee',
            'designation' => 'auditee',
            'approval_status' => 'approved',
            'agency_name' => 'Bureau of Fire Protection',
        ]);

        User::create([
            'name' => 'LGA Admin',
            'email' => 'admin@lga.gov.ph',
            'password' => Hash::make('password'),
            'role' => 'auditee',
            'designation' => 'auditee',
            'approval_status' => 'approved',
            'agency_name' => 'Local Government Academy',
        ]);
    }
}
