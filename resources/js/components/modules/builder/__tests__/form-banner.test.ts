import { describe, expect, it } from 'vitest';
import { buildFormBannerBuilderField, defaultFormBannerState } from '../formBanner';

/** DFORM-46 Task 3: `state.id!` diganti guard — state tanpa id tetap membangun field baru. */

describe('buildFormBannerBuilderField tanpa id tersimpan (DFORM-46 T3)', () => {
    it('state berisi caption tanpa id → tetap membangun field dengan id string', () => {
        const state = defaultFormBannerState();
        state.caption = 'Judul banner';

        const field = buildFormBannerBuilderField(state);
        expect(field).not.toBeNull();
        if (field === null) throw new Error('field banner harus terbentuk');

        expect(typeof field.id).toBe('string');
        expect(field.id.length).toBeGreaterThan(0);
        expect(field.id).toBe(state.id);
    });
});
