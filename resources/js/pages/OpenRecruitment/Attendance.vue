<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3'
import FormFillLayout from '@/layouts/FormFillLayout.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { routes } from '@/lib/routes'
import { QrCode } from 'lucide-vue-next'

defineOptions({ layout: FormFillLayout })

defineProps<{
    trackingLoginUrl: string | undefined
}>()
</script>

<template>
    <Head title="Absensi Interview OpRec" />

    <div class="mx-auto max-w-lg px-2">
        <div v-if="!trackingLoginUrl" aria-busy="true" aria-label="Memuat absensi">
            <div class="mb-6 space-y-2 text-center">
                <Skeleton class="mx-auto h-3 w-48" />
                <Skeleton class="mx-auto h-8 w-2/3" />
                <Skeleton class="mx-auto h-4 w-3/4" />
            </div>

            <div class="rounded-2xl border border-border/70 bg-card">
                <div class="flex items-center gap-2 px-5 pt-5">
                    <Skeleton class="size-5 shrink-0" />
                    <Skeleton class="h-5 w-32" />
                </div>
                <div class="space-y-4 p-5 text-sm">
                    <ol class="space-y-2 pl-5">
                        <li v-for="n in 3" :key="`langkah-${n}`" class="attendance-step-skeleton">
                            <Skeleton class="h-4 w-full" />
                        </li>
                        <li aria-hidden="true"><Skeleton class="h-4 w-2/3" /></li>
                    </ol>

                    <Skeleton class="h-16 w-full rounded-xl" />

                    <Skeleton class="h-10 w-full" />
                </div>
            </div>
        </div>
        <template v-else>
        <div class="mb-6 space-y-2 text-center">
            <p class="text-primary text-xs font-semibold tracking-wide uppercase">OpenRecruitment DOSCOM</p>
            <h1 class="text-2xl font-bold tracking-tight">Absensi interview</h1>
            <p class="text-muted-foreground text-sm">
                Absensi dilakukan oleh panitia di lokasi interview.
            </p>
        </div>

        <Card class="fade-up rounded-2xl border-border/70">
            <CardHeader>
                <CardTitle class="flex items-center gap-2 text-lg">
                    <QrCode class="size-5" />
                    Cara absensi
                </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4 text-sm">
                <ol class="text-muted-foreground list-decimal space-y-2 pl-5">
                    <li>Login ke halaman tracking pendaftaran kamu.</li>
                    <li>Tunjukkan QR code absensi interview kepada panitia.</li>
                    <li>Panitia akan memindai QR code melalui scanner admin.</li>
                    <li>Nomor antrean akan muncul di tracking setelah check-in berhasil.</li>
                </ol>

                <p class="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-amber-900">
                    Applicant tidak dapat melakukan check-in sendiri. Semua absensi harus melalui panitia.
                </p>

                <Button as-child class="w-full">
                    <Link :href="trackingLoginUrl">Buka tracking &amp; QR code</Link>
                </Button>
            </CardContent>
        </Card>
        </template>

        <p class="text-muted-foreground mt-6 text-center text-xs">
            <Link :href="routes.recruitment.landing" class="text-primary underline-offset-4 hover:underline">
                Kembali ke landing OpRec
            </Link>
        </p>
    </div>
</template>
