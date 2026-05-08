<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Link } from '@inertiajs/vue3'
import { ArrowLeft, Eye } from 'lucide-vue-next'

defineProps<{
    backHref: string
    toolbarSubtitle: string
    headingTitle: string
    isReadyToSave: boolean
    validationIssueCount: number
    isEmpty: boolean
    processing: boolean
    saveLabel: string
}>()

defineEmits<{
    preview: []
    save: []
}>()

const canTeleport = ref(false)

onMounted(() => {
    void nextTick(() => {
        const left = document.getElementById('dashboard-fb-nav-left')
        const right = document.getElementById('dashboard-fb-nav-right')
        if (left && right) canTeleport.value = true
    })
})
</script>

<template>
    <Teleport v-if="canTeleport" to="#dashboard-fb-nav-left">
        <div class="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
            <Button variant="ghost" size="icon-sm" class="mt-0.5 shrink-0 rounded-xl sm:mt-0" as-child>
                <Link :href="backHref" aria-label="Kembali ke daftar form">
                    <ArrowLeft class="size-4" />
                </Link>
            </Button>
            <div class="min-w-0 flex-1">
                <p class="text-muted-foreground text-[11px] font-medium tracking-wide uppercase sm:text-xs">
                    <span class="max-sm:line-clamp-2 max-sm:break-words sm:truncate">
                        {{ toolbarSubtitle }}
                    </span>
                </p>
                <h1 class="text-foreground mt-0.5 max-sm:line-clamp-2 max-sm:break-words text-[15px] font-semibold tracking-tight sm:mt-0 sm:truncate sm:text-base">
                    {{ headingTitle || 'Form tanpa judul' }}
                </h1>
            </div>
        </div>
    </Teleport>

    <Teleport v-if="canTeleport" to="#dashboard-fb-nav-right">
        <!-- Mobile: grid 2 kolom selebar baris; sm+: baris fleksibel seperti biasa -->
        <div
            class="
                flex w-full flex-wrap items-center justify-end gap-2
                max-sm:grid max-sm:grid-cols-2 max-sm:gap-2 max-sm:[&>*]:w-full
                sm:w-auto sm:flex sm:gap-2.5
            "
        >
            <slot name="toolbar-extra" />
            <span
                class="
                    inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase
                    max-sm:w-full max-sm:justify-center
                    sm:px-2.5 sm:text-[11px]
                "
                :class="
                    isReadyToSave
                        ? 'border-success/25 bg-success/10 text-success'
                        : 'border-warning/25 bg-warning/10 text-warning'
                "
                :title="isReadyToSave ? 'Semua validasi terpenuhi' : `${validationIssueCount} hal belum lengkap`"
            >
                <span class="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
                <span class="min-w-0 truncate">
                    {{ isReadyToSave ? 'Siap' : `${validationIssueCount} isu` }}
                </span>
            </span>
            <Button
                variant="outline"
                size="sm"
                class="
                    rounded-full border-border/80 bg-background/90 px-3 text-sm font-medium shadow-sm
                    max-sm:h-11 max-sm:w-full max-sm:rounded-xl
                "
                :disabled="isEmpty"
                aria-label="Pratinjau formulir"
                @click="$emit('preview')"
            >
                <Eye class="size-4 shrink-0 sm:hidden" aria-hidden="true" />
                <span>Pratinjau</span>
            </Button>
            <Button
                size="sm"
                class="
                    rounded-full px-3 text-sm font-medium shadow-sm sm:px-4
                    max-sm:h-11 max-sm:w-full max-sm:rounded-xl
                "
                :disabled="processing"
                @click="$emit('save')"
            >
                <span class="sm:hidden">Simpan</span>
                <span class="hidden sm:inline">{{ saveLabel }}</span>
            </Button>
        </div>
    </Teleport>
</template>
