<?php

namespace App\Http\Controllers\Dashboard\Recruitment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruitment\ResendRecruitmentTrackingRequest;
use App\Models\Recruitment\RecruitmentApplication;
use App\Models\Recruitment\RecruitmentDocument;
use App\Services\Recruitment\ApplicationVerificationService;
use App\Services\Recruitment\RecruitmentTrackingResendService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RecruitmentApplicationController extends Controller
{
    public function __construct(
        private readonly ApplicationVerificationService $verificationService,
        private readonly RecruitmentTrackingResendService $trackingResendService,
    ) {
    }

    /** Unduh atau pratinjau satu dokumen applicant; orkestrator tipis di atas profil per tipe. */
    public function downloadDocument(Request $request, RecruitmentApplication $application, string $type): StreamedResponse
    {
        $this->authorize('downloadDocument', $application);

        $document = $application->document;
        abort_if($document === null, 404);

        $profile = $this->resolveRecruitmentDocumentProfile($document, $type);
        abort_if($profile === null, 404);

        return $this->streamRecruitmentDocumentProfile($profile, $request->boolean('preview'));
    }

    /** Petakan tipe dokumen ke profil unduhan; null untuk tipe tak dikenal. */
    private function resolveRecruitmentDocumentProfile(RecruitmentDocument $document, string $type): ?RecruitmentDocumentProfile
    {
        return match ($type) {
            'cv' => new RecruitmentDocumentProfile(
                path: $document->cv_path,
                originalName: $document->cv_original_name,
                mime: $document->cv_mime,
                previewContentType: 'application/pdf',
            ),
            'portfolio' => new RecruitmentDocumentProfile(
                path: $document->portfolio_path,
                originalName: $document->portfolio_original_name ?? 'portfolio.pdf',
                mime: $document->portfolio_mime ?? 'application/octet-stream',
                previewContentType: 'application/pdf',
            ),
            'instagram_follow' => new RecruitmentDocumentProfile(
                path: $document->instagram_follow_path,
                originalName: $document->instagram_follow_original_name ?? 'instagram-follow',
                mime: $document->instagram_follow_mime ?: 'image/jpeg',
                previewContentType: $document->instagram_follow_mime ?: 'image/jpeg',
            ),
            default => null,
        };
    }

    /** Alirkan satu profil dokumen; preview inline, selain itu unduh. */
    private function streamRecruitmentDocumentProfile(RecruitmentDocumentProfile $profile, bool $preview): StreamedResponse
    {
        abort_if(blank($profile->path), 404);

        if ($preview) {
            return Storage::disk('local')->response(
                $profile->path,
                $profile->originalName,
                ['Content-Type' => $profile->previewContentType],
                'inline',
            );
        }

        return Storage::disk('local')->download(
            $profile->path,
            $profile->originalName,
            ['Content-Type' => $profile->mime],
        );
    }

    public function verify(Request $request, RecruitmentApplication $application): RedirectResponse
    {
        $this->authorize('view', $application);
        abort_unless($request->user()?->can('recruitment.screening.review'), 403);

        $this->verificationService->verify($request->user(), $application, $request);

        return redirect()
            ->back()
            ->with('message', 'Pendaftaran berhasil diverifikasi.');
    }

    public function resendTracking(ResendRecruitmentTrackingRequest $request, RecruitmentApplication $application): RedirectResponse
    {
        $this->trackingResendService->resend($request->user(), $application, $request);

        return redirect()
            ->back()
            ->with('message', 'Informasi tracking telah dikirim ulang ke applicant.');
    }
}
