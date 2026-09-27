import type { BuilderField } from '@/types/formBuilder';

/**
 * New canvas fields (create + edit form) — matches the builder palette / toBackendField mapping.
 */
export function createFormBuilderField(type: TFormBuilderType, label: string): BuilderField {
    const defaults: Partial<Record<TFormBuilderType, Partial<BuilderField>>> = {
        dropdown: { options: [{ id: crypto.randomUUID(), type: 'text', label: 'Option 1' }] },
        checkbox: { options: [{ id: crypto.randomUUID(), type: 'text', label: 'Choice A' }] },
        radio: { options: [{ id: crypto.randomUUID(), type: 'text', label: 'Radio 1' }] },
        rating: { metadata: { maxStars: 5 } },
        heading: { metadata: { content: 'Section Heading' } },
        paragraph: { metadata: { content: 'Description text goes here...' } },
    };
    const base: BuilderField = {
        id: crypto.randomUUID(),
        type,
        label: label || 'Untitled Field',
        name: `field_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
        description: '',
        placeholder: '',
        required: false,
        options: [],
        metadata: {},
        is_append: false,
    };
    return { ...base, ...(defaults[type] || {}) };
}
