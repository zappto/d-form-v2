<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { router } from '@inertiajs/vue3';
import FormSheet from './FormSheet.vue';
import EmptyState from '@/components/modules/dashboard/EmptyState.vue';
import { Button } from '@/components/ui/button';
import { CometSpinner } from '@/components/ui/comet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { routes } from '@/lib/routes';
import { handleInertiaFormErrors } from '@/lib/error-message';

export interface TIDashboardDivision {
    id: string;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
    interviewer_assignments_count: number;
}

const props = defineProps<{
    open: boolean;
    divisions: TIDashboardDivision[];
}>();

const emit = defineEmits<{ close: [] }>();

const sheetOpen = computed<boolean>({
    get: () => props.open,
    set: (value: boolean) => {
        if (!value) emit('close');
    },
});

const editingId = ref<string | null>(null);
const editName = ref<string>('');
const editIsActive = ref<boolean>(true);
const isSaving = ref<boolean>(false);

watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) {
            editingId.value = null;
            isSaving.value = false;
        }
    }
);

function startEdit(division: TIDashboardDivision): void {
    editingId.value = division.id;
    editName.value = division.name;
    editIsActive.value = division.is_active;
}

function cancelEdit(): void {
    editingId.value = null;
    isSaving.value = false;
}

function saveDivision(division: TIDashboardDivision): void {
    if (isSaving.value || editName.value.trim() === '') return;
    isSaving.value = true;
    router.put(
        routes.admin.recruitment.divisions.update(division.id),
        { name: editName.value.trim(), is_active: editIsActive.value },
        {
            preserveScroll: true,
            onSuccess: () => {
                // Tanpa toast manual: sukses sudah ditampilkan global oleh usePageFlashToast
                // dari flash `toast` server (RecruitmentDivisionController::update).
                editingId.value = null;
            },
            onError: (errors) => {
                handleInertiaFormErrors(errors, { title: 'Gagal memperbarui divisi' });
            },
            onFinish: () => {
                isSaving.value = false;
            },
        }
    );
}
</script>

<template>
    <FormSheet v-model:open="sheetOpen" title="Divisi" description="Daftar divisi open recruitment">
        <template #footer>
            <Button variant="outline" class="w-full" @click="emit('close')">Tutup</Button>
        </template>

        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <div v-for="division in divisions" :key="division.id" class="rounded-xl border border-border/60 p-4">
                <template v-if="editingId === division.id">
                    <form class="space-y-3" @submit.prevent="saveDivision(division)">
                        <div class="space-y-1.5">
                            <Label :for="`division-name-${division.id}`">Nama divisi</Label>
                            <Input :id="`division-name-${division.id}`" v-model="editName" required />
                        </div>
                        <label class="flex items-center gap-2 text-sm">
                            <input v-model="editIsActive" type="checkbox" class="size-4 accent-current" />
                            Aktif
                        </label>
                        <div class="flex gap-2">
                            <Button
                                size="sm"
                                type="submit"
                                :disabled="isSaving || editName.trim() === ''"
                                :aria-busy="isSaving"
                            >
                                <CometSpinner v-if="isSaving" :size="16" />
                                {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
                            </Button>
                            <Button size="sm" variant="ghost" type="button" @click="cancelEdit">Batal</Button>
                        </div>
                    </form>
                </template>
                <template v-else>
                    <p class="font-medium">{{ division.name }}</p>
                    <p class="mt-0.5 font-mono text-xs text-muted-foreground">{{ division.code }}</p>
                    <p class="mt-1 text-sm text-muted-foreground">
                        {{ division.interviewer_assignments_count }} interviewer ·
                        {{ division.is_active ? 'Aktif' : 'Nonaktif' }}
                    </p>
                    <Button size="sm" variant="outline" class="mt-3" @click="startEdit(division)"> Edit </Button>
                </template>
            </div>

            <div v-if="divisions.length === 0" class="px-4 py-10">
                <EmptyState variant="inline" title="Belum ada data divisi." />
            </div>
        </div>
    </FormSheet>
</template>
