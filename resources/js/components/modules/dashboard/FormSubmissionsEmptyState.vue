<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'
</script>

<template>
    <div class="app-surface-soft flex flex-col items-center justify-center py-24 text-center">
        <div class="grid size-16 place-items-center rounded-2xl border border-border bg-card shadow-xs">
            <Inbox class="size-7 text-muted-foreground" />
        </div>
        <h3 class="font-display mt-6 text-xl font-bold tracking-[-0.02em] text-foreground">Belum ada pengiriman</h3>
        <p class="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Saat ada yang mengisi dan mengirim formulir ini, daftar jawaban akan muncul di sini. Anda bisa meninjau status,
            membuka detail, dan memutuskan diterima atau ditolak jika formulir memakai review.
        </p>
    </div>
</template>
