<?php

namespace App\Support;

use App\Models\Form;
use App\Models\FormField;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class FormFieldsRequestValidation
{
    /**
     * Validation rules for each entry in the `fields` array (dashboard / API).
     *
     * @return array<string, mixed>
     */
    public static function nestedFieldRules(): array
    {
        return array_merge(
            self::fieldBodyRules(),
            self::fieldGlobalMetadataRules(),
            self::fieldRulesMetadataRules(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public static function fieldBodyRules(): array
    {
        return [
            'fields.*.id' => 'nullable|uuid',
            'fields.*.label' => 'required|string|max:100',
            'fields.*.description' => 'nullable|string|max:1000',
            'fields.*.name' => 'required|string|max:100',
            'fields.*.type' => ['required', 'string', Rule::in(FormFieldTypeMapping::API_TYPES)],
            'fields.*.metadata' => 'required|array',
            'fields.*.order' => 'required|integer|min:0',
            'fields.*.is_append' => 'sometimes|boolean',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function fieldGlobalMetadataRules(): array
    {
        return [
            'fields.*.metadata.placeholder' => 'nullable',
            'fields.*.metadata.type' => [
                'required_if:fields.*.type,input',
                'prohibited_unless:fields.*.type,input',
                Rule::in('text', 'number', 'email', 'password', 'tel'),
            ],
            'fields.*.metadata.is_multiple' => [
                'required_if:fields.*.type,select',
                'prohibited_unless:fields.*.type,select,checkbox,radio',
                'boolean',
            ],
            'fields.*.metadata.options' => [
                'nullable',
                'string',
                'prohibited_unless:fields.*.type,radio,checkbox',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function fieldRulesMetadataRules(): array
    {
        return [
            'fields.*.metadata.duplicatable' => 'nullable|boolean',
            'fields.*.metadata.builderType' => 'nullable|string',
            'fields.*.metadata.optionChoices' => 'nullable|array',
            'fields.*.metadata.content' => 'nullable',
            'fields.*.metadata.maxStars' => 'nullable',
            'fields.*.metadata.bannerUrl' => 'nullable|string',
            'fields.*.metadata.bannerFileName' => 'nullable|string',
            'fields.*.metadata.formBanner' => 'nullable|boolean',
            'fields.*.metadata.accepts' => 'nullable|string',

            'fields.*.metadata.rules' => 'nullable|array',

            'fields.*.metadata.rules.required' => 'nullable|boolean',

            'fields.*.metadata.rules.min' => [
                'nullable',
                'integer',
                'min:0',
                'prohibited_unless:fields.*.type,input,textarea',
            ],
            'fields.*.metadata.rules.max' => [
                'nullable',
                'integer',
                'gt:fields.*.metadata.rules.min',
                'prohibited_unless:fields.*.type,input,textarea',
            ],

            'fields.*.metadata.rules.regex' => [
                'nullable',
                'string',
                'prohibited_unless:fields.*.type,input',
            ],

            'fields.*.metadata.rules.in' => [
                'nullable',
                'string',
                'prohibited_unless:fields.*.type,select,radio,checkbox',
            ],

            'fields.*.metadata.rules.multiple' => [
                'nullable',
                'boolean',
                'prohibited_unless:fields.*.type,select,fileUpload',
            ],

            'fields.*.metadata.rules.min_date' => [
                'nullable',
                'date',
                'prohibited_unless:fields.*.type,datePicker',
            ],
            'fields.*.metadata.rules.max_date' => [
                'nullable',
                'date',
                'prohibited_unless:fields.*.type,datePicker',
            ],

            'fields.*.metadata.rules.mimes' => [
                'nullable',
                'string',
                'prohibited_unless:fields.*.type,fileUpload',
            ],
            'fields.*.metadata.rules.max_size' => [
                'nullable',
                'integer',
                'min:1',
                'prohibited_unless:fields.*.type,fileUpload',
            ],
        ];
    }

    /**
     * Rules for `forms.metadata` (registration / team configuration).
     *
     * @return array<string, mixed>
     */
    public static function formMetadataRules(): array
    {
        return [
            'metadata' => 'nullable|array',
            'metadata.registration_mode' => ['nullable', 'string', Rule::in(['single', 'bundle', 'team'])],
            'metadata.max_team_size' => 'nullable|integer|min:1|max:10000',
            'metadata.team_size' => 'nullable|integer|min:1|max:10000',
        ];
    }

    /**
     * Post-validation: date range order, name uniqueness, radio/checkbox choices.
     */
    public static function afterForFields(Validator $v, Request $request, ?Form $form): void
    {
        $v->after(function (Validator $validator) use ($request, $form): void {
            $fields = $validator->getData()['fields'] ?? $request->input('fields', []);
            if (!is_array($fields)) {
                return;
            }

            foreach ($fields as $index => $field) {
                if (!is_array($field)) {
                    continue;
                }
                if (($field['type'] ?? '') === 'datePicker') {
                    $min = $field['metadata']['rules']['min_date'] ?? null;
                    $max = $field['metadata']['rules']['max_date'] ?? null;
                    if (is_string($min) && $min !== '' && is_string($max) && $max !== '' && strtotime($max) < strtotime($min)) {
                        $validator->errors()->add(
                            "fields.{$index}.metadata.rules.max_date",
                            "Tanggal maksimal tidak boleh lebih kecil dari tanggal minimal ({$min})."
                        );
                    }
                }

                $type = $field['type'] ?? '';
                if ($type === 'radio' || $type === 'checkbox') {
                    $meta = $field['metadata'] ?? [];
                    if (!is_array($meta)) {
                        continue;
                    }
                    $rules = $meta['rules'] ?? [];
                    $in = is_array($rules) ? ($rules['in'] ?? null) : null;
                    $options = $meta['options'] ?? null;
                    $choices = $meta['optionChoices'] ?? null;
                    $hasIn = is_string($in) && trim($in) !== '';
                    $hasOptions = is_string($options) && trim($options) !== '';
                    $hasChoices = is_array($choices) && count($choices) > 0;
                    if (!$hasIn && !$hasOptions && !$hasChoices) {
                        $validator->errors()->add(
                            "fields.{$index}.metadata",
                            'Radio and checkbox fields must define options (rules.in), metadata.options, or metadata.optionChoices.'
                        );
                    }
                }
            }

            $names = collect($fields)->pluck('name')->filter(fn ($n) => $n !== null && $n !== '')->map(fn ($n) => (string) $n);
            if ($names->count() !== $names->unique()->count()) {
                $validator->errors()->add('fields', __('validation.distinct', ['attribute' => 'name']));
            }

            if ($form === null) {
                return;
            }

            foreach ($fields as $index => $field) {
                if (!is_array($field)) {
                    continue;
                }
                $name = $field['name'] ?? null;
                if (!is_string($name) || $name === '') {
                    continue;
                }
                $id = $field['id'] ?? null;
                $q = FormField::query()
                    ->where('form_id', $form->id)
                    ->where('name', $name);
                if (is_string($id) && $id !== '') {
                    $q->where('id', '!=', $id);
                }
                if ($q->exists()) {
                    $validator->errors()->add("fields.{$index}.name", __('validation.unique', ['attribute' => 'name']));
                }
            }
        });
    }
}
