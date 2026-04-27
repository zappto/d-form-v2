<script setup lang="ts">
import { ref, onMounted } from 'vue';

const visible = ref(false);
onMounted(() => {
    const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) visible.value = true; },
        { threshold: 0.1 }
    );
    const el = document.getElementById('feat-compare');
    if (el) observer.observe(el);
});

const rows = [
    { feature: 'Unlimited Events', dform: true, others: false },
    { feature: 'Drag & Drop Form Builder', dform: true, others: true },
    { feature: 'Real-time Analytics', dform: true, others: false },
    { feature: 'Team Collaboration', dform: true, others: false },
    { feature: 'Webhooks & API', dform: true, others: true },
    { feature: 'Custom Branding', dform: true, others: false },
    { feature: 'GDPR Compliance', dform: true, others: true },
    { feature: 'Free Tier Available', dform: true, others: false },
];
</script>

<template>
    <section id="feat-compare" class="bg-background py-24 lg:py-32">
        <div class="mx-auto max-w-4xl px-6 lg:px-8">
            <div :class="['mx-auto max-w-2xl text-center transition-all duration-700', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0']">
                <h2 class="font-display text-4xl font-extrabold tracking-[-0.04em] text-[#101014] sm:text-5xl">
                    Why choose <span class="text-[#0A84DC]">DForm?</span>
                </h2>
                <p class="mt-3 text-base font-semibold text-[#34343B]">See how we compare to other platforms.</p>
            </div>

            <div :class="['brutal-card mt-12 overflow-hidden transition-all duration-700', visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0']" style="transition-delay: 200ms;">
                <!-- Header -->
                <div class="grid grid-cols-3 border-b-2 border-[#101014] bg-[#FFD84D] px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-[#101014]">
                    <span>Feature</span>
                    <span class="text-center text-[#0A84DC]">DForm</span>
                    <span class="text-center">Others</span>
                </div>
                <!-- Rows -->
                <div class="divide-y-2 divide-[#101014]">
                    <div v-for="row in rows" :key="row.feature" class="grid grid-cols-3 items-center px-6 py-3.5 transition-colors hover:bg-[#41F0B4]/40">
                        <span class="text-sm font-extrabold text-[#101014]">{{ row.feature }}</span>
                        <span class="flex justify-center">
                            <svg v-if="row.dform" class="h-5 w-5 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            <span v-else class="h-1 w-5 rounded bg-[#101014]/30"></span>
                        </span>
                        <span class="flex justify-center">
                            <svg v-if="row.others" class="h-5 w-5 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            <span v-else class="h-1 w-5 rounded bg-[#101014]/30"></span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
