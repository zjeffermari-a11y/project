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
            'name' => 'Lyra Zel Bedayo',
            'email' => 'lzbedayo@gmail.com',
            'password' => Hash::make('bedayo'),
            'role' => 'auditor',
            'designation' => 'director',
            'approval_status' => 'approved',
            'agency_name' => 'DILG Central',
        ]);

        User::create([
            'name' => 'Beyonce De Chavez',
            'email' => 'btdechavez@gmail.com',
            'password' => Hash::make('Luke24:15'),
            'role' => 'auditor',
            'designation' => 'division_chief',
            'approval_status' => 'approved',
            'agency_name' => 'DILG Central',
        ]);
        
        User::create([
            'name' => 'Jean Antonette Tablizo',
            'email' => 'jatablizo@gmail.com',
            'password' => Hash::make('jeanantonette0601'),
            'role' => 'auditor',
            'designation' => 'assistant_division_chief',
            'approval_status' => 'approved',
            'agency_name' => 'DILG Central',
        ]);

        User::create([
            'name' => 'Jeffer Mari Zepeda',
            'email' => 'zjeffermari@gmail.com',
            'password' => Hash::make('Z3ped@040500'),
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
