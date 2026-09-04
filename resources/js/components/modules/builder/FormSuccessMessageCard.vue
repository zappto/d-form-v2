<script setup lang="ts">
import { ref, watch } from 'vue'
import { Info } from 'lucide-vue-next'
import TipTapEditor from '@/components/modules/dashboard/events/TipTapEditor.vue'

const successContent = defineModel<string>('successContent', { required: true })
const successEnabled = defineModel<boolean>('successEnabled', { required: true })

function hasMeaningfulContent(html: string): boolean {
    if (!html) return false
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim()
    return text !== ''
}

/**
 * Editor TipTap hanya dipasang saat `successEnabled` ON → unmount saat OFF
 * sehingga tidak ada konten basi. `successContent` dikosongkan oleh toggle
 * di composable (Workspace) saat OFF.
 */
const editorMounted = ref(successEnabled.value && hasMeaningfulContent(successContent.value))

watch(
    () => successEnabled.value,
    (on) => {
        editorMounted.value = on
        // OFF dari panel kiri → pastikan tidak ada sisa HTML.
        if (!on && successContent.value !== '') {
            successContent.value = ''
        }
    },
)

// Jaga konsistensi dua arah antara toggle & isi editor:
// - konten terhapus semua saat ON → matikan toggle + bersihkan HTML.
// - konten bermakna hadir dari luar (mis. data tersimpan dimuat belakangan) → nyalakan toggle.
watch(
    () => successContent.value,
    (v) => {
        const meaningful = hasMeaningfulContent(v)
        if (successEnabled.value && !meaningful) {
            successEnabled.value = false
            if (v !== '') successContent.value = ''
        } else if (!successEnabled.value && meaningful) {
            successEnabled.value = true
        }
    },
)
</script>

<template>
    <section class="border-border bg-card rounded-2xl border shadow-sm">
        <div class="flex items-start gap-3 px-5 pt-5 sm:px-7">
            <div
                class="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-xl border border-border/70 shadow-xs"
            >
                <Info class="size-4.5" aria-hidden="true" />
            </div>
            <div>
                <h3 class="font-display text-foreground text-base font-semibold tracking-tight">
                    Pesan setelah submit
                </h3>
                <p class="text-muted-foreground mt-0.5 max-w-xs text-xs leading-snug sm:text-[13px]">
                    Tampilkan ucapan terima kasih, link grup, atau info lain setelah peserta mengirim form.
                </p>
            </div>
        </div>

        <div class="px-5 pt-4 pb-5 sm:px-7 sm:pb-6">
            <Transition
                mode="out-in"
                enter-active-class="transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
            >
                <div v-if="editorMounted && successEnabled" key="on">
                    <TipTapEditor v-model="successContent" />
                    <p class="text-muted-foreground mt-2 text-xs leading-snug">
                        Hanya tersimpan dan ditampilkan saat switch aktif.
                    </p>
                </div>
                <div
                    v-else
                    key="off"
                    class="pointer-events-none flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3.5 opacity-60"
                    aria-disabled="true"
                >
                    <span class="bg-background text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg border border-border/70">
                        <Info class="size-4" aria-hidden="true" />
                    </span>
                    <p class="text-muted-foreground text-xs font-medium">
                        Pesan setelah submit nonaktif — aktifkan switch untuk menulis.
                    </p>
                </div>
            </Transition>
        </div>
    </section>
</template>
