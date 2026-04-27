<script setup lang="ts">
import 'vue-sonner/style.css';
import AuthIllustration from '@/components/modules/auth/AuthIllustration.vue';
import AuthOAuthButtons from '@/components/modules/auth/AuthOAuthButtons.vue';
import { Toaster } from '@/components/ui/sonner';
</script>

<template>
    <div class="grid min-h-dvh w-full grid-cols-1 bg-background lg:grid-cols-2">
        <!-- Left: Illustration -->
        <AuthIllustration />

        <!-- Right: Auth Forms -->
        <div class="flex min-h-dvh flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-12">
            <div class="brutal-card w-full max-w-md bg-white p-7 sm:p-8">
                <!-- Logo -->
                <a href="/" class="group mb-10 flex items-center gap-2.5">
                    <div
                        class="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#101014] bg-[#0A84DC] shadow-[4px_4px_0_#101014] transition-transform group-hover:-rotate-6"
                    >
                        <svg
                            width="22"
                            height="22"
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
                    <span class="font-display text-3xl font-extrabold tracking-tight text-[#111827]">
                        D<span class="text-[#0A84DC]">Form</span>
                    </span>
                </a>

                <!-- Forms -->
                <slot></slot>

                <!-- OAuth -->
                <AuthOAuthButtons />

                <!-- Mobile footer -->
                <p class="mt-10 text-center text-xs font-bold uppercase tracking-[0.14em] text-[#6B7280] lg:hidden">
                    Created by Dinus Open Source Community
                </p>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <Toaster position="top-right" richColors />
</template>
