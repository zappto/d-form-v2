<script setup lang="ts">
import FieldEditor from '@/components/modules/builder/FieldEditor.vue';
import type { BuilderField } from '@/types/form-builder';

defineProps<{
    selectedField: BuilderField | null;
}>();

const emit = defineEmits<{
    updateField: [field: BuilderField];
}>();
</script>

<template>
    <aside
        class="border-border bg-card hidden h-full max-h-full min-h-0 w-[340px] shrink-0 flex-col border-l lg:flex"
        aria-label="Inspector panel"
    >
        <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div class="px-5 py-5 pb-8">
                <FieldEditor v-if="selectedField" :field="selectedField" @update:field="emit('updateField', $event)" />
                <div v-else class="flex flex-col justify-center py-16 text-center">
                    <p class="text-foreground text-sm font-medium">Belum ada field dipilih</p>
                    <p class="text-muted-foreground mt-2 px-4 text-sm leading-relaxed">
                        Klik salah satu field di kanvas untuk mengubah properti.
                    </p>
                </div>
            </div>
        </div>
    </aside>
</template>
