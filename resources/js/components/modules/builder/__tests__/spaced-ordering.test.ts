import { describe, expect, it } from 'vitest';
import { allocateOrderRun, allocateSpacedOrder, FIELD_ORDER_GAP, toBackendFields } from '../fieldMapping';
import type { BuilderField } from '@/types/formBuilder';
import { diffBackendFields } from '../dirtyFields';

function builder(id: string, order?: number): BuilderField {
    return {
        id,
        type: 'short_text',
        label: `Field ${id}`,
        description: '',
        name: `field_${id}`,
        placeholder: '',
        required: false,
        options: [],
        metadata: {},
        is_append: false,
        ...(order !== undefined ? { order } : {}),
    };
}

describe('spaced ordering (Fase 1-C)', () => {
    it('fresh list dialokasikan 1000-step', () => {
        const out = toBackendFields([builder('a'), builder('b'), builder('c')]);
        expect(out.map((r) => r.order)).toEqual([1000, 2000, 3000]);
        for (const r of out) {
            expect(Number.isInteger(r.order)).toBe(true);
            expect(r.order).toBeGreaterThanOrEqual(0);
        }
    });

    it('allocateSpacedOrder: tengah midpoint, ujung ±1000', () => {
        expect(allocateSpacedOrder(null, null)).toBe(FIELD_ORDER_GAP);
        expect(allocateSpacedOrder(null, 2000)).toBe(1000);
        expect(allocateSpacedOrder(1000, null)).toBe(2000);
        expect(allocateSpacedOrder(1000, 2000)).toBe(1500);
    });

    it('insert depan hanya mengotori baris baru (existing tak dinomori ulang)', () => {
        const prev = toBackendFields([builder('b', 1000), builder('c', 2000)]);
        const current = [builder('a'), builder('b', 1000), builder('c', 2000)];
        const out = toBackendFields(current, prev);
        const byId = new Map(out.map((r) => [r.id, r.order]));
        expect(byId.get('b')).toBe(1000);
        expect(byId.get('c')).toBe(2000);
        expect(byId.get('a')).toBe(0);
        const diff = diffBackendFields(out, prev);
        expect(diff.dirty.map((r) => r.id)).toEqual(['a']);
        expect(diff.deletedIds).toEqual([]);
    });

    it('insert tengah dialokasikan midpoint tanpa menyentuh tetangga', () => {
        const prev = toBackendFields([builder('a', 1000), builder('c', 2000)]);
        const current = [builder('a', 1000), builder('b'), builder('c', 2000)];
        const out = toBackendFields(current, prev);
        const byId = new Map(out.map((r) => [r.id, r.order]));
        expect(byId.get('a')).toBe(1000);
        expect(byId.get('c')).toBe(2000);
        expect(byId.get('b')).toBe(1500);
        const diff = diffBackendFields(out, prev);
        expect(diff.dirty.map((r) => r.id)).toEqual(['b']);
    });

    it('insert akhir = tetangga + 1000', () => {
        const prev = toBackendFields([builder('a', 1000)]);
        const out = toBackendFields([builder('a', 1000), builder('b')], prev);
        expect(out.map((r) => r.order)).toEqual([1000, 2000]);
    });

    it('legacy order kecil (1,2): insert depan pakai 0 tanpa rebalance', () => {
        const prev = toBackendFields([builder('a', 1), builder('b', 2)]);
        const out = toBackendFields([builder('x'), builder('a', 1), builder('b', 2)], prev);
        const byId = new Map(out.map((r) => [r.id, r.order]));
        expect(byId.get('a')).toBe(1);
        expect(byId.get('b')).toBe(2);
        expect(byId.get('x')).toBe(0);
    });

    it('celah integer habis → fallback rebalance penuh (tetap integer >=0)', () => {
        const prev = toBackendFields([builder('a', 0), builder('c', 1)]);
        const out = toBackendFields([builder('a', 0), builder('b'), builder('c', 1)], prev);
        for (const r of out) {
            expect(Number.isInteger(r.order)).toBe(true);
            expect(r.order).toBeGreaterThanOrEqual(0);
        }
        const orders = out.map((r) => r.order);
        const sorted = [...orders].sort((x, y) => x - y);
        expect(orders).toEqual(sorted);
    });

    it('reorder eksplisit hanya menulis rentang yang dipindah', () => {
        const prev = toBackendFields([builder('a', 1000), builder('b', 2000), builder('c', 3000)]);
        // Pindah c ke depan: [c, a, b]
        const out = toBackendFields([builder('c', 3000), builder('a', 1000), builder('b', 2000)], prev);
        const orders = out.map((r) => r.order);
        // Urutan kanvas harus menaik secara numerik.
        expect([...orders].sort((x, y) => x - y)).toEqual(orders);
        const diff = diffBackendFields(out, prev);
        // Hanya yang pindah yang kotor; a/b bertahan.
        expect(diff.dirty.map((r) => r.id)).toEqual(['c']);
    });

    it('allocateOrderRun mengembalikan null bila slot habis', () => {
        expect(allocateOrderRun(0, 1, 1)).toBeNull();
        expect(allocateOrderRun(null, 0, 1)).toBeNull();
    });
});
