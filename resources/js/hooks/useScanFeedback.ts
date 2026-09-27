import type { TScanStatus } from '@/lib/qrScanUi';

/** Hasil useScanFeedback: satu-satunya pintu membunyikan beep/getar setelah scan. */
export interface IScanFeedback {
    playScanBeep: (status: TScanStatus) => void;
}

/**
 * Beri umpan balik dengar dan getar sesuai status scan.
 * Dipakai dari hook/`<script setup>` setelah status hasil scan diketahui; menyentuh WebAudio dan `navigator.vibrate`.
 */
export function useScanFeedback(): IScanFeedback {
    /** Bunyikan beep (dan getar) sesuai status scan; kegagalan audio/getar diabaikan agar scan tetap jalan. */
    function playScanBeep(status: TScanStatus): void {
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = status === 'success' ? 880 : status === 'already' ? 440 : 200;
            osc.start();
            const ms = status === 'already' ? 320 : 160;
            window.setTimeout(() => {
                osc.stop();
                void ctx.close();
            }, ms);
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } catch {
            return;
        }
    }

    return { playScanBeep };
}
