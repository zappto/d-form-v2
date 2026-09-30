<?php

namespace App\Http\Requests\Broadcasting;

use App\Support\BroadcastPermissions;
use Illuminate\Foundation\Http\FormRequest;

class SaveBroadcastRecipientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(BroadcastPermissions::CREATE) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:150'],
            'email' => ['required', 'email:rfc', 'max:255'],
        ];
    }
}
