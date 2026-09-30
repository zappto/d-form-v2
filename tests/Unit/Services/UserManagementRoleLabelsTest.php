<?php

namespace Tests\Unit\Services;

use App\Services\User\UserManagementService;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class UserManagementRoleLabelsTest extends TestCase
{
    public function test_every_assignable_role_has_its_locked_label(): void
    {
        $service = new UserManagementService();

        $expected = [
            'admin' => 'Admin',
            'member' => 'Member',
            'recruitment-staff' => 'Recruitment Staff',
            'recruitment-interviewer' => 'Recruitment Interviewer',
        ];

        $this->assertSame(array_keys($expected), UserManagementService::ASSIGNABLE_ROLES);

        foreach ($expected as $role => $label) {
            $this->assertSame($label, $service->roleLabel($role));
        }

        $this->assertSame(
            array_map(
                fn (string $role): array => ['value' => $role, 'label' => $expected[$role]],
                UserManagementService::ASSIGNABLE_ROLES
            ),
            $service->roleOptions()
        );
    }

    public function test_unknown_role_falls_back_to_explicit_humanized_label(): void
    {
        Log::shouldReceive('warning')->once()->withArgs(
            fn (string $message, array $context): bool => $message !== ''
                && ($context['role'] ?? null) === 'super-admin'
        );

        $service = new UserManagementService();

        $this->assertSame('Super Admin', $service->roleLabel('super-admin'));
        $this->assertNotContains(
            'super-admin',
            array_column($service->roleOptions(), 'value')
        );
    }
}
