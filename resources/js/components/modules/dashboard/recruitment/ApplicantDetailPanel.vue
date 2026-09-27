<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePage } from '@inertiajs/vue3';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ApplicantDetailContent from './ApplicantDetailContent.vue';
import type { IApplicationDetail } from '@/types/recruitment';
import FormSheet from './FormSheet.vue';
import { applicantAllowsTrackingResend, userAllowsTrackingResend } from '@/lib/recruitmentApplicantCapabilities';
import useAuth from '@/hooks/useAuth';
import { CheckCircle2, Mail, Trophy, XCircle } from 'lucide-vue-next';

const props = withDefaults(
    defineProps<{
        application: IApplicationDetail | null;
        loading: boolean;
        reasonOptions?: { value: string; label: string }[];
        divisionOptions?: { id: string; name: string; code: string }[];
        membershipTypeOptions?: { value: string; label: string }[];
        editable?: boolean;
    }>(),
    {
        reasonOptions: () => [],
        divisionOptions: () => [],
        membershipTypeOptions: () => [],
        editable: false,
    }
);

const emit = defineEmits<{ close: []; submitted: [] }>();

const page = usePage();
const user = useAuth(page.props);
const canScreen = computed(
    () => (props.application?.can_screen ?? false) && user.value?.can_screen_recruitment_applications === true
);
const canVerify = computed(
    () => (props.application?.can_verify ?? false) && user.value?.can_screen_recruitment_applications === true
);
const canDecideFinal = computed(
    () => (props.application?.can_decide_final ?? false) && user.value?.can_decide_recruitment_final === true
);
const canResendTracking = computed(() => {
    const application = props.application;
    if (!application) {
        return false;
    }

    return applicantAllowsTrackingResend(application) && userAllowsTrackingResend(user.value);
});

const contentRef = ref<InstanceType<typeof ApplicantDetailContent> | null>(null);

const sheetOpen = computed<boolean>({
    get: () => props.application !== null,
    set: (value: boolean) => {
        if (!value) emit('close');
    },
});

function openScreening(action: 'revision' | 'reject') {
    contentRef.value?.openScreeningModal(action);
}

function openFinal(action: 'accept' | 'reject') {
    contentRef.value?.openFinalModal(action);
}

function verifyRegistration() {
    contentRef.value?.verifyApplication();
}

function passScreening() {
    contentRef.value?.passApplication();
}

function resendTracking() {
    contentRef.value?.requestResendTracking();
}

function handleSubmitted() {
    emit('submitted');
    emit('close');
}
</script>

<template>
    <FormSheet v-model:open="sheetOpen" size="wide">
        <template #header>
            <SheetTitle class="truncate text-base">
                <Skeleton v-if="application && loading" class="h-5 w-2/3" />
                <template v-else>{{ application?.full_name ?? 'Detail peserta' }}</template>
            </SheetTitle>
            <SheetDescription class="truncate text-xs text-muted-foreground">
                <Skeleton v-if="application && loading" class="h-3 w-1/2" />
                <template v-else>{{ application?.registration_number }} · {{ application?.nim }}</template>
            </SheetDescription>
            <div v-if="application && !loading" class="flex flex-wrap items-center justify-between gap-2 pt-1.5">
                <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{{ application.stage_label }}</Badge>
                    <Badge variant="outline">{{ application.result_label }}</Badge>
                </div>
                <div v-if="editable" class="flex flex-wrap items-center gap-2">
                    <Button v-if="canResendTracking" size="sm" variant="outline" @click="resendTracking">
                        <Mail class="mr-2 size-4" />
                        Kirim ulang tracking
                    </Button>
                    <Button v-if="canVerify" size="sm" variant="secondary" @click="verifyRegistration">
                        Verifikasi
                    </Button>
                    <Button v-if="canDecideFinal" size="sm" variant="destructive" @click="openFinal('reject')">
                        <XCircle class="mr-2 size-4" />
                        Tolak final
                    </Button>
                    <Button v-if="canDecideFinal" size="sm" @click="openFinal('accept')">
                        <Trophy class="mr-2 size-4" />
                        Terima
                    </Button>
                    <Button v-if="canScreen" size="sm" variant="outline" @click="openScreening('revision')">
                        Revisi
                    </Button>
                    <Button v-if="canScreen" size="sm" variant="destructive" @click="openScreening('reject')">
                        <XCircle class="mr-2 size-4" />
                        Tolak
                    </Button>
                    <Button v-if="canScreen" size="sm" @click="passScreening">
                        <CheckCircle2 class="mr-2 size-4" />
                        Lolos
                    </Button>
                </div>
            </div>
        </template>

        <div
            v-if="application && !loading"
            :aria-busy="loading"
            class="fade-up min-h-0 flex-1 overflow-y-auto p-4 transition-opacity"
        >
            <ApplicantDetailContent
                ref="contentRef"
                :key="application.id"
                :application="application"
                :readonly="!editable"
                :screening-reason-options="reasonOptions"
                :division-options="divisionOptions"
                :membership-type-options="membershipTypeOptions"
                :hide-revision-action="true"
                :hide-actions="true"
                @submitted="handleSubmitted"
            />
        </div>
        <div
            v-else-if="application && loading"
            aria-busy="true"
            aria-label="Memuat detail aplikan"
            class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
        >
            <div class="flex items-center gap-3">
                <Skeleton class="size-12 shrink-0 rounded-full" />
                <div class="min-w-0 flex-1 space-y-2">
                    <Skeleton class="h-5 w-2/3" />
                    <Skeleton class="h-3 w-1/2" />
                </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-2">
                    <Skeleton class="h-3 w-1/3" />
                    <Skeleton class="h-4 w-full" />
                </div>
                <div class="space-y-2">
                    <Skeleton class="h-3 w-1/3" />
                    <Skeleton class="h-4 w-full" />
                </div>
            </div>
            <div class="space-y-2">
                <Skeleton class="h-3 w-full" />
                <Skeleton class="h-3 w-5/6" />
                <Skeleton class="h-3 w-2/3" />
            </div>
            <div class="flex flex-wrap gap-2">
                <Skeleton class="h-9 w-24" />
                <Skeleton class="h-9 w-24" />
            </div>
        </div>
    </FormSheet>
</template>
