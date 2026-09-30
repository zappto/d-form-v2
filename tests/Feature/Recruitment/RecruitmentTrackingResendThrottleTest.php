<?php

namespace Tests\Feature\Recruitment;

use App\Jobs\Recruitment\SendRecruitmentApplicationConfirmationJob;
use App\Models\Recruitment\RecruitmentApplication;
use App\Models\Recruitment\RecruitmentDivision;
use App\Models\Recruitment\RecruitmentPeriod;
use App\Models\User;
use Database\Seeders\RecruitmentDivisionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Kunci throttle resend-tracking (DFORM-82): 3/menit per user, hit ke-4 → 429.
 */
class RecruitmentTrackingResendThrottleTest extends TestCase
{
    use RefreshDatabase;

    private RecruitmentPeriod $period;

    private RecruitmentApplication $application;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(RecruitmentDivisionSeeder::class);

        $division = RecruitmentDivision::query()->where('code', 'programming')->firstOrFail();
        $this->period = RecruitmentPeriod::factory()->create();

        $this->application = RecruitmentApplication::factory()->create([
            'recruitment_period_id' => $this->period->id,
            'primary_division_id' => $division->id,
            'personal_email' => 'applicant@example.com',
            'tracking_token_hash' => Hash::make('AB12CD34'),
        ]);
    }

    /** Staff dengan izin resend-tracking (pola RecruitmentTrackingResendTest). */
    private function staff(): User
    {
        $user = User::factory()->create();
        $user->assignRole('admin');
        $user->givePermissionTo([
            'recruitment.periods.view',
            'recruitment.applications.list',
            'recruitment.applications.view',
            'recruitment.screening.decide',
        ]);

        return $user;
    }

    /** Tiga resend pertama dalam semenit lolos (redirect + job pushed). */
    public function test_first_three_resends_within_minute_succeed(): void
    {
        Queue::fake();

        $this->actingAs($this->staff());

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->post(route('dashboard.recruitment.applications.resend-tracking', $this->application))
                ->assertRedirect();
        }

        Queue::assertPushed(SendRecruitmentApplicationConfirmationJob::class, 3);
    }

    /** Resend ke-4 dalam semenit ditolak 429 (limiter recruitment-resend 3/menit). */
    public function test_fourth_resend_within_minute_is_throttled(): void
    {
        Queue::fake();

        $this->actingAs($this->staff());

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->post(route('dashboard.recruitment.applications.resend-tracking', $this->application))
                ->assertRedirect();
        }

        $this->post(route('dashboard.recruitment.applications.resend-tracking', $this->application))
            ->assertStatus(429);

        Queue::assertPushed(SendRecruitmentApplicationConfirmationJob::class, 3);
    }

    /** Throttle per-user: user lain yang belum memakai kuota masih bisa resend. */
    public function test_throttle_is_per_user_other_staff_still_can_resend(): void
    {
        Queue::fake();

        $firstStaff = $this->staff();

        $this->actingAs($firstStaff);

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->post(route('dashboard.recruitment.applications.resend-tracking', $this->application))
                ->assertRedirect();
        }

        $this->post(route('dashboard.recruitment.applications.resend-tracking', $this->application))
            ->assertStatus(429);

        $this->actingAs($this->staff())
            ->post(route('dashboard.recruitment.applications.resend-tracking', $this->application))
            ->assertRedirect();

        Queue::assertPushed(SendRecruitmentApplicationConfirmationJob::class, 4);
    }
}
