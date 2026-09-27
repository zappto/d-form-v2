import type { Component } from 'vue';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-vue-next';
import type { TScanStatus } from '@/lib/qrScanUi';

/** Satu entri tema status scan; ikon, warna teks, latar, dan label ringkas. */
interface IScanStatusTheme {
    icon: Component;
    class: string;
    bg: string;
    label: string;
}

/** Tema ikon/warna tiap status scan QR; dipakai sidebar scan untuk badge & ikon hasil scan. */
export const SCAN_STATUS_THEME: Record<TScanStatus, IScanStatusTheme> = {
    success: { icon: CheckCircle, class: 'text-success', bg: 'bg-success/10', label: 'Check-in berhasil' },
    already: { icon: AlertTriangle, class: 'text-warning', bg: 'bg-warning/10', label: 'Sudah pernah scan' },
    invalid: { icon: XCircle, class: 'text-destructive', bg: 'bg-destructive/10', label: 'QR tidak valid' },
};
