import { describe, expect, it } from 'vitest';
import { useBroadcastStatusSummary } from '../useBroadcastStatusSummary';
import type { IBroadcastShowBroadcast } from '../useBroadcastShowTypes';

/**
 * DFORM-67: kunci flag status + progres halaman detail broadcast agar
 * ekstraksi hook tak menggeser semantik guard tombol dan kartu monitoring.
 */

/** Broadcast demo dengan status dan angka monitoring yang bisa dioverride. */
function demoBroadcast(args: {
    status: string;
    recipientsCount?: number;
    sentCount?: number;
}): IBroadcastShowBroadcast {
    return {
        id: 'b-1',
        name: 'Pengumuman',
        status: args.status,
        scheduled_at: null,
        schedule_date: null,
        schedule_time: null,
        delay_min: 1,
        delay_max: 5,
        event_id: null,
        event_title: null,
        subject: null,
        content: null,
        datasets: [],
        total_recipients: 0,
        total_sent: 0,
        total_failed: 0,
        sent_count: args.sentCount ?? 0,
        failed_count: 0,
        pending_count: 0,
        processing_count: 0,
        cancelled_count: 0,
        recipients_count: args.recipientsCount ?? 0,
        attachments: [],
    };
}

describe('useBroadcastStatusSummary', () => {
    it('draf → isDraft saja yang true', () => {
        const status = useBroadcastStatusSummary({ broadcast: demoBroadcast({ status: 'draft' }) });
        expect(status.isDraft.value).toBe(true);
        expect(status.isScheduled.value).toBe(false);
        expect(status.canCancel.value).toBe(false);
    });

    it('scheduled → isScheduled + canCancel true', () => {
        const status = useBroadcastStatusSummary({ broadcast: demoBroadcast({ status: 'scheduled' }) });
        expect(status.isDraft.value).toBe(false);
        expect(status.isScheduled.value).toBe(true);
        expect(status.canCancel.value).toBe(true);
    });

    it('processing → hanya canCancel yang true', () => {
        const status = useBroadcastStatusSummary({ broadcast: demoBroadcast({ status: 'processing' }) });
        expect(status.isDraft.value).toBe(false);
        expect(status.isScheduled.value).toBe(false);
        expect(status.canCancel.value).toBe(true);
    });

    it('terkirim → semua flag false', () => {
        const status = useBroadcastStatusSummary({ broadcast: demoBroadcast({ status: 'sent' }) });
        expect(status.isDraft.value).toBe(false);
        expect(status.isScheduled.value).toBe(false);
        expect(status.canCancel.value).toBe(false);
    });

    it('progres nol saat belum ada recipients (jaga bagi-nol)', () => {
        const status = useBroadcastStatusSummary({
            broadcast: demoBroadcast({ status: 'processing', recipientsCount: 0, sentCount: 0 }),
        });
        expect(status.progress.value).toBe(0);
    });

    it('progres dibulatkan dari sent_count / recipients_count', () => {
        const status = useBroadcastStatusSummary({
            broadcast: demoBroadcast({ status: 'processing', recipientsCount: 3, sentCount: 1 }),
        });
        expect(status.progress.value).toBe(33);
        const full = useBroadcastStatusSummary({
            broadcast: demoBroadcast({ status: 'sent', recipientsCount: 4, sentCount: 4 }),
        });
        expect(full.progress.value).toBe(100);
    });
});
