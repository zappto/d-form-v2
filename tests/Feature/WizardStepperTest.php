<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\Form;
use App\Models\FormField;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class WizardStepperTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    // ── POST /admin/events (content negotiation: JSON / X-Inertia) ──────────────

    public function test_json_store_returns_200_with_event_id_and_slug(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $registrationStart = now()->startOfDay();
        $registrationEnd = now()->addDays(3)->endOfDay();
        $startDate = now()->addDays(10)->startOfDay();
        $endDate = now()->addDays(11)->startOfDay();

        $response = $this->actingAs($admin)->post(
            route('dashboard.events.store'),
            [
                'title' => 'Wizard Draft Event',
                'location' => 'Campus Hall',
                'description' => 'A full description for the event.',
                'registration_start' => $registrationStart->toDateString(),
                'registration_end' => $registrationEnd->toDateString(),
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'quota' => 100,
                'price' => '5000',
                'session' => 'general',
                'category' => 'rkt',
                'banner' => UploadedFile::fake()->image('banner.jpg', 1200, 675),
                'publish' => false,
            ],
            ['Accept' => 'application/json']
        );

        $response->assertOk();
        $response->assertJsonStructure(['event' => ['id', 'slug']]);

        $event = Event::query()->where('title', 'Wizard Draft Event')->firstOrFail();
        $response->assertJsonPath('event.id', $event->id);
        $response->assertJsonPath('event.slug', $event->slug);
        $this->assertSame(EventStatus::Draft->value, $event->status->value);
        $this->assertSame($admin->id, $event->created_by);

        // Wizard auto-creates one default form so step-forms has a target for
        // field autosave. A fresh default form stays open (closed_at null).
        $form = $event->forms()->first();
        $this->assertNotNull($form);
        $this->assertNull($form->closed_at);
        $this->assertSame(1, $event->forms()->count());
    }

    public function test_x_inertia_store_returns_same_page_200_with_draft_event(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->post(
            route('dashboard.events.store'),
            [
                'title' => 'Wizard Inertia Draft',
                'location' => 'Campus Hall',
                'description' => 'A full description for the event.',
                'registration_start' => now()->startOfDay()->toDateString(),
                'registration_end' => now()->addDays(3)->endOfDay()->toDateString(),
                'start_date' => now()->addDays(10)->startOfDay()->toDateString(),
                'end_date' => now()->addDays(11)->startOfDay()->toDateString(),
                'quota' => 100,
                'price' => '5000',
                'session' => 'general',
                'category' => 'rkt',
                'banner' => UploadedFile::fake()->image('banner.jpg', 1200, 675),
                'publish' => false,
            ],
            ['X-Inertia' => 'true']
        );

        $response->assertOk();
        $response->assertHeader('X-Inertia', 'true');

        $event = Event::query()->where('title', 'Wizard Inertia Draft')->firstOrFail();

        $response->assertJsonPath('component', 'Dashboard/Events/Create');
        $response->assertJsonPath('props.draftEvent.id', $event->id);
        $response->assertJsonPath('props.draftEvent.slug', $event->slug);
        $response->assertJsonPath('props.draftEvent.forms.0.closed_at', null);

        $this->assertNull($event->forms()->firstOrFail()->closed_at);
    }

    public function test_non_wizard_store_still_redirects_to_show(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->post(route('dashboard.events.store'), [
            'title' => 'Regular Create',
            'location' => 'Campus Hall',
            'description' => 'Description.',
            'registration_start' => now()->startOfDay()->toDateString(),
            'registration_end' => now()->addDays(3)->endOfDay()->toDateString(),
            'start_date' => now()->addDays(10)->startOfDay()->toDateString(),
            'end_date' => now()->addDays(11)->startOfDay()->toDateString(),
            'quota' => 100,
            'price' => '5000',
            'session' => 'general',
            'category' => 'rkt',
            'banner' => UploadedFile::fake()->image('banner.jpg', 1200, 675),
            'publish' => true,
        ]);

        $response->assertRedirect();
        $event = Event::query()->where('title', 'Regular Create')->firstOrFail();
        $response->assertRedirect(route('dashboard.events.show', $event));
    }

    public function test_plain_store_with_wizard_query_param_is_ignored_and_still_redirects(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->post(
            route('dashboard.events.store').'?wizard=1',
            [
                'title' => 'Legacy Param Create',
                'location' => 'Campus Hall',
                'description' => 'Description.',
                'registration_start' => now()->startOfDay()->toDateString(),
                'registration_end' => now()->addDays(3)->endOfDay()->toDateString(),
                'start_date' => now()->addDays(10)->startOfDay()->toDateString(),
                'end_date' => now()->addDays(11)->startOfDay()->toDateString(),
                'quota' => 100,
                'price' => '5000',
                'session' => 'general',
                'category' => 'rkt',
                'banner' => UploadedFile::fake()->image('banner.jpg', 1200, 675),
                'publish' => true,
            ]
        );

        $response->assertRedirect();
        $event = Event::query()->where('title', 'Legacy Param Create')->firstOrFail();
        $response->assertRedirect(route('dashboard.events.show', $event));

        // Legacy param must not trigger the wizard default-form auto-creation.
        $this->assertSame(0, $event->forms()->count());
    }

    // ── GET /admin/events/create?draftId=… ─────────────────────────────────────

    public function test_create_with_draft_id_hydrates_draft_event_with_forms_and_fields(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $event = Event::factory()->create([
            'status' => EventStatus::Draft,
            'created_by' => $admin->id,
        ]);
        $form = Form::factory()->create(['event_id' => $event->id]);
        $field = FormField::factory()->create([
            'form_id' => $form->id,
            'input_type' => 'input',
            'name' => 'full_name',
            'metadata' => ['type' => 'text', 'rules' => []],
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard.events.create').'?draftId='.$event->id)
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Dashboard/Events/Create')
                    ->where('draftEvent.id', $event->id)
                    ->where('draftEvent.slug', $event->slug)
                    ->where('draftEvent.status', 'draft')
                    ->has('draftEvent.forms', 1)
                    ->where('draftEvent.forms.0.id', $form->id)
                    ->has('draftEvent.forms.0.fields', 1)
                    ->where('draftEvent.forms.0.fields.0.id', $field->id)
                    ->where('draftEvent.forms.0.fields.0.name', 'full_name')
            );
    }

    public function test_create_with_draft_id_for_other_users_draft_returns_403(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $owner = User::factory()->create();
        $owner->assignRole('admin');

        $event = Event::factory()->create([
            'status' => EventStatus::Draft,
            'created_by' => $owner->id,
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard.events.create').'?draftId='.$event->id)
            ->assertForbidden();
    }

    public function test_create_without_draft_id_renders_create_without_draft_event(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get(route('dashboard.events.create'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Dashboard/Events/Create')
                    ->has('options')
                    ->missing('draftEvent')
            );
    }

    // ── DELETE cascade: forms soft-deleted with event ───────────────────────────

    public function test_deleting_draft_event_cascades_soft_delete_to_forms(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $event = Event::factory()->create([
            'status' => EventStatus::Draft,
            'created_by' => $admin->id,
        ]);
        $form = Form::factory()->create(['event_id' => $event->id]);
        $field = FormField::factory()->create(['form_id' => $form->id]);

        $this->actingAs($admin)
            ->delete(route('dashboard.events.destroy', $event))
            ->assertRedirect(route('dashboard.events.index'));

        $this->assertSoftDeleted('events', ['id' => $event->id]);
        $this->assertSoftDeleted('forms', ['id' => $form->id]);
        $this->assertSoftDeleted('form_fields', ['id' => $field->id]);
    }

    // ── FieldOperationController: full-array diff idempotency ───────────────────

    public function test_field_operation_posting_same_full_array_twice_is_idempotent(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id]);

        // Realistic payloads as produced by the FE builder (fieldMapping.toBackendFields):
        // metadata keeps at least one declared key so validation retains the metadata bag.
        $f1 = [
            'id' => (string) Str::uuid(),
            'label' => 'Name',
            'type' => 'input',
            'name' => 'full_name',
            'order' => 1,
            'metadata' => ['type' => 'text', 'placeholder' => '', 'rules' => [], 'builderType' => 'short_text'],
            'is_append' => false,
        ];
        $f2 = [
            'id' => (string) Str::uuid(),
            'label' => 'Note',
            'type' => 'textarea',
            'name' => 'note',
            'order' => 2,
            'metadata' => ['placeholder' => '', 'rules' => [], 'builderType' => 'long_text'],
            'is_append' => false,
        ];

        $url = route('dashboard.events.forms.fields', [
            'event' => $event,
            'form' => $form,
        ], false);

        $this->actingAs($admin)->post($url, ['fields' => [$f1, $f2]])->assertRedirect();
        $this->actingAs($admin)->post($url, ['fields' => [$f1, $f2]])->assertRedirect();

        $this->assertDatabaseCount('form_fields', 2);
        $this->assertSame(1, FormField::query()->where('form_id', $form->id)->where('name', 'full_name')->count());
        $this->assertSame(1, FormField::query()->where('form_id', $form->id)->where('name', 'note')->count());

        // Field label update on re-post must not create a new row.
        $f2['label'] = 'Note updated';
        $this->actingAs($admin)->post($url, ['fields' => [$f1, $f2]])->assertRedirect();

        $this->assertDatabaseCount('form_fields', 2);
        $this->assertDatabaseHas('form_fields', [
            'form_id' => $form->id,
            'name' => 'note',
            'label' => 'Note updated',
        ]);

        // Partial removal: dropping one field soft-deletes exactly that row (full-array diff).
        $this->actingAs($admin)->post($url, ['fields' => [$f1]])->assertRedirect();
        $this->assertDatabaseCount('form_fields', 2); // soft delete keeps the row
        $this->assertSoftDeleted('form_fields', [
            'form_id' => $form->id,
            'name' => 'note',
        ]);
        $this->assertSame(1, FormField::query()->where('form_id', $form->id)->count()); // only full_name active
    }
}
