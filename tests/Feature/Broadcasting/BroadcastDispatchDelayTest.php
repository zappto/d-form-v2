<?php

namespace Tests\Feature\Broadcasting;

use App\Enums\EmailBroadcastRecipientStatus;
use App\Enums\EmailBroadcastStatus;
use App\Jobs\Broadcasting\SendBroadcastRecipientJob;
use App\Models\EmailBroadcast;
use App\Models\User;
use App\Services\Broadcasting\BroadcastDispatchService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class BroadcastDispatchDelayTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function superAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('super-admin');

        return $user;
    }

    public function test_dispatch_zero_delay_pushes_jobs_to_locked_queue(): void
    {
        Queue::fake();
        $admin = $this->superAdmin();

        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Dispatch Zero Delay',
            'scheduled_at' => now()->subMinutes(5),
            'delay_min' => 0,
            'delay_max' => 0,
            'subject' => 'Halo {{name}}',
            'content' => '<p>Halo {{name}}</p>',
            'status' => EmailBroadcastStatus::Scheduled,
            'created_by' => $admin->id,
        ]);

        $broadcast->recipients()->create([
            'name' => 'Andi',
            'email' => 'andi@example.com',
            'status' => EmailBroadcastRecipientStatus::Pending,
        ]);

        app(BroadcastDispatchService::class)->dispatch($broadcast);

        $this->assertSame('broadcasts', BroadcastDispatchService::QUEUE);
        Queue::assertPushed(SendBroadcastRecipientJob::class, 1);
        Queue::assertPushed(
            SendBroadcastRecipientJob::class,
            fn (SendBroadcastRecipientJob $job): bool => $job->queue === BroadcastDispatchService::QUEUE
        );
    }

    public function test_dispatch_ranged_delay_pushes_all_pending_jobs_to_locked_queue(): void
    {
        Queue::fake();
        $admin = $this->superAdmin();

        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Dispatch Ranged Delay',
            'scheduled_at' => now()->subMinutes(5),
            'delay_min' => 5,
            'delay_max' => 15,
            'subject' => 'Halo {{name}}',
            'content' => '<p>Halo {{name}}</p>',
            'status' => EmailBroadcastStatus::Scheduled,
            'created_by' => $admin->id,
        ]);

        $broadcast->recipients()->create([
            'name' => 'Andi',
            'email' => 'andi@example.com',
            'status' => EmailBroadcastRecipientStatus::Pending,
        ]);
        $broadcast->recipients()->create([
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'status' => EmailBroadcastRecipientStatus::Pending,
        ]);

        app(BroadcastDispatchService::class)->dispatch($broadcast);

        Queue::assertPushed(SendBroadcastRecipientJob::class, 2);
        Queue::assertPushed(
            SendBroadcastRecipientJob::class,
            fn (SendBroadcastRecipientJob $job): bool => $job->queue === BroadcastDispatchService::QUEUE
        );
    }

    public function test_retry_failed_pushes_jobs_to_locked_queue(): void
    {
        Queue::fake();
        $admin = $this->superAdmin();

        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Retry Queue Lock',
            'scheduled_at' => now()->subHour(),
            'delay_min' => 5,
            'delay_max' => 15,
            'subject' => 'Halo {{name}}',
            'content' => '<p>Halo {{name}}</p>',
            'status' => EmailBroadcastStatus::Completed,
            'created_by' => $admin->id,
        ]);

        $broadcast->recipients()->create([
            'name' => 'Gagal',
            'email' => 'gagal@example.com',
            'status' => EmailBroadcastRecipientStatus::Failed,
        ]);

        app(BroadcastDispatchService::class)->retryFailed($broadcast);

        Queue::assertPushed(SendBroadcastRecipientJob::class, 1);
        Queue::assertPushed(
            SendBroadcastRecipientJob::class,
            fn (SendBroadcastRecipientJob $job): bool => $job->queue === BroadcastDispatchService::QUEUE
        );
    }
}
