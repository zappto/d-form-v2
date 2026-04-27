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
    <div class="brutal-card brutal-noise flex flex-wrap items-center justify-between gap-4 bg-white p-5">
        <div class="flex items-center gap-3">
            <Button v-if="backHref" variant="ghost" size="icon" class="size-8 rounded-lg" as-child>
                <Link :href="backHref"><ArrowLeft class="size-4" /></Link>
            </Button>
            <div>
                <h1 class="font-display text-3xl font-extrabold tracking-[-0.04em]">{{ title }}</h1>
                <p v-if="subtitle" class="mt-1 text-sm font-semibold text-muted-foreground">{{ subtitle }}</p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <slot name="actions" />
        </div>
    </div>
</template>
