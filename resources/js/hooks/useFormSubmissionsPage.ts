import { computed, ref } from 'vue';
import { router } from '@inertiajs/vue3';
import { toast } from 'vue-sonner';
import { parseApiErrorMessage, showErrorToast, showHttpErrorToast } from '@/lib/error-message';
import { answerPreview, formatSubmissionDate, humanizeSubmissionKey, submissionFileUrl } from '@/lib/formSubmissionsUi';
import { sendFormAnswerReview } from '@/lib/inertiaRequest';
import type { IPaginator } from '@/lib/pagination';
import type { TFormFillAnswerValue } from '@/types/form';
import FormAnswerReviewController from '@/actions/App/Http/Controllers/Dashboard/Events/Forms/FormAnswerReviewController';

/** Halaman submission (atau grup bundle) dari server. */
type TSubmissionPaginator = IPaginator<IFormSubmission>;
type TBundleGroupPaginator = IPaginator<IBundleSubmissionGroup>;

function submissionRows(paginator: TSubmissionPaginator | undefined): IFormSubmission[] {
    return paginator?.data ?? [];
}

function bundleGroupRows(paginator: TBundleGroupPaginator | undefined): IBundleSubmissionGroup[] {
    return paginator?.data ?? [];
}

/** Daftar submission (atau grup bundle), detail terpilih, dan aksi review halaman submission dashboard. */
export function useFormSubmissionsPage(props: {
    event: { id: string; title: string };
    form: { id: string; title: string; registration_mode?: 'single' | 'bundle' | 'team' };
    fields?: IFormField[];
    submissions?: TSubmissionPaginator;
    bundleGroups?: TBundleGroupPaginator;
}) {
    const formFields = computed(() => props.fields ?? []);
    const selectedSubmission = ref<IFormSubmission | null>(null);
    const isDetailOpen = ref(false);
    const selectedGroup = ref<IBundleSubmissionGroup | null>(null);
    const isGroupDetailOpen = ref(false);
    const reviewingIds = ref<Set<string>>(new Set());

    const activeBundleGroup = computed(() => {
        const rows = bundleGroupRows(props.bundleGroups);
        if (rows.length === 0) {
            return null;
        }

        if (!selectedGroup.value) {
            return rows[0];
        }

        return rows.find((g) => g.group_token === selectedGroup.value?.group_token) ?? rows[0];
    });

    const fieldLabelMap = computed(() => {
        const map: Record<string, string> = {};
        formFields.value.forEach((field) => {
            map[field.name] = field.label;
        });
        return map;
    });

    const answerKeys = computed(() => {
        const keysFromFields = formFields.value.map((f) => f.name);
        const keysInSubmissions = new Set<string>();

        for (const submission of submissionRows(props.submissions)) {
            Object.keys(submission.answers ?? {}).forEach((key) => keysInSubmissions.add(key));
        }

        for (const group of bundleGroupRows(props.bundleGroups)) {
            Object.keys(group.leader?.answers ?? {}).forEach((key) => keysInSubmissions.add(key));
            for (const member of group.members ?? []) {
                Object.keys(member.answers ?? {}).forEach((key) => keysInSubmissions.add(key));
            }
        }

        const allKeys = [...new Set([...keysFromFields, ...keysInSubmissions])];
        return allKeys.slice(0, 4);
    });

    const allAnswerKeys = computed(() => {
        const keysFromFields = formFields.value.map((f) => f.name);
        const keysInSubmissions = new Set<string>();

        for (const submission of submissionRows(props.submissions)) {
            Object.keys(submission.answers ?? {}).forEach((key) => keysInSubmissions.add(key));
        }

        for (const group of bundleGroupRows(props.bundleGroups)) {
            Object.keys(group.leader?.answers ?? {}).forEach((key) => keysInSubmissions.add(key));
            for (const member of group.members ?? []) {
                Object.keys(member.answers ?? {}).forEach((key) => keysInSubmissions.add(key));
            }
        }

        return [...new Set([...keysFromFields, ...keysInSubmissions])];
    });

    function humanizeKey(value: string): string {
        return humanizeSubmissionKey(fieldLabelMap.value, value);
    }

    function fileUrl(value: TFormFillAnswerValue | undefined): string | null {
        return submissionFileUrl(value);
    }

    function openDetail(submission: IFormSubmission | IBundleSubmissionMember) {
        if ('can_open_detail' in submission && !submission.can_open_detail) {
            return;
        }

        isGroupDetailOpen.value = false;
        selectedSubmission.value = submission;
        isDetailOpen.value = true;
    }

    function openGroupDetail(group: IBundleSubmissionGroup) {
        isDetailOpen.value = false;
        selectedSubmission.value = null;
        selectedGroup.value = group;
        isGroupDetailOpen.value = true;
    }

    function closeGroupDetail() {
        isGroupDetailOpen.value = false;
    }

    function isSubmissionReviewing(submissionId: string): boolean {
        return reviewingIds.value.has(submissionId);
    }

    function submitSubmissionReview(
        action: 'accept' | 'reject',
        submission: IFormSubmission | IBundleSubmissionMember
    ) {
        // Check can_review for bundle members
        if ('can_review' in submission && !submission.can_review) {
            return;
        }

        const review_status = action === 'accept' ? 'accepted' : 'rejected';
        const id = submission.id;
        const nextReviewing = new Set(reviewingIds.value);
        nextReviewing.add(id);
        reviewingIds.value = nextReviewing;

        const { url, method } = FormAnswerReviewController.patch({
            event: props.event.id,
            form: props.form.id,
            formAnswer: submission.id,
        });

        const clearReviewing = () => {
            const s = new Set(reviewingIds.value);
            s.delete(id);
            reviewingIds.value = s;
        };

        void (async () => {
            try {
                const result = await sendFormAnswerReview({
                    url,
                    method,
                    reviewStatus: review_status,
                });

                if (!result.ok) {
                    showHttpErrorToast(result.status, result.body, {
                        409: parseApiErrorMessage(result.body, 'Submission ini sudah pernah direview.'),
                        422: parseApiErrorMessage(result.body, 'Status review tidak valid.'),
                        403: 'Anda tidak punya izin untuk mereview submission ini.',
                        404: 'Submission tidak ditemukan.',
                    });
                    if (result.status === 409 || result.status === 422) {
                        router.reload({
                            only: props.form.registration_mode === 'bundle' ? ['bundleGroups'] : ['submissions'],
                        });
                    }
                    return;
                }

                toast.success(action === 'accept' ? 'Submission diterima.' : 'Submission ditolak.');

                const reloadKeys = props.form.registration_mode === 'bundle' ? ['bundleGroups'] : ['submissions'];

                router.reload({
                    only: reloadKeys,
                    onSuccess: () => {
                        if (selectedSubmission.value?.id === id) {
                            // Try to find updated submission in either submissions or bundleGroups
                            let next: IFormSubmission | IBundleSubmissionMember | null = null;

                            next = submissionRows(props.submissions).find((s) => s.id === id) ?? null;

                            if (!next) {
                                for (const group of bundleGroupRows(props.bundleGroups)) {
                                    if (group.leader.id === id) {
                                        next = group.leader;
                                        break;
                                    }
                                    const member = (group.members ?? []).find((m) => m.id === id);
                                    if (member) {
                                        next = member;
                                        break;
                                    }
                                }
                            }

                            if (next) selectedSubmission.value = next;
                        }
                    },
                });
            } catch {
                showErrorToast('Tidak dapat menghubungi server. Coba lagi.');
            } finally {
                clearReviewing();
            }
        })();
    }

    return {
        selectedSubmission,
        isDetailOpen,
        selectedGroup,
        activeBundleGroup,
        isGroupDetailOpen,
        fieldLabelMap,
        answerKeys,
        allAnswerKeys,
        formatDate: formatSubmissionDate,
        humanizeKey,
        answerPreview,
        fileUrl,
        openDetail,
        openGroupDetail,
        closeGroupDetail,
        submitSubmissionReview,
        isSubmissionReviewing,
    };
}
