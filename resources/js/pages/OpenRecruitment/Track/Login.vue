<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, Link, useForm, usePage } from '@inertiajs/vue3';
import FormFillLayout from '@/layouts/FormFillLayout.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/routes';
import { readFormError } from '@/lib/formErrors';
import { Eye, EyeOff, Mail } from 'lucide-vue-next';

defineOptions({ layout: FormFillLayout });

const props = defineProps<{
    authenticateUrl: string;
}>();

const page = usePage();
const showToken = ref(false);

const queryParams =
    typeof page.url === 'string' ? new URLSearchParams(page.url.split('?')[1] ?? '') : new URLSearchParams();

const prefilledReg = queryParams.get('reg') ?? '';
const prefilledToken = queryParams.get('token') ?? '';

const form = useForm({
    registration_number: prefilledReg,
    tracking_token: prefilledToken,
});

const credentialsError = computed(() => readFormError(form.errors, 'credentials'));
const trackingError = computed(() => readFormError(form.errors, 'tracking'));

function submit() {
    form.post(props.authenticateUrl, {
        preserveScroll: true,
    });
}
</script>

<template>
    <Head title="Portal OpRec" />

    <div class="mx-auto max-w-md px-2 pb-8">
        <div class="mb-5 space-y-1 text-center">
            <p class="text-xs font-semibold tracking-wide text-primary uppercase">OpenRecruitment DOSCOM</p>
            <h1 class="text-2xl font-bold tracking-tight">Portal pendaftaran</h1>
            <p class="text-sm text-muted-foreground">
                Masuk dengan nomor pendaftaran dan token 8 karakter dari email konfirmasi.
            </p>
        </div>

        <Card class="rounded-2xl border-border/70">
            <CardContent class="p-5">
                <form class="space-y-4" @submit.prevent="submit">
                    <p v-if="credentialsError" class="text-sm text-destructive">
                        {{ credentialsError }}
                    </p>
                    <p v-if="trackingError" class="text-sm text-destructive">
                        {{ trackingError }}
                    </p>

                    <div class="space-y-2">
                        <Label for="registration_number">Nomor pendaftaran</Label>
                        <Input
                            id="registration_number"
                            v-model="form.registration_number"
                            placeholder="OPREC-2026-00001"
                            autocomplete="off"
                            class="font-mono"
                            required
                        />
                    </div>

                    <div class="space-y-2">
                        <Label for="tracking_token">Token tracking</Label>
                        <div class="relative">
                            <Input
                                id="tracking_token"
                                v-model="form.tracking_token"
                                :type="showToken ? 'text' : 'password'"
                                autocomplete="off"
                                class="pr-10 font-mono text-sm"
                                required
                            />
                            <button
                                type="button"
                                class="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                :aria-label="showToken ? 'Sembunyikan token' : 'Tampilkan token'"
                                @click="showToken = !showToken"
                            >
                                <EyeOff v-if="showToken" class="size-4" />
                                <Eye v-else class="size-4" />
                            </button>
                        </div>
                    </div>

                    <div class="flex gap-2 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed">
                        <Mail class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <p class="text-muted-foreground">
                            Token ada di email <strong class="text-foreground">Konfirmasi pendaftaran OpRec</strong>.
                            Salin-tempel untuk menghindari typo.
                        </p>
                    </div>

                    <Button type="submit" class="w-full" :disabled="form.processing">
                        {{ form.processing ? 'Memverifikasi...' : 'Masuk portal' }}
                    </Button>
                </form>
            </CardContent>
        </Card>

        <div class="mt-4 flex flex-col items-center gap-2 text-center text-sm">
            <Link :href="routes.recruitment.landing" class="text-primary underline-offset-2 hover:underline">
                Belum daftar? Isi formulir
            </Link>
        </div>
    </div>
</template>
