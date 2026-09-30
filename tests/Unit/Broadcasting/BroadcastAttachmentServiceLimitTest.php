<?php

namespace Tests\Unit\Broadcasting;

use App\Enums\EmailBroadcastStatus;
use App\Models\EmailBroadcast;
use App\Services\Broadcasting\BroadcastAttachmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class BroadcastAttachmentServiceLimitTest extends TestCase
{
    use RefreshDatabase;

    /** Batas kanonik tetap 1.5 MB dan duplikat konstanta lama sudah dihapus. */
    public function test_batas_kanonik_tetap_1_5_mb_tanpa_duplikat(): void
    {
        $this->assertSame(1572864, BroadcastAttachmentService::MAX_BROADCAST_UPLOAD_BYTES);
        $this->assertFalse(defined(BroadcastAttachmentService::class.'::MAX_FILE_BYTES'));
        $this->assertFalse(defined(BroadcastAttachmentService::class.'::MAX_INLINE_IMAGE_BYTES'));
    }

    /** File attachment tepat-batas lolos dan tersimpan. */
    public function test_attachment_tepat_batas_lolos(): void
    {
        $broadcast = $this->makeBroadcast();
        Storage::fake('local');

        $file = UploadedFile::fake()->create('dokumen.pdf', 1536, 'application/pdf');

        $attachment = app(BroadcastAttachmentService::class)->store($broadcast, $file);

        $this->assertSame(1572864, $attachment->file_size);
        Storage::disk('local')->assertExists($attachment->file_path);
    }

    /** File attachment lewat-batas ditolak 422. */
    public function test_attachment_lewat_batas_ditolak(): void
    {
        $broadcast = $this->makeBroadcast();
        Storage::fake('local');

        $file = UploadedFile::fake()->create('besar.pdf', 1537, 'application/pdf');

        $this->expectException(HttpException::class);

        app(BroadcastAttachmentService::class)->store($broadcast, $file);
    }

    /** Inline image tepat-batas lolos validasi. */
    public function test_inline_image_tepat_batas_lolos(): void
    {
        $result = app(BroadcastAttachmentService::class)->validateInlineImages($this->inlineHtml(1572864));

        $this->assertSame(['ok' => true], $result);
    }

    /** Inline image lewat-batas ditolak dengan pesan 1.5 MB. */
    public function test_inline_image_lewat_batas_ditolak(): void
    {
        $result = app(BroadcastAttachmentService::class)->validateInlineImages($this->inlineHtml(1572865));

        $this->assertFalse($result['ok']);
        $this->assertSame('Inline image melebihi 1.5 MB.', $result['message']);
    }

    /** Membuat broadcast draft minimal untuk uji simpan attachment. */
    private function makeBroadcast(): EmailBroadcast
    {
        return EmailBroadcast::query()->create([
            'name' => 'Uji Batas',
            'status' => EmailBroadcastStatus::Draft,
        ]);
    }

    /** Menyusun HTML dengan satu inline image berukuran biner tertentu. */
    private function inlineHtml(int $binarySize): string
    {
        return '<img src="data:image/png;base64,'.base64_encode(str_repeat('a', $binarySize)).'">';
    }
}
