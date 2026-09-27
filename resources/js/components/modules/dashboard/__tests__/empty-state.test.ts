import { describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import EmptyState from '../EmptyState.vue';

/**
 * DFORM-37 F1: dua mode presentasi — `panel` (default, 7 pemakai lama, wajib utuh)
 * vs `inline` (teks polos untuk empty di dalam Card/`<td>`, tanpa padding sendiri).
 * `LocalLottie` di-stub karena lottie-web crash di jsdom.
 */
vi.mock('@/components/core/LocalLottie.vue', () => ({
    default: { template: '<div data-testid="local-lottie" />' },
}));

type TEmptyStateProps = InstanceType<typeof EmptyState>['$props'];

function mountState(overrides: Partial<TEmptyStateProps> = {}): VueWrapper<InstanceType<typeof EmptyState>> {
    return mount(EmptyState, {
        props: { title: 'Belum ada data.', description: 'Coba ubah filter.', animationName: 'emptyData', ...overrides },
        slots: { default: '<button>Buat acara</button>' },
    });
}

describe('EmptyState — mode panel (default)', () => {
    it('memakai surface + lottie + title/description + slot CTA', () => {
        const wrapper = mountState();

        expect(wrapper.classes()).toContain('app-surface');
        expect(wrapper.classes()).toContain('rounded-2xl');
        expect(wrapper.classes()).toContain('px-6');
        expect(wrapper.classes()).toContain('py-14');
        expect(wrapper.find('[data-testid="local-lottie"]').exists()).toBe(true);
        expect(wrapper.find('p.font-display').text()).toBe('Belum ada data.');
        expect(wrapper.find('p.mt-2').text()).toBe('Coba ubah filter.');
        expect(wrapper.find('div.mt-5').text()).toBe('Buat acara');

        wrapper.unmount();
    });

    it('variant eksplisit `panel` identik dengan default', () => {
        const wrapper = mountState({ variant: 'panel' });

        expect(wrapper.classes()).toContain('app-surface');
        expect(wrapper.find('[data-testid="local-lottie"]').exists()).toBe(true);

        wrapper.unmount();
    });
});

describe('EmptyState — mode inline', () => {
    it('teks polos: tanpa surface, tanpa lottie, tanpa padding sendiri', () => {
        const wrapper = mountState({ variant: 'inline' });

        expect(wrapper.classes()).toEqual(['flex', 'flex-col', 'items-center', 'justify-center', 'text-center']);
        expect(wrapper.find('[data-testid="local-lottie"]').exists()).toBe(false);
        expect(wrapper.text()).toContain('Belum ada data.');
        expect(wrapper.text()).toContain('Coba ubah filter.');
        expect(wrapper.find('div.mt-3').text()).toBe('Buat acara');

        wrapper.unmount();
    });

    it('tanpa description hanya merender title', () => {
        const wrapper = mountState({ variant: 'inline', description: undefined });

        expect(wrapper.find('p.text-sm.text-muted-foreground').text()).toBe('Belum ada data.');
        expect(wrapper.findAll('p')).toHaveLength(1);

        wrapper.unmount();
    });
});
