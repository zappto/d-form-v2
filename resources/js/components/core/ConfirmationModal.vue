<script setup lang="ts">
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { CometSpinner } from '@/components/ui/comet'

defineProps<{
    open: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    loading?: boolean
}>()

const emit = defineEmits<{
    confirm: []
    cancel: []
    'update:open': [value: boolean]
}>()
</script>

<template>
    <AlertDialog :open="open" @update:open="(v) => emit('update:open', v)">
        <AlertDialogContent class="rounded-2xl">
            <AlertDialogHeader>
                <AlertDialogTitle class="font-display text-xl font-bold tracking-[-0.02em]">{{ title }}</AlertDialogTitle>
                <AlertDialogDescription class="text-sm leading-relaxed text-muted-foreground">{{ description }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter class="gap-2">
                <AlertDialogCancel @click="emit('cancel')">
                    {{ cancelText ?? 'Cancel' }}
                </AlertDialogCancel>
                <AlertDialogAction
                    :class="variant === 'destructive' ? buttonVariants({ variant: 'destructive' }) : ''"
                    :disabled="loading"
                    :aria-busy="loading"
                    @click="emit('confirm')"
                >
                    <CometSpinner v-if="loading" :size="16" />
                    {{ loading ? (variant === 'destructive' ? 'Menghapus...' : 'Menyimpan...') : (confirmText ?? 'Continue') }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
