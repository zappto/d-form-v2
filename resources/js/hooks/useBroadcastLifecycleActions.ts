import { router, useForm } from '@inertiajs/vue3';
import type { InertiaForm } from '@inertiajs/vue3';
import { routes } from '@/lib/routes';

/** Isian form ubah jadwal broadcast. */
export interface IBroadcastScheduleFields {
    schedule_date: string;
    schedule_time: string;
}

/** Isian form kirim test email broadcast. */
export interface IBroadcastTestFields {
    email: string;
}

/** Argumen aksi siklus hidup broadcast (id + jadwal awal; objek tunggal agar ≤2 parameter). */
export interface IBroadcastLifecycleArgs {
    broadcastId: string;
    initialScheduleDate: string;
    initialScheduleTime: string;
}

/** Hasil aksi siklus hidup broadcast (form jadwal/test + pemicu schedule/batal/ulangi/hapus). */
export interface IBroadcastLifecycleResult {
    scheduleForm: InertiaForm<IBroadcastScheduleFields>;
    testForm: InertiaForm<IBroadcastTestFields>;
    doSchedule: () => void;
    updateSchedule: () => void;
    sendTest: () => void;
    cancelBroadcast: () => void;
    retryFailed: () => void;
    deleteBroadcast: () => void;
}

/** Aksi siklus hidup broadcast (jadwal + test + batal/ulangi/hapus); dipakai header dan kartu jadwal Show. */
export function useBroadcastLifecycleActions(args: IBroadcastLifecycleArgs): IBroadcastLifecycleResult {
    const scheduleForm: InertiaForm<IBroadcastScheduleFields> = useForm<IBroadcastScheduleFields>({
        schedule_date: args.initialScheduleDate,
        schedule_time: args.initialScheduleTime,
    });
    const testForm: InertiaForm<IBroadcastTestFields> = useForm<IBroadcastTestFields>({ email: '' });

    function doSchedule(): void {
        router.post(routes.admin.broadcasts.schedule(args.broadcastId), {}, { preserveScroll: true });
    }

    function updateSchedule(): void {
        scheduleForm.patch(routes.admin.broadcasts.schedule(args.broadcastId), { preserveScroll: true });
    }

    function sendTest(): void {
        testForm.post(routes.admin.broadcasts.test(args.broadcastId), {
            preserveScroll: true,
            onSuccess: () => testForm.reset(),
        });
    }

    function cancelBroadcast(): void {
        router.post(routes.admin.broadcasts.cancel(args.broadcastId), {}, { preserveScroll: true });
    }

    function retryFailed(): void {
        router.post(routes.admin.broadcasts.retry(args.broadcastId), {}, { preserveScroll: true });
    }

    function deleteBroadcast(): void {
        if (!confirm('Hapus broadcast beserta recipients & attachments?')) return;
        router.delete(routes.admin.broadcasts.destroy(args.broadcastId));
    }

    return {
        scheduleForm,
        testForm,
        doSchedule,
        updateSchedule,
        sendTest,
        cancelBroadcast,
        retryFailed,
        deleteBroadcast,
    };
}
