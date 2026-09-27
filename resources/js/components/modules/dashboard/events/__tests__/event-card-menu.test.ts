import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils';
import EventCard from '../EventCard.vue';

/**
 * DFORM-46 (S5 follow-up): tutup-menu kebab `EventCard`.
 * Jalur ini sebelumnya nol cakupan (skeleton menguji placeholder, delete-action meng-stub EventCard).
 * `Button` sengaja TIDAK di-stub: beda ref komponen (instance) vs elemen DOM justru yang diuji.
 */

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    router: { visit: vi.fn(), get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

function demoEvent(id: string): IEvent {
    return {
        id,
        slug: `event-${id}`,
        title: `Event ${id}`,
        description: 'Acara demo',
        start_date: '2026-10-01',
        end_date: '2026-10-02',
        registration_start: '2026-09-01',
        registration_end: '2026-09-30',
        location: 'Gedung A',
        quota: 100,
        registered_count: 10,
        banner: '',
        banner_url: null,
        price: 0,
        session: [],
        category: [],
        status: 'published',
        registration_status: 'open',
        deleted_at: null,
        created_at: '2026-09-01',
        updated_at: '2026-09-01',
    };
}

const wrappers: VueWrapper[] = [];

/**
 * Mount satu kartu `canManage` + catat untuk cleanup; `Button` asli (tanpa stub).
 * Wajib `attachTo: document.body` agar `pointerdown`/`click` bubble sampai listener `window`.
 */
function mountCard(id = 'evt-1'): VueWrapper {
    const wrapper = mount(EventCard, {
        attachTo: document.body,
        props: { event: demoEvent(id), href: `/events/event-${id}`, canManage: true },
    });
    wrappers.push(wrapper);
    return wrapper;
}

function triggerButton(wrapper: VueWrapper): Omit<DOMWrapper<Element>, 'exists'> {
    return wrapper.get('button[aria-label="Menu acara"]');
}

function menuPanel(wrapper: VueWrapper): DOMWrapper<Element> {
    return wrapper.find('.min-w-48');
}

/** Urutan interaksi nyata: `pointerdown` (listener window) lebih dulu, lalu `click` (handler tombol). */
async function pressTrigger(wrapper: VueWrapper): Promise<void> {
    await triggerButton(wrapper).trigger('pointerdown');
    await triggerButton(wrapper).trigger('click');
    await nextTick();
}

/** Klik di luar kartu: `pointerdown` + `click` pada `document.body` (bubble ke listener window). */
async function clickOutside(): Promise<void> {
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await nextTick();
}

beforeEach(() => {
    while (wrappers.length > 0) wrappers.pop()?.unmount();
});

describe('EventCard kebab menu (DFORM-46 S5)', () => {
    it('(a) klik pemicu saat tertutup → menu terbuka', async () => {
        const wrapper = mountCard();
        expect(menuPanel(wrapper).exists()).toBe(false);

        await pressTrigger(wrapper);

        expect(menuPanel(wrapper).exists()).toBe(true);
    });

    it('(b) klik pemicu saat terbuka → menu tertutup (kasus regresi)', async () => {
        const wrapper = mountCard();
        await pressTrigger(wrapper);
        expect(menuPanel(wrapper).exists()).toBe(true);

        await pressTrigger(wrapper);

        expect(menuPanel(wrapper).exists()).toBe(false);
    });

    it('(c) klik di luar kartu → menu tertutup', async () => {
        const wrapper = mountCard();
        await pressTrigger(wrapper);
        expect(menuPanel(wrapper).exists()).toBe(true);

        await clickOutside();

        expect(menuPanel(wrapper).exists()).toBe(false);
    });

    it('(d) klik pada background panel menu → menu tetap terbuka', async () => {
        const wrapper = mountCard();
        await pressTrigger(wrapper);
        expect(menuPanel(wrapper).exists()).toBe(true);

        await menuPanel(wrapper).trigger('pointerdown');

        expect(menuPanel(wrapper).exists()).toBe(true);
    });

    it('(e) tombol Escape → menu tertutup', async () => {
        const wrapper = mountCard();
        await pressTrigger(wrapper);
        expect(menuPanel(wrapper).exists()).toBe(true);

        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await nextTick();

        expect(menuPanel(wrapper).exists()).toBe(false);
    });

    it('dua kartu: membuka pemicu kartu kedua menutup menu kartu pertama', async () => {
        const first = mountCard('evt-1');
        const second = mountCard('evt-2');

        await pressTrigger(first);
        expect(menuPanel(first).exists()).toBe(true);

        await pressTrigger(second);
        await nextTick();

        expect(menuPanel(first).exists()).toBe(false);
        expect(menuPanel(second).exists()).toBe(true);
    });
});
