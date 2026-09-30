<?php

namespace App\Http\Requests\Broadcasting;

use App\Services\Broadcasting\BroadcastAttachmentService;
use App\Support\BroadcastPermissions;
use Illuminate\Foundation\Http\FormRequest;

class StoreBroadcastAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(BroadcastPermissions::CREATE) ?? false;
    }

    /** Validasi tipe via allowlist kanonik service (lapis-1); service mengulang gate di lapis-2. */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:1536',
                'mimes:'.implode(',', BroadcastAttachmentService::allowedExtensions()),
                'mimetypes:'.implode(',', BroadcastAttachmentService::allowedMimeTypes()),
            ],
        ];
    }
}
