<script setup lang="ts">
import FieldEditor from '@/components/modules/builder/FieldEditor.vue';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { BuilderField } from '@/types/formBuilder';
import { computed } from 'vue';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
    field: BuilderField | null;
}>();

defineEmits<{
    updateField: [field: BuilderField];
    done: [];
}>();

const isChoiceType = computed(
    () => props.field != null && ['dropdown', 'checkbox', 'radio'].includes(props.field.type)
);
</script>

<template>
    <Sheet v-model:open="open">
        <SheetContent side="right" class="flex w-full flex-col p-0 sm:max-w-md">
            <SheetHeader class="shrink-0 border-b border-border bg-muted/30 p-5 text-left">
                <SheetTitle class="font-display tracking-[-0.01em]">
                    {{ isChoiceType ? 'Kelola opsi' : 'Pengaturan field' }}
                </SheetTitle>
                <SheetDescription>Customize the selected field.</SheetDescription>
            </SheetHeader>
            <div class="flex-1 overflow-y-auto bg-background px-5 py-5">
                <FieldEditor v-if="field" :field="field" @update:field="$emit('updateField', $event)" />
            </div>
            <div class="shrink-0 border-t border-border bg-muted/30 p-4">
                <Button class="h-11 w-full" @click="$emit('done')">Done</Button>
            </div>
        </SheetContent>
    </Sheet>
</template>
