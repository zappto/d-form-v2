import { describe, expect, it } from 'vitest';
import { toBackendFields } from '../fieldMapping';
import {
    applyOptionImageUploadSuccess,
    buildOptionImageFieldsFormData,
    collectPendingOptionImageFiles,
    ensureOptionImageRowsDirty,
    hasPendingOptionImageFiles,
    pendingOptionImagesSnapshotKey,
    readOptionImagePathsFromResponse,
    resolveOptionImagePreviewSrc,
} from '../optionImage';
import type { BackendField, BuilderField, IFieldOptionEntry } from '@/types/formBuilder';

function optionField(fieldId: string, optionId: string, extra: Partial<IFieldOptionEntry> = {}): BuilderField {
    return {
        id: fieldId,
        type: 'checkbox',
        label: 'Pilih gambar',
        description: '',
        name: 'pilih_gambar',
        placeholder: '',
        required: false,
        options: [
            {
                id: optionId,
                type: 'image',
                label: 'Kucing',
                imageUrl: 'forms/options/old.jpg',
                ...extra,
            },
        ],
        metadata: {},
    };
}

describe('option image upload (base64 → file storage)', () => {
    it('serialize kirim imageUrl kosong selama file pending (tanpa data:)', () => {
        const file = new File(['bytes'], 'kucing.jpg', { type: 'image/jpeg' });
        const rows = toBackendFields([
            optionField('f1', 'o1', {
                imageUrl: 'forms/options/old.jpg',
                imageFile: file,
                imagePreviewUrl: 'blob:preview',
            }),
        ]);
        const choices = rows[0].metadata.optionChoices as IFieldOptionEntry[];
        expect(choices[0].imageUrl).toBe('');
        // File mentah tak ikut serialisasi.
        expect(JSON.stringify(rows)).not.toContain('data:');
        expect(JSON.stringify(rows)).not.toContain('blob:');
        expect(JSON.stringify(rows)).not.toContain('kucing.jpg');
    });

    it('tanpa file pending berperilaku seperti sekarang (path utuh)', () => {
        const rows = toBackendFields([optionField('f1', 'o1')]);
        const choices = rows[0].metadata.optionChoices as IFieldOptionEntry[];
        expect(choices[0].imageUrl).toBe('forms/options/old.jpg');
        expect(hasPendingOptionImageFiles([optionField('f1', 'o1')])).toBe(false);
        expect(pendingOptionImagesSnapshotKey([optionField('f1', 'o1')])).toBeNull();
    });

    it('pending terkumpul + snapshot berubah + FormData bawa part file per opsi', () => {
        const file = new File(['bytes'], 'kucing.jpg', { type: 'image/jpeg' });
        const fields = [optionField('f1', 'o1', { imageFile: file, imagePreviewUrl: 'blob:preview' })];
        expect(hasPendingOptionImageFiles(fields)).toBe(true);
        expect(pendingOptionImagesSnapshotKey(fields)).toContain('f1:o1:kucing.jpg');

        const backend = toBackendFields(fields);
        const fd = buildOptionImageFieldsFormData({
            dirty: backend,
            deletedIds: [],
            optionFiles: collectPendingOptionImageFiles(fields),
            bannerFile: null,
        });
        // fields + deleted_ids sebagai JSON-string part (tanpa data:).
        const fieldsPart = fd.get('fields');
        expect(typeof fieldsPart).toBe('string');
        expect(String(fieldsPart)).not.toContain('data:');
        expect(String(fieldsPart)).toContain('"imageUrl":""');
        // Part file per opsi dengan peta fieldId/optionId di nama kunci.
        const stored = fd.get('option_images[f1][o1]');
        expect(stored instanceof File).toBe(true);
    });

    it('baris opsi pending ikut dirty walau diff bersih + apply sukses ganti path', () => {
        const file = new File(['bytes'], 'kucing.jpg', { type: 'image/jpeg' });
        const fields = [
            optionField('f1', 'o1', {
                imageUrl: 'forms/options/old.jpg',
                imageFile: file,
                imagePreviewUrl: 'blob:preview',
            }),
        ];
        const backend = toBackendFields(fields);
        // Simulasi diff bersih (snapshot sudah berisi imageUrl '').
        const dirty: BackendField[] = [];
        const ensured = ensureOptionImageRowsDirty(backend, dirty);
        expect(ensured.map((r) => r.id)).toEqual(['f1']);

        const storedMap = readOptionImagePathsFromResponse({
            ok: true,
            option_images: { 'f1:o1': 'forms/options/kucing.jpg' },
        });
        expect(storedMap).toEqual({ 'f1:o1': 'forms/options/kucing.jpg' });
        if (storedMap === null) throw new Error('peta stored path opsi harus ada');
        applyOptionImageUploadSuccess(fields, storedMap);
        const opt = fields[0].options[0];
        expect(opt.imageUrl).toBe('forms/options/kucing.jpg');
        expect(opt.imageFile).toBeNull();
        expect(opt.imagePreviewUrl).toBe('');
    });

    it('respons bersarang { fieldId: { optionId } } diratakan tanpa cast', () => {
        expect(readOptionImagePathsFromResponse({ option_images: { f1: { o1: 'forms/o.jpg' } } })).toEqual({
            'f1:o1': 'forms/o.jpg',
        });
    });

    it('payload non-bag (array) dan option_images array → null', () => {
        expect(readOptionImagePathsFromResponse([])).toBeNull();
        expect(readOptionImagePathsFromResponse({ option_images: [1, 2] })).toBeNull();
    });

    it('optionChoices malformed (string/array) tidak dianggap file pending', () => {
        const row: BackendField = {
            id: 'f1',
            type: 'checkbox',
            label: 'Pilih',
            description: null,
            name: 'pilih',
            order: 1000,
            metadata: { optionChoices: ['x', ['y']] },
        };
        expect(ensureOptionImageRowsDirty([row], [])).toEqual([]);
    });

    it('path relatif tampil via normalize (/storage/) + preview blob diutamakan', () => {
        expect(
            resolveOptionImagePreviewSrc({
                id: 'o1',
                type: 'image',
                label: 'Kucing',
                imageUrl: 'forms/options/kucing.jpg',
            })
        ).toBe('/storage/forms/options/kucing.jpg');
        expect(
            resolveOptionImagePreviewSrc({
                id: 'o1',
                type: 'image',
                label: 'Kucing',
                imageUrl: 'forms/options/old.jpg',
                imagePreviewUrl: 'blob:preview-baru',
            })
        ).toBe('blob:preview-baru');
    });
});
