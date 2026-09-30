import type { BackendField, BuilderField, IFieldOptionEntry } from '@/types/formBuilder';
import type { TFormFieldMetadataBag, TFormFieldMetadataValue } from '@/types/form';
import { isMetadataBag } from '@/lib/formFieldMetadata';
import { normalizeBannerSrc } from '@/lib/bannerSrc';

export interface ITPendingOptionImageFile {
    fieldId: string;
    optionId: string;
    file: File;
}

/** Kumpulkan File mentah opsi yang menunggu upload (tidak ikut serialisasi). */
export function collectPendingOptionImageFiles(fields: BuilderField[]): ITPendingOptionImageFile[] {
    const out: ITPendingOptionImageFile[] = [];
    for (const f of fields) {
        if (!Array.isArray(f.options)) continue;
        if (f.type === 'dropdown') continue;
        for (const opt of f.options) {
            if (opt.type !== 'image') continue;
            if (opt.imageFile instanceof File) {
                out.push({ fieldId: f.id, optionId: opt.id, file: opt.imageFile });
            }
        }
    }
    return out;
}

/** True bila ada File opsi baru yang menunggu upload via POST /fields. */
export function hasPendingOptionImageFiles(fields: BuilderField[]): boolean {
    return collectPendingOptionImageFiles(fields).length > 0;
}

/** Kunci snapshot autosave untuk file opsi pending (nama + ukuran + mtime per file). */
export function pendingOptionImagesSnapshotKey(fields: BuilderField[]): string | null {
    const pending = collectPendingOptionImageFiles(fields);
    if (pending.length === 0) return null;
    return pending
        .map((p) => `${p.fieldId}:${p.optionId}:${p.file.name}:${p.file.size}:${p.file.lastModified}`)
        .sort()
        .join('|');
}

/**
 * Pastikan baris field yang punya file opsi pending ikut terkirim saat ada
 * file baru — walau diff per-id bersih (pola ensureBannerRowDirty).
 */
export function ensureOptionImageRowsDirty(backend: BackendField[], dirty: BackendField[]): BackendField[] {
    const dirtyIds = new Set(dirty.map((r) => r.id));
    const extra = backend.filter((r) => !dirtyIds.has(r.id) && rowHasPendingFile(r));
    if (extra.length === 0) return dirty;
    return [...extra, ...dirty];
}

/** Baca kunci dari baris opsi JSON-like; dipakai setelah guard agar tanpa cast. */
function readChoiceField(bag: TFormFieldMetadataBag, key: string): TFormFieldMetadataValue | undefined {
    return bag[key];
}

function rowHasPendingFile(row: BackendField): boolean {
    const meta: TFormFieldMetadataBag | undefined = row.metadata;
    const choices = meta?.optionChoices;
    if (!Array.isArray(choices)) return false;
    // Serialisasi mengirim imageUrl '' saat file pending; baris dengan
    // pilihan image ber-url kosong dianggap membawa file baru.
    // Baris image tanpa file (url kosong manual) ikut terkirim — aman
    // (server hanya mengganti bila file ada untuk pasangan id tersebut).
    return choices.some((candidate) => {
        if (!isMetadataBag(candidate)) return false;
        return (
            readChoiceField(candidate, 'type') === 'image' &&
            String(readChoiceField(candidate, 'imageUrl') ?? '') === ''
        );
    });
}

/**
 * Tambahkan part file per opsi ke FormData yang sudah berisi fields +
 * deleted_ids sebagai JSON-string part. Kunci bersarang
 * `option_images[fieldId][optionId]` agar server bisa pasangkan tanpa
 * peta tambahan (fieldId/optionId = UUID tanpa karakter khusus).
 */
export function appendOptionImageFiles(formData: FormData, files: ITPendingOptionImageFile[]): void {
    for (const p of files) {
        formData.append(`option_images[${p.fieldId}][${p.optionId}]`, p.file, p.file.name);
    }
}

/**
 * Bangun multipart untuk autosave POST /fields saat ada file opsi baru
 * (pola buildBannerFieldsFormData): `fields` + `deleted_ids` sebagai
 * JSON-string part + `banner_file` opsional + part file per opsi.
 */
/** Argumen multipart autosave opsi bergambar (dirty + deleted eksplisit + file pending + banner opsional). */
export interface IBuildOptionImageFieldsFormDataArgs {
    dirty: BackendField[];
    deletedIds: string[];
    optionFiles: ITPendingOptionImageFile[];
    bannerFile?: File | null;
}

export function buildOptionImageFieldsFormData(args: IBuildOptionImageFieldsFormDataArgs): FormData {
    const formData = new FormData();
    formData.append('fields', JSON.stringify(args.dirty));
    formData.append('deleted_ids', JSON.stringify(args.deletedIds));
    if (args.bannerFile instanceof File) {
        formData.append('banner_file', args.bannerFile, args.bannerFile.name);
    }
    appendOptionImageFiles(formData, args.optionFiles);
    return formData;
}

/** Baca peta stored path opsi dari respons POST /fields (toleran bila tak ada). */
export function readOptionImagePathsFromResponse(payload: unknown): Record<string, string> | null {
    if (!isMetadataBag(payload)) return null;
    const raw = payload.option_images;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'string' && value.trim() !== '') {
            out[key] = value.trim();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Bentuk bersarang { fieldId: { optionId: path } } → ratakan ke "fieldId:optionId".
            for (const [optionId, path] of Object.entries(value)) {
                if (typeof path === 'string' && path.trim() !== '') {
                    out[`${key}:${optionId}`] = path.trim();
                }
            }
        }
    }
    return Object.keys(out).length > 0 ? out : null;
}

/**
 * Setelah upload sukses: state pegang path string, bukan File/base64.
 * Kunci peta "fieldId:optionId" (lihat server); cabut object URL preview.
 */
export function applyOptionImageUploadSuccess(fields: BuilderField[], storedMap: Record<string, string>): void {
    for (const f of fields) {
        if (!Array.isArray(f.options)) continue;
        for (const opt of f.options) {
            const key = `${f.id}:${opt.id}`;
            const storedPath = storedMap[key];
            if (typeof storedPath !== 'string' || storedPath === '') continue;
            if (!(opt.imageFile instanceof File)) continue;
            revokeOptionImagePreviewUrl(opt.imagePreviewUrl);
            opt.imageUrl = storedPath;
            opt.imageFile = null;
            opt.imagePreviewUrl = '';
        }
    }
}

/** Buang File + preview pending pada semua opsi (dipakai saat create tanpa id). */
export function discardPendingOptionImageFiles(fields: BuilderField[]): boolean {
    let hadPending = false;
    for (const f of fields) {
        if (!Array.isArray(f.options)) continue;
        for (const opt of f.options) {
            if (opt.imageFile instanceof File) {
                hadPending = true;
                revokeOptionImagePreviewUrl(opt.imagePreviewUrl);
                opt.imageFile = null;
                opt.imagePreviewUrl = '';
            }
        }
    }
    return hadPending;
}

/** Cabut object URL preview bila ada (cegah bocor memori, pola formBanner). */
export function revokeOptionImagePreviewUrl(url: string | undefined | null): void {
    if (typeof url !== 'string' || url === '') return;
    if (!url.startsWith('blob:')) return;
    try {
        URL.revokeObjectURL(url);
    } catch {
        /* abaikan */
    }
}

/** Preview yang harus tampil: object URL file baru diutamakan, lalu path tersimpan. */
export function resolveOptionImagePreviewSrc(entry: IFieldOptionEntry, fallback = ''): string {
    const preview = (entry.imagePreviewUrl ?? '').trim();
    if (preview !== '') return preview;
    const fromUrl = normalizeBannerSrc(String(entry.imageUrl ?? ''));
    if (fromUrl !== '') return fromUrl;
    return fallback;
}
