<?php

namespace Tests\Unit\Support;

use App\Support\EmailAddress;
use Tests\TestCase;

class EmailAddressTest extends TestCase
{
    public function test_normalize_email_mengembalikan_email_valid_apa_adanya(): void
    {
        $this->assertSame('andi@example.com', EmailAddress::normalizeEmail('andi@example.com'));
    }

    public function test_normalize_email_menangani_huruf_besar_dan_spasi(): void
    {
        $this->assertSame('andi@example.com', EmailAddress::normalizeEmail('  ANDI@Example.COM  '));
    }

    public function test_normalize_email_mengembalikan_null_untuk_email_invalid(): void
    {
        $this->assertNull(EmailAddress::normalizeEmail('bukan-email'));
    }

    public function test_normalize_email_mengembalikan_null_untuk_kosong(): void
    {
        $this->assertNull(EmailAddress::normalizeEmail(''));
        $this->assertNull(EmailAddress::normalizeEmail('   '));
        $this->assertNull(EmailAddress::normalizeEmail(null));
    }
}
