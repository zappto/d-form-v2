import './bootstrap';

import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { useGlobalErrorToast } from '@/hooks/useGlobalErrorToast';

createInertiaApp({
    // Progress bar bawaan Inertia DIMATIKAN total (progress: false):
    // navigasi memakai skeleton per-halaman + CometSpinner tombol (M1/M2).
    progress: false,
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.vue', { eager: true });
        return pages[`./pages/${name}.vue`];
    },
    setup({ el, App, props, plugin }) {
        createApp({
            setup() {
                useGlobalErrorToast();
                return () => h(App, props);
            },
        })
            .use(plugin)
            .directive('focus', {
                mounted: (el, binding) => {
                    if (binding.value) el.focus();
                },
            })
            .mount(el);
    },
});
