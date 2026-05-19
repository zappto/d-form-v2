<script setup lang="ts">
import { reactive } from 'vue';
import { Head } from '@inertiajs/vue3';
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/modules/dashboard/PageHeader.vue';
import FormSubmissionsEmptyState from '@/components/modules/dashboard/FormSubmissionsEmptyState.vue';
import FormSubmissionsCardGridView from '@/components/modules/dashboard/FormSubmissionsCardGridView.vue';
import FormSubmissionsPagination from '@/components/modules/dashboard/FormSubmissionsPagination.vue';
import FormSubmissionDetailSheet from '@/components/modules/dashboard/FormSubmissionDetailSheet.vue';
import { Download } from 'lucide-vue-next';
import { useFormSubmissionsPage } from '@/utils/composables/useFormSubmissionsPage';

defineOptions({ layout: DashboardFocusLayout });

const props = defineProps<{
    event: { id: string; title: string };
    form: { id: string; title: string };
    fields: IFormField[];
    submissions: {
        data: IFormSubmission[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links?: { url: string | null; label: string; active: boolean }[];
    };
    exportSubmissionsCsvUrl: string;
}>();

const s = reactive(useFormSubmissionsPage(props));

function onReview(payload: { action: 'accept' | 'reject'; submission: IFormSubmission }) {
    s.submitSubmissionReview(payload.action, payload.submission);
}
</script>

<template>
    <Head :title="`Pengiriman — ${form.title}`" />

    <div class="app-page">
        <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:gap-8">
            <PageHeader
                :title="form.title"
                :subtitle="event.title"
                :back-href="`/admin/dashboard/events/${event.id}/forms/${form.id}`"
            >
                <template #actions>
                    <Button variant="outline" size="sm" class="h-10 w-full gap-2 rounded-xl md:w-auto" as-child>
                        <a :href="exportSubmissionsCsvUrl" class="inline-flex items-center justify-center" download>
                            <Download class="size-4 shrink-0 opacity-90" aria-hidden="true" />
                            Ekspor CSV
                        </a>
                    </Button>
                </template>
            </PageHeader>

            <FormSubmissionsEmptyState v-if="submissions.data.length === 0" />

            <template v-else>
                <FormSubmissionsCardGridView
                    :submissions="submissions.data"
                    :format-date="s.formatDate"
                    @open-detail="s.openDetail"
                />

                <FormSubmissionsPagination
                    :links="submissions.links"
                    :current-page="submissions.current_page"
                    :last-page="submissions.last_page"
                    :total="submissions.total"
                />
            </template>
        </div>
    </div>

    <FormSubmissionDetailSheet
        v-model:open="s.isDetailOpen"
        :submission="s.selectedSubmission"
        :all-answer-keys="s.allAnswerKeys"
        :fields="fields"
        :format-date="s.formatDate"
        :humanize-key="s.humanizeKey"
        :is-submission-reviewing="s.isSubmissionReviewing"
        @review="onReview"
    />
</template>
