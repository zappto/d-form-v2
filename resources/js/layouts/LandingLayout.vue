<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue';
import Footer from '@/components/layout/Footer.vue';
</script>

<template>
    <div class="relative min-h-screen bg-background font-sans antialiased">
        <Navbar />
        <main>
            <slot />
        </main>
        <Footer />
    </div>
</template>
