<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Password;

class PasswordResetService
{
    /**
     * Send a password reset link to the given email address.
     *
     * Always completes without revealing whether the account exists.
     */
    public function sendResetLink(string $email): void
    {
        Password::sendResetLink(['email' => $email]);
    }
}
