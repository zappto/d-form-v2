<script setup lang="ts">
import { ref, onMounted } from 'vue';

const visible = ref(false);
onMounted(() => setTimeout(() => (visible.value = true), 100));
</script>

<template>
    <section class="relative overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div class="brutal-grid pointer-events-none absolute inset-0 opacity-[0.035]"></div>
        <div class="absolute -top-20 right-8 h-48 w-48 rotate-12 rounded-[2rem] border-4 border-[#101014] bg-[#FFD84D]"></div>
        <div class="absolute bottom-20 left-6 hidden h-28 w-28 -rotate-12 rounded-full border-4 border-[#101014] bg-[#FF6BB5] lg:block"></div>

        <div class="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8">
            <div
                :class="[
                    'transition-all duration-700 ease-out',
                    visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
                ]"
            >
                <div
                    class="mb-6 inline-flex rotate-[-1deg] items-center gap-2 rounded-full border-2 border-[#101014] bg-[#41F0B4] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] shadow-[4px_4px_0_#101014]"
                >
                    <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#0A84DC]"></span>
                    Event ops, but louder
                </div>

                <h1
                    class="font-display text-balance max-w-4xl text-[3.1rem] leading-[0.95] font-extrabold tracking-[-0.055em] text-[#101014] sm:text-6xl lg:text-7xl"
                >
                    Build forms that feel
                    <span class="relative inline-block text-[#0A84DC]">
                        alive.
                        <span class="hero-underline absolute -bottom-2 left-0 h-3 w-full rounded-full bg-[#FFD84D]"></span>
                    </span>
                </h1>

                <p class="mt-7 max-w-2xl text-lg leading-8 font-semibold text-[#34343B]">
                    Create registration flows, manage attendees, and read the room from one colorful dashboard that is
                    clear, human, and impossible to miss.
                </p>

                <div class="mt-10 flex flex-wrap items-center gap-4">
                    <a
                        href="/auth"
                        class="group inline-flex items-center gap-2.5 rounded-2xl border-2 border-[#101014] bg-[#0A84DC] px-8 py-4 text-sm font-extrabold text-white shadow-[6px_6px_0_#101014] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:bg-[#FFD84D] hover:text-[#101014] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_#101014]"
                    >
                        Get Started Free
                        <svg
                            class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    </a>
                    <a
                        href="/features"
                        class="inline-flex items-center gap-2 rounded-2xl border-2 border-[#101014] bg-white px-8 py-4 text-sm font-extrabold text-[#101014] shadow-[6px_6px_0_#101014] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:bg-[#FF6BB5] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_#101014]"
                    >
                        See How It Works
                    </a>
                </div>

                <div class="mt-10 flex flex-wrap gap-3 text-sm font-extrabold">
                    <span class="rounded-full border-2 border-[#101014] bg-white px-4 py-2 shadow-[3px_3px_0_#101014]">No credit card</span>
                    <span class="rounded-full border-2 border-[#101014] bg-[#B9A4FF] px-4 py-2 shadow-[3px_3px_0_#101014]">Live analytics</span>
                    <span class="rounded-full border-2 border-[#101014] bg-[#FFD84D] px-4 py-2 shadow-[3px_3px_0_#101014]">DOSCOM made</span>
                </div>
            </div>

            <div
                :class="[
                    'relative transition-all delay-200 duration-700 ease-out',
                    visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0',
                ]"
            >
                <div class="absolute -right-5 top-8 h-20 w-20 rounded-full border-4 border-[#101014] bg-[#41F0B4]"></div>
                <div class="absolute -bottom-5 left-6 z-10 rounded-2xl border-2 border-[#101014] bg-[#FFD84D] px-4 py-3 text-sm font-extrabold shadow-[5px_5px_0_#101014]">
                    342 people joined today
                </div>
                <svg viewBox="0 0 720 520" fill="none" xmlns="http://www.w3.org/2000/svg" class="home-svg w-full">
                    <rect x="64" y="48" width="560" height="392" rx="28" fill="white" stroke="#101014" stroke-width="6" />
                    <rect x="86" y="72" width="560" height="392" rx="28" fill="#0A84DC" stroke="#101014" stroke-width="6" />
                    <rect x="112" y="98" width="430" height="58" rx="18" fill="#FFD84D" stroke="#101014" stroke-width="4" />
                    <circle cx="136" cy="127" r="8" fill="#FF6BB5" stroke="#101014" stroke-width="3" />
                    <circle cx="164" cy="127" r="8" fill="#41F0B4" stroke="#101014" stroke-width="3" />
                    <circle cx="192" cy="127" r="8" fill="white" stroke="#101014" stroke-width="3" />

                    <g class="card-1">
                        <rect x="112" y="186" width="190" height="150" rx="20" fill="#FF6BB5" stroke="#101014" stroke-width="5" />
                        <rect x="132" y="210" width="92" height="14" rx="7" fill="#101014" />
                        <rect x="132" y="242" width="130" height="12" rx="6" fill="white" stroke="#101014" stroke-width="3" />
                        <rect x="132" y="272" width="96" height="12" rx="6" fill="white" stroke="#101014" stroke-width="3" />
                        <rect x="132" y="304" width="118" height="18" rx="9" fill="#FFD84D" stroke="#101014" stroke-width="3" />
                    </g>

                    <g class="card-2">
                        <rect x="330" y="186" width="190" height="150" rx="20" fill="#41F0B4" stroke="#101014" stroke-width="5" />
                        <path d="M360 300 L392 258 L424 282 L466 224" stroke="#101014" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                        <circle cx="466" cy="224" r="13" fill="#FFD84D" stroke="#101014" stroke-width="5" />
                        <rect x="360" y="210" width="82" height="14" rx="7" fill="#101014" />
                    </g>

                    <g class="notif-float">
                        <rect x="430" y="350" width="170" height="72" rx="22" fill="white" stroke="#101014" stroke-width="5" />
                        <circle cx="466" cy="386" r="17" fill="#0A84DC" stroke="#101014" stroke-width="4" />
                        <path d="M458 386l7 7 14-16" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                        <rect x="496" y="372" width="70" height="11" rx="5.5" fill="#101014" />
                        <rect x="496" y="394" width="48" height="9" rx="4.5" fill="#101014" opacity="0.45" />
                    </g>

                    <g class="cursor-move">
                        <path d="M246 376l28 80 18-35 38 28 18-24-39-27 35-18-98-24z" fill="#FFD84D" stroke="#101014" stroke-width="5" stroke-linejoin="round" />
                    </g>
                </svg>
            </div>
        </div>
    </section>
</template>

<style scoped>
.hero-underline {
    z-index: -1;
    animation: underlineGrow 0.75s cubic-bezier(0.2, 1.4, 0.4, 1) 0.45s both;
}
@keyframes underlineGrow {
    from {
        transform: scaleX(0);
        transform-origin: left;
    }
    to {
        transform: scaleX(1);
        transform-origin: left;
    }
}

.card-1 {
    animation: cFloat 6s ease-in-out infinite;
}
.card-2 {
    animation: cFloat 7s ease-in-out infinite;
    animation-delay: -2s;
}
@keyframes cFloat {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-3px);
    }
}

.analytics-card {
    animation: aPulse 6s ease-in-out infinite;
}
@keyframes aPulse {
    0%,
    100% {
        stroke: #e5e7eb;
    }
    50% {
        stroke: #0a84dc20;
    }
}

.notif-float {
    animation: nFloat 5s ease-in-out infinite;
}
@keyframes nFloat {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-4px);
    }
}

.cursor-move {
    animation: cursorAnim 8s ease-in-out infinite;
}
@keyframes cursorAnim {
    0%,
    100% {
        transform: translate(0, 0);
    }
    25% {
        transform: translate(180px, 60px);
    }
    50% {
        transform: translate(240px, 100px);
    }
    75% {
        transform: translate(-60px, 40px);
    }
}
</style>
