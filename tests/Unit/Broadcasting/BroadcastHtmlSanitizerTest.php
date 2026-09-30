<?php

namespace Tests\Unit\Broadcasting;

use App\Services\Broadcasting\BroadcastHtmlSanitizer;
use Tests\TestCase;

class BroadcastHtmlSanitizerTest extends TestCase
{
    /** Unwrap font wajib tetap menghapus onerror pada img pindahan (DFORM-76). */
    public function test_unwrap_font_menghapus_onerror_img_pindahan(): void
    {
        $clean = $this->sanitize('<font><img src="https://example.com/x.png" onerror="alert(1)"></font>');

        $this->assertStringNotContainsString('onerror', $clean);
        $this->assertStringContainsString('https://example.com/x.png', $clean);
    }

    /** Tag script dibuang, teks aman di sekitarnya dipertahankan. */
    public function test_script_dibuang_teks_disekitarnya_aman(): void
    {
        $clean = $this->sanitize('<script>alert(1)</script><p>Halo</p>');

        $this->assertStringNotContainsString('<script', $clean);
        $this->assertStringNotContainsString('alert(1)', $clean);
        $this->assertStringContainsString('Halo', $clean);
    }

    /** Unwrap font bersarang wajib membuang svg+onload pindahan hingga ke teks. */
    public function test_unwrap_bersarang_membuang_svg_onload(): void
    {
        $clean = $this->sanitize('<font><svg onload="alert(1)">x</svg></font>');

        $this->assertStringNotContainsString('onload', $clean);
        $this->assertStringNotContainsString('<svg', $clean);
        $this->assertStringContainsString('x', $clean);
    }

    /** Unwrap math>font wajib membersihkan href javascript pada a pindahan. */
    public function test_unwrap_math_font_membersihkan_href_javascript(): void
    {
        $clean = $this->sanitize('<math><font><a href="javascript:alert(1)">klik</a></font></math>');

        $this->assertStringNotContainsString('javascript:', $clean);
        $this->assertStringContainsString('klik', $clean);
    }

    /** Kontrol jalur allowlist: a javascript: langsung dibersihkan. */
    public function test_kontrol_a_javascript_langsung_dibersihkan(): void
    {
        $clean = $this->sanitize('<a href="javascript:alert(1)">klik</a>');

        $this->assertStringNotContainsString('javascript:', $clean);
        $this->assertStringContainsString('klik', $clean);
    }

    /** Unwrap font wajib membersihkan style expression pada span pindahan. */
    public function test_unwrap_font_membersihkan_style_expression_span(): void
    {
        $clean = $this->sanitize('<font><span style="width: expression(alert(1))">teks</span></font>');

        $this->assertStringNotContainsString('expression(', $clean);
        $this->assertStringContainsString('teks', $clean);
    }

    /** Style expression() pada prop allowlist wajib dibuang, teks kept (DFORM-76). */
    public function test_style_expression_pada_prop_allowlist_dibuang(): void
    {
        $clean = $this->sanitize('<p style="color: expression(alert(1))">x</p>');

        $this->assertStringNotContainsString('expression(', $clean);
        $this->assertStringContainsString('x', $clean);
    }

    /** Tag dan atribut allowlist yang valid tidak ikut terbuang (anti over-strip). */
    public function test_allowlist_valid_dipertahankan(): void
    {
        $clean = $this->sanitize(
            '<p>Halo <strong>dunia</strong></p><a href="https://example.com">ok</a><img src="https://example.com/x.png" alt="foto">'
        );

        $this->assertStringContainsString('<p>', $clean);
        $this->assertStringContainsString('<strong>dunia</strong>', $clean);
        $this->assertStringContainsString('https://example.com', $clean);
        $this->assertStringContainsString('<img', $clean);
        $this->assertStringContainsString('alt="foto"', $clean);
    }

    /** Sanitasi satu HTML lewat sanitizer yang sama dengan controller. */
    private function sanitize(string $html): string
    {
        return app(BroadcastHtmlSanitizer::class)->sanitize($html);
    }
}
