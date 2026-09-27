import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount, type VueWrapper } from '@vue/test-utils';
import EventDashboardForm from '../events/EventDashboardForm.vue';

/**
 * DFORM-46 Task 3: hapus non-null assertion `props.event!`.
 * Jalur data kosong (event null) harus no-op aman — bukan TypeError —
 * dan tidak boleh mengirim request; jalur normal dengan event tetap POST.
 */

const { postMock, transformMock } = vi.hoisted(() => ({
    postMock: vi.fn(),
    transformMock: vi.fn(),
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        useForm: (initial: Record<string, unknown>) =>
            reactive({
                ...initial,
                errors: {},
                processing: false,
                transform: transformMock,
                post: postMock,
            }),
    };
});

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function demoEvent(): IEvent {
    return {
        id: 'ev-1',
        slug: 'acara',
        title: 'Acara',
        description: 'Deskripsi',
        start_date: '2026-10-01',
        end_date: '2026-10-02',
        registration_start: '2026-09-01T08:00',
        registration_end: '2026-09-30T20:00',
        location: 'Kampus',
        quota: 100,
        registered_count: 0,
        banner: '',
        banner_url: null,
        price: 0,
        session: ['general'],
        category: ['rkt'],
        status: 'published',
        registration_status: 'open',
        deleted_at: null,
        created_at: '2026-09-01',
        updated_at: '2026-09-01',
    };
}

function mountForm(event: IEvent | null): VueWrapper<InstanceType<typeof EventDashboardForm>> {
    return shallowMount(EventDashboardForm, {
        props: { variant: 'edit', event },
    });
}

describe('EventDashboardForm saat data event kosong (DFORM-46 T3)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('event null → mount aman dan submit jadi no-op tanpa POST', () => {
        const wrapper = mountForm(null);
        try {
            wrapper.vm.submitForm(true);
            expect(postMock).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });

    it('event ada → submit memakai URL update event (perilaku normal tetap)', () => {
        const event = demoEvent();
        const wrapper = mountForm(event);
        try {
            wrapper.vm.submitForm(true);
            expect(postMock).toHaveBeenCalledTimes(1);
            expect(postMock.mock.calls[0]?.[0]).toContain(event.id);
        } finally {
            wrapper.unmount();
        }
    });
});
