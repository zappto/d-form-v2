<?php

namespace Database\Seeders;

use App\Enums\EventSession;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventSessionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (EventSession::cases() as $index => $session) {
            $existing = DB::table('event_sessions')->where('slug', $session->value)->first();
            if ($existing) {
                DB::table('event_sessions')->where('slug', $session->value)->update([
                    'name' => $session->getLabel(),
                    'sort_order' => $index,
                    'updated_at' => now(),
                ]);

                continue;
            }

            DB::table('event_sessions')->insert([
                'id' => (string) Str::uuid(),
                'slug' => $session->value,
                'name' => $session->getLabel(),
                'sort_order' => $index,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
