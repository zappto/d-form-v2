<script setup lang="ts">
import { ref, onMounted } from 'vue';

const visible = ref(false);
onMounted(() => {
    const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) visible.value = true; },
        { threshold: 0.1 }
    );
    const el = document.getElementById('feat-how');
    if (el) observer.observe(el);
});

const steps = [
    { num: '01', title: 'Design Your Form', desc: 'Use the drag-and-drop builder to add fields, set validations, and customize the look and feel.' },
    { num: '02', title: 'Publish & Share', desc: 'Generate a shareable link or embed the form on your website. Go live in seconds.' },
    { num: '03', title: 'Analyze Results', desc: 'View real-time responses, auto-generated charts, and export data at any time.' },
];
</script>

<template>
    <section id="feat-how" class="relative overflow-hidden bg-background py-24 lg:py-32">
        <div class="absolute left-8 top-12 h-24 w-24 -rotate-12 rounded-3xl border-4 border-[#101014] bg-[#B9A4FF]"></div>
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div :class="['mx-auto max-w-2xl text-center transition-all duration-700', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0']">
                <h2 class="font-display text-4xl font-extrabold tracking-[-0.04em] text-[#101014] sm:text-5xl">
                    How it <span class="text-[#0A84DC]">works</span>
                </h2>
                <p class="mt-3 text-base font-semibold text-[#34343B]">From design to insights in three punchy steps.</p>
            </div>

            <div class="mt-16 grid gap-8 lg:grid-cols-3">
                <div
                    v-for="(s, i) in steps" :key="s.num"
                    :class="['brutal-card relative p-8 transition-all duration-700', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0']"
                    :style="{ transitionDelay: `${200 + i * 150}ms` }"
                >
                    <span class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#101014] bg-[#FFD84D] text-sm font-extrabold text-[#101014] shadow-[3px_3px_0_#101014]">{{ s.num }}</span>
                    <h3 class="font-display mb-2 text-xl font-extrabold text-[#101014]">{{ s.title }}</h3>
                    <p class="text-sm font-semibold leading-relaxed text-[#34343B]">{{ s.desc }}</p>
                    <!-- Connector arrow between cards (desktop) -->
                    <div v-if="i < 2" class="pointer-events-none absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#0A84DC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/></svg>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
