<script setup lang="ts">
import { computed } from 'vue';
import { Head } from '@inertiajs/vue3';
import { Vue3Lottie } from 'vue3-lottie';

const props = defineProps<{
    status: number;
}>();

const titles: Record<number, string> = {
    503: '503: Lagi beres-beres',
    500: '500: Server lagi mumet',
    404: '404: Halamannya kabur',
    403: '403: Area khusus',
};

const descriptions: Record<number, string> = {
    503: 'DForm sedang maintenance sebentar. Balik lagi nanti ya.',
    500: 'Ada yang tidak beres di sisi server. Tim kami perlu cek sebentar.',
    404: 'Halaman yang kamu cari tidak ditemukan, tapi kamu masih bisa balik ke rumah.',
    403: 'Kamu belum punya akses untuk membuka halaman ini.',
};

const title = computed(() => titles[props.status] ?? `${props.status}: Ada yang aneh`);
const description = computed(() => descriptions[props.status] ?? 'Terjadi masalah yang tidak terduga.');
</script>

<template>
    <Head :title="title" />

    <main class="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-6 py-16">
        <div class="brutal-grid pointer-events-none absolute inset-0 opacity-[0.04]"></div>
        <div class="absolute left-8 top-12 h-28 w-28 -rotate-12 rounded-3xl border-4 border-[#101014] bg-[#FFD84D]"></div>
        <div class="absolute bottom-12 right-10 h-32 w-32 rounded-full border-4 border-[#101014] bg-[#FF6BB5]"></div>

        <section class="brutal-card relative z-10 grid max-w-5xl items-center gap-8 p-8 md:grid-cols-[0.9fr_1.1fr] md:p-10">
            <div class="rounded-3xl border-2 border-[#101014] bg-[#41F0B4] p-4 shadow-[6px_6px_0_#101014]">
                <Vue3Lottie
                    animation-link="https://lottie.host/4e039bf3-670e-4a0f-8a6c-1bee793bfc23/JkaGBMIxOz.json"
                    :height="280"
                    :width="280"
                    :loop="true"
                    class="mx-auto"
                />
            </div>

            <div>
                <p class="mb-4 w-fit rounded-full border-2 border-[#101014] bg-[#FFD84D] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] shadow-[3px_3px_0_#101014]">
                    Something happened
                </p>
                <h1 class="font-display text-balance text-5xl font-extrabold leading-none tracking-[-0.04em] text-[#101014] md:text-6xl">
                    {{ title }}
                </h1>
                <p class="mt-5 max-w-xl text-lg font-semibold leading-8 text-muted-foreground">
                    {{ description }}
                </p>
                <div class="mt-8 flex flex-wrap gap-3">
                    <a
                        href="/"
                        class="rounded-2xl border-2 border-[#101014] bg-[#0A84DC] px-6 py-3 text-sm font-extrabold text-white shadow-[5px_5px_0_#101014] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:bg-[#FFD84D] hover:text-[#101014]"
                    >
                        Back to Home
                    </a>
                    <a
                        href="/events"
                        class="rounded-2xl border-2 border-[#101014] bg-white px-6 py-3 text-sm font-extrabold text-[#101014] shadow-[5px_5px_0_#101014] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:bg-[#FF6BB5]"
                    >
                        Browse Events
                    </a>
                </div>
            </div>
        </section>
    </main>
</template>
