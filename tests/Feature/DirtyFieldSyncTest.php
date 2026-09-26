<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Form;
use App\Models\FormField;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DirtyFieldSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    /**
     * @return array{admin: User, event: Event, form: Form, url: string}
     */
    private function seedForm(): array
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);

        $url = route('dashboard.events.forms.fields', [
            'event' => $event,
            'form' => $form,
        ], false);

        return compact('admin', 'event', 'form', 'url');
    }

    /**
     * @return array<string, mixed>
     */
    private function fieldPayload(string $name, string $label, int $order, ?string $id = null): array
    {
        return [
            'id' => $id ?? (string) Str::uuid(),
            'label' => $label,
            'type' => 'input',
            'name' => $name,
            'order' => $order,
            'metadata' => ['type' => 'text', 'placeholder' => '', 'rules' => [], 'builderType' => 'short_text'],
            'is_append' => false,
        ];
    }

    public function test_partial_dirty_subset_updates_only_dirty_rows(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1);
        $f2 = $this->fieldPayload('note', 'Note', 2);

        $this->actingAs($admin)->post($url, ['fields' => [$f1, $f2]])->assertRedirect();

        $untouchedBefore = FormField::query()->where('form_id', $form->id)->where('name', 'note')->firstOrFail();
        $untouchedUpdatedAt = $untouchedBefore->updated_at->toDateTimeString();

        // Dirty-subset: hanya baris yang berubah + deleted_ids eksplisit.
        $f1['label'] = 'Name updated';
        $this->actingAs($admin)
            ->post($url, ['fields' => [$f1], 'deleted_ids' => []])
            ->assertRedirect();

        $this->assertDatabaseHas('form_fields', [
            'form_id' => $form->id,
            'name' => 'full_name',
            'label' => 'Name updated',
        ]);
        // Baris bersih tidak ditulis ulang dan tidak terhapus oleh omission.
        $untouchedAfter = FormField::query()->where('form_id', $form->id)->where('name', 'note')->firstOrFail();
        $this->assertSame('Note', $untouchedAfter->label);
        $this->assertSame(2, $untouchedAfter->order);
        $this->assertSame($untouchedUpdatedAt, $untouchedAfter->updated_at->toDateTimeString());
        $this->assertSame(2, FormField::query()->where('form_id', $form->id)->count());
    }

    public function test_partial_post_via_json_returns_ok(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1);
        $this->actingAs($admin)->post($url, ['fields' => [$f1]])->assertRedirect();

        $f1['label'] = 'Name via autosave';
        $this->actingAs($admin)
            ->post($url, ['fields' => [$f1], 'deleted_ids' => []], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseHas('form_fields', [
            'form_id' => $form->id,
            'name' => 'full_name',
            'label' => 'Name via autosave',
        ]);
    }

    public function test_explicit_deleted_ids_deletes_without_deleting_omitted_rows(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1);
        $f2 = $this->fieldPayload('note', 'Note', 2);
        $f3 = $this->fieldPayload('phone', 'Phone', 3);

        $this->actingAs($admin)->post($url, ['fields' => [$f1, $f2, $f3]])->assertRedirect();

        // f1 dikirim ulang apa adanya, f2 tidak ikut terkirim (bersih), f3 dihapus eksplisit.
        $this->actingAs($admin)
            ->post($url, ['fields' => [$f1], 'deleted_ids' => [$f3['id']]])
            ->assertRedirect();

        $this->assertSoftDeleted('form_fields', ['form_id' => $form->id, 'name' => 'phone']);
        $this->assertSame(2, FormField::query()->where('form_id', $form->id)->count());
        $this->assertDatabaseHas('form_fields', ['form_id' => $form->id, 'name' => 'note']);
    }

    public function test_full_delete_via_deleted_ids_with_empty_fields(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1);
        $f2 = $this->fieldPayload('note', 'Note', 2);

        $this->actingAs($admin)->post($url, ['fields' => [$f1, $f2]])->assertRedirect();

        $this->actingAs($admin)
            ->post($url, ['fields' => [], 'deleted_ids' => [$f1['id'], $f2['id']]])
            ->assertRedirect();

        $this->assertSame(0, FormField::query()->where('form_id', $form->id)->count());
        $this->assertSoftDeleted('form_fields', ['form_id' => $form->id, 'name' => 'full_name']);
        $this->assertSoftDeleted('form_fields', ['form_id' => $form->id, 'name' => 'note']);
    }

    public function test_legacy_full_array_omission_still_supported(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1);
        $f2 = $this->fieldPayload('note', 'Note', 2);

        $this->actingAs($admin)->post($url, ['fields' => [$f1, $f2]])->assertRedirect();

        // Tanpa key deleted_ids → mode full lama: omission = delete.
        $this->actingAs($admin)->post($url, ['fields' => [$f1]])->assertRedirect();

        $this->assertSoftDeleted('form_fields', ['form_id' => $form->id, 'name' => 'note']);
        $this->assertSame(1, FormField::query()->where('form_id', $form->id)->count());
    }

    public function test_reused_id_after_delete_restores_instead_of_1062(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1);

        $this->actingAs($admin)->post($url, ['fields' => [$f1]])->assertRedirect();
        $this->actingAs($admin)->post($url, ['fields' => [], 'deleted_ids' => [$f1['id']]])->assertRedirect();
        $this->assertSoftDeleted('form_fields', ['id' => $f1['id']]);

        // Id yang sama dipakai lagi (mis. banner sticky pasca-hapus): tanpa
        // rescue, create di PK yang masih ditempati baris soft-deleted → 1062.
        $f1['label'] = 'Name restored';
        $this->actingAs($admin)
            ->post($url, ['fields' => [$f1], 'deleted_ids' => []])
            ->assertRedirect();

        $this->assertSame(
            1,
            FormField::query()->withTrashed()->where('id', $f1['id'])->count(),
            'Duplicate row created for reused id.'
        );
        $restored = FormField::query()->where('id', $f1['id'])->firstOrFail();
        $this->assertSame('Name restored', $restored->label);
        $this->assertSame($form->id, $restored->form_id);
    }

    public function test_repeated_submit_of_same_new_id_is_idempotent(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        // Simulasi double-flush: dua submit berurutan membawa id baru yang sama.
        $f1 = $this->fieldPayload('full_name', 'Name', 1);

        $this->actingAs($admin)->post($url, ['fields' => [$f1], 'deleted_ids' => []])->assertRedirect();
        $this->actingAs($admin)->post($url, ['fields' => [$f1], 'deleted_ids' => []])->assertRedirect();

        $this->assertSame(1, FormField::query()->where('form_id', $form->id)->count());
    }

    public function test_deleted_ids_rejects_non_uuid(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1);
        $this->actingAs($admin)->post($url, ['fields' => [$f1]])->assertRedirect();

        $this->actingAs($admin)
            ->post($url, ['fields' => [], 'deleted_ids' => ['not-a-uuid']])
            ->assertSessionHasErrors('deleted_ids.0');

        $this->assertSame(1, FormField::query()->where('form_id', $form->id)->count());
    }
}
