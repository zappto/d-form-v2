<script setup lang="ts">
import { ref, onMounted } from 'vue';

const visible = ref(false);
onMounted(() => {
    const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) visible.value = true; },
        { threshold: 0.15 }
    );
    const el = document.getElementById('cta-home');
    if (el) observer.observe(el);
});
</script>

<template>
    <section id="cta-home" class="relative overflow-hidden border-y-4 border-[#101014] bg-[#0A84DC] py-24 lg:py-28">
        <div class="brutal-grid pointer-events-none absolute inset-0 opacity-[0.08]"></div>
        <div class="pointer-events-none absolute inset-0 opacity-[0.09]">
            <svg width="100%" height="100%">
                <defs>
                    <pattern id="cta-dots" width="28" height="28" patternUnits="userSpaceOnUse">
                        <circle cx="14" cy="14" r="1" fill="white" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cta-dots)" />
            </svg>
        </div>
        <div class="absolute -top-8 left-10 h-24 w-24 rotate-12 rounded-3xl border-4 border-[#101014] bg-[#FFD84D]"></div>
        <div class="absolute right-8 -bottom-10 h-32 w-32 rounded-full border-4 border-[#101014] bg-[#FF6BB5]"></div>

        <div
            :class="[
                'relative mx-auto max-w-4xl px-6 text-center transition-all duration-700',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
            ]"
        >
            <div class="mx-auto mb-6 w-fit -rotate-2 rounded-full border-2 border-[#101014] bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] shadow-[4px_4px_0_#101014]">
                Make the next registration memorable
            </div>
            <h2 class="font-display text-balance text-4xl font-extrabold tracking-[-0.04em] text-white drop-shadow-[4px_4px_0_#101014] sm:text-5xl lg:text-6xl">
                Ready to create your<br />next event?
            </h2>
            <p class="mx-auto mt-5 max-w-xl text-base leading-relaxed font-semibold text-white/80">
                Join organizers who want forms that feel clear, lively, and built for real humans.
            </p>
            <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
                <a
                    href="/auth"
                    class="group inline-flex items-center gap-2 rounded-2xl border-2 border-[#101014] bg-white px-8 py-4 text-sm font-extrabold text-[#0A84DC] shadow-[6px_6px_0_#101014] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:bg-[#FFD84D] hover:text-[#101014] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_#101014]"
                >
                    Get Started Free
                    <svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
            </div>
            <p class="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-white/70">No credit card required - setup in minutes</p>
        </div>
    </section>
</template>
