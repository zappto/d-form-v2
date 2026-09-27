<?php

namespace Tests\Feature;

use App\Models\Recruitment\RecruitmentApplication;
use App\Models\Recruitment\RecruitmentDocument;
use App\Models\Recruitment\RecruitmentPeriod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageHardDeleteCleanupTest extends TestCase
{
    use RefreshDatabase;

    public function test_force_delete_user_removes_stored_avatar_not_oauth(): void
    {
        Storage::fake('public');
        $avatarPath = 'avatars/seed/stored.jpg';
        Storage::disk('public')->put($avatarPath, 'x');

        $local = User::factory()->create(['avatar' => $avatarPath]);
        $oauth = User::factory()->create(['avatar' => 'https://oauth.example/a.jpg']);

        $local->forceDelete();
        Storage::disk('public')->assertMissing($avatarPath);

        $oauth->forceDelete();
        $this->assertTrue(true); // sukses = tidak throw, tidak hapus milik lain
    }

    public function test_force_delete_period_removes_banner_and_documents(): void
    {
        Storage::fake('public');
        Storage::fake('local');

        $periodBanner = 'recruitment/banners/period.jpg';
        $cvPath = 'recruitment/seed/app/cv.pdf';
        Storage::disk('public')->put($periodBanner, 'x');
        Storage::disk('local')->put($cvPath, 'x');

        $owner = User::factory()->create();
        $period = RecruitmentPeriod::factory()->create([
            'created_by' => $owner->id,
            'banner' => $periodBanner,
        ]);
        $application = RecruitmentApplication::factory()->create([
            'recruitment_period_id' => $period->id,
        ]);
        $application->document()->save(new RecruitmentDocument([
            'recruitment_application_id' => $application->id,
            'cv_path' => $cvPath,
            'cv_original_name' => 'cv.pdf',
            'cv_mime' => 'application/pdf',
            'cv_size_bytes' => 123,
            'portfolio_type' => 'file',
        ]));

        $period->forceDelete();

        Storage::disk('public')->assertMissing($periodBanner);
        Storage::disk('local')->assertMissing($cvPath);
    }

    public function test_soft_delete_period_keeps_files(): void
    {
        Storage::fake('public');
        $periodBanner = 'recruitment/banners/period.jpg';
        Storage::disk('public')->put($periodBanner, 'x');

        $owner = User::factory()->create();
        $period = RecruitmentPeriod::factory()->create([
            'created_by' => $owner->id,
            'banner' => $periodBanner,
        ]);

        $period->delete();

        Storage::disk('public')->assertExists($periodBanner);
    }
}
