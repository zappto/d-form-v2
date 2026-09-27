import type { BuilderField } from '@/components/modules/builder/fieldMapping';
import type { BackendField } from '@/types/formBuilder';
import type { TFormFieldMetadataBag } from '@/types/form';
import { normalizeBannerSrc } from '@/lib/bannerSrc';
import { BANNER_ACCEPT_MIMES } from '@/lib/displayLimits';

export interface ITFormBannerState {
    id: string | null;
    bannerUrl: string;
    bannerFileName: string;
    caption: string;
    /** File baru yang belum terupload — tidak diserialisasi ke DB, hanya di state. */
    bannerFile?: File | null;
    /** Object URL untuk preview file baru — tidak diserialisasi ke DB. */
    bannerPreviewUrl?: string;
    /** Order backend baris banner (spaced ordering); null bila baris belum ada. */
    order?: number | null;
}

function recordMetadata(field: IFormField): TFormFieldMetadataBag {
    return field.metadata && typeof field.metadata === 'object' ? field.metadata : {};
}

function builderApiType(field: IFormField): string {
    const metadata = recordMetadata(field);
    const builderType = metadata.builderType;
    return typeof builderType === 'string' ? builderType : field.type;
}

/** State banner form kosong tanpa file/url; titik awal sebelum baris banner dimuat dari field. */
export function defaultFormBannerState(): ITFormBannerState {
    return {
        id: null,
        bannerUrl: '',
        bannerFileName: '',
        caption: '',
        bannerFile: null,
        bannerPreviewUrl: '',
        order: null,
    };
}

/** True bila ada File banner baru yang menunggu upload via POST /fields. */
export function hasPendingBannerFile(state: ITFormBannerState): boolean {
    return state.bannerFile instanceof File;
}

/** Kunci snapshot autosave untuk file pending (nama + ukuran + mtime). */
export function pendingBannerSnapshotKey(state: ITFormBannerState): string | null {
    const bannerFile = state.bannerFile;
    if (!(bannerFile instanceof File)) return null;
    return `${bannerFile.name}:${bannerFile.size}:${bannerFile.lastModified}`;
}

/** Preview yang harus tampil: object URL file baru diutamakan, lalu path tersimpan. */
export function resolveBannerPreviewSrc(state: ITFormBannerState, fallback = ''): string {
    const preview = (state.bannerPreviewUrl ?? '').trim();
    if (preview !== '') return preview;
    const fromUrl = normalizeBannerSrc(state.bannerUrl);
    if (fromUrl !== '') return fromUrl;
    return fallback;
}

/** Cabut object URL preview bila ada (cegah bocor memori). */
export function revokeBannerPreview(state: ITFormBannerState): void {
    const preview = state.bannerPreviewUrl ?? '';
    if (preview.startsWith('blob:')) {
        try {
            URL.revokeObjectURL(preview);
        } catch {
            /* abaikan */
        }
    }
    state.bannerPreviewUrl = '';
}

/** Pisahkan baris banner dari daftar field builder ke state banner dan sisakan field kanvas; dipakai saat memuat form. */
export function extractFormBannerFromBuilderFields(rows: BuilderField[]): {
    banner: ITFormBannerState;
    canvasFields: BuilderField[];
} {
    const idxFlag = rows.findIndex((f) => f.type === 'banner' && Boolean(f.metadata?.formBanner));
    const idxLegacy = idxFlag === -1 ? rows.findIndex((f) => f.type === 'banner') : -1;
    const idx = idxFlag >= 0 ? idxFlag : idxLegacy;

    if (idx === -1) {
        return { banner: defaultFormBannerState(), canvasFields: [...rows] };
    }

    const backendField = rows[idx];
    const meta = backendField.metadata ?? {};
    const banner: ITFormBannerState = {
        id: backendField.id,
        bannerUrl: typeof meta.bannerUrl === 'string' ? meta.bannerUrl : '',
        bannerFileName: typeof meta.bannerFileName === 'string' ? meta.bannerFileName : '',
        caption: typeof meta.content === 'string' ? meta.content : '',
        bannerFile: null,
        bannerPreviewUrl: '',
        order:
            typeof backendField.order === 'number' && Number.isFinite(backendField.order)
                ? Math.trunc(backendField.order)
                : null,
    };
    const canvasFields = rows.filter((_, i) => i !== idx);
    return { banner, canvasFields };
}

const FORM_BANNER_NAME = 'form_banner';

/** Bangun field builder banner dari state, atau null bila tak ada isi; dipakai menyusun payload simpan. */
export function buildFormBannerBuilderField(state: ITFormBannerState): BuilderField | null {
    const trimmedUrl = state.bannerUrl.trim();
    const trimmedCaption = state.caption.trim();
    const hadPrevious = typeof state.id === 'string' && state.id !== '';
    const hasPendingFile = hasPendingBannerFile(state);
    // File baru tanpa url/caption tetap payload (server ganti url dengan stored path).
    const hasPayload = trimmedUrl !== '' || trimmedCaption !== '' || hasPendingFile;

    if (!hasPayload && !hadPrevious) {
        return null;
    }

    if (!hasPayload && hadPrevious) {
        return null;
    }

    if (!hadPrevious) {
        state.id = crypto.randomUUID();
    }

    const fieldId = state.id;
    if (fieldId === null) return null;

    const order = typeof state.order === 'number' && Number.isFinite(state.order) ? Math.trunc(state.order) : undefined;

    return {
        id: fieldId,
        type: 'banner',
        label: 'Form banner',
        description: '',
        name: FORM_BANNER_NAME,
        placeholder: '',
        required: false,
        options: [],
        ...(order !== undefined ? { order } : {}),
        metadata: {
            accepts: BANNER_ACCEPT_MIMES,
            bannerUrl: trimmedUrl,
            bannerFileName: state.bannerFileName.trim(),
            content: trimmedCaption,
            formBanner: true,
        },
    };
}

/** Sisipkan field banner hasil sintesis di depan daftar field payload; banner kosong membiarkan daftar apa adanya. */
export function prependFormBannerToBackendPayload(
    canvasFields: BuilderField[],
    banner: ITFormBannerState
): BuilderField[] {
    const synth = buildFormBannerBuilderField(banner);
    if (!synth) {
        return canvasFields;
    }
    return [synth, ...canvasFields];
}

/** Deteksi baris banner pada payload backend (untuk multipart + fallback server). */
export function isBannerBackendRow(row: Pick<BackendField, 'name' | 'type' | 'metadata'>): boolean {
    if (row.name === FORM_BANNER_NAME) return true;
    if (row.type === 'banner') return true;
    const meta: TFormFieldMetadataBag | undefined = row.metadata;
    if (meta && typeof meta === 'object') {
        if (meta.formBanner === true) return true;
        if (typeof meta.builderType === 'string' && meta.builderType === 'banner') return true;
    }
    return false;
}

/**
 * Pastikan baris banner ikut terkirim saat ada file pending — walau
 * bannerUrl/caption/order tak berubah (diff per-id akan melewatkannya).
 */
export function ensureBannerRowDirty(backend: BackendField[], dirty: BackendField[]): BackendField[] {
    const banner = backend.find((r) => isBannerBackendRow(r));
    if (!banner) return dirty;
    if (dirty.some((r) => r.id === banner.id)) return dirty;
    return [banner, ...dirty];
}

/**
 * Bangun multipart untuk autosave POST /fields saat ada file banner baru:
 * `fields` + `deleted_ids` sebagai JSON-string part (Laravel parse native
 * via FormData; decode di server) + `banner_file` sebagai file part.
 */
export function buildBannerFieldsFormData(dirty: BackendField[], deletedIds: string[], file: File): FormData {
    const formData = new FormData();
    formData.append('fields', JSON.stringify(dirty));
    formData.append('deleted_ids', JSON.stringify(deletedIds));
    formData.append('banner_file', file, file.name);
    return formData;
}

/** Setelah upload sukses: state pegang path string, bukan File/base64. */
export function applyBannerUploadSuccess(state: ITFormBannerState, storedPath: string, fileName?: string): void {
    revokeBannerPreview(state);
    state.bannerUrl = storedPath;
    if (typeof fileName === 'string' && fileName.trim() !== '') {
        state.bannerFileName = fileName;
    }
    state.bannerFile = null;
    state.bannerPreviewUrl = '';
}

/** True bila value berupa objek JSON-like non-null; menyempitkan body respons HTTP tanpa cast. */
function isMetadataBag(value: unknown): value is TFormFieldMetadataBag {
    return value !== null && typeof value === 'object';
}

/** Baca stored path dari respons POST /fields (tetap toleran bila tak ada). */
export function readBannerPathFromResponse(payload: unknown): string | null {
    if (!isMetadataBag(payload)) return null;
    const rec = payload;
    for (const key of ['banner_url', 'banner_path', 'bannerUrl']) {
        const rawValue = rec[key];
        if (typeof rawValue === 'string' && rawValue.trim() !== '') return rawValue.trim();
    }
    return null;
}

/** Pilih baris banner form (yang ditandai formBanner dulu, lalu legacy) paling awal berdasar order; dipakai halaman isi form. */
export function pickFormBannerField(fields: readonly IFormField[]): IFormField | null {
    const flagged = [...fields].filter((f) => builderApiType(f) === 'banner' && recordMetadata(f).formBanner === true);
    if (flagged.length > 0) {
        return flagged.sort((a, b) => a.order - b.order)[0] ?? null;
    }
    const legacy = [...fields].filter((f) => builderApiType(f) === 'banner');
    return legacy.sort((a, b) => a.order - b.order)[0] ?? null;
}

/** Buang baris banner dari daftar field agar tersisa field isian saja; dipakai sebelum render/validasi. */
export function filterBodyFields(fields: readonly IFormField[]): IFormField[] {
    return fields.filter((f) => builderApiType(f) !== 'banner');
}
