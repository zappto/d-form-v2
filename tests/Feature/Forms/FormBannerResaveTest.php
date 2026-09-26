<?php

namespace Tests\Feature\Forms;

use App\Models\Event;
use App\Models\Form;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Repro untuk 422 `fields.0.name taken` pada banner.
 *
 * Rantai nyata: buildFormBannerBuilderField() (type 'banner') →
 * toBackendField() memetakan ke type 'fileUpload' + name 'form_banner'
 * (payload di bawah meniru persis wire format ini). Bug frontend:
 * crypto.randomUUID() dipanggil di setiap kirim saat state.id null,
 * sehingga autosave kedua mengirim id berbeda dengan name yang sama →
 * afterForFields menolak dengan `fields.0.name taken`. Fix: UUID
 * di-generate sekali lalu ditulis balik ke state (dipakai ulang).
 */
class FormBannerResaveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function bannerRow(string $id): array
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
                'bannerUrl' => 'banners/test.jpg',
                'bannerFileName' => 'test.jpg',
                'content' => 'Caption',
                'formBanner' => true,
            ],
        ];
    }

    private function fieldSavePath(Event $event, Form $form): string
    {
        return route('dashboard.events.forms.fields', [
            'event' => $event,
            'form' => $form,
        ], false);
    }

    public function test_resave_banner_with_same_id_succeeds_twice(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);

        // Mensimulasikan fix frontend: UUID di-generate sekali lalu dipakai ulang.
        $bannerId = (string) Str::uuid();
        $path = $this->fieldSavePath($event, $form);

        $this->actingAs($admin)
            ->postJson($path, ['fields' => [$this->bannerRow($bannerId)]])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->actingAs($admin)
            ->postJson($path, ['fields' => [$this->bannerRow($bannerId)]])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertEquals(1, $form->formFields()->where('name', 'form_banner')->count());
    }

    public function test_resave_banner_with_regenerated_id_is_rejected(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);
        $path = $this->fieldSavePath($event, $form);

        $this->actingAs($admin)
            ->postJson($path, ['fields' => [$this->bannerRow((string) Str::uuid())]])
            ->assertOk();

        // Perilaku lama (bug): tiap kirim generate UUID baru → 422 name taken.
        $this->actingAs($admin)
            ->postJson($path, ['fields' => [$this->bannerRow((string) Str::uuid())]])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['fields.0.name']);
    }
}
