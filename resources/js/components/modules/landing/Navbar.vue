<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const scrolled = ref(false);
const mobileMenuOpen = ref(false);

const currentPath = computed(() => window.location.pathname);

const handleScroll = () => {
    scrolled.value = window.scrollY > 20;
};

onMounted(() => window.addEventListener('scroll', handleScroll));
onUnmounted(() => window.removeEventListener('scroll', handleScroll));

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Event', href: '/events' },
    { label: 'Docs', href: '/docs' },
];
</script>

<template>
    <nav
        :class="[
            'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
            scrolled
                ? 'border-b-2 border-[#101014] bg-white/95 shadow-[0_6px_0_rgba(16,16,20,0.9)] backdrop-blur-md'
                : 'bg-white/80 backdrop-blur-sm',
        ]"
    >
        <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <!-- Logo -->
            <a href="/" class="group flex items-center gap-2.5">
                <div
                    class="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#101014] bg-[#0A84DC] text-white shadow-[4px_4px_0_#101014] transition-transform group-hover:-rotate-6"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                        <path d="M14 2v6h6" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                        <path d="M10 9H8" />
                    </svg>
                </div>
                <span class="font-display text-2xl font-extrabold tracking-tight text-[#101014]">
                    D<span class="text-[#0A84DC]">Form</span>
                </span>
            </a>

            <!-- Desktop Nav -->
            <div class="hidden items-center gap-1 md:flex">
                <a
                    v-for="link in navLinks"
                    :key="link.href"
                    :href="link.href"
                    :class="[
                        'rounded-xl border-2 px-4 py-2 text-sm font-extrabold transition-all duration-150',
                        currentPath === link.href
                            ? 'border-[#101014] bg-[#FFD84D] text-[#101014] shadow-[3px_3px_0_#101014]'
                            : 'border-transparent text-[#101014] hover:border-[#101014] hover:bg-[#41F0B4] hover:shadow-[3px_3px_0_#101014]',
                    ]"
                >
                    {{ link.label }}
                </a>
            </div>

            <!-- CTA -->
            <div class="hidden items-center gap-3 md:flex">
                <a
                    href="/auth/login"
                    class="rounded-xl border-2 border-transparent px-4 py-2 text-sm font-extrabold text-[#101014] transition-all hover:border-[#101014] hover:bg-white hover:shadow-[3px_3px_0_#101014]"
                >
                    Sign In
                </a>
                <a
                    href="/auth/register"
                    class="rounded-xl border-2 border-[#101014] bg-[#0A84DC] px-5 py-2.5 text-sm font-extrabold text-white shadow-[4px_4px_0_#101014] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#FFD84D] hover:text-[#101014] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_#101014]"
                >
                    Get Started
                </a>
            </div>

            <!-- Mobile menu button -->
            <button
                class="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#101014] bg-white shadow-[3px_3px_0_#101014] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none md:hidden"
                @click="mobileMenuOpen = !mobileMenuOpen"
            >
                <svg
                    v-if="!mobileMenuOpen"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <svg
                    v-else
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>

        <!-- Mobile menu -->
        <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
        >
            <div v-if="mobileMenuOpen" class="border-t-2 border-[#101014] bg-white px-6 py-4 shadow-[0_8px_0_#101014] md:hidden">
                <div class="flex flex-col gap-1">
                    <a
                        v-for="link in navLinks"
                        :key="link.href"
                        :href="link.href"
                        :class="[
                            'rounded-xl border-2 px-3 py-2.5 text-sm font-extrabold transition-all',
                            currentPath === link.href
                                ? 'border-[#101014] bg-[#FFD84D] text-[#101014]'
                                : 'border-transparent text-[#101014] hover:border-[#101014] hover:bg-[#41F0B4]',
                        ]"
                        @click="mobileMenuOpen = false"
                    >
                        {{ link.label }}
                    </a>
                    <hr class="my-2 border-[#101014]" />
                    <a href="/auth" class="rounded-xl border-2 border-[#101014] px-3 py-2.5 text-sm font-extrabold text-[#111827]"
                        >Sign In</a
                    >
                    <a
                        href="/auth"
                        class="mt-1 rounded-xl border-2 border-[#101014] bg-[#0A84DC] px-3 py-2.5 text-center text-sm font-extrabold text-white shadow-[3px_3px_0_#101014]"
                        >Get Started</a
                    >
                </div>
            </div>
        </transition>
    </nav>
</template>
