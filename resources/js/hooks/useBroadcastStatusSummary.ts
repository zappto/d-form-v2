import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import type { IBroadcastShowBroadcast } from './useBroadcastShowTypes';

/** Argumen ringkasan status broadcast (objek tunggal agar ≤2 parameter). */
export interface IBroadcastStatusSummaryArgs {
    broadcast: IBroadcastShowBroadcast;
}

/** Hasil ringkasan status broadcast (flag draf/jadwal/batal + progres kirim). */
export interface IBroadcastStatusSummaryResult {
    isDraft: ComputedRef<boolean>;
    isScheduled: ComputedRef<boolean>;
    canCancel: ComputedRef<boolean>;
    progress: ComputedRef<number>;
}

/** Status turunan halaman detail broadcast (flag aksi + progres persen); dipakai guard tombol dan kartu monitoring. */
export function useBroadcastStatusSummary(args: IBroadcastStatusSummaryArgs): IBroadcastStatusSummaryResult {
    const isDraft: ComputedRef<boolean> = computed(() => args.broadcast.status === 'draft');
    const isScheduled: ComputedRef<boolean> = computed(() => args.broadcast.status === 'scheduled');
    const canCancel: ComputedRef<boolean> = computed(() => ['scheduled', 'processing'].includes(args.broadcast.status));
    const progress: ComputedRef<number> = computed(() => {
        const total: number = args.broadcast.recipients_count || 0;
        if (total === 0) return 0;
        return Math.round(((args.broadcast.sent_count || 0) / total) * 100);
    });

    return { isDraft, isScheduled, canCancel, progress };
}
