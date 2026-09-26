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
 * Gambar opsi (checkbox/radio) diupload sebagai file (multipart part
 * `option_images[fieldId][optionId]`), bukan base64 inline — DB hanya
 * menyimpan path (`forms/options/...`).
 *
 * Wire format meniru frontend: FormData dengan `fields` + `deleted_ids`
 * sebagai JSON-string part + file per opsi, tanpa endpoint/route baru
 * (handler POST /fields yang sama, pola banner_file).
 */
class FormOptionImageUploadTest extends TestCase
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

    private function optionMetadata(Form $form, string $fieldId): array
    {
        $field = $form->formFields()->where('id', $fieldId)->firstOrFail();
        $metadata = $field->metadata;
        if ($metadata instanceof \Illuminate\Support\Collection) {
            return $metadata->all();
        }

        return is_array($metadata) ? $metadata : (array) $metadata;
    }

    private function checkboxRow(string $fieldId, string $optionId, string $imageUrl): array
    {
        return [
            'id' => $fieldId,
            'label' => 'Pilih gambar',
            'description' => '',
            'name' => 'pilih_gambar',
            'type' => 'checkbox',
            'order' => 1000,
            'metadata' => [
                'is_multiple' => true,
                'rules' => ['in' => 'Kucing'],
                'builderType' => 'checkbox',
                'optionChoices' => [
                    [
                        'id' => $optionId,
                        'type' => 'image',
                        'label' => 'Kucing',
                        // Frontend kirim '' selama file pending (tanpa data:).
                        'imageUrl' => $imageUrl,
                    ],
                ],
            ],
        ];
    }

    public function test_option_image_upload_stores_path_not_base64(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);
        $fieldId = (string) Str::uuid();
        $optionId = (string) Str::uuid();

        $response = $this->actingAs($admin)->post($path, [
            'fields' => json_encode([$this->checkboxRow($fieldId, $optionId, '')]),
            'deleted_ids' => json_encode([]),
            'option_images' => [$fieldId => [$optionId => UploadedFile::fake()->image('kucing.jpg', 800, 800)]],
        ], [
            'Accept' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
        ]);

        $response->assertOk()->assertJson(['ok' => true]);
        $storedMap = $response->json('option_images');
        $this->assertIsArray($storedMap);
        $storedPath = $storedMap["{$fieldId}:{$optionId}"] ?? null;
        $this->assertIsString($storedPath);
        $this->assertStringStartsWith('forms/options/', $storedPath);
        $this->assertStringNotContainsString('data:', $storedPath);
        Storage::disk('public')->assertExists($storedPath);

        // Metadata menyimpan path pendek — render tak bawa MB-an base64.
        $metadata = $this->optionMetadata($form, $fieldId);
        $imageUrl = $metadata['optionChoices'][0]['imageUrl'] ?? null;
        $this->assertSame($storedPath, $imageUrl);
        $this->assertLessThan(200, strlen((string) $imageUrl));
        $this->assertStringNotContainsString('base64', (string) $imageUrl);
        $this->assertStringNotContainsString('data:', (string) $imageUrl);
    }

    public function test_post_without_option_file_behaves_as_before(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);
        $fieldId = (string) Str::uuid();
        $optionId = (string) Str::uuid();

        $this->actingAs($admin)
            ->postJson($path, ['fields' => [$this->checkboxRow($fieldId, $optionId, 'forms/options/existing.jpg')]])
            ->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonMissing(['option_images']);

        $metadata = $this->optionMetadata($form, $fieldId);
        $this->assertSame('forms/options/existing.jpg', $metadata['optionChoices'][0]['imageUrl']);
    }

    public function test_legacy_base64_row_left_as_is_without_option_file(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);
        $fieldId = (string) Str::uuid();
        $optionId = (string) Str::uuid();
        $legacy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        $this->actingAs($admin)
            ->postJson($path, ['fields' => [$this->checkboxRow($fieldId, $optionId, $legacy)]])
            ->assertOk();

        $metadata = $this->optionMetadata($form, $fieldId);
        $this->assertSame($legacy, $metadata['optionChoices'][0]['imageUrl']);
    }

    public function test_option_image_rejects_non_image(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);
        $fieldId = (string) Str::uuid();
        $optionId = (string) Str::uuid();

        $response = $this->actingAs($admin)->post($path, [
            'fields' => json_encode([$this->checkboxRow($fieldId, $optionId, '')]),
            'deleted_ids' => json_encode([]),
            'option_images' => [$fieldId => [$optionId => UploadedFile::fake()->create('dokumen.pdf', 100, 'application/pdf')]],
        ], [
            'Accept' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
        ]);
        $response->assertStatus(422);
        $errors = $response->json('errors', []);
        $this->assertNotEmpty($errors);
        $hasOptionError = false;
        foreach (array_keys($errors) as $key) {
            if (is_string($key) && str_starts_with($key, 'option_images')) {
                $hasOptionError = true;
                break;
            }
        }
        $this->assertTrue($hasOptionError, 'Expected validation error for option_images, got: '.json_encode($errors));
    }
}
