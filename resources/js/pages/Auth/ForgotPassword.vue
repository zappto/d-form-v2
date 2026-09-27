<script lang="ts" setup>
import { Head } from '@inertiajs/vue3';
import AuthLayout from '@/layouts/AuthLayout.vue';
import AuthForgotPasswordForm from '@/components/modules/auth/AuthForgotPasswordForm.vue';
</script>

<template>
    <Head title="Reset password" />

    <AuthLayout>
        <AuthForgotPasswordForm />
    </AuthLayout>
</template>
