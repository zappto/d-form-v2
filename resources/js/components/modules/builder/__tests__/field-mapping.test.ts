import { describe, expect, it } from 'vitest';
import { fromBackendField, toBackendField } from '../fieldMapping';
import type { BackendField, BuilderField } from '@/types/formBuilder';

/**
 * DFORM-46 T5 S4: paritas parser/hidrasi fieldMapping setelah cast metadata
 * diganti guard (`isMetadataBag`/`isFormFieldRules`) — perilaku lama dipaku.
 */

function backend(metadata: BackendField['metadata'], type: BackendField['type'] = 'checkbox'): BackendField {
    return {
        id: 'f1',
        type,
        label: 'Pilih',
        description: null,
        name: 'pilih',
        order: 1000,
        metadata,
    };
}

function builderMetadata(metadata: BuilderField['metadata']): BuilderField {
    return {
        id: 'f1',
        type: 'rating',
        label: 'Rating',
        description: '',
        name: 'rating',
        placeholder: '',
        required: false,
        options: [],
        metadata,
    };
}

describe('fromBackendField — paritas guard metadata', () => {
    it('optionChoices objek dibaca apa adanya (trim label/url)', () => {
        const field = fromBackendField(
            backend({ optionChoices: [{ id: 'o1', type: 'image', label: ' A ', imageUrl: ' x.jpg ' }] })
        );
        expect(field.options).toEqual([{ id: 'o1', type: 'image', label: 'A', imageUrl: 'x.jpg' }]);
    });

    it('item optionChoices berupa array tetap jadi baris opsi default (paritas perilaku lama)', () => {
        const field = fromBackendField(backend({ optionChoices: [['nested']] }));
        expect(field.options).toHaveLength(1);
        expect(field.options[0].type).toBe('text');
        expect(field.options[0].label).toBe('');
        expect(field.options[0].imageUrl).toBe('');
    });

    it('rules non-objek (string) diperlakukan seperti objek kosong', () => {
        const field = fromBackendField(backend({ rules: 'bogus' }));
        expect(field.required).toBe(false);
        expect(field.metadata).not.toHaveProperty('maxLength');
    });

    it('rules objek valid tetap terbaca (required + maxLength)', () => {
        const field = fromBackendField(backend({ rules: { required: true, max: 12 } }, 'input'));
        expect(field.required).toBe(true);
        expect(field.metadata.maxLength).toBe(12);
    });
});

describe('toBackendField — paritas coerce maxStars', () => {
    it('maxStars number diteruskan apa adanya ke rules.max + metadata.maxStars', () => {
        const row = toBackendField(builderMetadata({ maxStars: 7 }), 1000);
        expect(row.metadata.rules).toMatchObject({ min: 1, max: 7 });
        expect(row.metadata.maxStars).toBe(7);
    });

    it('maxStars null/tak ada jatuh ke default 5', () => {
        expect(toBackendField(builderMetadata({ maxStars: null }), 1000).metadata.maxStars).toBe(5);
        expect(toBackendField(builderMetadata({}), 1000).metadata.maxStars).toBe(5);
    });

    it('maxStars malformed non-number diteruskan apa adanya (tidak dikoersi)', () => {
        expect(toBackendField(builderMetadata({ maxStars: 'x' }), 1000).metadata.maxStars).toBe('x');
    });
});
