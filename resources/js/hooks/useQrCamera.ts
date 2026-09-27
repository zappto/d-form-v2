import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import { toast } from 'vue-sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { humanizeErrorMessage } from '@/lib/errorMessage';
import { useErrorToast } from './useErrorToast';

/** Laju baca QR per detik; 10 fps cukup responsif tanpa membebani CPU ponsel. */
const CAMERA_FRAME_RATE = 10;

/** Lama efek shutter ditahan; sama dengan jendela cooldown agar hasil ganda ikut tertahan. */
const SHUTTER_HOLD_MS = 2000;

export interface IQrCameraDevice {
    id: string;
    label: string;
}

export interface IQrCameraArgs {
    containerId: string;
    onDecode: (decodedText: string) => void;
}

export interface IQrCameraControls {
    cameras: Ref<IQrCameraDevice[]>;
    selectedCameraId: Ref<string>;
    isCameraReady: Ref<boolean>;
    isStartingCamera: Ref<boolean>;
    permissionError: Ref<string>;
    isShutterActive: Ref<boolean>;
    loadCameras: () => Promise<void>;
    startCameraScanner: () => Promise<void>;
    stopCameraScanner: () => Promise<void>;
    switchCamera: (nextCameraId: string | undefined) => Promise<void>;
    triggerShutter: () => void;
}

/** Kelola daftar kamera dan siklus hidup Html5Qrcode untuk satu wadah scanner. */
export function useQrCamera(args: IQrCameraArgs): IQrCameraControls {
    const { showErrorToast } = useErrorToast();
    const scanner = ref<Html5Qrcode | null>(null);
    const cameras = ref<IQrCameraDevice[]>([]);
    const selectedCameraId = ref('');
    const isCameraReady = ref(false);
    const isStartingCamera = ref(false);
    const permissionError = ref('');
    const isShutterActive = ref(false);
    let shutterTimer: number | null = null;

    function clearShutterTimer(): void {
        if (shutterTimer !== null) {
            window.clearTimeout(shutterTimer);
            shutterTimer = null;
        }
    }

    async function loadCameras(): Promise<void> {
        try {
            const discoveredCameras = await Html5Qrcode.getCameras();
            cameras.value = discoveredCameras.map((camera, index) => ({
                id: camera.id,
                label: camera.label || `Camera ${index + 1}`,
            }));

            if (cameras.value.length > 0 && selectedCameraId.value.length === 0) {
                const first = cameras.value[0];
                if (first !== undefined) {
                    selectedCameraId.value = first.id;
                }
            }

            permissionError.value = '';
        } catch (error) {
            permissionError.value = humanizeErrorMessage(
                'Gagal membaca daftar kamera. Pastikan browser punya izin kamera.'
            );
            showErrorToast('Kamera tidak tersedia', {
                description:
                    error instanceof Error
                        ? humanizeErrorMessage(error.message)
                        : 'Terjadi kesalahan saat mengakses kamera.',
            });
        }
    }

    async function startCameraScanner(): Promise<void> {
        if (isCameraReady.value || isStartingCamera.value) {
            return;
        }

        if (!selectedCameraId.value) {
            showErrorToast('Pilih kamera terlebih dahulu.');

            return;
        }

        isStartingCamera.value = true;
        permissionError.value = '';

        try {
            scanner.value = new Html5Qrcode(args.containerId);
            await scanner.value.start(
                selectedCameraId.value,
                {
                    fps: CAMERA_FRAME_RATE,
                    qrbox: (viewfinderWidth: number, viewfinderHeight: number): { width: number; height: number } => ({
                        width: Math.floor(viewfinderWidth),
                        height: Math.floor(viewfinderHeight),
                    }),
                    aspectRatio: 1,
                },
                (decodedText) => {
                    args.onDecode(decodedText);
                },
                () => {}
            );
            isCameraReady.value = true;
            toast.success('Kamera aktif', {
                description: 'Arahkan QR ke area scanner untuk check-in otomatis.',
            });
        } catch (error) {
            permissionError.value = humanizeErrorMessage(
                'Izin kamera ditolak atau kamera sedang digunakan aplikasi lain.'
            );
            showErrorToast('Tidak bisa memulai kamera', {
                description:
                    error instanceof Error
                        ? humanizeErrorMessage(error.message)
                        : 'Coba pilih kamera lain atau muat ulang halaman.',
            });
        } finally {
            isStartingCamera.value = false;
        }
    }

    async function stopCameraScanner(): Promise<void> {
        clearShutterTimer();
        isShutterActive.value = false;

        if (!scanner.value) {
            return;
        }

        try {
            if (isCameraReady.value) {
                await scanner.value.stop();
            }
            await scanner.value.clear();
        } finally {
            scanner.value = null;
            isCameraReady.value = false;
        }
    }

    async function switchCamera(nextCameraId: string | undefined): Promise<void> {
        if (nextCameraId === undefined) {
            return;
        }

        selectedCameraId.value = nextCameraId;

        if (!nextCameraId) {
            return;
        }

        if (!isCameraReady.value) {
            return;
        }

        await stopCameraScanner();
        await startCameraScanner();
    }

    function hideScannerNotice(): void {
        const container = document.getElementById(args.containerId);
        if (container === null) {
            return;
        }

        container.querySelectorAll<HTMLDivElement>(':scope > div').forEach((notice) => {
            notice.style.display = 'none';
        });
    }

    function resumeScannerAfterShutter(): void {
        const active = scanner.value;
        if (active === null || !isCameraReady.value) {
            return;
        }

        try {
            active.resume();
        } catch {
            // Resume bisa gagal kalau state scanner berubah; pengguna tetap bisa mulai ulang kamera.
        }
    }

    function triggerShutter(): void {
        const active = scanner.value;
        if (active === null || !isCameraReady.value) {
            return;
        }

        isShutterActive.value = true;

        try {
            active.pause(true);
            hideScannerNotice();
        } catch {
            // Pause gagal bukan kondisi fatal; efek shutter tetap ditampilkan.
        }

        clearShutterTimer();
        shutterTimer = window.setTimeout(() => {
            shutterTimer = null;
            isShutterActive.value = false;
            resumeScannerAfterShutter();
        }, SHUTTER_HOLD_MS);
    }

    onMounted(loadCameras);
    onBeforeUnmount(stopCameraScanner);

    return {
        cameras,
        selectedCameraId,
        isCameraReady,
        isStartingCamera,
        permissionError,
        isShutterActive,
        loadCameras,
        startCameraScanner,
        stopCameraScanner,
        switchCamera,
        triggerShutter,
    };
}
