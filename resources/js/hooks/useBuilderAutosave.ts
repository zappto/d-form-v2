import axios from 'axios';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { buildUnloadPayload, shouldSkipHydrate } from '@/components/modules/builder/autosaveGuard';
import { diffBackendFields, snapshotBackendFields } from '@/components/modules/builder/dirtyFields';
import { toBackendFields } from '@/components/modules/builder/fieldMapping';
import {
    applyBannerUploadSuccess,
    buildBannerFieldsFormData,
    ensureBannerRowDirty,
    hasPendingBannerFile,
    pendingBannerSnapshotKey,
    prependFormBannerToBackendPayload,
    readBannerPathFromResponse,
    type FormBannerState,
} from '@/components/modules/builder/formBanner';
import {
    applyOptionImageUploadSuccess,
    buildOptionImageFieldsFormData,
    collectPendingOptionImageFiles,
    discardPendingOptionImageFiles,
    ensureOptionImageRowsDirty,
    pendingOptionImagesSnapshotKey,
    readOptionImagePathsFromResponse,
    type PendingOptionImageFile,
} from '@/components/modules/builder/optionImage';
import { mergeSentHeader, stripBlankRequiredKeys } from '@/lib/autosaveHeader';
import { toFormMetadataPayload, type FormRegistrationMetadata } from '@/types/form';
import type { BackendField, BuilderField } from '@/types/form-builder';
import { useAutosaveSync, type AutosaveStatus } from './useAutosaveSync';

/** State builder langsung yang dibaca hook tiap save; sumber tetap milik halaman. */
export interface IBuilderAutosaveState {
    title: string;
    description: string;
    successContent: string;
    closedAt: string;
    visibleFor: string[];
    banner: FormBannerState;
    fields: BuilderField[];
    metadata: FormRegistrationMetadata;
}

/** Pemasok state + URL + gerbang yang wajib disediakan tiap halaman konsumen. */
export interface IBuilderAutosaveOptions {
    getState: () => IBuilderAutosaveState;
    resolveFieldsUrl: () => string;
    resolveAutosaveUrl: () => string;
    readEnabled: () => boolean;
    notifySaveError: () => void;
}

/** Hasil hook: snapshot/save autosave + guard hydrate + beacon unload. */
export interface IBuilderAutosaveResult {
    snapshot: () => string;
    /** Dipanggil watch dengan snapshot terbaru sebagai pemicu; state dibaca live saat save. */
    save: (snapshot: string) => Promise<boolean>;
    status: Ref<AutosaveStatus>;
    flush: () => Promise<void>;
    evaluateHydrate: (formId: string, pending: boolean) => boolean;
    registerHydrated: (formId: string) => void;
    flushBeacon: () => void;
}

/** Header autosave ternormalisasi persis seperti payload PATCH yang dikirim. */
interface IHeaderPayload {
    title: string;
    description: string;
    success_content: string | null;
    closed_at: string | null;
    visible_for: string[];
    banner_url: string | null;
    banner_caption: string | null;
    metadata: ReturnType<typeof toFormMetadataPayload>;
}

/** Header PATCH ternormalisasi dari state builder saat ini. */
function buildHeaderPayload(state: IBuilderAutosaveState): IHeaderPayload {
    return {
        title: state.title,
        description: state.description,
        success_content: state.successContent,
        closed_at: state.closedAt.trim() !== '' ? state.closedAt : null,
        visible_for: [...state.visibleFor],
        banner_url: state.banner.bannerUrl || null,
        banner_caption: state.banner.caption || null,
        metadata: toFormMetadataPayload(state.metadata),
    };
}

/** Field header yang ikut diff PATCH; `Record` memaksa daftarnya exhaustive. */
const HEADER_FIELDS: Record<keyof IHeaderPayload, true> = {
    title: true,
    description: true,
    success_content: true,
    closed_at: true,
    visible_for: true,
    banner_url: true,
    banner_caption: true,
    metadata: true,
};

/** True bila dua nilai berbeda menurut serialisasi JSON (hemat payload per-key). */
function headerValueChanged<GValue>(currentValue: GValue, sentValue: GValue): boolean {
    return JSON.stringify(currentValue) !== JSON.stringify(sentValue);
}

/** Argumen diff per-key: objek live + snapshot + daftar field yang dibandingkan. */
interface IChangedFieldsRequest<GObject extends object, GKey extends keyof GObject> {
    current: GObject;
    sent: GObject;
    fields: Record<GKey, true>;
}

/** Ambil key yang nilainya berbeda antara current dan sent (satu objek argumen, maks dua param). */
function pickChangedFields<GObject extends object, GKey extends keyof GObject>(
    request: IChangedFieldsRequest<GObject, GKey>
): Partial<GObject> {
    const diff: Partial<GObject> = {};
    // Object.keys selalu string[] di TS; cast sempit ini satu-satunya cara iterasi runtime.
    for (const key of Object.keys(request.fields) as GKey[]) {
        if (headerValueChanged(request.current[key], request.sent[key])) {
            diff[key] = request.current[key];
        }
    }
    return diff;
}

/** Diff header per-key vs snapshot sukses terakhir; penuh bila belum pernah kirim. */
function diffHeaderPayload(current: IHeaderPayload, sent: IHeaderPayload | null): Partial<IHeaderPayload> {
    if (sent === null) return { ...current };
    return pickChangedFields({ current, sent, fields: HEADER_FIELDS });
}

/** String snapshot autosave; kunci sama persis seperti builder halaman lama. */
function buildSnapshotText(state: IBuilderAutosaveState): string {
    return JSON.stringify({
        fields: state.fields,
        title: state.title,
        description: state.description,
        bannerUrl: state.banner.bannerUrl,
        bannerCaption: state.banner.caption,
        bannerFileName: state.banner.bannerFileName,
        bannerPending: pendingBannerSnapshotKey(state.banner),
        optionImagesPending: pendingOptionImagesSnapshotKey(state.fields),
        success: state.successContent,
        closedAt: state.closedAt,
        visibleFor: state.visibleFor,
        metadata: state.metadata,
    });
}

/** File banner pending sebagai File, atau null bila tak ada (tanpa casting). */
function pendingBannerUpload(state: IBuilderAutosaveState): File | null {
    if (!hasPendingBannerFile(state.banner)) return null;
    const candidate = state.banner.bannerFile;
    return candidate instanceof File ? candidate : null;
}

/** Argumen paksa-dirty baris banner/opsi saat file pending (diff per-id melewatkannya). */
interface IPendingDirtyRequest {
    backend: BackendField[];
    dirty: BackendField[];
    bannerFile: File | null;
    optionFiles: PendingOptionImageFile[];
}

/** Pastikan baris banner/opsi pending ikut terkirim walau diff per-id bersih. */
function forcePendingRowsDirty(request: IPendingDirtyRequest): BackendField[] {
    let dirty = request.dirty;
    if (request.bannerFile !== null) dirty = ensureBannerRowDirty(request.backend, dirty);
    if (request.optionFiles.length > 0) dirty = ensureOptionImageRowsDirty(request.backend, dirty);
    return dirty;
}

/** Argumen body multipart: dirty-subset + deleted eksplisit + file pending. */
interface IUploadBodyRequest {
    dirty: BackendField[];
    deletedIds: string[];
    bannerFile: File | null;
    optionFiles: PendingOptionImageFile[];
}

/** Pilih body multipart banner-only vs banner+opsi sesuai file pending. */
function buildUploadBody(request: IUploadBodyRequest): FormData {
    if (request.optionFiles.length === 0 && request.bannerFile !== null) {
        return buildBannerFieldsFormData(request.dirty, request.deletedIds, request.bannerFile);
    }
    return buildOptionImageFieldsFormData(request.dirty, request.deletedIds, request.optionFiles, request.bannerFile);
}

/** Argumen sinkronisasi state pasca-upload: state live + file terkirim + respons server. */
interface IUploadResultRequest {
    state: IBuilderAutosaveState;
    bannerFile: File | null;
    optionFiles: PendingOptionImageFile[];
    response: unknown;
}

/** Argumen pipeline save (fields POST + header PATCH): state live + URL endpoint. */
interface ISaveRequest {
    state: IBuilderAutosaveState;
    url: string;
}

/** Terapkan path hasil upload ke state; buang pending bila respons tanpa path. */
function applyUploadResults(request: IUploadResultRequest): void {
    const storedBannerPath = readBannerPathFromResponse(request.response);
    if (storedBannerPath !== null) {
        applyBannerUploadSuccess(request.state.banner, storedBannerPath, request.bannerFile?.name);
    } else if (request.bannerFile !== null) {
        request.state.banner.bannerFile = null;
        request.state.banner.bannerPreviewUrl = '';
    }
    const storedOptionPaths = readOptionImagePathsFromResponse(request.response);
    if (storedOptionPaths !== null) {
        applyOptionImageUploadSuccess(request.state.fields, storedOptionPaths);
    } else if (request.optionFiles.length > 0) {
        discardPendingOptionImageFiles(request.state.fields);
    }
}

/** Baca XSRF-TOKEN untuk CSRF beacon (Laravel cek input `_token`). */
function readXsrfToken(): string | null {
    // Nama cookie XSRF-TOKEN stabil milik Laravel; literal sekali pakai.
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    const encoded = match?.[1];
    return encoded ? decodeURIComponent(encoded) : null;
}

/** Ekstrak pipeline autosave builder menjadi hook shared (pemilik tunggal save/guard/beacon). */
export function useBuilderAutosave(options: IBuilderAutosaveOptions): IBuilderAutosaveResult {
    const lastSentHeader = ref<IHeaderPayload | null>(null);
    const lastSentFields = ref<BackendField[] | null>(null);
    const lastHydratedFormId = ref<string | null>(null);
    const lastCleanSnapshot = ref<string | null>(null);

    /** Snapshot autosave saat ini dari state live halaman. */
    function snapshot(): string {
        return buildSnapshotText(options.getState());
    }

    /** Jalankan pipeline fields (diff → POST → refresh snapshot); true bila terkirim. */
    async function postFieldChanges(request: ISaveRequest): Promise<boolean> {
        const backend = toBackendFields(
            prependFormBannerToBackendPayload(request.state.fields, request.state.banner),
            lastSentFields.value
        );
        const fieldDiff = diffBackendFields(backend, lastSentFields.value);
        const bannerFile = pendingBannerUpload(request.state);
        const optionFiles = collectPendingOptionImageFiles(request.state.fields);
        const dirtyRows = forcePendingRowsDirty({
            backend,
            dirty: fieldDiff.dirty,
            bannerFile,
            optionFiles,
        });
        const fieldsSent = fieldDiff.hasChanges || bannerFile !== null || optionFiles.length > 0;
        if (!fieldsSent) return false;
        if (bannerFile !== null || optionFiles.length > 0) {
            const uploadBody = buildUploadBody({
                dirty: dirtyRows,
                deletedIds: fieldDiff.deletedIds,
                bannerFile,
                optionFiles,
            });
            const response = await axios.post(request.url, uploadBody, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            applyUploadResults({ state: request.state, bannerFile, optionFiles, response: response.data });
        } else {
            await axios.post(
                request.url,
                { fields: dirtyRows, deleted_ids: fieldDiff.deletedIds },
                { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
            );
        }
        lastSentFields.value = snapshotBackendFields(backend);
        return true;
    }

    /** PATCH parsial per-key (blank required dikecualikan); true bila ada key terkirim. */
    async function patchHeaderChanges(request: ISaveRequest): Promise<boolean> {
        const header = buildHeaderPayload(request.state);
        const headerDiff = stripBlankRequiredKeys(diffHeaderPayload(header, lastSentHeader.value), header);
        if (Object.keys(headerDiff).length === 0) return false;
        await axios.patch(request.url, headerDiff, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        lastSentHeader.value = mergeSentHeader(lastSentHeader.value, header, headerDiff);
        return true;
    }

    /** Orkestrasi save: pipeline fields lalu header; true hanya bila ada yang terkirim. */
    async function save(): Promise<boolean> {
        const fieldsUrl = options.resolveFieldsUrl();
        const patchUrl = options.resolveAutosaveUrl();
        if (fieldsUrl === '' || patchUrl === '') return false;
        const state = options.getState();
        const fieldsSent = await postFieldChanges({ state, url: fieldsUrl });
        const headerSent = await patchHeaderChanges({ state, url: patchUrl });
        if (fieldsSent || headerSent) lastCleanSnapshot.value = buildSnapshotText(state);
        return fieldsSent || headerSent;
    }

    /** True berarti lewati hydrate (id sama + kanvas kotor atau file pending). */
    function evaluateHydrate(formId: string, pending: boolean): boolean {
        return shouldSkipHydrate({
            lastHydratedId: lastHydratedFormId.value,
            currentId: formId,
            lastCleanSnapshot: lastCleanSnapshot.value,
            currentSnapshot: buildSnapshotText(options.getState()),
            hasPendingBannerFile: pending,
        });
    }

    /** Catat hydrate sukses: baselines kirim + id + snapshot bersih dari state kini. */
    function registerHydrated(formId: string): void {
        const state = options.getState();
        lastSentHeader.value = buildHeaderPayload(state);
        lastSentFields.value = snapshotBackendFields(
            toBackendFields(prependFormBannerToBackendPayload(state.fields, state.banner))
        );
        lastHydratedFormId.value = formId;
        lastCleanSnapshot.value = buildSnapshotText(state);
    }

    /** Kirim snapshot kotor via beacon saat unload; diam bila bersih (null-saat-bersih). */
    function flushBeacon(): void {
        if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
        try {
            const fieldsUrl = options.resolveFieldsUrl();
            if (fieldsUrl === '') return;
            const state = options.getState();
            const payload = buildUnloadPayload({
                canvasFields: state.fields,
                banner: state.banner,
                lastSent: lastSentFields.value,
            });
            if (payload === null) return;
            // Beacon JSON sekali pakai: sendBeacon tak dukung multipart sehingga file pending tak ikut.
            const sendFields = { fields: payload.fields, deleted_ids: payload.deleted_ids };
            const token = readXsrfToken();
            const beaconBody =
                token === null ? JSON.stringify(sendFields) : JSON.stringify({ ...sendFields, _token: token });
            const blob = new Blob([beaconBody], { type: 'application/json' });
            navigator.sendBeacon(fieldsUrl, blob);
        } catch {
            /* fire-and-forget: abaikan */
        }
    }

    // Debounce 800ms stabil milik pipeline autosave (literal sekali pakai).
    const sync = useAutosaveSync(snapshot, save, {
        debounceMs: 800,
        enabled: computed(() => options.readEnabled()),
        onError: options.notifySaveError,
    });

    return {
        snapshot,
        save,
        status: sync.status,
        flush: sync.flush,
        evaluateHydrate,
        registerHydrated,
        flushBeacon,
    };
}
