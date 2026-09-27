import { formFieldApiType, formFieldBuilderType } from '@/lib/formFieldOptions';

/** Nama tipe API/builder yang menandakan unggahan berkas atau foto. */
export const FILE_UPLOAD_TYPE_NAMES: ReadonlySet<string> = new Set(['fileUpload', 'file_upload', 'image_upload']);

/** True bila nama tipe field termasuk unggahan berkas/foto; dipakai saat memetakan tipe API/builder. */
export function isFileUploadTypeName(type: string): boolean {
    return FILE_UPLOAD_TYPE_NAMES.has(type);
}

/** True bila field form berupa unggahan berkas/foto (banner dikecualikan — bukan jawaban). */
export function isFileUploadField(field: IFormField | null): boolean {
    if (field === null) return false;
    const builderType = formFieldBuilderType(field);
    if (builderType === 'banner' || field.name === 'form_banner') return false;
    if (formFieldApiType(field) === 'fileUpload') return true;
    return isFileUploadTypeName(builderType);
}
