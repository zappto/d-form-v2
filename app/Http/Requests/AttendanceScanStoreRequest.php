<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AttendanceScanStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Event|null $event */
        $event = $this->route('event');

        return $event instanceof Event && $this->user() !== null && $this->user()->can('update', $event);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'submission_id' => ['nullable', 'string', 'uuid'],
            'registration_code' => ['nullable', 'string', 'max:32'],
            'raw_payload' => ['nullable', 'string', 'max:65535'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'submission_id.string' => 'Submission ID must be valid text.',
            'submission_id.uuid' => 'Submission ID must be a valid UUID format.',
            'registration_code.string' => 'Registration code must be valid text.',
            'registration_code.max' => 'Registration code cannot be longer than 32 characters.',
            'raw_payload.string' => 'QR code payload must be valid text.',
            'raw_payload.max' => 'QR code payload is too large (maximum 65,535 characters).',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $hasSubmissionId = filled(trim((string) $this->input('submission_id', '')));
            $hasCode = filled(trim((string) $this->input('registration_code', '')));
            $hasRaw = filled(trim((string) $this->input('raw_payload', '')));

            if (! $hasSubmissionId && ! $hasCode && ! $hasRaw) {
                $validator->errors()->add(
                    'payload',
                    __('Provide a QR payload, registration code, or submission ID.'),
                );
            }
        });
    }
}
