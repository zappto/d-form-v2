import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useChartTheme, type IChartThemeResult } from '../useChartTheme';

/** Host tipis agar onMounted/onBeforeUnmount hook berjalan seperti di chart. */
function mountThemeHost(): { exposed: () => IChartThemeResult; wrapper: ReturnType<typeof mount> } {
    let exposed: IChartThemeResult | null = null;
    const host = defineComponent({
        setup() {
            exposed = useChartTheme();
            return () => h('div', String(exposed?.isDark.value));
        },
    });
    const wrapper = mount(host);
    return {
        exposed: (): IChartThemeResult => {
            if (exposed === null) throw new Error('hook belum terpasang');
            return exposed;
        },
        wrapper,
    };
}

/** Tunggu MutationObserver jsdom menyalurkan mutasi atribut ke callback. */
function flushThemeMutation(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('useChartTheme', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('data-theme');
        vi.restoreAllMocks();
    });

    it('baca awal mengikuti atribut data-theme', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        const dark = mountThemeHost();
        expect(dark.exposed().isDark.value).toBe(true);
        dark.wrapper.unmount();

        document.documentElement.setAttribute('data-theme', 'light');
        const light = mountThemeHost();
        expect(light.exposed().isDark.value).toBe(false);
        light.wrapper.unmount();
    });

    it('tanpa atribut berarti terang', () => {
        const { wrapper, exposed } = mountThemeHost();
        expect(exposed().isDark.value).toBe(false);
        wrapper.unmount();
    });

    it('mutasi data-theme membalik flag tanpa mount ulang', async () => {
        document.documentElement.setAttribute('data-theme', 'light');
        const { wrapper, exposed } = mountThemeHost();
        expect(exposed().isDark.value).toBe(false);

        document.documentElement.setAttribute('data-theme', 'dark');
        await flushThemeMutation();
        await nextTick();
        expect(exposed().isDark.value).toBe(true);

        document.documentElement.setAttribute('data-theme', 'light');
        await flushThemeMutation();
        await nextTick();
        expect(exposed().isDark.value).toBe(false);
        wrapper.unmount();
    });

    it('unmount melepas observer sehingga mutasi tak lagi diikuti', async () => {
        document.documentElement.setAttribute('data-theme', 'light');
        const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect');
        const { wrapper, exposed } = mountThemeHost();
        wrapper.unmount();
        expect(disconnectSpy).toHaveBeenCalledTimes(1);

        document.documentElement.setAttribute('data-theme', 'dark');
        await flushThemeMutation();
        await nextTick();
        expect(exposed().isDark.value).toBe(false);
    });
});
