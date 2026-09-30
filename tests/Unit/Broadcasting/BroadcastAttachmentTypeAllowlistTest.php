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
use ZipArchive;

class BroadcastAttachmentTypeAllowlistTest extends TestCase
{
    use RefreshDatabase;

    /** PDF jujur lolos; nama simpan ternormalisasi dan nama display utuh. */
    public function test_legit_pdf_lolos_dan_nama_simpan_ternormalisasi(): void
    {
        $broadcast = $this->makeBroadcast();
        Storage::fake('local');

        $file = UploadedFile::fake()->createWithContent('laporan akhir (v2).pdf', "%PDF-1.4\n%lampiran sah");

        $attachment = app(BroadcastAttachmentService::class)->store($broadcast, $file);

        $this->assertSame('laporan akhir (v2).pdf', $attachment->file_name);
        $this->assertMatchesRegularExpression(
            '#^broadcasts/'.$broadcast->id.'/[0-9a-f-]{36}_laporan_akhir_v2_\\.pdf$#',
            $attachment->file_path,
        );
        Storage::disk('local')->assertExists($attachment->file_path);
    }

    /** Gambar raster dan teks sah lolos lapis-2 service. */
    public function test_legit_gambar_dan_teks_lolos(): void
    {
        $broadcast = $this->makeBroadcast();
        Storage::fake('local');

        foreach ([
            UploadedFile::fake()->image('foto.jpg', 640, 480),
            UploadedFile::fake()->image('grafik.png', 640, 480),
            UploadedFile::fake()->createWithContent('catatan.txt', "baris satu\nbaris dua"),
            UploadedFile::fake()->createWithContent('data.csv', "nama,email\nNafan,n@x.id"),
        ] as $file) {
            $attachment = app(BroadcastAttachmentService::class)->store($broadcast, $file);
            Storage::disk('local')->assertExists($attachment->file_path);
        }
    }

    /** DOCX berupa zip valid lolos (finfo menebak application/zip yang memang allowlist). */
    public function test_legit_docx_berupa_zip_lolos(): void
    {
        $broadcast = $this->makeBroadcast();
        Storage::fake('local');

        $attachment = app(BroadcastAttachmentService::class)->store(
            $broadcast,
            UploadedFile::fake()->createWithContent('dokumen.docx', $this->minimalZipBytes()),
        );

        Storage::disk('local')->assertExists($attachment->file_path);
    }

    /** Ekstensi executable langsung ditolak walau kontennya polos. */
    public function test_ekstensi_executable_ditolak(): void
    {
        $broadcast = $this->makeBroadcast();
        Storage::fake('local');
        $php = '<?php echo "pwn"; ?>';

        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('shell.php', $php));
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('shell.phtml', $php));
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('paket.phar', $php));
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('page.html', '<html><body>x</body></html>'));
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('grafik.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('README', 'tanpa ekstensi'));
    }

    /** Double-extension dengan segmen berbahaya ditolak walau ekstensi akhir allowlist. */
    public function test_double_extension_berbahaya_ditolak(): void
    {
        $broadcast = $this->makeBroadcast();
        Storage::fake('local');

        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->image('file.php.jpg', 640, 480));
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('arsip.phtml.zip', 'PK'));
    }

    /** MIME-spoof: ekstensi allowlist + konten PHP/SVG/HTML ditolak via tebakan finfo. */
    public function test_mime_spoof_ditolak(): void
    {
        $broadcast = $this->makeBroadcast();
        Storage::fake('local');

        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('laporan.pdf', '<?php echo "pwn"; ?>'));
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('foto.jpg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('info.pdf', '<html><body>phish</body></html>'));
    }

    /** Traversal `../` ditolak walau framework membasenamakan nama klien normal. */
    public function test_nama_traversal_ditolak(): void
    {
        $broadcast = $this->makeBroadcast();
        Storage::fake('local');

        $inner = UploadedFile::fake()->createWithContent('evil.pdf', "%PDF-1.4\n%jebakan");
        $traversal = new class ($inner->getPathname(), 'evil.pdf', null, null, true) extends UploadedFile {
            public function getClientOriginalName(): string
            {
                return '../../evil.pdf';
            }
        };

        $this->assertStoreDitolak422($broadcast, $traversal);
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent('..evil.pdf', '%PDF-1.4'));
        $this->assertStoreDitolak422($broadcast, UploadedFile::fake()->createWithContent("evil.pdf\0.php", '%PDF-1.4'));
    }

    /** Allowlist kanonik tunggal mencakup semua tipe email-attachment-safe. */
    public function test_allowlist_kanonik_tunggal(): void
    {
        $this->assertSame(
            ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip'],
            BroadcastAttachmentService::allowedExtensions(),
        );
        $this->assertContains('application/pdf', BroadcastAttachmentService::allowedMimeTypes());
        $this->assertContains('application/zip', BroadcastAttachmentService::allowedMimeTypes());
    }

    /** Simpan dan pastikan ditolak 422; gagal bila file berbahaya lolos. */
    private function assertStoreDitolak422(EmailBroadcast $broadcast, UploadedFile $file): void
    {
        try {
            app(BroadcastAttachmentService::class)->store($broadcast, $file);
        } catch (HttpException $e) {
            $this->assertSame(422, $e->getStatusCode());

            return;
        }

        $this->fail('File berbahaya lolos: '.$file->getClientOriginalName());
    }

    /** Membuat broadcast draft minimal untuk uji simpan attachment. */
    private function makeBroadcast(): EmailBroadcast
    {
        return EmailBroadcast::query()->create([
            'name' => 'Uji Allowlist',
            'status' => EmailBroadcastStatus::Draft,
        ]);
    }

    /** Menyusun arsip zip minimal yang valid untuk menyamar sebagai OOXML. */
    private function minimalZipBytes(): string
    {
        $zipPath = tempnam(sys_get_temp_dir(), 'docx');
        $this->assertNotFalse($zipPath);

        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types></Types>');
        $zip->close();

        return (string) file_get_contents($zipPath);
    }
}
