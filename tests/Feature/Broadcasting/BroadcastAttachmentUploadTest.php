<?php

namespace Tests\Feature\Broadcasting;

use App\Enums\EmailBroadcastStatus;
use App\Models\EmailBroadcast;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BroadcastAttachmentUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /** Buat super-admin untuk melewati gate email-broadcast.*. */
    private function superAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('super-admin');

        return $admin;
    }

    /** Buat broadcast draft milik admin yang masih bisa dilampiri. */
    private function draftBroadcast(User $owner): EmailBroadcast
    {
        return EmailBroadcast::query()->create([
            'name' => 'Unggah Lampiran',
            'scheduled_at' => now()->addDay(),
            'delay_min' => 0,
            'delay_max' => 0,
            'status' => EmailBroadcastStatus::Draft,
            'created_by' => $owner->id,
        ]);
    }

    /** Skrip PHP langsung ditolak validasi lapis-1 (mimes/mimetypes). */
    public function test_upload_php_ditolak_validasi(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);
        Storage::fake('local');

        $this->post(route('dashboard.broadcasts.attachments.store', $broadcast), [
            'file' => UploadedFile::fake()->createWithContent('shell.php', '<?php echo "pwn"; ?>'),
        ])->assertSessionHasErrors('file');

        $this->assertDatabaseCount('email_broadcast_attachments', 0);
    }

    /** SVG ber-script ditolak validasi lapis-1 walau mengaku gambar. */
    public function test_upload_svg_ditolak_validasi(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);
        Storage::fake('local');

        $this->post(route('dashboard.broadcasts.attachments.store', $broadcast), [
            'file' => UploadedFile::fake()->createWithContent(
                'grafik.svg',
                '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            ),
        ])->assertSessionHasErrors('file');

        $this->assertDatabaseCount('email_broadcast_attachments', 0);
    }

    /** MIME-spoof (pdf berisi PHP) ditolak lapis-2 service dengan 422. */
    public function test_upload_spoof_pdf_ditolak_service(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);
        Storage::fake('local');

        $this->post(route('dashboard.broadcasts.attachments.store', $broadcast), [
            'file' => UploadedFile::fake()->createWithContent('laporan.pdf', '<?php echo "pwn"; ?>'),
        ])->assertStatus(422);

        $this->assertDatabaseCount('email_broadcast_attachments', 0);
    }

    /** Double-extension berbahaya ditolak lapis-2 service dengan 422. */
    public function test_upload_double_extension_ditolak_service(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);
        Storage::fake('local');

        $this->post(route('dashboard.broadcasts.attachments.store', $broadcast), [
            'file' => UploadedFile::fake()->image('file.php.jpg', 640, 480),
        ])->assertStatus(422);

        $this->assertDatabaseCount('email_broadcast_attachments', 0);
    }

    /** PDF jujur tetap lolos dan tercatat dengan nama display asli. */
    public function test_upload_legit_pdf_lolos(): void
    {
        $admin = $this->superAdmin();
        $this->actingAs($admin);
        $broadcast = $this->draftBroadcast($admin);
        Storage::fake('local');

        $this->post(route('dashboard.broadcasts.attachments.store', $broadcast), [
            'file' => UploadedFile::fake()->createWithContent('laporan.pdf', "%PDF-1.4\n%lampiran sah"),
        ])->assertStatus(302);

        $this->assertDatabaseHas('email_broadcast_attachments', [
            'broadcast_id' => $broadcast->id,
            'file_name' => 'laporan.pdf',
        ]);
    }
}
