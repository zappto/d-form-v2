<?php

namespace App\Services\Registration;

use App\Models\FormAnswer;

final class FormAnswerRecipientResolver
{
    public function email(FormAnswer $submission): ?string
    {
        $fromUser = $this->normalizeEmail($submission->user?->email);

        if ($fromUser !== null) {
            return $fromUser;
        }

        return $this->normalizeEmail($submission->invited_email);
    }

    public function isGuest(FormAnswer $submission): bool
    {
        return $submission->user_id === null
            && is_string($submission->invited_email)
            && $submission->invited_email !== '';
    }

    private function normalizeEmail(mixed $raw): ?string
    {
        if (! is_string($raw)) {
            return null;
        }

        $normalized = mb_strtolower(trim($raw));

        if ($normalized === '') {
            return null;
        }

        if (filter_var($normalized, FILTER_VALIDATE_EMAIL) === false) {
            return null;
        }

        return $normalized;
    }

    public function userIdForLog(FormAnswer $submission): ?string
    {
        $id = $submission->user_id;

        return is_string($id) && $id !== '' ? $id : null;
    }
}
