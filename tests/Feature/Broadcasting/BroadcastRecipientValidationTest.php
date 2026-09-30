<?php

namespace Tests\Feature\Broadcasting;

use App\Enums\EmailBroadcastStatus;
use App\Models\EmailBroadcast;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BroadcastRecipientValidationTest extends TestCase
{
    use RefreshDatabase;

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

    /** Buat broadcast draft yang masih editable untuk uji recipient. */
    private function draftBroadcast(User $owner): EmailBroadcast
    {
        return EmailBroadcast::query()->create([
            'name' => 'Validasi Recipient',
            'scheduled_at' => now()->addDay(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Draft,
            'created_by' => $owner->id,
        ]);
    }

    /** Store recipient menerima payload valid dan menyimpannya. */
    public function test_recipient_store_accepts_valid_payload(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);

        $response = $this->post(route('dashboard.broadcasts.recipients.store', $broadcast), [
            'name' => 'Nafan',
            'email' => 'nafan@gmail.com',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('email_broadcast_recipients', [
            'broadcast_id' => $broadcast->id,
            'email' => 'nafan@gmail.com',
        ]);
    }

    /** Store recipient menolak email tidak valid. */
    public function test_recipient_store_rejects_invalid_email(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);

        $response = $this->post(route('dashboard.broadcasts.recipients.store', $broadcast), [
            'name' => 'Nafan',
            'email' => 'bukan-email',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertSame(0, $broadcast->recipients()->count());
    }

    /** Update recipient menerima payload valid — rules yang sama dengan store. */
    public function test_recipient_update_accepts_valid_payload(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);
        $recipient = $broadcast->recipients()->create([
            'name' => 'Lama',
            'email' => 'lama@gmail.com',
            'status' => 'pending',
        ]);

        $response = $this->patch(
            route('dashboard.broadcasts.recipients.update', [$broadcast, $recipient]),
            ['name' => 'Baru', 'email' => 'baru@gmail.com']
        );

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertSame('baru@gmail.com', $recipient->refresh()->email);
    }

    /** Update recipient menolak email tidak valid — bukti kedua aksi memakai rules sama. */
    public function test_recipient_update_rejects_invalid_email(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);
        $recipient = $broadcast->recipients()->create([
            'name' => 'Lama',
            'email' => 'lama@gmail.com',
            'status' => 'pending',
        ]);

        $response = $this->patch(
            route('dashboard.broadcasts.recipients.update', [$broadcast, $recipient]),
            ['name' => 'Baru', 'email' => 'bukan-email']
        );

        $response->assertSessionHasErrors('email');
        $this->assertSame('lama@gmail.com', $recipient->refresh()->email);
    }

    /** Update jadwal menerima payload valid dan menggeser scheduled_at. */
    public function test_schedule_update_accepts_valid_payload(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Validasi Jadwal',
            'scheduled_at' => now()->addDay(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Scheduled,
            'created_by' => $admin->id,
        ]);
        $date = now()->addDays(2)->format('Y-m-d');

        $response = $this->patch(route('dashboard.broadcasts.schedule.update', $broadcast), [
            'schedule_date' => $date,
            'schedule_time' => '19:00',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertSame($date.' 19:00:00', $broadcast->refresh()->scheduled_at->format('Y-m-d H:i:s'));
    }

    /** Update jadwal menolak format tanggal salah dan tidak mengubah scheduled_at. */
    public function test_schedule_update_rejects_invalid_payload(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Validasi Jadwal',
            'scheduled_at' => now()->addDay(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Scheduled,
            'created_by' => $admin->id,
        ]);
        $original = $broadcast->scheduled_at->format('Y-m-d H:i:s');

        $response = $this->patch(route('dashboard.broadcasts.schedule.update', $broadcast), [
            'schedule_date' => 'bukan-tanggal',
            'schedule_time' => '19:00',
        ]);

        $response->assertSessionHasErrors('schedule_date');
        $this->assertSame($original, $broadcast->refresh()->scheduled_at->format('Y-m-d H:i:s'));
    }

    /** Kedua aksi recipient memakai satu request class yang sama (satu sumber kebenaran). */
    public function test_both_recipient_actions_share_single_request_class(): void
    {
        $store = new \ReflectionMethod(
            \App\Http\Controllers\Dashboard\Broadcasting\BroadcastRecipientController::class,
            'store'
        );
        $update = new \ReflectionMethod(
            \App\Http\Controllers\Dashboard\Broadcasting\BroadcastRecipientController::class,
            'update'
        );

        $this->assertSame(
            $store->getParameters()[0]->getType()?->getName(),
            $update->getParameters()[0]->getType()?->getName()
        );
        $this->assertSame(
            \App\Http\Requests\Broadcasting\SaveBroadcastRecipientRequest::class,
            $store->getParameters()[0]->getType()?->getName()
        );
    }

    /** Kedua request jadwal memakai helper scheduledAt dari trait bersama. */
    public function test_both_schedule_requests_share_resolves_trait(): void
    {
        $this->assertContains(
            \App\Http\Requests\Concerns\ResolvesBroadcastSchedule::class,
            array_keys((new \ReflectionClass(\App\Http\Requests\Broadcasting\StoreBroadcastRequest::class))->getTraits())
        );
        $this->assertContains(
            \App\Http\Requests\Concerns\ResolvesBroadcastSchedule::class,
            array_keys((new \ReflectionClass(\App\Http\Requests\Broadcasting\UpdateBroadcastScheduleRequest::class))->getTraits())
        );
        $this->assertSame(
            (new \ReflectionClass(\App\Http\Requests\Broadcasting\StoreBroadcastRequest::class))->getMethod('scheduledAt')->getDeclaringClass()->getName(),
            (new \ReflectionClass(\App\Http\Requests\Broadcasting\UpdateBroadcastScheduleRequest::class))->getMethod('scheduledAt')->getDeclaringClass()->getName()
        );
    }
}
