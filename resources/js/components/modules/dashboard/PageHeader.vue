<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
import { Link } from '@inertiajs/vue3'

defineProps<{
    title: string
    subtitle?: string
    backHref?: string
}>()
</script>

<template>
    <div class="app-surface flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
        <div class="flex min-w-0 items-start gap-3 md:items-center">
            <Button
                v-if="backHref"
                variant="ghost"
                size="icon-sm"
                class="mt-0.5 shrink-0 rounded-lg md:mt-0"
                as-child
            >
                <Link :href="backHref" aria-label="Kembali">
                    <ArrowLeft class="size-4" aria-hidden="true" />
                </Link>
            </Button>
            <div class="min-w-0 flex-1">
                <h1 class="font-display text-xl font-bold tracking-[-0.025em] sm:text-2xl md:text-3xl">
                    {{ title }}
                </h1>
                <p v-if="subtitle" class="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {{ subtitle }}
                </p>
            </div>
        </div>
        <div class="w-full min-w-0 md:w-auto md:shrink-0">
            <slot name="actions" />
        </div>
    </div>
</template>
