<script setup lang="ts">
import { reactive } from 'vue';
import { Head } from '@inertiajs/vue3';
import DashboardFocusLayout from '@/layouts/DashboardFocusLayout.vue';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KpiCard from '@/components/modules/dashboard/KpiCard.vue';
import PageHeader from '@/components/modules/dashboard/PageHeader.vue';
import FormSubmissionsEmptyState from '@/components/modules/dashboard/FormSubmissionsEmptyState.vue';
import FormSubmissionsTableView from '@/components/modules/dashboard/FormSubmissionsTableView.vue';
import FormSubmissionsCardGridView from '@/components/modules/dashboard/FormSubmissionsCardGridView.vue';
import FormSubmissionsPagination from '@/components/modules/dashboard/FormSubmissionsPagination.vue';
import FormSubmissionDetailSheet from '@/components/modules/dashboard/FormSubmissionDetailSheet.vue';
import { LayoutGrid, List, Download, Users, CalendarClock, ListChecks } from 'lucide-vue-next';
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
}>();

const s = reactive(useFormSubmissionsPage(props));

function onReview(payload: { action: 'accept' | 'reject'; submission: IFormSubmission }) {
    s.submitSubmissionReview(payload.action, payload.submission);
}
</script>

<template>
    <Head :title="`Pengiriman — ${form.title}`" />

    <div class="app-page">
        <div class="flex flex-col gap-8">
            <PageHeader
                :title="`Pengiriman formulir`"
                :subtitle="`${event.title} · ${form.title}`"
                :back-href="`/dashboard/events/${event.id}/forms/${form.id}`"
            >
                <template #actions>
                    <div
                        class="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap md:items-center md:gap-2.5 max-md:[&>*]:min-w-0"
                    >
                        <Tabs
                            v-model="s.viewType"
                            class="col-span-2 w-full md:col-span-1 md:w-auto"
                            aria-label="Mode tampilan daftar"
                        >
                            <TabsList
                                class="border-border bg-muted/40 md:bg-muted/40 grid h-auto w-full grid-cols-2 gap-1.5 rounded-xl border p-1.5 md:inline-flex md:h-10 md:w-auto md:gap-1 md:border-0 md:p-1"
                            >
                                <TabsTrigger
                                    value="table"
                                    class="data-[state=active]:bg-card h-11 w-full justify-center gap-1.5 rounded-lg data-[state=active]:shadow-sm md:h-9 md:w-auto md:px-3"
                                >
                                    <List class="size-3.5 shrink-0" />
                                    Tabel
                                </TabsTrigger>
                                <TabsTrigger
                                    value="form"
                                    class="data-[state=active]:bg-card h-11 w-full justify-center gap-1.5 rounded-lg data-[state=active]:shadow-sm md:h-9 md:w-auto md:px-3"
                                >
                                    <LayoutGrid class="size-3.5 shrink-0" />
                                    Kartu
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button
                            variant="outline"
                            size="sm"
                            class="col-span-2 h-11 w-full justify-center rounded-xl md:h-9 md:w-auto md:rounded-md"
                        >
                            <Download class="mr-1.5 size-4 shrink-0" />
                            Ekspor
                        </Button>
                    </div>
                </template>
            </PageHeader>

            <div v-if="submissions.total > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard label="Total pengiriman" :value="submissions.total" :icon="Users" color="primary" />
                <KpiCard
                    label="Pengiriman terbaru (halaman ini)"
                    :value="s.latestSubmissionDate"
                    :icon="CalendarClock"
                    color="success"
                />
                <KpiCard
                    label="Menunggu review (halaman ini)"
                    :value="s.pendingReviewCount"
                    :icon="ListChecks"
                    color="warning"
                />
            </div>
            <p v-if="submissions.total > 0 && submissions.last_page > 1" class="text-muted-foreground -mt-4 text-xs">
                Angka &quot;menunggu review&quot; hanya menghitung baris di halaman saat ini. Gunakan navigasi di bawah
                untuk halaman lain.
            </p>

            <FormSubmissionsEmptyState v-if="submissions.data.length === 0" />

            <template v-else>
                <FormSubmissionsTableView
                    v-if="s.viewType === 'table'"
                    :submissions="submissions.data"
                    :answer-keys="s.answerKeys"
                    :format-date="s.formatDate"
                    :humanize-key="s.humanizeKey"
                    :answer-preview="s.answerPreview"
                    :file-url="s.fileUrl"
                    :is-submission-reviewing="s.isSubmissionReviewing"
                    @open-detail="s.openDetail"
                    @review="onReview"
                />

                <FormSubmissionsCardGridView
                    v-else
                    :submissions="submissions.data"
                    :answer-keys="s.answerKeys"
                    :format-date="s.formatDate"
                    :humanize-key="s.humanizeKey"
                    :answer-preview="s.answerPreview"
                    :file-url="s.fileUrl"
                    :is-submission-reviewing="s.isSubmissionReviewing"
                    @open-detail="s.openDetail"
                    @review="onReview"
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
        :format-date="s.formatDate"
        :humanize-key="s.humanizeKey"
        :answer-preview="s.answerPreview"
        :file-url="s.fileUrl"
        :is-submission-reviewing="s.isSubmissionReviewing"
        @review="onReview"
    />
</template>
