import { onMounted, onUnmounted, ref } from 'vue';
import axios from 'axios';
import { showErrorToast } from '@/lib/error-message';

export interface IQueueEntryRow {
    id: string;
    queue_number: number;
    status: string;
    status_label: string;
    called_at: string | null;
    completed_at: string | null;
    application: {
        id: string;
        full_name: string;
        registration_number: string;
    } | null;
}

export interface IQueueSnapshot {
    entries: IQueueEntryRow[];
    current: IQueueEntryRow | null;
    next: IQueueEntryRow | null;
    stats: {
        waiting: number;
        called: number;
        completed: number;
        total: number;
    };
}

const POLL_INTERVAL_MS = 10_000;

/** Snapshot antrean rekrutmen yang di-poll berkala beserta status loading dan kontrol polling. */
export function useRecruitmentQueue(pollUrl: string, initial: IQueueSnapshot) {
    const queue = ref<IQueueSnapshot>(initial);
    const polling = ref(true);
    /** Tick pertama (refresh awal) → skeleton; tick berikut diam. Sekali false, tak pernah true lagi. */
    const isInitialLoading = ref(true);
    /** Throttle toast error: hanya sekali per transisi ke gagal. */
    const pollErrorShown = ref(false);
    let timer: ReturnType<typeof setInterval> | null = null;

    async function refresh() {
        try {
            const { data } = await axios.get<IQueueSnapshot>(pollUrl, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            queue.value = data;
            pollErrorShown.value = false;
        } catch {
            // Keep last snapshot on transient errors; toast sekali per transisi gagal.
            if (!pollErrorShown.value) {
                pollErrorShown.value = true;
                showErrorToast('Gagal memperbarui antrean. Menampilkan data terakhir.');
            }
        } finally {
            isInitialLoading.value = false;
        }
    }

    function startPolling() {
        if (timer !== null) {
            return;
        }

        timer = setInterval(() => {
            if (polling.value) {
                void refresh();
            }
        }, POLL_INTERVAL_MS);
    }

    function stopPolling() {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    }

    onMounted(() => {
        startPolling();
    });

    onUnmounted(() => {
        stopPolling();
    });

    return {
        queue,
        polling,
        isInitialLoading,
        refresh,
        startPolling,
        stopPolling,
    };
}
