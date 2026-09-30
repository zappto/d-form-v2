<?php

namespace Tests\Feature\Broadcasting;

use App\Enums\EmailBroadcastStatus;
use App\Jobs\Broadcasting\SendBroadcastRecipientJob;
use App\Models\EmailBroadcast;
use App\Models\User;
use App\Services\Broadcasting\BroadcastDispatchService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BroadcastDispatchIndexTest extends TestCase
{
    use RefreshDatabase;

    /** Nama index komposit dispatch; DIKUNCI identik dengan migrasi. */
    private const COMPOSITE_INDEX = 'email_broadcasts_status_scheduled_at_idx';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /** Buat super-admin untuk melewati gate email-broadcast.*. */
    private function superAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('super-admin');

        return $admin;
    }

    /** Buat broadcast scheduled yang sudah lewat waktunya (jatuh tempo). */
    private function dueScheduledBroadcast(User $owner): EmailBroadcast
    {
        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Due Broadcast',
            'scheduled_at' => now()->subHour(),
            'delay_min' => 0,
            'delay_max' => 0,
            'subject' => 'Halo {{name}}',
            'content' => '<p>Halo {{name}}</p>',
            'status' => EmailBroadcastStatus::Scheduled,
            'created_by' => $owner->id,
        ]);
        $broadcast->recipients()->create([
            'name' => 'Nafan',
            'email' => 'nafan@gmail.com',
            'status' => 'pending',
        ]);

        return $broadcast;
    }

    /** Buat broadcast scheduled yang waktunya masih di masa depan. */
    private function futureScheduledBroadcast(User $owner): EmailBroadcast
    {
        return EmailBroadcast::query()->create([
            'name' => 'Future Broadcast',
            'scheduled_at' => now()->addDay(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Scheduled,
            'created_by' => $owner->id,
        ]);
    }

    /** Buat broadcast yang sudah selesai (bukan kandidat dispatch). */
    private function completedBroadcast(User $owner): EmailBroadcast
    {
        return EmailBroadcast::query()->create([
            'name' => 'Completed Broadcast',
            'scheduled_at' => now()->subDay(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Completed,
            'created_by' => $owner->id,
        ]);
    }

    /**
     * Ambil daftar kolom sebuah index; pakai Schema API bila ada, fallback PRAGMA sqlite.
     *
     * @return list<string>
     */
    private function indexColumns(string $table, string $index): array
    {
        if (method_exists(Schema::class, 'getIndexes')) {
            foreach (Schema::getIndexes($table) as $entry) {
                if (($entry['name'] ?? null) === $index) {
                    return array_values($entry['columns'] ?? []);
                }
            }

            $this->fail("Index {$index} tidak ditemukan pada tabel {$table}.");

            return [];
        }

        $quoted = '"'.str_replace('"', '""', $index).'"';
        $rows = DB::select("PRAGMA index_info({$quoted})");
        $byOrder = [];

        foreach ($rows as $row) {
            $byOrder[(int) $row->seqno] = (string) $row->name;
        }

        ksort($byOrder);

        return array_values($byOrder);
    }

    /** Index komposit (status, scheduled_at) tersedia untuk query dispatchDue. */
    public function test_composite_status_scheduled_at_index_exists(): void
    {
        $this->assertSame(
            ['status', 'scheduled_at'],
            $this->indexColumns('email_broadcasts', self::COMPOSITE_INDEX)
        );
    }

    /** dispatchDue hanya memproses broadcast scheduled yang waktunya tiba. */
    public function test_dispatch_due_returns_only_due_broadcast(): void
    {
        Bus::fake();
        $admin = $this->superAdmin();
        $due = $this->dueScheduledBroadcast($admin);
        $future = $this->futureScheduledBroadcast($admin);
        $completed = $this->completedBroadcast($admin);

        $processed = app(BroadcastDispatchService::class)->dispatchDue();

        $this->assertSame([$due->id], array_values($processed));
        Bus::assertDispatched(SendBroadcastRecipientJob::class, 1);
        $this->assertSame(EmailBroadcastStatus::Scheduled, $future->refresh()->status);
        $this->assertSame(EmailBroadcastStatus::Completed, $completed->refresh()->status);
    }
}
