<?php

namespace App\Http\Requests\Broadcasting;

use App\Support\BroadcastPermissions;
use Illuminate\Foundation\Http\FormRequest;

class StoreBroadcastAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(BroadcastPermissions::CREATE) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:1536'],
        ];
    }
}
