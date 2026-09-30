<?php

namespace Tests\Feature\Recruitment;

use App\Enums\Recruitment\ApplicationResult;
use App\Enums\Recruitment\ApplicationStage;
use App\Models\Recruitment\RecruitmentApplication;
use App\Models\Recruitment\RecruitmentDivision;
use App\Models\Recruitment\RecruitmentDocument;
use App\Models\Recruitment\RecruitmentPeriod;
use App\Models\User;
use Database\Seeders\RecruitmentDivisionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RecruitmentDocumentDownloadTest extends TestCase
{
    use RefreshDatabase;

    private User $staff;

    private RecruitmentPeriod $period;

    private RecruitmentDivision $programming;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(RecruitmentDivisionSeeder::class);
        Queue::fake();
        Storage::fake('local');

        $this->staff = User::factory()->create();
        $this->staff->assignRole('recruitment-staff');

        $this->programming = RecruitmentDivision::query()->where('code', 'programming')->firstOrFail();
        $this->period = RecruitmentPeriod::factory()->create();
    }

    private function applicationWithFiles(): RecruitmentApplication
    {
        $application = RecruitmentApplication::factory()->create([
            'recruitment_period_id' => $this->period->id,
            'primary_division_id' => $this->programming->id,
            'stage' => ApplicationStage::Submitted,
            'result' => ApplicationResult::Pending,
        ]);

        Storage::disk('local')->put('recruitment/cv/doc-dl.pdf', 'cv bytes');
        Storage::disk('local')->put('recruitment/portfolio/doc-dl.pdf', 'portfolio bytes');
        Storage::disk('local')->put('recruitment/instagram/doc-dl.jpg', 'follow bytes');

        RecruitmentDocument::query()->create([
            'recruitment_application_id' => $application->id,
            'cv_path' => 'recruitment/cv/doc-dl.pdf',
            'cv_original_name' => 'cv.pdf',
            'cv_mime' => 'application/pdf',
            'cv_size_bytes' => 100,
            'portfolio_type' => 'file',
            'portfolio_path' => 'recruitment/portfolio/doc-dl.pdf',
            'portfolio_original_name' => 'Portfolio.pdf',
            'portfolio_mime' => 'application/pdf',
            'portfolio_size_bytes' => 200,
            'instagram_follow_path' => 'recruitment/instagram/doc-dl.jpg',
            'instagram_follow_original_name' => 'bukti-follow.jpg',
            'instagram_follow_mime' => 'image/jpeg',
            'instagram_follow_size_bytes' => 300,
        ]);

        return $application->fresh(['document']);
    }

    public function test_staff_can_download_portfolio_with_original_filename(): void
    {
        $application = $this->applicationWithFiles();

        $response = $this->actingAs($this->staff)
            ->get(route('dashboard.recruitment.applications.documents.download', [
                'application' => $application,
                'type' => 'portfolio',
            ]));

        $response->assertOk();
        $this->assertStringContainsString(
            'Portfolio.pdf',
            (string) $response->headers->get('Content-Disposition'),
        );
    }

    public function test_staff_can_download_instagram_follow_with_original_filename(): void
    {
        $application = $this->applicationWithFiles();

        $response = $this->actingAs($this->staff)
            ->get(route('dashboard.recruitment.applications.documents.download', [
                'application' => $application,
                'type' => 'instagram_follow',
            ]));

        $response->assertOk();
        $this->assertStringContainsString(
            'bukti-follow.jpg',
            (string) $response->headers->get('Content-Disposition'),
        );
    }

    public function test_unknown_document_type_returns_not_found(): void
    {
        $application = $this->applicationWithFiles();

        $this->actingAs($this->staff)
            ->get(route('dashboard.recruitment.applications.documents.download', [
                'application' => $application,
                'type' => 'ktp',
            ]))
            ->assertNotFound();
    }
}
