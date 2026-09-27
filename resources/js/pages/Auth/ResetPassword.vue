<script lang="ts" setup>
import { Head } from '@inertiajs/vue3';
import AuthLayout from '@/layouts/AuthLayout.vue';
import AuthResetPasswordForm from '@/components/modules/auth/AuthResetPasswordForm.vue';

defineProps<{
    token: string;
    email: string;
}>();
</script>

<template>
    <Head title="Choose a new password" />

    <AuthLayout>
        <AuthResetPasswordForm :token="token" :email="email" />
    </AuthLayout>
</template>
