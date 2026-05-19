import './bootstrap';

import { createApp, h } from 'vue';
import { createInertiaApp, router } from '@inertiajs/vue3';
import { toast } from 'vue-sonner';

router.on('invalid', (event) => {
    const status = event.detail.response?.status;
    if (typeof status === 'number' && status >= 500) {
        event.preventDefault();
        toast.error(
            'Terjadi kesalahan server saat memuat halaman. Coba refresh; jika tetap terjadi, ini perlu diperbaiki di server.',
        );
    } else if (status === 419) {
        event.preventDefault();
        toast.error('Sesi tidak valid atau sudah habis. Muat ulang halaman lalu coba lagi.');
    }
});

createInertiaApp({
    progress: {
        delay: 180,
        color: '#FFD84D',
        includeCSS: true,
        showSpinner: false,
    },
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.vue', { eager: true });
        return pages[`./pages/${name}.vue`];
    },
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .directive('focus', {
                mounted: (el, binding) => {
                    if (binding.value) el.focus();
                },
            })
            .mount(el);
    },
});
