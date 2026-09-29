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
        // UserSeeder sengaja tidak di-commit (file lokal/dev). Lewati bila
        // kelasnya tidak ada agar db:seed pada build fresh tidak abort.
        $seeders = [
            RoleSeeder::class,
            RecruitmentDivisionSeeder::class,
            EventSeeder::class,
            FormSeeder::class,
            OprecFormSeeder::class,
        ];

        if (class_exists(UserSeeder::class)) {
            $seeders[] = UserSeeder::class;
        }

        $this->call($seeders);

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
