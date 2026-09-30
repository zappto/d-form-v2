<?php

namespace Tests\Feature\Broadcasting;

use App\Enums\EmailBroadcastRecipientStatus;
use App\Enums\EmailBroadcastStatus;
use App\Mail\BroadcastMail;
use App\Models\EmailBroadcast;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Kunci throttle endpoint broadcast mahal (DFORM-80): test-mail 10/jam per user,
 * schedule + retry 30/menit, store/snapshot/content/attachments 60/menit.
 */
class BroadcastThrottleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /** Super-admin pegang semua permission broadcast. */
    private function superAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('super-admin');

        return $user;
    }

    /** Broadcast draft siap kirim test/schedule (subject + content + 1 recipient). */
    private function sendableBroadcast(User $owner): EmailBroadcast
    {
        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Throttle Uji',
            'scheduled_at' => now()->addDay(),
            'delay_min' => 0,
            'delay_max' => 0,
            'subject' => 'Halo {{name}}',
            'content' => '<p>Halo {{name}}</p>',
            'status' => EmailBroadcastStatus::Draft,
            'created_by' => $owner->id,
        ]);

        $broadcast->recipients()->create([
            'name' => 'Nafan',
            'email' => 'nafan@example.com',
            'status' => EmailBroadcastRecipientStatus::Pending,
        ]);

        return $broadcast;
    }

    /** Satu kirim test-mail normal tetap lolos (redirect + 1 mail). */
    public function test_single_test_mail_sends_successfully(): void
    {
        Mail::fake();
        $admin = $this->superAdmin();
        $broadcast = $this->sendableBroadcast($admin);

        $this->actingAs($admin)
            ->post(route('dashboard.broadcasts.test', $broadcast), ['email' => 'kolega@example.com'])
            ->assertRedirect();

        Mail::assertSent(BroadcastMail::class, 1);
    }

    /** Test-mail ke-11 dalam sejam ditolak 429 (limiter broadcast-test 10/jam). */
    public function test_test_mail_throttled_after_hourly_limit(): void
    {
        Mail::fake();
        $admin = $this->superAdmin();
        $broadcast = $this->sendableBroadcast($admin);
        $this->actingAs($admin);

        for ($attempt = 1; $attempt <= 10; $attempt++) {
            $this->post(route('dashboard.broadcasts.test', $broadcast), ['email' => 'kolega@example.com'])
                ->assertRedirect();
        }

        $this->post(route('dashboard.broadcasts.test', $broadcast), ['email' => 'kolega@example.com'])
            ->assertStatus(429);

        Mail::assertSent(BroadcastMail::class, 10);
    }

    /** Schedule (POST + PATCH berbagi bucket 30/menit): hit ke-31 ditolak 429. */
    public function test_schedule_update_throttled_after_limit(): void
    {
        $admin = $this->superAdmin();
        $broadcast = $this->sendableBroadcast($admin);
        $this->actingAs($admin);

        $this->post(route('dashboard.broadcasts.schedule', $broadcast))->assertRedirect();

        $payload = [
            'schedule_date' => now()->addDay()->format('Y-m-d'),
            'schedule_time' => '19:00',
        ];

        for ($attempt = 1; $attempt <= 29; $attempt++) {
            $this->patch(route('dashboard.broadcasts.schedule.update', $broadcast), $payload)
                ->assertRedirect();
        }

        $this->patch(route('dashboard.broadcasts.schedule.update', $broadcast), $payload)
            ->assertStatus(429);
    }

    /** Retry-failed (bucket 30/menit): hit ke-31 ditolak 429. */
    public function test_retry_failed_throttled_after_limit(): void
    {
        Queue::fake();
        $admin = $this->superAdmin();

        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Retry Throttle Uji',
            'scheduled_at' => now()->subHour(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Completed,
            'created_by' => $admin->id,
        ]);
        $this->actingAs($admin);

        for ($attempt = 1; $attempt <= 30; $attempt++) {
            $this->post(route('dashboard.broadcasts.retry', $broadcast))->assertRedirect();
        }

        $this->post(route('dashboard.broadcasts.retry', $broadcast))->assertStatus(429);
    }
}
