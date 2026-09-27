import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useQrCamera, type IQrCameraControls } from '../useQrCamera';

/** Rekaman pemindaian palsu: cukup untuk mem-pin konfigurasi start kamera. */
interface IRecordedCameraStart {
    cameraId: string;
    fps: number;
    qrbox: (width: number, height: number) => { width: number; height: number };
    aspectRatio: number;
}

const qrDoubles = vi.hoisted(() => ({
    containerIds: [] as string[],
    cameras: [] as Array<{ id: string; label: string }>,
    starts: [] as IRecordedCameraStart[],
    stopCalls: 0,
    clearCalls: 0,
}));

vi.mock('html5-qrcode', () => {
    class Html5QrcodeDouble {
        static getCameras(): Promise<Array<{ id: string; label: string }>> {
            return Promise.resolve(qrDoubles.cameras.map((camera) => ({ ...camera })));
        }

        constructor(elementId: string) {
            qrDoubles.containerIds.push(elementId);
        }

        start(
            cameraId: string,
            config: {
                fps: number;
                qrbox: (width: number, height: number) => { width: number; height: number };
                aspectRatio: number;
            },
            onSuccess: (decodedText: string) => void,
            onFailure: () => void
        ): Promise<void> {
            void onSuccess;
            void onFailure;
            qrDoubles.starts.push({
                cameraId,
                fps: config.fps,
                qrbox: config.qrbox,
                aspectRatio: config.aspectRatio,
            });

            return Promise.resolve(undefined);
        }

        stop(): Promise<void> {
            qrDoubles.stopCalls += 1;

            return Promise.resolve(undefined);
        }

        clear(): Promise<void> {
            qrDoubles.clearCalls += 1;

            return Promise.resolve(undefined);
        }

        pause(): void {
            return undefined;
        }

        resume(): void {
            return undefined;
        }
    }

    return { Html5Qrcode: Html5QrcodeDouble };
});

function resetQrDoubles(): void {
    qrDoubles.containerIds.length = 0;
    qrDoubles.cameras.length = 0;
    qrDoubles.starts.length = 0;
    qrDoubles.stopCalls = 0;
    qrDoubles.clearCalls = 0;
}

/** Host tipis agar siklus hidup hook kamera berjalan seperti di halaman. */
function mountCameraHost(): { controls: () => IQrCameraControls; wrapper: ReturnType<typeof mount> } {
    let controls: IQrCameraControls | null = null;
    const host = defineComponent({
        setup() {
            controls = useQrCamera({ containerId: 'test-scanner', onDecode: () => undefined });
            return () => h('div', { id: 'test-scanner' });
        },
    });
    const wrapper = mount(host);
    return {
        controls: (): IQrCameraControls => {
            if (controls === null) {
                throw new Error('hook kamera belum terpasang');
            }

            return controls;
        },
        wrapper,
    };
}

/** Kejar antrean janji + reaktivitas Vue setelah aksi async hook. */
async function flushHook(): Promise<void> {
    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => {
        window.setTimeout(resolve, 0);
    });
    await nextTick();
}

describe('useQrCamera', () => {
    beforeEach(() => {
        resetQrDoubles();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('start memakai fps 10 dan qrbox responsif selebar viewfinder', async () => {
        qrDoubles.cameras = [{ id: 'cam-1', label: 'Kamera Depan' }];
        const { controls, wrapper } = mountCameraHost();
        try {
            await flushHook();
            await controls().startCameraScanner();
            await flushHook();

            expect(qrDoubles.containerIds).toEqual(['test-scanner']);
            expect(qrDoubles.starts.length).toBe(1);
            const start = qrDoubles.starts[0];
            if (start === undefined) {
                throw new Error('start kamera tidak tercatat');
            }
            expect(start.cameraId).toBe('cam-1');
            expect(start.fps).toBe(10);
            expect(start.aspectRatio).toBe(1);
            expect(start.qrbox(640.8, 480.2)).toEqual({ width: 640, height: 480 });
            expect(controls().isCameraReady.value).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('unmount menghentikan kamera dan melepas resource scanner', async () => {
        qrDoubles.cameras = [{ id: 'cam-1', label: 'Kamera Depan' }];
        const { controls, wrapper } = mountCameraHost();
        await flushHook();
        await controls().startCameraScanner();
        await flushHook();
        expect(controls().isCameraReady.value).toBe(true);

        wrapper.unmount();
        await flushHook();

        expect(qrDoubles.stopCalls).toBe(1);
        expect(qrDoubles.clearCalls).toBe(1);
        expect(controls().isCameraReady.value).toBe(false);
    });
});
