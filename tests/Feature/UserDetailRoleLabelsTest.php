<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDetailRoleLabelsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_show_payload_carries_display_role_labels(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $member = User::factory()->create();
        $member->assignRole('member');

        $this->actingAs($superAdmin)
            ->get(route('dashboard.users.show', $member))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Dashboard/Users/Show')
                    ->where('roleLabels.super-admin', 'Super Admin')
                    ->where('roleLabels.admin', 'Admin')
                    ->where('roleLabels.member', 'Member')
                    ->where('roleLabels.recruitment-staff', 'Recruitment Staff')
                    ->where('roleLabels.recruitment-interviewer', 'Recruitment Interviewer')
            );
    }
}
