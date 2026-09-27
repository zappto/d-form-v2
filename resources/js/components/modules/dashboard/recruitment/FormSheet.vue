<script setup lang="ts">
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    FORM_SHEET_FOOTER_CLASS,
    FORM_SHEET_HEADER_CLASS,
    FORM_SHEET_OVERLAY_CLASS,
    formSheetContentClass,
    type TFormSheetSize,
} from './formSheetClasses';

/**
 * Shell sheet recruitment: `Sheet` → `SheetContent` → header/footer opsional.
 * Isi default dirender langsung di dalam `SheetContent` agar call-site mengatur
 * struktur/padding-nya sendiri; perilaku buka/tutup diteruskan apa adanya.
 */

const open = defineModel<boolean>('open');

withDefaults(
    defineProps<{
        title?: string;
        description?: string;
        size?: TFormSheetSize;
    }>(),
    { size: 'default' }
);
</script>

<template>
    <Sheet v-model:open="open">
        <SheetContent side="right" :class="formSheetContentClass(size)" :overlay-class="FORM_SHEET_OVERLAY_CLASS">
            <!-- Slot `#header`: isi header penuh, menggantikan `title`/`description` untuk header dinamis. -->
            <SheetHeader v-if="$slots.header || title || description" :class="FORM_SHEET_HEADER_CLASS">
                <slot name="header">
                    <SheetTitle v-if="title" class="truncate text-base">{{ title }}</SheetTitle>
                    <SheetDescription v-if="description" class="text-muted-foreground truncate text-xs">
                        {{ description }}
                    </SheetDescription>
                </slot>
            </SheetHeader>

            <slot />

            <SheetFooter v-if="$slots.footer" :class="FORM_SHEET_FOOTER_CLASS">
                <slot name="footer" />
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>
