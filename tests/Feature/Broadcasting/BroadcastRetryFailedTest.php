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

class BroadcastRetryFailedTest extends TestCase
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

    public function test_retry_failed_resets_recipient_and_dispatches_job(): void
    {
        Queue::fake();
        $admin = $this->superAdmin();

        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Retry Test',
            'scheduled_at' => now()->subHour(),
            'delay_min' => 0,
            'delay_max' => 0,
            'subject' => 'Halo {{name}}',
            'content' => '<p>Halo {{name}}</p>',
            'status' => EmailBroadcastStatus::Completed,
            'created_by' => $admin->id,
        ]);

        $recipient = $broadcast->recipients()->create([
            'name' => 'Gagal',
            'email' => 'gagal@example.com',
            'status' => EmailBroadcastRecipientStatus::Failed,
            'attempts' => 3,
            'failed_at' => now()->subMinutes(5),
            'error_message' => 'SMTP connection timeout',
        ]);

        $retried = app(BroadcastDispatchService::class)->retryFailed($broadcast);

        $this->assertSame(1, $retried);
        $this->assertSame(
            EmailBroadcastRecipientStatus::Pending,
            $recipient->refresh()->status
        );
        $this->assertNull($recipient->error_message);
        $this->assertNull($recipient->failed_at);
        $this->assertSame(
            EmailBroadcastStatus::Processing,
            $broadcast->refresh()->status
        );
        Queue::assertPushed(SendBroadcastRecipientJob::class, 1);
    }

    public function test_retry_failed_returns_zero_without_failed_recipients(): void
    {
        Queue::fake();
        $admin = $this->superAdmin();

        $broadcast = EmailBroadcast::query()->create([
            'name' => 'No Failed',
            'scheduled_at' => now()->subHour(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Completed,
            'created_by' => $admin->id,
        ]);

        $broadcast->recipients()->create([
            'name' => 'Terkirim',
            'email' => 'terkirim@example.com',
            'status' => EmailBroadcastRecipientStatus::Sent,
            'sent_at' => now()->subMinutes(5),
        ]);

        $retried = app(BroadcastDispatchService::class)->retryFailed($broadcast);

        $this->assertSame(0, $retried);
        Queue::assertNothingPushed();
    }
}
