<?php

namespace App\Http\Requests;

use App\Enums\EventFormVisibility;
use App\Enums\FormPurpose;
use App\Models\Event;
use App\Models\Form;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AutosaveEventFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        $eventParam = $this->route('event');
        $event = $eventParam instanceof Event
            ? $eventParam
            : Event::query()->find($eventParam);

        $formParam = $this->route('form');
        $form = $formParam instanceof Form
            ? $formParam
            : Form::query()->find($formParam);

        if (!$event || !$form || $form->event_id !== $event->id) {
            return false;
        }

        return $user->can('update', $event);
    }

    /**
     * Lenient partial rules: every header key is sometimes|nullable.
     * Intentionally does NOT reuse the strict store/update helpers
     * (no required, no min:1, no mandatory metadata.purpose).
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|nullable|string|max:100',
            'description' => 'sometimes|nullable|string',
            'success_content' => 'sometimes|nullable|string',
            'closed_at' => 'sometimes|nullable|date',
            'visible_for' => 'sometimes|nullable|array',
            'visible_for.*' => [Rule::enum(EventFormVisibility::class)],
            'banner_url' => 'sometimes|nullable|string',
            'banner_caption' => 'sometimes|nullable|string|max:255',
            'metadata' => 'sometimes|nullable|array',
            'metadata.purpose' => ['sometimes', 'nullable', 'string', Rule::enum(FormPurpose::class)],
            'metadata.requires_form_id' => 'sometimes|nullable|uuid',
            'metadata.registration_mode' => ['sometimes', 'nullable', 'string', Rule::in(['single', 'bundle', 'team'])],
            'metadata.max_team_size' => 'sometimes|nullable|integer|min:1|max:10000',
            'metadata.team_size' => 'sometimes|nullable|integer|min:1|max:10000',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Frontend sends '' for empty datetime/caption; normalize to null
        // so `nullable|date` passes instead of 422 on partial autosave.
        $normalize = [];
        foreach (['closed_at', 'banner_url', 'banner_caption', 'success_content'] as $key) {
            if ($this->exists($key) && $this->input($key) === '') {
                $normalize[$key] = null;
            }
        }

        if ($normalize !== []) {
            $this->merge($normalize);
        }
    }
}
