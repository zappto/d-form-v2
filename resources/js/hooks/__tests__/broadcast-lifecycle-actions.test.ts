import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastLifecycleActions } from '../useBroadcastLifecycleActions';

/**
 * DFORM-67: kunci endpoint siklus hidup (schedule + ubah jadwal + test +
 * batal + ulangi + hapus ber-confirm) agar ekstraksi hook tak menggeser
 * perilaku header dan kartu jadwal.
 */

/** Opsi submit aksi lifecycle (subset yang dipakai hook). */
interface ILifecycleSubmitOptions {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
}

const { formPostMock, formPatchMock, formResetMock, routerPostMock, routerDeleteMock } = vi.hoisted(() => ({
    formPostMock: vi.fn<(url: string, options?: ILifecycleSubmitOptions) => void>(),
    formPatchMock: vi.fn<(url: string, options?: ILifecycleSubmitOptions) => void>(),
    formResetMock: vi.fn<() => void>(),
    routerPostMock: vi.fn<(url: string, data?: Record<string, string>, options?: ILifecycleSubmitOptions) => void>(),
    routerDeleteMock: vi.fn<(url: string, options?: ILifecycleSubmitOptions) => void>(),
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        router: { get: vi.fn(), post: routerPostMock, delete: routerDeleteMock },
        useForm: <T extends object>(initial: T) =>
            reactive({
                ...initial,
                errors: {},
                processing: false,
                post: formPostMock,
                patch: formPatchMock,
                reset: formResetMock,
            }),
    };
});

vi.mock('@/hooks/useErrorToast', () => ({
    useErrorToast: () => ({ showErrorToast: vi.fn() }),
}));

/** Argumen lifecycle demo (jadwal awal terisi). */
function demoArgs(): { broadcastId: string; initialScheduleDate: string; initialScheduleTime: string } {
    return { broadcastId: 'b-1', initialScheduleDate: '2026-10-05', initialScheduleTime: '09:00' };
}

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('useBroadcastLifecycleActions', () => {
    it('nilai awal jadwal dari broadcast', () => {
        const lifecycle = useBroadcastLifecycleActions(demoArgs());
        expect(lifecycle.scheduleForm.schedule_date).toBe('2026-10-05');
        expect(lifecycle.scheduleForm.schedule_time).toBe('09:00');
        expect(lifecycle.testForm.email).toBe('');
    });

    it('schedule → post endpoint schedule', () => {
        const lifecycle = useBroadcastLifecycleActions(demoArgs());
        lifecycle.doSchedule();
        expect(routerPostMock).toHaveBeenCalledTimes(1);
        expect(routerPostMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/schedule');
        expect(routerPostMock.mock.calls[0]?.[2]?.preserveScroll).toBe(true);
    });

    it('ubah jadwal → patch endpoint schedule', () => {
        const lifecycle = useBroadcastLifecycleActions(demoArgs());
        lifecycle.scheduleForm.schedule_time = '10:30';
        lifecycle.updateSchedule();
        expect(formPatchMock).toHaveBeenCalledTimes(1);
        expect(formPatchMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/schedule');
        expect(formPatchMock.mock.calls[0]?.[1]?.preserveScroll).toBe(true);
    });

    it('kirim test → post endpoint test + reset saat sukses', () => {
        const lifecycle = useBroadcastLifecycleActions(demoArgs());
        lifecycle.testForm.email = 'admin@example.com';
        lifecycle.sendTest();

        expect(formPostMock).toHaveBeenCalledTimes(1);
        expect(formPostMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/test');

        formPostMock.mock.calls[0]?.[1]?.onSuccess?.();
        expect(formResetMock).toHaveBeenCalledTimes(1);
    });

    it('batal + ulangi → post endpoint masing-masing', () => {
        const lifecycle = useBroadcastLifecycleActions(demoArgs());
        lifecycle.cancelBroadcast();
        lifecycle.retryFailed();

        expect(routerPostMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1/cancel');
        expect(routerPostMock.mock.calls[1]?.[0]).toBe('/admin/broadcasts/b-1/retry-failed');
    });

    it('hapus dengan confirm ya → delete; confirm tidak → batal tanpa request', () => {
        vi.stubGlobal(
            'confirm',
            vi.fn(() => true)
        );
        const lifecycle = useBroadcastLifecycleActions(demoArgs());
        lifecycle.deleteBroadcast();
        expect(routerDeleteMock).toHaveBeenCalledTimes(1);
        expect(routerDeleteMock.mock.calls[0]?.[0]).toBe('/admin/broadcasts/b-1');

        vi.stubGlobal(
            'confirm',
            vi.fn(() => false)
        );
        lifecycle.deleteBroadcast();
        expect(routerDeleteMock).toHaveBeenCalledTimes(1);
    });
});
