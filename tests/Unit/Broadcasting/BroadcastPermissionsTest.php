<?php

namespace Tests\Unit\Broadcasting;

use App\Support\BroadcastPermissions;
use Tests\TestCase;

class BroadcastPermissionsTest extends TestCase
{
    public function test_nilai_konstanta_terkunci_sama_dengan_permission_di_db(): void
    {
        $this->assertSame('email-broadcast.view', BroadcastPermissions::VIEW);
        $this->assertSame('email-broadcast.create', BroadcastPermissions::CREATE);
        $this->assertSame('email-broadcast.schedule', BroadcastPermissions::SCHEDULE);
        $this->assertSame('email-broadcast.cancel', BroadcastPermissions::CANCEL);
        $this->assertSame('email-broadcast.retry', BroadcastPermissions::RETRY);
        $this->assertSame('email-broadcast.delete', BroadcastPermissions::DELETE);
    }
}
