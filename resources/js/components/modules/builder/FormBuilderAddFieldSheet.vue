<script setup lang="ts">
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Search, Plus } from 'lucide-vue-next';
import type {
    FormBuilderPaletteCategory,
    FormBuilderPaletteField,
} from '@/components/modules/builder/formBuilderPalette';

const open = defineModel<boolean>('open', { required: true });
const searchQuery = defineModel<string>('searchQuery', { required: true });

defineProps<{
    categories: FormBuilderPaletteCategory[];
}>();

defineEmits<{
    pickField: [template: FormBuilderPaletteField];
}>();
</script>

<template>
    <Sheet v-model:open="open">
        <SheetContent side="bottom" class="flex max-h-[88vh] flex-col rounded-t-2xl border-t border-border p-0">
            <SheetHeader class="shrink-0 space-y-1 border-b border-border px-5 py-4 text-left">
                <SheetTitle class="flex items-center gap-2 font-display text-base font-bold tracking-[-0.015em]">
                    <Plus class="size-4 text-primary" />
                    Add a field
                </SheetTitle>
                <SheetDescription class="text-xs"
                    >Tap any block to insert it at the bottom of your form.</SheetDescription
                >
            </SheetHeader>
            <div class="border-b border-border bg-card px-5 py-3">
                <div class="relative">
                    <Search
                        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search components..."
                        class="w-full rounded-lg border border-border bg-card py-2.5 pr-3 pl-9 text-sm text-foreground shadow-xs transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none"
                    />
                </div>
            </div>
            <div class="flex-1 space-y-5 overflow-y-auto bg-background px-5 py-5">
                <section v-for="cat in categories" :key="cat.name">
                    <div
                        class="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
                    >
                        <component :is="cat.icon" class="size-3.5" />
                        {{ cat.name }}
                    </div>
                    <div class="grid grid-cols-2 gap-2.5">
                        <button
                            v-for="f in cat.fields"
                            :key="f.type"
                            type="button"
                            class="group flex flex-col items-start gap-2 border border-border bg-card p-3.5 text-left shadow-xs transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/30"
                            @click="$emit('pickField', f)"
                        >
                            <div
                                class="grid size-9 place-items-center rounded-full border border-primary/15 bg-primary/8 text-primary transition-colors group-hover:border-primary/30 group-hover:bg-primary/12"
                            >
                                <component :is="f.icon" class="size-4" />
                            </div>
                            <div class="min-w-0">
                                <p class="truncate text-[13px] font-semibold text-foreground">{{ f.label }}</p>
                                <p class="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                                    {{ f.description }}
                                </p>
                            </div>
                        </button>
                    </div>
                </section>
                <div v-if="categories.length === 0" class="flex flex-col items-center py-10 text-center">
                    <Search class="mb-2 size-9 text-muted-foreground/50" />
                    <p class="text-sm font-medium text-muted-foreground">No components match "{{ searchQuery }}"</p>
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>
