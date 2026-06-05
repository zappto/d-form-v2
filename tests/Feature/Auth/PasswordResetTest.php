<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_forgot_password_page(): void
    {
        $this->get(route('auth.password.request'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/ForgotPassword'));
    }

    public function test_guest_can_view_reset_password_page_with_token(): void
    {
        $this->get(route('password.reset', ['token' => 'test-token', 'email' => 'u@example.com']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/ResetPassword')
                ->where('token', 'test-token')
                ->where('email', 'u@example.com'));
    }

    public function test_forgot_password_sends_reset_notification_for_valid_user(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->from(route('auth.password.request'))
            ->post(route('auth.password.email'), [
                'email' => $user->email,
            ])
            ->assertRedirect();

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_password_reset_link_endpoint_sends_notification_for_valid_user(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->postJson(route('auth.password.reset-link'), [
            'email' => $user->email,
        ])
            ->assertOk()
            ->assertJson([
                'message' => 'If an account exists for that email, we sent a password reset link.',
            ]);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_password_reset_link_endpoint_returns_generic_message_for_unknown_email(): void
    {
        Notification::fake();

        $this->postJson(route('auth.password.reset-link'), [
            'email' => 'unknown@example.com',
        ])
            ->assertOk()
            ->assertJson([
                'message' => 'If an account exists for that email, we sent a password reset link.',
            ]);

        Notification::assertNothingSent();
    }

    public function test_oauth_only_user_can_receive_password_reset_link(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => null,
            'google_id' => 'google-123',
        ]);

        $this->postJson(route('auth.password.reset-link'), [
            'email' => $user->email,
        ])
            ->assertOk();

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_reset_password_updates_credentials_and_redirects_to_login(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => Hash::make('old-secret'),
        ]);

        $this->from(route('auth.password.request'))
            ->post(route('auth.password.email'), [
                'email' => $user->email,
            ]);

        $sent = Notification::sent($user, ResetPasswordNotification::class);
        $this->assertCount(1, $sent);
        $notification = $sent->first();
        $this->assertInstanceOf(ResetPasswordNotification::class, $notification);

        $this->post(route('auth.password.update', ['token' => $notification->token]), [
            'email' => $user->email,
            'password' => 'new-secret-99',
            'password_confirmation' => 'new-secret-99',
        ])
            ->assertRedirect(route('auth.login'));

        $user->refresh();
        $this->assertTrue(Hash::check('new-secret-99', $user->password));
    }

    public function test_expired_reset_token_is_rejected(): void
    {
        Notification::fake();

        config(['auth.passwords.users.expire' => 30]);

        $user = User::factory()->create([
            'password' => Hash::make('old-secret'),
        ]);

        $this->post(route('auth.password.email'), [
            'email' => $user->email,
        ]);

        $sent = Notification::sent($user, ResetPasswordNotification::class);
        $notification = $sent->first();
        $this->assertInstanceOf(ResetPasswordNotification::class, $notification);

        $this->travel(31)->minutes();

        $this->from(route('password.reset', ['token' => $notification->token, 'email' => $user->email]))
            ->post(route('auth.password.update', ['token' => $notification->token]), [
                'email' => $user->email,
                'password' => 'new-secret-99',
                'password_confirmation' => 'new-secret-99',
            ])
            ->assertRedirect();

        $user->refresh();
        $this->assertTrue(Hash::check('old-secret', $user->password));
    }

    public function test_reset_notification_mail_uses_configured_expiry_minutes(): void
    {
        config(['auth.passwords.users.expire' => 30]);

        $user = User::factory()->create();
        $notification = new ResetPasswordNotification('test-token');

        $mail = $notification->toMail($user);
        $rendered = implode(' ', array_merge($mail->introLines, $mail->outroLines));

        $this->assertStringContainsString('30', $rendered);
    }
}
