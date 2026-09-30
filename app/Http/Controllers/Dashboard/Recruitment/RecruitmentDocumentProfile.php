<?php

namespace App\Http\Controllers\Dashboard\Recruitment;

/** Profil unduhan satu dokumen recruitment; dibawa resolver ke streamer tunggal. */
final readonly class RecruitmentDocumentProfile
{
    public function __construct(
        public ?string $path,
        public string $originalName,
        public string $mime,
        public string $previewContentType,
    ) {
    }
}
