import { normalizeBannerSrc } from '@/lib/bannerSrc';
import { readFieldMetadata, readFieldRules } from '@/lib/formFieldMetadata';
import type { TFormFieldMetadataBag, TFormFieldMetadataValue, TFormFillOptionRow } from '@/types/form';

function isRecord(value: unknown): value is TFormFieldMetadataBag {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function asStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    for (const item of value) {
        const normalized = asNonEmptyString(item);
        if (normalized) out.push(normalized);
    }
    return out;
}

function parseJsonUnknown(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function listFromUnknown(value: unknown): string[] {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];

        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            const parsed = parseJsonUnknown(trimmed);
            if (Array.isArray(parsed)) return asStringList(parsed);
            if (isRecord(parsed)) {
                // Legacy object bag: {"a":"Option A","b":"Option B"}
                return asStringList(Object.values(parsed));
            }
        }

        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (Array.isArray(value)) {
        return value.map((item) => String(item ?? '').trim()).filter(Boolean);
    }
    return [];
}

/** True bila field menyimpan `input_type` legacy (kolom DB) non-blank; menyempitkan tanpa cast. */
function hasLegacyApiType(field: IFormField): field is IFormField & { input_type: string } {
    if (!('input_type' in field)) return false;
    return typeof field.input_type === 'string' && field.input_type !== '';
}

/**
 * API `type` di IFormField, atau `input_type` legacy (kolom DB) bila payload tidak dinormalisasi.
 */
export function formFieldApiType(field: IFormField | null): string | undefined {
    if (!field) {
        return undefined;
    }
    if (typeof field.type === 'string' && field.type !== '') {
        return field.type;
    }
    if (hasLegacyApiType(field)) {
        return field.input_type === 'selectInput' ? 'select' : field.input_type;
    }
    return undefined;
}

/** Mirrors builder type resolution in {@see useFormFillPage}. */
export function formFieldBuilderType(field: IFormField): string {
    const meta = readFieldMetadata(field);
    const value = meta.builderType;
    if (typeof value === 'string') {
        return value;
    }
    const api = formFieldApiType(field);
    if (field.name === 'form_banner' || api === 'banner') {
        return 'banner';
    }
    return api ?? '';
}

function fallbackOptionLabels(field: IFormField): string[] {
    const meta = readFieldMetadata(field);
    const fromFieldOptions = listFromUnknown(field.options);
    if (fromFieldOptions.length > 0) {
        return fromFieldOptions;
    }
    const direct = meta.options;
    const directList = listFromUnknown(direct);
    if (directList.length > 0) {
        return directList;
    }
    const optionChoices = listFromUnknown(meta.optionChoices ?? meta.option_choices);
    if (optionChoices.length > 0) {
        return optionChoices;
    }
    const ruleOptions = readFieldRules(field).in;
    return listFromUnknown(ruleOptions);
}

type TOptionChoiceRaw = {
    type?: TFormFieldMetadataValue;
    label?: TFormFieldMetadataValue;
    value?: TFormFieldMetadataValue;
    text?: TFormFieldMetadataValue;
    name?: TFormFieldMetadataValue;
    imageUrl?: TFormFieldMetadataValue;
    image_url?: TFormFieldMetadataValue;
};

/** True bila item berbentuk baris option-choice (objek non-null, bukan array); menyempitkan tanpa cast. */
function isOptionChoiceRaw(value: unknown): value is TOptionChoiceRaw {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function flattenMetadataValueArray(arr: TFormFieldMetadataValue[]): TFormFieldMetadataValue[] {
    const out: TFormFieldMetadataValue[] = [];
    for (const item of arr) {
        if (Array.isArray(item)) {
            out.push(...flattenMetadataValueArray(item));
        } else {
            out.push(item);
        }
    }
    return out;
}

function parseOptionChoicesRows(value: unknown, builderType: string): TFormFillOptionRow[] {
    const raw: TFormFieldMetadataValue[] = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? (() => {
                const trimmed = value.trim();
                if (!trimmed) return [];
                if (trimmed.includes(',') && !trimmed.startsWith('[') && !trimmed.startsWith('{')) {
                    return trimmed
                        .split(',')
                        .map((item) => item.trim())
                        .filter((item) => item.length > 0);
                }
                const parsed = parseJsonUnknown(trimmed);
                return Array.isArray(parsed) ? parsed : [];
            })()
          : [];

    const source = flattenMetadataValueArray(raw);
    if (source.length === 0) return [];

    const rows: TFormFillOptionRow[] = [];
    for (const item of source) {
        if (typeof item === 'string') {
            const label = asNonEmptyString(item);
            if (!label) continue;
            rows.push({ type: 'text', label });
            continue;
        }
        if (!isOptionChoiceRaw(item)) continue;

        const typedItem = item;
        const resolvedLabel =
            asNonEmptyString(typedItem.label) ??
            asNonEmptyString(typedItem.value) ??
            asNonEmptyString(typedItem.text) ??
            asNonEmptyString(typedItem.name) ??
            '';

        const rawType = asNonEmptyString(typedItem.type);
        const isImageType = rawType === 'image';
        const rowType: 'text' | 'image' = builderType === 'dropdown' ? 'text' : isImageType ? 'image' : 'text';
        const rawUrl = asNonEmptyString(typedItem.imageUrl) ?? asNonEmptyString(typedItem.image_url);

        rows.push({
            type: rowType,
            label: resolvedLabel,
            imageSrc: rowType === 'image' && rawUrl ? normalizeBannerSrc(rawUrl) : undefined,
        });
    }
    return rows;
}

/**
 * Options / image-choice rows for select, radio, checkbox — shared by fill UI, invitation review, and read-only display.
 */
export function getFormFieldOptionRows(field: IFormField): TFormFillOptionRow[] {
    const builderType = formFieldBuilderType(field);
    const meta = readFieldMetadata(field);
    const oc = meta.optionChoices ?? meta.option_choices;
    const parsedChoiceRows = parseOptionChoicesRows(oc, builderType);
    if (parsedChoiceRows.length > 0) {
        return parsedChoiceRows;
    }
    const parsedMetaOptionsRows = parseOptionChoicesRows(meta.options, builderType);
    if (parsedMetaOptionsRows.length > 0) {
        return parsedMetaOptionsRows;
    }
    const parsedFieldOptionsRows = parseOptionChoicesRows(field.options, builderType);
    if (parsedFieldOptionsRows.length > 0) {
        return parsedFieldOptionsRows;
    }
    return fallbackOptionLabels(field).map((label) => ({
        type: 'text' as const,
        label,
    }));
}
