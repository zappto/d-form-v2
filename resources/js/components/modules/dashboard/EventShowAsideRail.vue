<script setup lang="ts">
import { ref, computed } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { toast } from 'vue-sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ConfirmationModal from '@/components/core/ConfirmationModal.vue'
import {
    Pencil, Trash2, RotateCcw, Download, QrCode, FileText, Users, FileSpreadsheet, BarChart3, Plus, ChevronDown, ChevronUp,
} from 'lucide-vue-next'
import { edit as editEvent } from '@/actions/App/Http/Controllers/Dashboard/Events/EventController'
import { routes } from '@/lib/routes'
import { handleInertiaFormErrors, humanizeErrorMessage } from '@/lib/error-message'

const props = defineProps<{
    event: IEvent
    forms: { id: string; title: string }[]
    cardShadow: string
    registrationsCsvHref: string
    attendanceCsvHref: string
    /** URL halaman laporan & log kehadiran untuk acara ini. */
    laporanHref?: string | null
}>()

const VISIBLE_LIMIT = 4
const showAllForms = ref(false)
const visibleForms = computed(() => (showAllForms.value ? props.forms : props.forms.slice(0, VISIBLE_LIMIT)))
const hiddenCount = computed(() => Math.max(0, props.forms.length - VISIBLE_LIMIT))

const showDeleteModal = ref(false)
const deleteTarget = ref<{ id: string; title: string } | null>(null)
function startDelete(f: { id: string; title: string }): void {
    deleteTarget.value = f
    showDeleteModal.value = true
}
function confirmDelete(): void {
    if (!deleteTarget.value) return
    router.delete(routes.admin.events.forms.destroy(props.event.id, deleteTarget.value.id), {
        preserveScroll: true,
        onSuccess: () => {
            toast.success(humanizeErrorMessage('Form deleted.'))
            showDeleteModal.value = false
            deleteTarget.value = null
        },
        onError: (errors: Record<string, string>) => handleInertiaFormErrors(errors, { title: 'Gagal menghapus form' }),
    })
}

defineEmits<{
    openArchive: []
    openRestore: []
}>()
</script>

<template>
    <aside class="flex min-w-0 flex-col gap-5 xl:sticky xl:top-20 xl:self-start">
        <Card :class="['rounded-2xl border-border/60', cardShadow]">
            <CardHeader class="pb-3">
                <CardTitle class="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Manage event</CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-2 pt-0">
                <Button class="h-auto min-h-10 w-full justify-start py-2 text-left whitespace-normal" as-child>
                    <Link :href="editEvent.url(event.id)"><Pencil class="mr-2 size-4" />Edit details</Link>
                </Button>
                <Button variant="outline" class="h-auto min-h-10 w-full justify-start py-2 text-left whitespace-normal" as-child>
                    <Link :href="routes.admin.events.scan(event.id)"><QrCode class="mr-2 size-4" />Check-in scanner</Link>
                </Button>
                <Button variant="outline" class="h-auto min-h-10 w-full justify-start py-2 text-left whitespace-normal" as-child>
                    <Link :href="routes.admin.events.registrants(event.id)"><Users class="mr-2 size-4" />Manage registrants</Link>
                </Button>
                <Button
                    v-if="laporanHref"
                    variant="outline"
                    class="h-auto min-h-10 w-full justify-start py-2 text-left whitespace-normal"
                    as-child
                >
                    <Link :href="laporanHref"><BarChart3 class="mr-2 size-4" />Laporan dan log kehadiran</Link>
                </Button>
            </CardContent>
        </Card>

        <Card :class="['rounded-2xl border-border/60', cardShadow]">
            <CardHeader class="pb-3">
                <CardTitle class="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Data</CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-2 pt-0">
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Button variant="outline" size="sm" class="" as-child>
                                <a :href="registrationsCsvHref"><Download class="mr-1.5 size-3.5" />CSV</a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export all form submissions for this event (CSV)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Button variant="outline" size="sm" class="" as-child>
                                <a :href="attendanceCsvHref"><FileSpreadsheet class="mr-1.5 size-3.5" />Attendance</a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export attendance scan log (CSV)</TooltipContent>
                    </Tooltip>
                </div>
            </CardContent>
        </Card>

        <Card :class="['rounded-2xl border-border/60', cardShadow]">
            <CardHeader class="pb-3">
                <div class="flex items-center justify-between">
                    <CardTitle class="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Forms</CardTitle>
                    <span class="text-[11px] font-medium tabular-nums text-muted-foreground">{{ props.forms.length }}</span>
                </div>
            </CardHeader>
            <CardContent class="flex flex-col gap-2 pt-0">
                <!-- Empty state -->
                <div v-if="props.forms.length === 0" class="flex flex-col gap-2">
                    <p class="px-1 text-xs text-muted-foreground">Belum ada form untuk event ini.</p>
                    <Link :href="routes.admin.events.forms.create(props.event.id)"
                        class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
                        <Plus class="size-4" /> Buat form pertama
                    </Link>
                </div>

                <template v-else>
                    <div class="flex flex-col gap-1.5">
                        <div v-for="form in visibleForms" :key="form.id"
                            class="group flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50">
                            <Link :href="routes.admin.events.forms.show(props.event.id, form.id)" class="flex min-w-0 flex-1 items-center gap-2">
                                <FileText class="size-3.5 shrink-0 text-muted-foreground" />
                                <span class="truncate text-xs font-medium text-foreground">{{ form.title }}</span>
                            </Link>
                            <div class="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <Link :href="routes.admin.events.forms.show(props.event.id, form.id)"
                                            class="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                                            :aria-label="`Edit form ${form.title}`">
                                            <Pencil class="size-3.5" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <Button variant="ghost" size="icon" class="size-7 text-muted-foreground hover:bg-background hover:text-destructive"
                                            :aria-label="`Hapus form ${form.title}`" @click="startDelete(form)">
                                            <Trash2 class="size-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Hapus</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <Button v-if="hiddenCount > 0" variant="ghost" size="sm"
                        class="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
                        @click="showAllForms = !showAllForms">
                        <span v-if="!showAllForms">Lihat {{ hiddenCount }} form lainnya</span>
                        <span v-else>Sembunyikan</span>
                        <ChevronDown v-if="!showAllForms" class="ml-1 size-3.5" />
                        <ChevronUp v-else class="ml-1 size-3.5" />
                    </Button>

                    <!-- Dashed CTA -->
                    <Link :href="routes.admin.events.forms.create(props.event.id)"
                        class="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
                        <Plus class="size-3.5" /> Tambah form
                    </Link>
                </template>
            </CardContent>
        </Card>

        <Card :class="['rounded-2xl border-border/60', cardShadow]">
            <CardHeader class="pb-3">
                <CardTitle class="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Lifecycle</CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-2 pt-0">
                <Button
                    v-if="!event.deleted_at"
                    variant="outline"
                    size="sm"
                    class="w-full justify-start border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive"
                    @click="$emit('openArchive')"
                >
                    <Trash2 class="mr-2 size-4" />Archive event
                </Button>
                <Button
                    v-else
                    variant="outline"
                    size="sm"
                    class="w-full justify-start "
                    @click="$emit('openRestore')"
                >
                    <RotateCcw class="mr-2 size-4" />Restore event
                </Button>
                <Separator class="my-1" />
                <p class="px-1 text-[11px] leading-relaxed text-muted-foreground">
                    Archiving hides this event from the public but keeps all registrant data safe. You can restore it anytime.
                </p>
            </CardContent>
        </Card>

        <ConfirmationModal :open="showDeleteModal" title="Hapus Form"
            :description="`Yakin hapus &quot;${deleteTarget?.title}&quot;? Tindakan tidak bisa dibatalkan.`"
            confirm-text="Hapus" variant="destructive" @confirm="confirmDelete" @cancel="showDeleteModal=false" @update:open="showDeleteModal=$event" />
    </aside>
</template>
