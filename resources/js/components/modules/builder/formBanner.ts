import type { BuilderField } from '@/components/modules/builder/fieldMapping';
import type { BackendField } from '@/types/form-builder';

export interface TFormBannerState {
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

function recordMetadata(field: IFormField): Record<string, unknown> {
    return field.metadata && typeof field.metadata === 'object' ? field.metadata : {};
}

function builderApiType(field: IFormField): string {
    const m = recordMetadata(field);
    const bt = m.builderType;
    return typeof bt === 'string' ? bt : field.type;
}

/** State banner form kosong tanpa file/url; titik awal sebelum baris banner dimuat dari field. */
export function defaultFormBannerState(): TFormBannerState {
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

/** Public URL / data URL / relative storage path → safe display URL for <img>. */
export function normalizeBannerSrc(raw: string): string {
    const u = raw.trim();
    if (!u) return '';
    if (u.startsWith('data:')) return u;
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('blob:')) return u;
    if (u.startsWith('/')) return u;
    return `/storage/${u.replace(/^\/+/, '')}`;
}

/** True bila ada File banner baru yang menunggu upload via POST /fields. */
export function hasPendingBannerFile(state: TFormBannerState): boolean {
    return state.bannerFile instanceof File;
}

/** Kunci snapshot autosave untuk file pending (nama + ukuran + mtime). */
export function pendingBannerSnapshotKey(state: TFormBannerState): string | null {
    const f = state.bannerFile;
    if (!(f instanceof File)) return null;
    return `${f.name}:${f.size}:${f.lastModified}`;
}

/** Preview yang harus tampil: object URL file baru diutamakan, lalu path tersimpan. */
export function resolveBannerPreviewSrc(state: TFormBannerState, fallback = ''): string {
    const preview = (state.bannerPreviewUrl ?? '').trim();
    if (preview !== '') return preview;
    const fromUrl = normalizeBannerSrc(state.bannerUrl);
    if (fromUrl !== '') return fromUrl;
    return fallback;
}

/** Cabut object URL preview bila ada (cegah bocor memori). */
export function revokeBannerPreview(state: TFormBannerState): void {
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
    banner: TFormBannerState;
    canvasFields: BuilderField[];
} {
    const idxFlag = rows.findIndex(
        (f) => f.type === 'banner' && Boolean((f.metadata as Record<string, unknown> | undefined)?.formBanner)
    );
    const idxLegacy = idxFlag === -1 ? rows.findIndex((f) => f.type === 'banner') : -1;
    const idx = idxFlag >= 0 ? idxFlag : idxLegacy;

    if (idx === -1) {
        return { banner: defaultFormBannerState(), canvasFields: [...rows] };
    }

    const bf = rows[idx];
    const meta = bf.metadata ?? {};
    const banner: TFormBannerState = {
        id: bf.id,
        bannerUrl: typeof meta.bannerUrl === 'string' ? meta.bannerUrl : '',
        bannerFileName: typeof meta.bannerFileName === 'string' ? meta.bannerFileName : '',
        caption: typeof meta.content === 'string' ? meta.content : '',
        bannerFile: null,
        bannerPreviewUrl: '',
        order: typeof bf.order === 'number' && Number.isFinite(bf.order) ? Math.trunc(bf.order) : null,
    };
    const canvasFields = rows.filter((_, i) => i !== idx);
    return { banner, canvasFields };
}

const FORM_BANNER_NAME = 'form_banner';

/** Bangun field builder banner dari state, atau null bila tak ada isi; dipakai menyusun payload simpan. */
export function buildFormBannerBuilderField(state: TFormBannerState): BuilderField | null {
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

    const id = state.id!;

    const order = typeof state.order === 'number' && Number.isFinite(state.order) ? Math.trunc(state.order) : undefined;

    return {
        id,
        type: 'banner',
        label: 'Form banner',
        description: '',
        name: FORM_BANNER_NAME,
        placeholder: '',
        required: false,
        options: [],
        ...(order !== undefined ? { order } : {}),
        metadata: {
            accepts: 'gif, png, jpg, jpeg',
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
    banner: TFormBannerState
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
    const meta = row.metadata as Record<string, unknown> | undefined;
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
    const fd = new FormData();
    fd.append('fields', JSON.stringify(dirty));
    fd.append('deleted_ids', JSON.stringify(deletedIds));
    fd.append('banner_file', file, file.name);
    return fd;
}

/** Setelah upload sukses: state pegang path string, bukan File/base64. */
export function applyBannerUploadSuccess(state: TFormBannerState, storedPath: string, fileName?: string): void {
    revokeBannerPreview(state);
    state.bannerUrl = storedPath;
    if (typeof fileName === 'string' && fileName.trim() !== '') {
        state.bannerFileName = fileName;
    }
    state.bannerFile = null;
    state.bannerPreviewUrl = '';
}

/** Baca stored path dari respons POST /fields (tetap toleran bila tak ada). */
export function readBannerPathFromResponse(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') return null;
    const rec = payload as Record<string, unknown>;
    for (const key of ['banner_url', 'banner_path', 'bannerUrl']) {
        const v = rec[key];
        if (typeof v === 'string' && v.trim() !== '') return v.trim();
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
