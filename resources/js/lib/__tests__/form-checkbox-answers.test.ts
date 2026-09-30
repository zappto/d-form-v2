import { describe, expect, it } from 'vitest';
import { createCheckboxToggleHandler, toggleCheckboxSelection } from '../formCheckboxAnswers';

describe('formCheckboxAnswers arg-object (DFORM-50)', () => {
    it('toggleCheckboxSelection menambah opsi saat dicentang dari daftar kosong', () => {
        expect(toggleCheckboxSelection({ selected: [], option: 'A', checked: true })).toEqual(['A']);
    });

    it('toggleCheckboxSelection melepas opsi + non-array dianggap kosong', () => {
        expect(toggleCheckboxSelection({ selected: ['A', 'B'], option: 'A', checked: false })).toEqual(['B']);
        expect(toggleCheckboxSelection({ selected: 'bukan-array', option: 'A', checked: true })).toEqual(['A']);
    });

    it('createCheckboxToggleHandler menulis via akses form bersama (satu sumber)', () => {
        const store: Record<string, string[]> = { hobi: ['A'] };
        const onCheckboxToggle = createCheckboxToggleHandler({
            read: (fieldName: string): unknown => store[fieldName],
            write: (fieldName: string, selected: string[]): void => {
                store[fieldName] = selected;
            },
        });
        onCheckboxToggle({ fieldName: 'hobi', option: 'B', checked: true });
        expect(store.hobi).toEqual(['A', 'B']);
        onCheckboxToggle({ fieldName: 'hobi', option: 'A', checked: false });
        expect(store.hobi).toEqual(['B']);
    });
});
