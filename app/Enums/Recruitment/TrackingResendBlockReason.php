<?php

namespace App\Enums\Recruitment;

/** Satu-satunya alasan kirim ulang tracking boleh ditolak; dipakai policy dan service. */
enum TrackingResendBlockReason: string
{
    case Cancelled = 'cancelled';
    case MissingPersonalEmail = 'missing_personal_email';
}
