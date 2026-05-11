import type { FormFieldMetadataBag, FormFieldRules } from '@/types/form'

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function readFieldMetadata(field: IFormField): FormFieldMetadataBag {
    let m: unknown = field.metadata
    if (typeof m === 'string' && m.trim()) {
        try { m = JSON.parse(m) } catch { /* not valid JSON, keep as-is */ }
    }
    if (Array.isArray(m)) {
        m = m.find((item) => isPlainObject(item)) ?? {}
    }
    return isPlainObject(m) ? m : {}
}

export function readFieldRules(field: IFormField): FormFieldRules {
    const raw = readFieldMetadata(field).rules
    return isPlainObject(raw) ? (raw as FormFieldRules) : {}
}
