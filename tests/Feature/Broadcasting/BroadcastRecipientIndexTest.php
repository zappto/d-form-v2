<?php

namespace Tests\Feature\Broadcasting;

use App\Enums\EmailBroadcastStatus;
use App\Models\EmailBroadcast;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BroadcastRecipientIndexTest extends TestCase
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
            'name' => 'Index Recipient',
            'scheduled_at' => now()->addDay(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Draft,
            'created_by' => $owner->id,
        ]);
    }

    /** Index mengirim prop recipients + duplicateSummary untuk komponen Show. */
    public function test_index_returns_recipients_and_duplicate_summary(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);
        $broadcast->recipients()->create(['name' => 'Nafan', 'email' => 'nafan@gmail.com', 'status' => 'pending']);
        $broadcast->recipients()->create(['name' => 'Ganda', 'email' => 'nafan@gmail.com', 'status' => 'pending']);

        $this->get(route('dashboard.broadcasts.recipients.index', $broadcast))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Broadcasts/Show')
                ->has('recipients.data', 2)
                ->where('recipients.data.0.email', 'nafan@gmail.com')
                ->where('duplicateSummary.total', 2)
                ->where('duplicateSummary.duplicates', 1));
    }

    /** Show bukan sumber recipients — UI wajib memuatnya via recipients.index. */
    public function test_show_does_not_send_recipient_props(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);

        $this->get(route('dashboard.broadcasts.show', $broadcast))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Broadcasts/Show')
                ->has('broadcast')
                ->missing('recipients')
                ->missing('duplicateSummary'));
    }
}
