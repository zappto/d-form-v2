import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount, type VueWrapper } from '@vue/test-utils';
import EventDashboardForm, { type TEventDashboardFormVariant } from '../events/EventDashboardForm.vue';

/**
 * DFORM-46 Task 3: hapus non-null assertion `props.event!`.
 * Jalur data kosong (event null) harus no-op aman — bukan TypeError —
 * dan tidak boleh mengirim request; jalur normal dengan event tetap POST.
 *
 * Tambahan review independen (ora-3): kunci kontrak varian create vs edit —
 * create harus POST ke /admin/events TANPA `_method`, edit membawa `_method: 'PUT'`;
 * `validateRequired` diuji langsung (create wajib banner, edit tidak).
 */

const { postMock, transformMock } = vi.hoisted(() => ({
    postMock: vi.fn<(url: string) => void>(),
    transformMock: vi.fn(),
}));

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        useForm: <T extends object>(initial: T) => {
            const errors: Record<string, string | string[]> = {};
            return reactive({
                ...initial,
                errors,
                processing: false,
                transform: transformMock,
                post: postMock,
            });
        },
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

/** Pasang komponen dengan varian eksplisit; `event` null merepresentasikan jalur data kosong. */
function mountForm(
    variant: TEventDashboardFormVariant,
    event: IEvent | null
): VueWrapper<InstanceType<typeof EventDashboardForm>> {
    return shallowMount(EventDashboardForm, {
        props: { variant, event },
    });
}

describe('EventDashboardForm saat data event kosong (DFORM-46 T3)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('event null → mount aman dan submit jadi no-op tanpa POST', () => {
        const wrapper = mountForm('edit', null);
        try {
            wrapper.vm.submitForm(true);
            expect(postMock).not.toHaveBeenCalled();
        } finally {
            wrapper.unmount();
        }
    });

    it('event ada → submit memakai URL update event (perilaku normal tetap)', () => {
        const event = demoEvent();
        const wrapper = mountForm('edit', event);
        try {
            wrapper.vm.submitForm(true);
            expect(postMock).toHaveBeenCalledTimes(1);
            expect(postMock.mock.calls[0]?.[0]).toContain(event.id);
        } finally {
            wrapper.unmount();
        }
    });
});

describe('EventDashboardForm — kontrak endpoint create vs edit (DFORM-46)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('varian create → POST ke /admin/events dan payload form tanpa key _method', () => {
        const wrapper = mountForm('create', null);
        try {
            wrapper.vm.submitForm(true);
            expect(postMock).toHaveBeenCalledTimes(1);
            expect(postMock.mock.calls[0]?.[0]).toBe('/admin/events');
            expect(Object.keys(wrapper.vm.form)).not.toContain('_method');
        } finally {
            wrapper.unmount();
        }
    });

    it('varian edit → form membawa penanda _method PUT untuk update', () => {
        const wrapper = mountForm('edit', demoEvent());
        try {
            expect(wrapper.vm.form).toHaveProperty('_method', 'PUT');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('EventDashboardForm.validateRequired (DFORM-46)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('create dengan field wajib kosong → false dan pesan errors.title "Wajib diisi."', () => {
        const wrapper = mountForm('create', null);
        try {
            expect(wrapper.vm.validateRequired()).toBe(false);
            expect(wrapper.vm.form.errors.title).toBe('Wajib diisi.');
        } finally {
            wrapper.unmount();
        }
    });

    it('create dengan semua field wajib terisi (banner File) → true', () => {
        const wrapper = mountForm('create', null);
        try {
            const form = wrapper.vm.form;
            form.title = 'Acara';
            form.description = 'Deskripsi';
            form.location = 'Kampus';
            form.start_date = '2026-10-01';
            form.end_date = '2026-10-02';
            form.registration_start = '2026-09-01T08:00';
            form.registration_end = '2026-09-30T20:00';
            form.session = 'general';
            form.category = 'rkt';
            form.banner = new File(['x'], 'banner.png', { type: 'image/png' });

            expect(wrapper.vm.validateRequired()).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('edit dengan banner null → banner tidak masuk daftar error wajib', () => {
        const wrapper = mountForm('edit', demoEvent());
        try {
            expect(wrapper.vm.form.banner).toBeNull();
            expect(wrapper.vm.validateRequired()).toBe(true);
            expect(Object.keys(wrapper.vm.form.errors)).not.toContain('banner');
        } finally {
            wrapper.unmount();
        }
    });
});
