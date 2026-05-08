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
                'fields' => 'required|array',
            ],
            FormFieldsRequestValidation::nestedFieldRules(),
        );
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
