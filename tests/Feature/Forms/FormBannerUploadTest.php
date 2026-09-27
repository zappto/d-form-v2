<?php

namespace Tests\Feature\Forms;

use App\Models\Event;
use App\Models\Form;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Banner form builder diupload sebagai file (multipart part `banner_file`),
 * bukan base64 inline — DB hanya menyimpan path (`forms/banners/...`).
 *
 * Wire format meniru frontend: FormData dengan `fields` + `deleted_ids`
 * sebagai JSON-string part + `banner_file` sebagai file part, tanpa
 * endpoint/route baru (handler POST /fields yang sama).
 */
class FormBannerUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        Storage::fake('public');
    }

    private function fieldSavePath(Event $event, Form $form): string
    {
        return route('dashboard.events.forms.fields', [
            'event' => $event,
            'form' => $form,
        ], false);
    }

    private function fieldMetadata(Form $form): array
    {
        $field = $form->formFields()->where('name', 'form_banner')->firstOrFail();
        $metadata = $field->metadata;
        if ($metadata instanceof \Illuminate\Support\Collection) {
            return $metadata->all();
        }

        return is_array($metadata) ? $metadata : (array) $metadata;
    }

    private function bannerRow(string $id, string $bannerUrl): array
    {
        return [
            'id' => $id,
            'label' => 'Form banner',
            'description' => '',
            'name' => 'form_banner',
            'type' => 'fileUpload',
            'order' => 1,
            'metadata' => [
                'rules' => [],
                'builderType' => 'banner',
                'accepts' => 'gif, png, jpg, jpeg',
                'bannerUrl' => $bannerUrl,
                'bannerFileName' => 'banner.jpg',
                'content' => 'Caption',
                'formBanner' => true,
            ],
        ];
    }

    public function test_banner_file_upload_stores_path_not_base64(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);
        $bannerId = (string) Str::uuid();

        $response = $this->actingAs($admin)->post($path, [
            'fields' => json_encode([$this->bannerRow($bannerId, '')]),
            'deleted_ids' => json_encode([]),
            'banner_file' => UploadedFile::fake()->image('banner.jpg', 1200, 400),
        ], [
            'Accept' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
        ]);

        $response->assertOk()->assertJson(['ok' => true]);
        $storedPath = $response->json('banner_url');
        $this->assertIsString($storedPath);
        $this->assertStringStartsWith('forms/banners/', $storedPath);
        $this->assertStringNotContainsString('data:', $storedPath);
        Storage::disk('public')->assertExists($storedPath);

        // Kolom forms.banner_url ikut menunjuk path hasil upload.
        $this->assertSame($storedPath, $form->fresh()->banner_url);

        // Metadata synthetic field menyimpan path pendek — render tak bawa MB-an base64.
        $metadata = $this->fieldMetadata($form);
        $this->assertSame($storedPath, $metadata['bannerUrl']);
        $this->assertLessThan(200, strlen((string) $metadata['bannerUrl']));
        $this->assertStringNotContainsString('base64', (string) $metadata['bannerUrl']);
    }

    public function test_post_without_banner_file_behaves_as_before(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);
        $bannerId = (string) Str::uuid();

        $this->actingAs($admin)
            ->postJson($path, ['fields' => [$this->bannerRow($bannerId, 'forms/banners/existing.jpg')]])
            ->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonMissing(['banner_url']);

        $metadata = $this->fieldMetadata($form);
        $this->assertSame('forms/banners/existing.jpg', $metadata['bannerUrl']);
        $this->assertNull($form->fresh()->banner_url);
    }

    public function test_legacy_base64_row_left_as_is_without_banner_file(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);
        $bannerId = (string) Str::uuid();
        $legacy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        $this->actingAs($admin)
            ->postJson($path, ['fields' => [$this->bannerRow($bannerId, $legacy)]])
            ->assertOk();

        $metadata = $this->fieldMetadata($form);
        $this->assertSame($legacy, $metadata['bannerUrl']);
    }

    public function test_banner_file_rejects_non_image(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);

        $this->actingAs($admin)->post($path, [
            'fields' => json_encode([$this->bannerRow((string) Str::uuid(), '')]),
            'deleted_ids' => json_encode([]),
            'banner_file' => UploadedFile::fake()->create('dokumen.pdf', 100, 'application/pdf'),
        ], [
            'Accept' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
        ])->assertStatus(422)->assertJsonValidationErrors(['banner_file']);
    }

    public function test_banner_file_rejects_over_5mb(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);

        $this->actingAs($admin)->post($path, [
            'fields' => json_encode([$this->bannerRow((string) Str::uuid(), '')]),
            'deleted_ids' => json_encode([]),
            'banner_file' => UploadedFile::fake()->image('banner.jpg')->size(5121),
        ], [
            'Accept' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['banner_file' => 'Ukuran banner maksimal 5 MB.']);
    }
}
