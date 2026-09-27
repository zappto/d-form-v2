import { describe, expect, it } from 'vitest';
import { AUTOSAVE_DEBOUNCE_MS, RESPONDENT_DRAFT_DEBOUNCE_MS } from '../debounce';

describe('konstanta debounce', () => {
    it('autosave builder/event default 800 ms', () => {
        expect(AUTOSAVE_DEBOUNCE_MS).toBe(800);
    });

    it('draft responden default 800 ms (konteks simpan berbeda, nilai sengaja seragam)', () => {
        expect(RESPONDENT_DRAFT_DEBOUNCE_MS).toBe(800);
    });
});
