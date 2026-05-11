<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from '@/components/ui/sheet'

const scrolled = ref(false)
const mobileOpen = ref(false)
const currentPath = computed(() => window.location.pathname)

const onScroll = () => {
    scrolled.value = window.scrollY > 10
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const links = [
    { label: 'Beranda', href: '/' },
    { label: 'Fitur', href: '/features' },
    { label: 'Acara', href: '/events' },
    { label: 'Dokumentasi', href: '/docs' },
]
</script>

<template>
    <header
        :class="[
            'fixed inset-x-0 top-0 z-50 transition-all duration-300',
            scrolled
                ? 'border-b border-border/50 bg-background/85 shadow-[0_1px_3px_rgb(0_0_0/0.04)] backdrop-blur-xl'
                : 'bg-transparent',
        ]"
    >
        <div class="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-6 lg:px-10">
            <a href="/" class="group flex items-center gap-2.5">
                <span
                    class="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold leading-none text-primary-foreground transition-transform duration-200 group-hover:scale-105"
                >
                    D
                </span>
                <span class="text-base font-semibold tracking-tight text-foreground">DForm</span>
            </a>

            <nav class="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
                <a
                    v-for="link in links"
                    :key="link.href"
                    :href="link.href"
                    :class="[
                        'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150',
                        currentPath === link.href
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground',
                    ]"
                >
                    {{ link.label }}
                </a>
            </nav>

            <div class="hidden items-center gap-2.5 md:flex">
                <Button as-child variant="ghost" size="sm" class="h-9 rounded-lg px-4 text-sm">
                    <a href="/auth/login">Masuk</a>
                </Button>
                <Button as-child size="sm" class="h-9 rounded-lg px-5 text-sm font-semibold">
                    <a href="/auth/register">Daftar</a>
                </Button>
            </div>

            <Sheet v-model:open="mobileOpen">
                <SheetTrigger as-child>
                    <button
                        type="button"
                        class="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 text-foreground transition-colors hover:bg-muted md:hidden"
                        aria-label="Menu navigasi"
                    >
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" class="text-foreground">
                            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                        </svg>
                    </button>
                </SheetTrigger>
                <SheetContent side="right" class="w-72 p-0">
                    <SheetTitle class="sr-only">Navigasi</SheetTitle>
                    <div class="flex flex-col gap-1 px-6 pt-14">
                        <a
                            v-for="link in links"
                            :key="link.href"
                            :href="link.href"
                            :class="[
                                'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                currentPath === link.href
                                    ? 'bg-primary/8 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            ]"
                            @click="mobileOpen = false"
                        >
                            {{ link.label }}
                        </a>

                        <Separator class="my-5" />

                        <Button as-child variant="outline" class="h-10 w-full rounded-lg text-sm">
                            <a href="/auth/login" @click="mobileOpen = false">Masuk</a>
                        </Button>
                        <Button as-child class="mt-2 h-10 w-full rounded-lg text-sm font-semibold">
                            <a href="/auth/register" @click="mobileOpen = false">Daftar</a>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    </header>
</template>
