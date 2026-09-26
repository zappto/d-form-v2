<?php

namespace Tests\Feature\Forms;

use App\Models\Event;
use App\Models\Form;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormAutosaveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function autosaveUri(Event $event, Form $form): string
    {
        return route('dashboard.events.forms.autosave', ['event' => $event, 'form' => $form], false);
    }

    public function test_patch_title_only_with_empty_description_keeps_description(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create([
            'event_id' => $event->id,
            'title' => 'Old title',
            'description' => 'Must stay',
        ]);

        // Frontend autosave mengirim FULL header; description '' diubah
        // ConvertEmptyStringsToNull menjadi null → tidak boleh 500 (1048)
        // dan description di DB tidak boleh berubah.
        $this->actingAs($admin)
            ->patchJson($this->autosaveUri($event, $form), [
                'title' => 'New title',
                'description' => '',
            ])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $form->refresh();
        $this->assertSame('New title', $form->title);
        $this->assertSame('Must stay', $form->description);
    }

    public function test_patch_partial_without_blank_keys_keeps_description(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create([
            'event_id' => $event->id,
            'title' => 'Old title',
            'description' => 'Must stay',
        ]);

        // Kontrak baru frontend blank-guard: key required yang kosong/blank
        // dikecualikan dari payload PATCH (partial, tanpa key) — bukan dikirim
        // ''/null. Description tanpa key harus tetap utuh.
        $this->actingAs($admin)
            ->patchJson($this->autosaveUri($event, $form), [
                'title' => 'New title',
            ])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $form->refresh();
        $this->assertSame('New title', $form->title);
        $this->assertSame('Must stay', $form->description);
    }

    public function test_patch_null_visible_for_is_skipped(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);

        $before = $form->visible_for->map(fn ($e) => $e->value)->values()->all();

        $this->actingAs($admin)
            ->patchJson($this->autosaveUri($event, $form), [
                'title' => 'Renamed',
                'visible_for' => null,
            ])
            ->assertOk();

        $form->refresh();
        $this->assertSame('Renamed', $form->title);
        $this->assertSame($before, $form->visible_for->map(fn ($e) => $e->value)->values()->all());
    }

    public function test_patch_nullable_columns_can_still_be_cleared(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $event = Event::factory()->create();
        $form = Form::factory()->create([
            'event_id' => $event->id,
            'banner_url' => 'https://example.com/b.png',
            'banner_caption' => 'Caption',
        ]);

        $this->actingAs($admin)
            ->patchJson($this->autosaveUri($event, $form), [
                'banner_url' => null,
                'banner_caption' => null,
                'closed_at' => null,
            ])
            ->assertOk();

        $form->refresh();
        $this->assertNull($form->banner_url);
        $this->assertNull($form->banner_caption);
        $this->assertNull($form->closed_at);
    }
}
