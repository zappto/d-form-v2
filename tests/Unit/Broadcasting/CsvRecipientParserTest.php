<?php

namespace Tests\Unit\Broadcasting;

use App\Services\Broadcasting\CsvRecipientParser;
use Tests\TestCase;

class CsvRecipientParserTest extends TestCase
{
    public function test_parse_csv_ber_header_memetakan_kolom_email_dan_name(): void
    {
        $result = app(CsvRecipientParser::class)->parse("email,name\nandi@example.com,Andi\n");

        $this->assertSame([['name' => 'Andi', 'email' => 'andi@example.com']], $result['valid']);
        $this->assertSame([], $result['invalid']);
    }

    public function test_parse_csv_tanpa_header_memperlakukan_kolom_pertama_sebagai_email(): void
    {
        $result = app(CsvRecipientParser::class)->parse("andi@example.com\nbudi@example.com\n");

        $this->assertSame([
            ['name' => null, 'email' => 'andi@example.com'],
            ['name' => null, 'email' => 'budi@example.com'],
        ], $result['valid']);
        $this->assertSame([], $result['invalid']);
    }

    public function test_parse_csv_tanpa_header_mendukung_pasangan_name_koma_email(): void
    {
        $result = app(CsvRecipientParser::class)->parse("Andi,andi@example.com\n");

        $this->assertSame([['name' => 'Andi', 'email' => 'andi@example.com']], $result['valid']);
        $this->assertSame([], $result['invalid']);
    }

    public function test_parse_melewati_baris_kosong_dan_mencatat_email_invalid(): void
    {
        $result = app(CsvRecipientParser::class)->parse("email,name\n\nbukan-email,X\nandi@example.com,Andi\n");

        $this->assertSame([['name' => 'Andi', 'email' => 'andi@example.com']], $result['valid']);
        $this->assertSame(['bukan-email'], $result['invalid']);
    }

    public function test_parse_menormalisasi_email_jadi_lowercase_dan_trim(): void
    {
        $result = app(CsvRecipientParser::class)->parse("email,name\n  ANDI@Example.COM  ,  Andi  \n");

        $this->assertSame([['name' => 'Andi', 'email' => 'andi@example.com']], $result['valid']);
        $this->assertSame([], $result['invalid']);
    }
}
