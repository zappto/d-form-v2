import { computed, ref } from 'vue'
import { router } from '@inertiajs/vue3'
import { handleInertiaFormErrors } from '@/lib/error-message'
import {
    destroy as destroyEvent,
    restore as restoreEvent,
    update as updateEvent,
} from '@/actions/App/Http/Controllers/Dashboard/Events/EventController'
import { sessionLabelMap } from '@/lib/dummyData'
import { formatDisplayDate, formatDisplayDateTime, formatRupiahPrice } from '@/lib/format'
import { parseEventCategories } from '@/lib/eventShowUi'
import { Banknote, CalendarDays, Clock, MapPin } from 'lucide-vue-next'

export function useDashboardEventShowPage(
    event: IEvent,
    forms: { id: string; title: string }[],
) {
    const previewRegistrants = [] as IRegistrant[]
    const totalRegistrants = event.registered_count

    const showDeleteModal = ref(false)
    const showRestoreModal = ref(false)
    const isDeleting = ref(false)
    const isRestoring = ref(false)
    const isTogglingPublish = ref(false)

    const fillPercent = computed(() => {
        if (!event.quota) return 0
        return Math.min(100, Math.round((event.registered_count / event.quota) * 100))
    })

    const remainingSeats = computed(() => Math.max(0, event.quota - event.registered_count))

    const progressTone = computed(() => {
        const p = fillPercent.value
        if (p >= 90) return { ring: 'text-destructive', label: 'Almost full', pill: 'bg-destructive/10 text-destructive' }
        if (p >= 60) return { ring: 'text-warning', label: 'Filling fast', pill: 'bg-warning/15 text-warning-foreground' }
        return { ring: 'text-success', label: 'Seats available', pill: 'bg-success/10 text-success' }
    })

    const statusPill = computed(() => {
        if (event.deleted_at) return { label: 'Archived', classes: 'bg-muted text-muted-foreground border-border' }
        if (event.status === 'published') return { label: 'Published', classes: 'bg-success/10 text-success border-success/20' }
        return { label: 'Draft', classes: 'bg-muted text-muted-foreground border-border' }
    })

    const metaBlocks = computed(() => [
        {
            title: 'Schedule',
            value: event.start_date === event.end_date ? formatDisplayDate(event.start_date) : `${formatDisplayDate(event.start_date)} — ${formatDisplayDate(event.end_date)}`,
            icon: CalendarDays,
        },
        { title: 'Location', value: event.location, icon: MapPin },
        {
            title: 'Session',
            value: parseEventCategories(event.session).map((s) => sessionLabelMap[s] ?? s).join(', ') || '—',
            icon: Clock,
        },
        {
            title: 'Price',
            value: event.price > 0 ? `Rp ${formatRupiahPrice(Number(event.price))}` : 'Free',
            icon: Banknote,
        },
    ])

    function handleDelete() {
        isDeleting.value = true
        router.delete(destroyEvent(event.id).url, {
            // Tanpa toast manual: sukses sudah ditampilkan global oleh usePageFlashToast
            // dari flash `toast` server (messages.event.delete.success).
            onSuccess: () => { showDeleteModal.value = false },
            onError: (errors) => handleInertiaFormErrors(errors, { title: 'Gagal mengarsipkan event' }),
            onFinish: () => { isDeleting.value = false; showDeleteModal.value = false },
        })
    }

    function handleRestore() {
        isRestoring.value = true
        router.post(restoreEvent(event.id).url, {}, {
            // Tanpa toast manual: sukses sudah ditampilkan global oleh usePageFlashToast
            // dari flash `toast` server (messages.event.restore.success).
            onSuccess: () => { showRestoreModal.value = false },
            onError: (errors) => handleInertiaFormErrors(errors, { title: 'Gagal memulihkan event' }),
            onFinish: () => { isRestoring.value = false; showRestoreModal.value = false },
        })
    }

    function handleTogglePublish() {
        if (isTogglingPublish.value || event.deleted_at) return
        // UpdateEventRequest mewajibkan semua field, jadi kirim payload lengkap
        // dari data event saat ini + flag publish yang dibalik. session/category
        // boleh berupa array (dinormalisasi backend jadi string CSV).
        const publish = event.status === 'draft'
        isTogglingPublish.value = true
        router.put(updateEvent(event.id).url, {
            title: event.title,
            description: event.description,
            location: event.location,
            start_date: event.start_date,
            end_date: event.end_date,
            registration_start: event.registration_start,
            registration_end: event.registration_end,
            quota: event.quota,
            price: event.price,
            session: event.session,
            category: event.category,
            publish,
        }, {
            preserveScroll: true,
            onError: (errors) => handleInertiaFormErrors(errors, {
                title: publish ? 'Gagal mempublikasikan event' : 'Gagal mengembalikan event ke draf',
            }),
            onFinish: () => { isTogglingPublish.value = false },
        })
    }

    const cardShadow = 'shadow-sm'

    return {
        forms,
        previewRegistrants,
        totalRegistrants,
        showDeleteModal,
        showRestoreModal,
        isDeleting,
        isRestoring,
        isTogglingPublish,
        fillPercent,
        remainingSeats,
        progressTone,
        statusPill,
        metaBlocks,
        parseEventCategories,
        formatDate: formatDisplayDate,
        formatDateTime: formatDisplayDateTime,
        handleDelete,
        handleRestore,
        handleTogglePublish,
        cardShadow,
    }
}
