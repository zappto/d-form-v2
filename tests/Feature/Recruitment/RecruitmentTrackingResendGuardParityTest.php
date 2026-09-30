<?php

namespace Tests\Feature\Recruitment;

use App\Jobs\Recruitment\SendRecruitmentApplicationConfirmationJob;
use App\Models\Recruitment\RecruitmentApplication;
use App\Models\Recruitment\RecruitmentDivision;
use App\Models\Recruitment\RecruitmentPeriod;
use App\Models\User;
use App\Services\Recruitment\RecruitmentTrackingResendService;
use Database\Seeders\RecruitmentDivisionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class RecruitmentTrackingResendGuardParityTest extends TestCase
{
    use RefreshDatabase;

    private RecruitmentPeriod $period;

    private RecruitmentDivision $division;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(RecruitmentDivisionSeeder::class);

        $this->division = RecruitmentDivision::query()->where('code', 'programming')->firstOrFail();
        $this->period = RecruitmentPeriod::factory()->create();
    }

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

    private function makeApplication(array $overrides = []): RecruitmentApplication
    {
        return RecruitmentApplication::factory()->create(array_merge([
            'recruitment_period_id' => $this->period->id,
            'primary_division_id' => $this->division->id,
            'personal_email' => 'applicant@example.com',
            'tracking_token_hash' => Hash::make('AB12CD34'),
        ], $overrides));
    }

    public function test_cancelled_application_is_denied_by_policy_and_service(): void
    {
        $staff = $this->staff();
        $application = $this->makeApplication(['cancelled_at' => now()]);

        $this->assertFalse($staff->can('resendTrackingInformation', $application));

        try {
            app(RecruitmentTrackingResendService::class)->resend($staff, $application);
            $this->fail('Resend seharusnya menolak application yang dibatalkan.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Pendaftaran ini sudah dibatalkan.',
                $exception->errors()['application'][0] ?? null,
            );
        }
    }

    public function test_application_without_personal_email_is_denied_by_policy_and_service(): void
    {
        $staff = $this->staff();
        $application = $this->makeApplication(['personal_email' => '']);

        $this->assertFalse($staff->can('resendTrackingInformation', $application));

        try {
            app(RecruitmentTrackingResendService::class)->resend($staff, $application);
            $this->fail('Resend seharusnya menolak application tanpa email pribadi.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                'Applicant tidak memiliki email pribadi.',
                $exception->errors()['application'][0] ?? null,
            );
        }
    }

    public function test_valid_application_is_allowed_by_policy_and_service(): void
    {
        Queue::fake();

        $staff = $this->staff();
        $application = $this->makeApplication();

        $this->assertTrue($staff->can('resendTrackingInformation', $application));

        app(RecruitmentTrackingResendService::class)->resend($staff, $application);

        $this->assertFalse(Hash::check('AB12CD34', (string) $application->fresh()->tracking_token_hash));
        Queue::assertPushed(SendRecruitmentApplicationConfirmationJob::class, function (SendRecruitmentApplicationConfirmationJob $job) use ($application): bool {
            return $job->applicationId === $application->id;
        });
    }
}
