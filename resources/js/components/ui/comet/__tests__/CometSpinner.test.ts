import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CometSpinner from '../CometSpinner.vue';

describe('CometSpinner', () => {
    it('merender role status dengan ukuran 16px', () => {
        const wrapper = mount(CometSpinner, { props: { size: 16 } });
        const outer = wrapper.find('[role="status"]');
        expect(outer.exists()).toBe(true);
        expect(outer.attributes('aria-label')).toBe('Loading');
        expect(outer.attributes('style')).toContain('16px');
    });

    it('meng-clamp headScale dan radiusScale', () => {
        const wrapper = mount(CometSpinner, { props: { headScale: 0.5, radiusScale: 2 } });
        const style: string = wrapper.find('[role="status"]').attributes('style') ?? '';
        expect(style).toContain('--loading-ui-comet-head: 35cqmin');
        expect(style).toContain('--loading-ui-comet-radius: 110cqmin');
    });
});
