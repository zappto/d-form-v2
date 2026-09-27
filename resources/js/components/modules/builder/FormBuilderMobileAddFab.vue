<script setup lang="ts">
import { Plus } from 'lucide-vue-next';

defineEmits<{
    click: [];
}>();
</script>

<template>
    <button
        type="button"
        class="fixed right-5 bottom-6 z-40 inline-flex size-14 items-center justify-center bg-primary text-primary-foreground shadow-sm transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/92 lg:hidden"
        aria-label="Add field"
        @click="$emit('click')"
    >
        <Plus class="size-6" />
    </button>
</template>
