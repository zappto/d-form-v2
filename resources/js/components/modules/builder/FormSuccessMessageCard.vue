<script setup lang="ts">
import { computed } from 'vue';
import { MessageSquareCheck } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import TipTapEditor from '@/components/modules/dashboard/events/TipTapEditor.vue';
import { hasMeaningfulHtmlText } from '@/lib/htmlText';

/**
 * Zona konfirmasi "Pesan setelah submit" ala Google Forms — segmen terakhir dari
 * section utama canvas. Bukan card mandiri: tanpa chrome luar, tanpa toggle.
 * Tampil saat `show` aktif (drag item palette) ATAU `successContent` berisi teks
 * bermakna (mis. form tersimpan dimuat kembali). Tombol "Hapus" mengosongkan
 * konten + menyembunyikan zona via emit `remove`.
 */
const successContent = defineModel<string>('successContent', { required: true });

const props = defineProps<{
    show: boolean;
}>();

defineEmits<{
    remove: [];
}>();

const visible = computed(() => props.show || hasMeaningfulHtmlText(successContent.value));
</script>

<template>
    <div v-if="visible" class="border-t border-border/70">
        <div class="flex items-center gap-2 border-b border-border/70 px-5 py-3.5 sm:px-7">
            <MessageSquareCheck class="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 class="text-sm font-semibold tracking-[-0.01em] text-foreground">Pesan setelah submit</h2>
            <div class="ml-auto">
                <Button variant="ghost" size="sm" @click="$emit('remove')">Hapus</Button>
            </div>
        </div>
        <div class="px-4 py-4 sm:px-5 sm:py-5">
            <TipTapEditor v-model="successContent" />
        </div>
    </div>
</template>
