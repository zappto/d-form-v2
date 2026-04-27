<script setup lang="ts">
import { ref, onMounted } from 'vue';

const visible = ref(false);
onMounted(() => {
    const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) visible.value = true; },
        { threshold: 0.15 }
    );
    const el = document.getElementById('preview-section');
    if (el) observer.observe(el);
});

const previews = [
    { icon: 'form', title: 'Form Builder', desc: 'Drag-and-drop interface with 20+ field types and conditional logic.' },
    { icon: 'event', title: 'Event Manager', desc: 'Create, schedule, and manage events with real-time attendee tracking.' },
    { icon: 'chart', title: 'Live Analytics', desc: 'Visualize responses instantly with auto-generated charts and exports.' },
];
</script>

<template>
    <section id="preview-section" class="relative overflow-hidden bg-background py-24 lg:py-32">
        <div class="absolute right-8 top-12 h-24 w-24 rotate-12 rounded-full border-4 border-[#101014] bg-[#FF6BB5]"></div>
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div :class="['mx-auto max-w-2xl text-center transition-all duration-700', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0']">
                <h2 class="font-display text-4xl font-extrabold tracking-[-0.04em] text-[#101014] sm:text-5xl">
                    Everything you need,<br/><span class="text-[#0A84DC]">nothing you don't.</span>
                </h2>
                <p class="mt-4 text-base font-semibold leading-relaxed text-[#34343B]">Powerful, expressive tools to run your events end-to-end.</p>
            </div>

            <div class="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="(p, i) in previews" :key="p.title"
                    :class="['brutal-card group p-8 transition-all duration-500', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0']"
                    :style="{ transitionDelay: `${200 + i * 120}ms` }"
                >
                    <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#101014] bg-[#FFD84D] text-[#101014] shadow-[3px_3px_0_#101014] transition-colors group-hover:bg-[#41F0B4]">
                        <svg v-if="p.icon === 'form'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                        <svg v-if="p.icon === 'event'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                        <svg v-if="p.icon === 'chart'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                    </div>
                    <h3 class="font-display mb-2 text-xl font-extrabold text-[#101014]">{{ p.title }}</h3>
                    <p class="text-sm font-semibold leading-relaxed text-[#34343B]">{{ p.desc }}</p>
                </div>
            </div>
        </div>
    </section>
</template>
