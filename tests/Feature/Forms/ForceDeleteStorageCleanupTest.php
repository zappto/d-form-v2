<?php

namespace Tests\Feature\Forms;

use App\Models\Event;
use App\Models\Form;
use App\Models\FormAnswer;
use App\Models\FormField;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ForceDeleteStorageCleanupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        Storage::fake('public');
    }

    public function test_force_delete_event_removes_nested_files(): void
    {
        $eventBanner = 'events/banners/event.jpg';
        $formBanner = 'forms/banners/form.jpg';
        $optionImage = 'forms/options/opt.jpg';
        $fieldImage = 'forms/options/field.jpg';
        $answerFile = 'form-uploads/seed/cv.pdf';
        foreach ([$eventBanner, $formBanner, $optionImage, $fieldImage, $answerFile] as $path) {
            Storage::disk('public')->put($path, 'x');
        }

        $event = Event::factory()->create(['banner' => $eventBanner]);
        $form = Form::factory()->create([
            'event_id' => $event->id,
            'banner_url' => $formBanner,
            'metadata' => ['optionChoices' => [['imageUrl' => $optionImage]]],
        ]);
        FormField::factory()->create([
            'form_id' => $form->id,
            'metadata' => ['optionChoices' => [['imageUrl' => $fieldImage]]],
        ]);
        FormAnswer::factory()->create([
            'form_id' => $form->id,
            'answers' => ['cv' => $answerFile, 'nama' => 'Budi'],
        ]);

        $event->forceDelete();

        Storage::disk('public')->assertMissing($eventBanner);
        Storage::disk('public')->assertMissing($formBanner);
        Storage::disk('public')->assertMissing($optionImage);
        Storage::disk('public')->assertMissing($fieldImage);
        Storage::disk('public')->assertMissing($answerFile);
    }

    public function test_soft_delete_keeps_files(): void
    {
        $formBanner = 'forms/banners/form.jpg';
        Storage::disk('public')->put($formBanner, 'x');

        $event = Event::factory()->create();
        $form = Form::factory()->create(['event_id' => $event->id, 'banner_url' => $formBanner]);

        $form->delete();

        Storage::disk('public')->assertExists($formBanner);
    }
}
