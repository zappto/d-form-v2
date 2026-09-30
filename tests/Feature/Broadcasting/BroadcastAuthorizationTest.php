<?php

namespace Tests\Feature\Broadcasting;

use App\Enums\EmailBroadcastStatus;
use App\Models\EmailBroadcast;
use App\Models\User;
use App\Support\BroadcastPermissions;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Mengunci perilaku otorisasi jalur update broadcast SAAT INI (DFORM-55):
 * request jalur simpan memakai gate CREATE sementara controller memakai policy 'update'.
 * Test ini mengunci perilaku kini, bukan perilaku ideal — lihat KEPUTUSAN-PM-TERTUNDA.
 */
class BroadcastAuthorizationTest extends TestCase
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

    private function draftBroadcast(User $owner): EmailBroadcast
    {
        return EmailBroadcast::query()->create([
            'name' => 'Draf Uji Otorisasi',
            'scheduled_at' => now()->addDay(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Draft,
            'created_by' => $owner->id,
        ]);
    }

    public function test_update_ditolak_untuk_user_tanpa_permission_sama_sekali(): void
    {
        $owner = $this->superAdmin();
        $broadcast = $this->draftBroadcast($owner);

        $this->actingAs(User::factory()->create())
            ->post(route('dashboard.broadcasts.content.save', $broadcast), [
                'subject' => 'Halo {{name}}',
                'content' => '<p>Halo {{name}}</p>',
            ])
            ->assertRedirect(route('dashboard'));
    }

    public function test_update_ditolak_403_untuk_user_hanya_view_tanpa_create(): void
    {
        $owner = $this->superAdmin();
        $broadcast = $this->draftBroadcast($owner);

        $viewer = User::factory()->create();
        $viewer->givePermissionTo(BroadcastPermissions::VIEW);

        $this->actingAs($viewer)
            ->post(route('dashboard.broadcasts.content.save', $broadcast), [
                'subject' => 'Halo {{name}}',
                'content' => '<p>Halo {{name}}</p>',
            ])
            ->assertForbidden();
    }

    public function test_update_diterima_untuk_super_admin(): void
    {
        $admin = $this->superAdmin();
        $broadcast = $this->draftBroadcast($admin);

        $this->actingAs($admin)
            ->post(route('dashboard.broadcasts.content.save', $broadcast), [
                'subject' => 'Halo {{name}}',
                'content' => '<p>Halo {{name}}</p>',
            ])
            ->assertRedirect();

        $this->assertSame('Halo {{name}}', $broadcast->refresh()->subject);
    }
}
