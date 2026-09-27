<script lang="ts" setup>
import { Head } from '@inertiajs/vue3';
import AuthLayout from '@/layouts/AuthLayout.vue';
import AuthRegisterForm from '@/components/modules/auth/AuthRegisterForm.vue';
</script>

<template>
    <Head title="Create account" />

    <AuthLayout>
        <AuthRegisterForm />
    </AuthLayout>
</template>
