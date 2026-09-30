<?php

namespace Tests\Feature\Broadcasting;

use App\Enums\EmailBroadcastRecipientStatus;
use App\Enums\EmailBroadcastStatus;
use App\Models\EmailBroadcast;
use App\Models\User;
use App\Support\BroadcastPermissions;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Mengunci scope pemilik otorisasi broadcast (DFORM-79):
 * admin hanya boleh ubah miliknya sendiri; super-admin bebas semua;
 * baris legacy tanpa created_by tetap boleh diubah pemegang permission.
 */
class BroadcastOwnershipTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /** Admin baru dengan role admin (pegang semua permission broadcast). */
    private function broadcastAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    }

    /** Super-admin baru (bypass scope pemilik). */
    private function superAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('super-admin');

        return $user;
    }

    /** Draf milik owner yang siap dijadwalkan (subject+content+1 recipient). */
    private function ownedDraft(User $owner): EmailBroadcast
    {
        $broadcast = EmailBroadcast::query()->create([
            'name' => 'Draf Milik Owner',
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
            'email' => 'nafan@gmail.com',
            'status' => EmailBroadcastRecipientStatus::Pending,
        ]);

        return $broadcast;
    }

    public function test_admin_b_tidak_bisa_edit_konten_milik_admin_a(): void
    {
        $owner = $this->broadcastAdmin();
        $broadcast = $this->ownedDraft($owner);

        $this->actingAs($this->broadcastAdmin())
            ->post(route('dashboard.broadcasts.content.save', $broadcast), [
                'subject' => 'Halo {{name}}',
                'content' => '<p>Diubah orang lain</p>',
            ])
            ->assertForbidden();

        $this->assertNotSame('Diubah orang lain', $broadcast->refresh()->subject);
    }

    public function test_admin_b_tidak_bisa_schedule_milik_admin_a(): void
    {
        $owner = $this->broadcastAdmin();
        $broadcast = $this->ownedDraft($owner);

        $this->actingAs($this->broadcastAdmin())
            ->post(route('dashboard.broadcasts.schedule', $broadcast))
            ->assertForbidden();

        $this->assertSame(EmailBroadcastStatus::Draft, $broadcast->refresh()->status);
    }

    public function test_schedule_only_tanpa_create_tidak_bisa_edit_konten(): void
    {
        $owner = $this->broadcastAdmin();
        $broadcast = $this->ownedDraft($owner);

        $scheduler = User::factory()->create();
        $scheduler->givePermissionTo(BroadcastPermissions::VIEW, BroadcastPermissions::SCHEDULE);

        $this->actingAs($scheduler)
            ->post(route('dashboard.broadcasts.content.save', $broadcast), [
                'subject' => 'Halo {{name}}',
                'content' => '<p>Diubah scheduler</p>',
            ])
            ->assertForbidden();
    }

    public function test_super_admin_bisa_edit_milik_admin_a(): void
    {
        $owner = $this->broadcastAdmin();
        $broadcast = $this->ownedDraft($owner);

        $this->actingAs($this->superAdmin())
            ->post(route('dashboard.broadcasts.content.save', $broadcast), [
                'subject' => 'Halo {{name}}',
                'content' => '<p>Halo {{name}}</p>',
            ])
            ->assertRedirect();

        $this->assertSame('Halo {{name}}', $broadcast->refresh()->subject);
    }

    public function test_owner_admin_bisa_edit_milik_sendiri(): void
    {
        $owner = $this->broadcastAdmin();
        $broadcast = $this->ownedDraft($owner);

        $this->actingAs($owner)
            ->post(route('dashboard.broadcasts.content.save', $broadcast), [
                'subject' => 'Halo {{name}}',
                'content' => '<p>Halo {{name}}</p>',
            ])
            ->assertRedirect();

        $this->assertSame('Halo {{name}}', $broadcast->refresh()->subject);
    }
}
