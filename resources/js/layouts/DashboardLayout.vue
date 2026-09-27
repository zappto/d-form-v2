<script setup lang="ts">
import 'vue-sonner/style.css';
import { watch } from 'vue';
import { usePage } from '@inertiajs/vue3';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import Sidebar from '@/components/layout/Sidebar.vue';
import Topbar from '@/components/layout/Topbar.vue';
import { usePageFlashToast } from '@/hooks/usePageFlashToast';
import { clearTopbar } from '@/hooks/useDashboardTopbar';

usePageFlashToast();

// Reset state topbar saat navigasi Inertia ke halaman lain,
// supaya judul/subtitle halaman sebelumnya tidak bocor.
const page = usePage();
watch(
    () => page.component,
    () => {
        clearTopbar();
    }
);
</script>

<template>
    <SidebarProvider>
        <Sidebar />
        <SidebarInset class="h-svh overflow-x-hidden bg-gradient-to-b from-background via-muted/20 to-background">
            <Topbar />
            <div class="flex-1 overflow-y-auto px-4 pt-6 pb-10 md:px-6 md:pt-8 md:pb-12 lg:px-8">
                <div class="w-full max-w-full">
                    <slot />
                </div>
            </div>
        </SidebarInset>
    </SidebarProvider>
    <Toaster position="top-right" richColors />
</template>
