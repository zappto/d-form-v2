<?php

namespace App\Support;

/**
 * API / kontrak (docs/04-contract.md) memakai `select`; kolom DB `form_fields.input_type` memakai `selectInput`.
 * Radio / checkbox (PRD) belum ada di enum `form_fields.input_type` — butuh migrasi bila disetujui.
 */
final class FormFieldTypeMapping
{
    public const API_TYPES = ['input', 'select', 'textarea', 'datePicker', 'fileUpload'];

    public static function toInputType(string $apiType): string
    {
        return match ($apiType) {
            'select' => 'selectInput',
            default => $apiType,
        };
    }

    public static function toApiType(string $inputType): string
    {
        return match ($inputType) {
            'selectInput' => 'select',
            default => $inputType,
        };
    }
}
