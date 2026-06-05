<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class OAuthGoogleEmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    public function test_new_google_user_with_verified_email_gets_email_verified_at(): void
    {
        $this->mockGoogleCallback(emailVerified: true);

        $this->get(route('auth.google.callback'))
            ->assertRedirect();

        $user = User::where('email', 'google@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_new_google_user_with_unverified_email_stays_unverified(): void
    {
        $this->mockGoogleCallback(emailVerified: false);

        $this->get(route('auth.google.callback'))
            ->assertRedirect();

        $user = User::where('email', 'google@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at);
    }

    public function test_existing_unverified_user_is_verified_when_google_reports_verified_email(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'google@example.com',
        ]);
        $user->assignRole('member');

        $this->mockGoogleCallback(emailVerified: true);

        $this->get(route('auth.google.callback'))
            ->assertRedirect();

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('google-123', $user->google_id);
    }

    public function test_existing_verified_user_keeps_email_verified_at_on_google_login(): void
    {
        $verifiedAt = now()->subDays(3);
        $user = User::factory()->create([
            'email' => 'google@example.com',
            'google_id' => 'google-123',
            'email_verified_at' => $verifiedAt,
        ]);
        $user->assignRole('member');

        $this->mockGoogleCallback(emailVerified: true, googleId: 'google-123');

        $this->get(route('auth.google.callback'))
            ->assertRedirect();

        $user->refresh();
        $this->assertSame(
            $verifiedAt->toDateTimeString(),
            $user->email_verified_at?->toDateTimeString(),
        );
    }

    private function mockGoogleCallback(bool $emailVerified, string $googleId = 'google-123'): void
    {
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn($googleId);
        $googleUser->shouldReceive('getEmail')->andReturn('google@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Google User');
        $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');
        $googleUser->user = ['email_verified' => $emailVerified];

        Socialite::shouldReceive('driver')->with('google')->andReturnSelf();
        Socialite::shouldReceive('user')->andReturn($googleUser);
    }
}
