import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBuilderAutosave } from '../useBuilderAutosave';
import type { IBuilderAutosaveResult, IBuilderAutosaveState } from '../useBuilderAutosave';
import { defaultFormBannerState } from '@/components/modules/builder/formBanner';
import { emptyFormRegistrationMetadata } from '@/types/form';
import type { BackendField, BuilderField } from '@/types/formBuilder';

const { axiosPostMock, axiosPatchMock } = vi.hoisted(() => ({
    axiosPostMock: vi.fn(),
    axiosPatchMock: vi.fn(),
}));

vi.mock('axios', () => ({
    default: {
        post: axiosPostMock,
        patch: axiosPatchMock,
    },
}));

const FIELDS_URL = '/forms/fields';
const AUTOSAVE_URL = '/forms/autosave';

/** Payload JSON beacon unload: fields + deleted_ids + token CSRF opsional. */
interface IBeaconPayload {
    fields: BackendField[];
    deleted_ids: string[];
    _token?: string;
}

/** Satu field kanvas teks minimal untuk skenario dirty-subset. */
function textCanvasField(fieldId: string, order?: number): BuilderField {
    return {
        id: fieldId,
        type: 'short_text',
        label: `Field ${fieldId}`,
        description: '',
        name: `field_${fieldId}`,
        placeholder: '',
        required: false,
        options: [],
        metadata: {},
        ...(order === undefined ? {} : { order }),
    };
}

/** State builder segar ala mount halaman (judul terisi, kanvas kosong). */
function freshBuilderState(): IBuilderAutosaveState {
    return {
        title: 'Judul',
        description: 'Deskripsi',
        successContent: '',
        closedAt: '',
        visibleFor: [],
        banner: defaultFormBannerState(),
        fields: [],
        metadata: emptyFormRegistrationMetadata(),
    };
}

interface ITestBed {
    state: IBuilderAutosaveState;
    hook: IBuilderAutosaveResult;
}

/** Hook + state live untuk satu skenario (baselines internal milik hook). */
function createBed(): ITestBed {
    const state = freshBuilderState();
    const hook = useBuilderAutosave({
        getState: () => state,
        resolveFieldsUrl: () => FIELDS_URL,
        resolveAutosaveUrl: () => AUTOSAVE_URL,
        readEnabled: () => true,
        notifySaveError: () => {},
    });
    return { state, hook };
}

/** Bed ter-hydrate ala mount (baselines = state awal), siap untuk mutasi. */
function createHydratedBed(formId: string): ITestBed {
    const bed = createBed();
    bed.hook.registerHydrated(formId);
    return bed;
}

/** Body POST JSON terakhir (bukan FormData) untuk asersi dirty-subset. */
function lastJsonPostBody(): { fields: Array<{ id: string }>; deleted_ids: string[] } {
    const body: { fields: Array<{ id: string }>; deleted_ids: string[] } =
        axiosPostMock.mock.calls[axiosPostMock.mock.calls.length - 1][1];
    return body;
}

/** Beacon mengirim Blob JSON; baca kembali sebagai objek untuk asersi. */
async function lastBeaconJson(beaconMock: ReturnType<typeof vi.fn>): Promise<IBeaconPayload> {
    const blob: Blob = beaconMock.mock.calls[0][1];
    const payload: IBeaconPayload = JSON.parse(await blob.text());
    return payload;
}

beforeEach(() => {
    axiosPostMock.mockReset();
    axiosPatchMock.mockReset();
    axiosPostMock.mockResolvedValue({ data: {} });
    axiosPatchMock.mockResolvedValue({ data: {} });
});

describe('useBuilderAutosave steady-empty', () => {
    it('tanpa perubahan vs hydrate → false dan nol request', async () => {
        const bed = createHydratedBed('form-1');
        const sent = await bed.hook.save('snapshot');
        expect(sent).toBe(false);
        expect(axiosPostMock).not.toHaveBeenCalled();
        expect(axiosPatchMock).not.toHaveBeenCalled();
    });
});

describe('useBuilderAutosave dirty-subset fields', () => {
    it('tambah satu field → POST JSON dirty-subset + deleted_ids, lalu bersih', async () => {
        const bed = createHydratedBed('form-1');
        bed.state.fields.push(textCanvasField('a'));
        const sent = await bed.hook.save('snapshot');
        expect(sent).toBe(true);
        expect(axiosPostMock).toHaveBeenCalledTimes(1);
        expect(axiosPostMock.mock.calls[0][0]).toBe(FIELDS_URL);
        const body = lastJsonPostBody();
        expect(body.fields.map((row) => row.id)).toEqual(['a']);
        expect(body.deleted_ids).toEqual([]);
        expect(body.fields).not.toBeInstanceOf(FormData);
        axiosPostMock.mockClear();
        const steady = await bed.hook.save('snapshot');
        expect(steady).toBe(false);
        expect(axiosPostMock).not.toHaveBeenCalled();
    });

    it('hapus satu field → deleted_ids eksplisit; hapus semua → full-delete true', async () => {
        const bed = createBed();
        bed.state.fields.push(textCanvasField('a'), textCanvasField('b'));
        await bed.hook.save('seed');
        axiosPostMock.mockClear();
        bed.state.fields = bed.state.fields.filter((row) => row.id !== 'b');
        const partial = await bed.hook.save('snapshot');
        expect(partial).toBe(true);
        expect(lastJsonPostBody().deleted_ids).toEqual(['b']);
        axiosPostMock.mockClear();
        bed.state.fields = [];
        const fullDelete = await bed.hook.save('snapshot');
        expect(fullDelete).toBe(true);
        const body = lastJsonPostBody();
        expect(body.fields).toEqual([]);
        expect(body.deleted_ids).toEqual(['a']);
    });

    it('insert depan dengan lastSent → hanya baris baru yang dirty', async () => {
        const bed = createBed();
        bed.state.fields.push(textCanvasField('b', 1000), textCanvasField('c', 2000));
        await bed.hook.save('seed');
        axiosPostMock.mockClear();
        bed.state.fields.unshift(textCanvasField('a'));
        const sent = await bed.hook.save('snapshot');
        expect(sent).toBe(true);
        expect(lastJsonPostBody().fields.map((row) => row.id)).toEqual(['a']);
    });
});

describe('useBuilderAutosave header parsial', () => {
    it('ubah title saja → PATCH hanya { title }', async () => {
        const bed = createHydratedBed('form-1');
        bed.state.title = 'Judul baru';
        const sent = await bed.hook.save('snapshot');
        expect(sent).toBe(true);
        expect(axiosPostMock).not.toHaveBeenCalled();
        expect(axiosPatchMock).toHaveBeenCalledTimes(1);
        expect(axiosPatchMock.mock.calls[0][0]).toBe(AUTOSAVE_URL);
        expect(axiosPatchMock.mock.calls[0][1]).toEqual({ title: 'Judul baru' });
    });

    it('kosongkan title → PATCH tanpa key title, false, tanpa error', async () => {
        const bed = createHydratedBed('form-1');
        bed.state.title = '';
        const sent = await bed.hook.save('snapshot');
        expect(sent).toBe(false);
        expect(axiosPostMock).not.toHaveBeenCalled();
        expect(axiosPatchMock).not.toHaveBeenCalled();
        bed.state.title = 'Judul isi ulang';
        const refilled = await bed.hook.save('snapshot');
        expect(refilled).toBe(true);
        expect(axiosPatchMock.mock.calls[0][1]).toEqual({ title: 'Judul isi ulang' });
    });
});

describe('useBuilderAutosave upload banner', () => {
    it('file banner pending → multipart dan path respons diterapkan ke state', async () => {
        const bed = createHydratedBed('form-1');
        bed.state.banner.bannerFile = new File(['bytes'], 'banner.jpg', { type: 'image/jpeg' });
        axiosPostMock.mockResolvedValueOnce({ data: { banner_url: 'banners/baru.jpg' } });
        const sent = await bed.hook.save('snapshot');
        expect(sent).toBe(true);
        const posted: FormData = axiosPostMock.mock.calls[0][1];
        expect(posted).toBeInstanceOf(FormData);
        if (!(posted instanceof FormData)) throw new Error('POST banner harus multipart FormData');
        expect(posted.get('banner_file')).toBeInstanceOf(File);
        expect(bed.state.banner.bannerUrl).toBe('banners/baru.jpg');
        expect(bed.state.banner.bannerFile).toBeNull();
    });

    it('respons tanpa path → file pending dibuang seperti halaman lama', async () => {
        const bed = createHydratedBed('form-1');
        bed.state.banner.bannerFile = new File(['bytes'], 'banner.jpg', { type: 'image/jpeg' });
        bed.state.banner.bannerPreviewUrl = 'blob:pratinjau';
        axiosPostMock.mockResolvedValueOnce({ data: {} });
        const sent = await bed.hook.save('snapshot');
        expect(sent).toBe(true);
        expect(bed.state.banner.bannerFile).toBeNull();
        expect(bed.state.banner.bannerPreviewUrl).toBe('');
    });
});

describe('useBuilderAutosave hydrate guard', () => {
    it('mount segar → hydrate normal (false)', () => {
        const bed = createBed();
        expect(bed.hook.evaluateHydrate('form-1', false)).toBe(false);
    });

    it('id sama + kotor → lewati (true); id berubah → normal (false)', () => {
        const bed = createHydratedBed('form-1');
        bed.state.title = 'Edit lokal';
        expect(bed.hook.evaluateHydrate('form-1', false)).toBe(true);
        expect(bed.hook.evaluateHydrate('form-2', false)).toBe(false);
    });

    it('id sama + bersih → normal; pending file + snapshot sama → lewati', () => {
        const bed = createHydratedBed('form-1');
        expect(bed.hook.evaluateHydrate('form-1', false)).toBe(false);
        expect(bed.hook.evaluateHydrate('form-1', true)).toBe(true);
    });
});

describe('useBuilderAutosave beacon unload', () => {
    it('bersih → sendBeacon tidak dipanggil', () => {
        const beaconMock = vi.fn();
        Object.defineProperty(window.navigator, 'sendBeacon', { value: beaconMock, configurable: true });
        const bed = createHydratedBed('form-1');
        bed.hook.flushBeacon();
        expect(beaconMock).not.toHaveBeenCalled();
    });

    it('kotor → dipanggil sekali dengan JSON fields + deleted_ids + _token', async () => {
        const beaconMock = vi.fn().mockReturnValue(true);
        Object.defineProperty(window.navigator, 'sendBeacon', { value: beaconMock, configurable: true });
        document.cookie = 'XSRF-TOKEN=token-uji';
        const bed = createHydratedBed('form-1');
        bed.state.fields.push(textCanvasField('a'));
        bed.hook.flushBeacon();
        expect(beaconMock).toHaveBeenCalledTimes(1);
        expect(beaconMock.mock.calls[0][0]).toBe(FIELDS_URL);
        const payload = await lastBeaconJson(beaconMock);
        expect(Array.isArray(payload.fields)).toBe(true);
        expect(payload.deleted_ids).toEqual([]);
        expect(payload._token).toBe('token-uji');
        document.cookie = 'XSRF-TOKEN=; Max-Age=0';
    });
});

describe('useBuilderAutosave guard URL', () => {
    it('URL kosong (draft belum ada) → false tanpa request', async () => {
        const state = freshBuilderState();
        const hook = useBuilderAutosave({
            getState: () => state,
            resolveFieldsUrl: () => '',
            resolveAutosaveUrl: () => '',
            readEnabled: () => false,
            notifySaveError: () => {},
        });
        state.fields.push(textCanvasField('a'));
        const sent = await hook.save('snapshot');
        expect(sent).toBe(false);
        expect(axiosPostMock).not.toHaveBeenCalled();
        expect(axiosPatchMock).not.toHaveBeenCalled();
    });
});
