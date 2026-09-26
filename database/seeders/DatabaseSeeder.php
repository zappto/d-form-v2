<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            RecruitmentDivisionSeeder::class,
            EventSeeder::class,
            FormSeeder::class,
            OprecFormSeeder::class,
            UserSeeder::class,
        ]);

        // Dev/local only: periode oprec dummy agar /recruitment langsung bisa submit,
        // + data scan test. Prod TIDAK memakai seeder ini — cukup migrate
        // + RecruitmentDivisionSeeder + OprecFormSeeder, lalu period dibuat manual
        // via /admin/recruitment (RecruitmentPeriodService::create otomatis
        // membuat registration sequence).
        if (app()->environment(['local', 'development', 'testing'])) {
            $this->call([
                RecruitmentPeriodSeeder::class,
                ScanTestSeeder::class,
            ]);
        }
    }
}
