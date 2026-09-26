<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\Form;
use App\Support\FormFieldsRequestValidation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class FieldModifyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        $eventParam = $this->route('event');
        $formParam = $this->route('form');

        $event = $eventParam instanceof Event
            ? $eventParam
            : Event::query()->find($eventParam);

        $form = $formParam instanceof Form
            ? $formParam
            : Form::query()->find($formParam);

        if (!$event || !$form || $form->event_id !== $event->id) {
            return false;
        }

        return $user->can('update', $event);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge(
            [
                'fields' => 'nullable|array',
                'deleted_ids' => 'sometimes|array',
                'deleted_ids.*' => 'uuid',
                'banner_file' => 'sometimes|nullable|image|max:10240',
                'option_images' => 'sometimes|nullable|array',
                'option_images.*' => 'sometimes|array',
                'option_images.*.*' => 'sometimes|nullable|image|max:10240',
            ],
            FormFieldsRequestValidation::nestedFieldRules(),
        );
    }

    protected function prepareForValidation(): void
    {
        // Multipart autosave (FormData) mengirim `fields` / `deleted_ids`
        // sebagai JSON-string part + `banner_file` sebagai file part.
        // Decode di sini agar validasi nested `fields.*` tetap jalan
        // native tanpa endpoint baru.
        $merge = [];
        foreach (['fields', 'deleted_ids'] as $key) {
            $value = $this->input($key);
            if (is_string($value)) {
                $trimmed = trim($value);
                if ($trimmed === '') {
                    continue;
                }
                $decoded = json_decode($trimmed, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $merge[$key] = $decoded;
                }
            }
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'fields.required' => 'Please provide form fields to update.',
            'fields.array' => 'Form fields must be a valid list.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $formParam = $this->route('form');
        $form = $formParam instanceof Form
            ? $formParam
            : ($formParam !== null ? Form::query()->find($formParam) : null);
        FormFieldsRequestValidation::afterForFields($validator, $this, $form);
    }
}
