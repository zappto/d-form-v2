<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import FormFillLayout from '@/layouts/FormFillLayout.vue';
import OpRecFeedbackForm from '@/components/modules/open-recruitment/OpRecFeedbackForm.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

defineOptions({ layout: FormFillLayout });

defineProps<{
    application: { full_name: string; registration_number: string } | undefined;
    storeUrl: string;
    dashboardUrl: string;
}>();
</script>

<template>
    <Head title="Feedback OpRec" />

    <div class="mx-auto max-w-lg space-y-4 px-2 py-6">
        <div class="text-center">
            <h1 class="text-xl font-semibold">Feedback OpRec</h1>
            <p v-if="application" class="fade-up mt-1 text-sm text-muted-foreground">
                {{ application.full_name }} · {{ application.registration_number }}
            </p>
            <div v-else aria-busy="true" aria-label="Memuat feedback" class="mt-1 flex flex-col items-center gap-1.5">
                <Skeleton class="h-4 w-48" />
            </div>
        </div>

        <Card class="rounded-2xl border-border/70">
            <CardHeader class="pb-2">
                <CardTitle class="text-base">Bagaimana pengalamanmu?</CardTitle>
            </CardHeader>
            <CardContent>
                <OpRecFeedbackForm :store-url="storeUrl" />
                <Button as-child variant="link" class="mt-2 h-auto p-0 text-sm">
                    <Link :href="dashboardUrl">← Kembali ke portal</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
</template>
