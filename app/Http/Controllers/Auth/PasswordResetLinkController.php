<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordStoreRequest;
use App\Services\Auth\PasswordResetService;
use Illuminate\Http\JsonResponse;

class PasswordResetLinkController extends Controller
{
    public function store(ForgotPasswordStoreRequest $request, PasswordResetService $passwordReset): JsonResponse
    {
        $passwordReset->sendResetLink($request->validated('email'));

        return response()->json([
            'message' => 'If an account exists for that email, we sent a password reset link.',
        ]);
    }
}
