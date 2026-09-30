<?php

namespace App\Http\Requests\Broadcasting;

use App\Support\BroadcastPermissions;
use Illuminate\Foundation\Http\FormRequest;

class SendBroadcastTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(BroadcastPermissions::CREATE) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc', 'max:255'],
        ];
    }
}
