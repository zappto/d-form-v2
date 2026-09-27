<script lang="ts" setup>
import { Head } from '@inertiajs/vue3';
import AuthLayout from '@/layouts/AuthLayout.vue';
import AuthLoginForm from '@/components/modules/auth/AuthLoginForm.vue';
</script>

<template>
    <Head title="Welcome back" />

    <AuthLayout>
        <AuthLoginForm />
    </AuthLayout>
</template>
