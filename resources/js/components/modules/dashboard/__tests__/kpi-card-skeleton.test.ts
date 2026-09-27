import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import KpiCardSkeleton from '../KpiCardSkeleton.vue';

/**
 * DFORM-43: pin fidelitas satu kartu KPI placeholder — root ber-marker `kpi-skeleton`
 * dengan 2 bar `ui/skeleton` (label + angka) dan tanpa props.
 */
describe('KpiCardSkeleton', () => {
    it('merender satu kartu KPI placeholder tanpa props', () => {
        const wrapper = mount(KpiCardSkeleton);

        expect(wrapper.classes()).toContain('kpi-skeleton');
        expect(wrapper.findAll('[data-slot="skeleton"]')).toHaveLength(2);
        expect(wrapper.props()).toEqual({});
    });
});
