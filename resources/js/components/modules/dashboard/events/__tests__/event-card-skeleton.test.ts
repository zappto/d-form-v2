import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import EventCardSkeleton from '../EventCardSkeleton.vue';

/**
 * DFORM-38 (Mx-J): pin fidelitas satu kartu skeleton event — root ber-marker,
 * 9 bar `ui/skeleton`, dan bar banner `aspect-[16/7]` bergaya `rounded-xl`.
 */
describe('EventCardSkeleton', () => {
    it('merender satu kartu placeholder yang setia pada kartu event asli', () => {
        const wrapper = mount(EventCardSkeleton);

        expect(wrapper.classes()).toContain('event-card-skeleton');
        expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(9);

        const bannerBars = wrapper.findAll('[class*="aspect-[16/7]"]');
        expect(bannerBars).toHaveLength(1);
        expect(bannerBars.filter((bar) => bar.classes().includes('rounded-xl'))).toHaveLength(1);
    });
});
