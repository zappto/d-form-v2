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

/**
 * Spaced ordering Fase 1-C: order integer gap-1000 + numeric sort murni.
 * Insert tengah/depan hanya mengotori baris baru (existing tak ditulis ulang).
 */
class SpacedOrderSyncTest extends TestCase
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

    public function test_spaced_insert_midpoint_does_not_rewrite_neighbors(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1000);
        $f3 = $this->fieldPayload('note', 'Note', 3000);

        $this->actingAs($admin)->post($url, ['fields' => [$f1, $f3]])->assertRedirect();

        $untouchedBefore = FormField::query()->where('form_id', $form->id)->where('name', 'note')->firstOrFail();
        $untouchedUpdatedAt = $untouchedBefore->updated_at->toDateTimeString();

        // Insert tengah 2000 (midpoint 1000..3000): hanya baris baru yang ditulis.
        $f2 = $this->fieldPayload('phone', 'Phone', 2000);
        $this->actingAs($admin)
            ->post($url, ['fields' => [$f2], 'deleted_ids' => []])
            ->assertRedirect();

        $this->assertDatabaseHas('form_fields', ['form_id' => $form->id, 'name' => 'phone', 'order' => 2000]);

        $untouchedAfter = FormField::query()->where('form_id', $form->id)->where('name', 'note')->firstOrFail();
        $this->assertSame(3000, $untouchedAfter->order);
        $this->assertSame($untouchedUpdatedAt, $untouchedAfter->updated_at->toDateTimeString());

        $names = FormField::query()->where('form_id', $form->id)->orderBy('order')->pluck('name')->all();
        $this->assertSame(['full_name', 'phone', 'note'], $names);
    }

    public function test_front_insert_with_order_zero_sorts_first(): void
    {
        ['admin' => $admin, 'form' => $form, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1000);
        $this->actingAs($admin)->post($url, ['fields' => [$f1]])->assertRedirect();

        $front = $this->fieldPayload('intro', 'Intro', 0);
        $this->actingAs($admin)
            ->post($url, ['fields' => [$front], 'deleted_ids' => []])
            ->assertRedirect();

        $names = FormField::query()->where('form_id', $form->id)->orderBy('order')->pluck('name')->all();
        $this->assertSame(['intro', 'full_name'], $names);
    }

    public function test_float_order_rejected_integer_required(): void
    {
        ['admin' => $admin, 'url' => $url] = $this->seedForm();

        $f1 = $this->fieldPayload('full_name', 'Name', 1500);
        $f1['order'] = 1500.5;

        $this->actingAs($admin)
            ->post($url, ['fields' => [$f1], 'deleted_ids' => []])
            ->assertSessionHasErrors('fields.0.order');
    }
}
