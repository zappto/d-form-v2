import { describe, expect, it } from 'vitest';
import { FILE_UPLOAD_TYPE_NAMES, isFileUploadField, isFileUploadTypeName } from '@/lib/formFieldKind';

function field(overrides: Partial<IFormField>): IFormField {
    return { id: 'f-1', type: 'input', label: 'Field', name: 'field', order: 1, metadata: {}, ...overrides };
}

describe('isFileUploadTypeName', () => {
    it.each([
        ['fileUpload', true],
        ['file_upload', true],
        ['image_upload', true],
        ['text', false],
        ['banner', false],
    ])('isFileUploadTypeName(%s) === %s', (type, expected) => {
        expect(isFileUploadTypeName(type)).toBe(expected);
    });

    it('mengekspos himpunan nama tipe unggahan kanonik', () => {
        expect([...FILE_UPLOAD_TYPE_NAMES].sort()).toEqual(['fileUpload', 'file_upload', 'image_upload']);
    });
});

describe('isFileUploadField', () => {
    it('true untuk tipe API fileUpload', () => {
        expect(isFileUploadField(field({ type: 'fileUpload' }))).toBe(true);
    });

    it('true untuk tipe builder unggahan berkas/foto', () => {
        expect(isFileUploadField(field({ metadata: { builderType: 'file_upload' } }))).toBe(true);
        expect(isFileUploadField(field({ metadata: { builderType: 'image_upload' } }))).toBe(true);
    });

    it('false untuk banner (bukan jawaban)', () => {
        expect(isFileUploadField(field({ name: 'form_banner', metadata: { builderType: 'banner' } }))).toBe(false);
    });

    it('false untuk field teks dan field null', () => {
        expect(isFileUploadField(field({ metadata: { builderType: 'short_text' } }))).toBe(false);
        expect(isFileUploadField(null)).toBe(false);
    });
});
