import { describe, expect, it } from 'vitest';
import { buildUnloadPayload, shouldSkipHydrate } from '../autosaveGuard';
import type { ITFormBannerState } from '../formBanner';
import { defaultFormBannerState } from '../formBanner';
import { toBackendFields } from '../fieldMapping';
import type { BuilderField } from '@/types/form-builder';

function builder(id: string, order?: number): BuilderField {
    return {
        id,
        type: 'short_text',
        label: `F ${id}`,
        description: '',
        name: `field_${id}`,
        placeholder: '',
        required: false,
        options: [],
        metadata: {},
        ...(order !== undefined ? { order } : {}),
    };
}

function banner(): ITFormBannerState {
    return defaultFormBannerState();
}

describe('hydrate guard (Fase 1-B)', () => {
    it('mount segar (lastHydrated null) → hydrate normal', () => {
        expect(
            shouldSkipHydrate({
                lastHydratedId: null,
                currentId: 'form-1',
                lastCleanSnapshot: null,
                currentSnapshot: '{"a":1}',
                hasPendingBannerFile: false,
            })
        ).toBe(false);
    });

    it('id berubah → hydrate normal walau snapshot kotor', () => {
        expect(
            shouldSkipHydrate({
                lastHydratedId: 'form-1',
                currentId: 'form-2',
                lastCleanSnapshot: '{"a":1}',
                currentSnapshot: '{"a":2}',
                hasPendingBannerFile: false,
            })
        ).toBe(false);
    });

    it('id sama + bersih → hydrate normal', () => {
        const snap = '{"a":1}';
        expect(
            shouldSkipHydrate({
                lastHydratedId: 'form-1',
                currentId: 'form-1',
                lastCleanSnapshot: snap,
                currentSnapshot: snap,
                hasPendingBannerFile: false,
            })
        ).toBe(false);
    });

    it('id sama + kotor → lewati hydrate', () => {
        expect(
            shouldSkipHydrate({
                lastHydratedId: 'form-1',
                currentId: 'form-1',
                lastCleanSnapshot: '{"a":1}',
                currentSnapshot: '{"a":2}',
                hasPendingBannerFile: false,
            })
        ).toBe(true);
    });

    it('id sama + bersih tapi banner pending → lewati (bannerFile=null jangan buang file)', () => {
        const snap = '{"a":1}';
        expect(
            shouldSkipHydrate({
                lastHydratedId: 'form-1',
                currentId: 'form-1',
                lastCleanSnapshot: snap,
                currentSnapshot: snap,
                hasPendingBannerFile: true,
            })
        ).toBe(true);
    });
});

describe('unload payload (Fase 1-A, pure)', () => {
    it('bersih → null (tak perlu beacon)', () => {
        const prev = toBackendFields([builder('a', 1000)]);
        const payload = buildUnloadPayload({
            canvasFields: [builder('a', 1000)],
            banner: banner(),
            lastSent: prev,
        });
        expect(payload).toBeNull();
    });

    it('kotor → full fields + deleted_ids terkini', () => {
        const prev = toBackendFields([builder('a', 1000), builder('gone', 2000)]);
        const payload = buildUnloadPayload({
            canvasFields: [builder('a', 1000), builder('b')],
            banner: banner(),
            lastSent: prev,
        });
        expect(payload).not.toBeNull();
        expect(payload?.deleted_ids).toEqual(['gone']);
        expect(payload?.fields.map((f) => f.id).sort()).toEqual(['a', 'b']);
    });

    it('steady-empty → null', () => {
        expect(buildUnloadPayload({ canvasFields: [], banner: banner(), lastSent: [] })).toBeNull();
    });
});
