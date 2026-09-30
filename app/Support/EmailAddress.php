<?php

namespace App\Support;

/**
 * Invarian kanonik normalisasi alamat email (trim + lowercase + FILTER_VALIDATE_EMAIL).
 */
final class EmailAddress
{
    /**
     * Normalisasi email mentah jadi lowercase-trim, atau null bila kosong/invalid.
     */
    public static function normalizeEmail(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $email = strtolower(trim($raw));

        if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return null;
        }

        return $email;
    }
}
