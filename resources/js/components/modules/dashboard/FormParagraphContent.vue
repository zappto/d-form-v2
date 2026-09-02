<script setup lang="ts">
import { computed } from 'vue'
import { formatParagraphContentToHtml } from '@/lib/formParagraphContent'
import { cn } from '@/lib/utils'

const props = defineProps<{
    content?: string | null
    fallback?: string
    class?: string
}>()

const html = computed(() => {
    const source = (props.content ?? '').trim() || (props.fallback ?? '').trim()
    return formatParagraphContentToHtml(source)
})
</script>

<template>
    <div
        :class="
 cn(
 'text-sm leading-relaxed text-muted-foreground [&_a]:break-all',
 props.class,
 )
 "
        v-html="html"
    />
</template>
