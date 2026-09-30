<?php

namespace Tests\Feature\Recruitment;

use App\Jobs\Recruitment\SendRecruitmentApplicationConfirmationJob;
use App\Mail\Recruitment\RecruitmentApplicationConfirmationMail;
use App\Models\Recruitment\RecruitmentApplication;
use App\Models\Recruitment\RecruitmentDivision;
use App\Models\Recruitment\RecruitmentPeriod;
use App\Models\User;
use App\Services\Recruitment\ApplicationSubmitter;
use App\Services\Recruitment\RecruitmentEmailRenderer;
use App\Services\Recruitment\RecruitmentTrackingPortalUrlBuilder;
use Database\Seeders\RecruitmentDivisionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

/**
 * Kunci DFORM-83: token tracking di payload queue wajib ciphertext dengan dekripsi toleran dan fail-closed.
 */
class RecruitmentConfirmationTokenEncryptionTest extends TestCase
{
    use RefreshDatabase;

    private RecruitmentPeriod $period;

    private RecruitmentDivision $division;

    private RecruitmentApplication $application;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(RecruitmentDivisionSeeder::class);
        Storage::fake('local');

        $this->division = RecruitmentDivision::query()->where('code', 'programming')->firstOrFail();
        $this->period = RecruitmentPeriod::factory()->open()->create();

        $this->application = RecruitmentApplication::factory()->create([
            'recruitment_period_id' => $this->period->id,
            'primary_division_id' => $this->division->id,
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

    /** Payload resend terserialisasi tanpa plaintext dan ciphertext kembali ke token asal. */
    public function test_resend_queue_payload_hides_plaintext_token(): void
    {
        Queue::fake();

        $this->actingAs($this->staff())
            ->post(route('dashboard.recruitment.applications.resend-tracking', $this->application))
            ->assertRedirect();

        Queue::assertPushed(SendRecruitmentApplicationConfirmationJob::class, function (SendRecruitmentApplicationConfirmationJob $job): bool {
            $decryptedToken = Crypt::decryptString($job->trackingToken);

            $this->assertStringNotContainsString($decryptedToken, serialize($job));
            $this->assertTrue(Hash::check($decryptedToken, (string) $this->application->fresh()->tracking_token_hash));

            return $job->applicationId === $this->application->id;
        });
    }

    /** Round-trip resend: mail terkirim dengan portal URL dan token yang benar. */
    public function test_resend_round_trip_delivers_mail_with_correct_token(): void
    {
        Queue::fake();
        Mail::fake();

        $this->actingAs($this->staff())
            ->post(route('dashboard.recruitment.applications.resend-tracking', $this->application))
            ->assertRedirect();

        $ciphertext = '';

        Queue::assertPushed(SendRecruitmentApplicationConfirmationJob::class, function (SendRecruitmentApplicationConfirmationJob $job) use (&$ciphertext): bool {
            $ciphertext = $job->trackingToken;

            return $job->applicationId === $this->application->id;
        });

        $this->assertNotSame('', $ciphertext);

        $trackingToken = Crypt::decryptString($ciphertext);

        (new SendRecruitmentApplicationConfirmationJob($this->application->id, $ciphertext))->handle(
            app(RecruitmentEmailRenderer::class),
            app(RecruitmentTrackingPortalUrlBuilder::class),
        );

        Mail::assertSent(RecruitmentApplicationConfirmationMail::class, function (RecruitmentApplicationConfirmationMail $mail) use ($trackingToken): bool {
            return $mail->hasTo('applicant@example.com')
                && str_contains($mail->bodyHtml, $trackingToken)
                && str_contains($mail->bodyHtml, 'token='.$trackingToken);
        });

        $this->assertTrue(Hash::check($trackingToken, (string) $this->application->fresh()->tracking_token_hash));
    }

    /** Round-trip submit: mail terkirim ke pendaftar dengan token hasil enkripsi dispatch. */
    public function test_submit_round_trip_delivers_mail_with_correct_token(): void
    {
        Queue::fake();
        Mail::fake();

        $submitResult = app(ApplicationSubmitter::class)->submit(
            $this->period,
            [
                'full_name' => 'Citra Lestari',
                'nim' => 'A11.2024.05678',
                'semester' => 3,
                'phone' => '081234567891',
                'personal_email' => 'citra@gmail.com',
                'student_email' => 'citra@students.udinus.ac.id',
                'instagram_username' => 'citralestari',
                'primary_division_id' => $this->division->id,
                'secondary_division_id' => null,
                'portfolio_type' => 'none',
            ],
            UploadedFile::fake()->create('cv.pdf', 120, 'application/pdf'),
        );

        $ciphertext = '';

        Queue::assertPushed(SendRecruitmentApplicationConfirmationJob::class, function (SendRecruitmentApplicationConfirmationJob $job) use (&$ciphertext, $submitResult): bool {
            $ciphertext = $job->trackingToken;

            return $job->applicationId === $submitResult['application']->id;
        });

        $this->assertNotSame('', $ciphertext);
        $this->assertSame($submitResult['tracking_token'], Crypt::decryptString($ciphertext));

        (new SendRecruitmentApplicationConfirmationJob($submitResult['application']->id, $ciphertext))->handle(
            app(RecruitmentEmailRenderer::class),
            app(RecruitmentTrackingPortalUrlBuilder::class),
        );

        $trackingToken = $submitResult['tracking_token'];

        Mail::assertSent(RecruitmentApplicationConfirmationMail::class, function (RecruitmentApplicationConfirmationMail $mail) use ($trackingToken): bool {
            return $mail->hasTo('citra@gmail.com')
                && str_contains($mail->bodyHtml, $trackingToken)
                && str_contains($mail->bodyHtml, 'token='.$trackingToken);
        });
    }

    /** Job lama berpayload plaintext tetap terkirim sekali lewat fallback depresiasi. */
    public function test_legacy_plaintext_payload_still_delivers_with_deprecation_warning(): void
    {
        Mail::fake();
        Log::spy();

        (new SendRecruitmentApplicationConfirmationJob($this->application->id, 'AB12CD34'))->handle(
            app(RecruitmentEmailRenderer::class),
            app(RecruitmentTrackingPortalUrlBuilder::class),
        );

        Mail::assertSent(RecruitmentApplicationConfirmationMail::class, function (RecruitmentApplicationConfirmationMail $mail): bool {
            return $mail->hasTo('applicant@example.com')
                && str_contains($mail->bodyHtml, 'AB12CD34');
        });

        Log::shouldHaveReceived('warning')->once()->with(
            Mockery::on(fn (string $message): bool => str_contains($message, 'Legacy plaintext') === true
                && str_contains($message, 'AB12CD34') === false),
            Mockery::on(fn (array $context): bool => ($context['application_id'] ?? null) === $this->application->id
                && str_contains((string) json_encode($context), 'AB12CD34') === false),
        );
    }

    /** Payload rusak fail-closed: mail tak terkirim, warning tanpa membocorkan token. */
    public function test_tampered_payload_fails_closed_without_leaking_token(): void
    {
        Mail::fake();
        Log::spy();

        $tamperedToken = substr(Crypt::encryptString('AB12CD34'), 0, -6).'AAAAAA';

        (new SendRecruitmentApplicationConfirmationJob($this->application->id, $tamperedToken))->handle(
            app(RecruitmentEmailRenderer::class),
            app(RecruitmentTrackingPortalUrlBuilder::class),
        );

        Mail::assertNothingSent();

        $this->assertDatabaseMissing('email_logs', [
            'recruitment_application_id' => $this->application->id,
        ]);

        Log::shouldHaveReceived('warning')->once()->with(
            Mockery::on(fn (string $message): bool => str_contains($message, 'Undecryptable') === true
                && str_contains($message, 'AB12CD34') === false),
            Mockery::on(fn (array $context): bool => ($context['application_id'] ?? null) === $this->application->id
                && str_contains((string) json_encode($context), 'AB12CD34') === false
                && str_contains((string) json_encode($context), $tamperedToken) === false),
        );
    }
}
