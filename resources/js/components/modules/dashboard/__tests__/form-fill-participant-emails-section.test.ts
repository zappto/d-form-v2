import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import FormFillParticipantEmailsSection from '../FormFillParticipantEmailsSection.vue';
import { useFormFillPage } from '@/hooks/useFormFillPage';
import { formatDisplayDate } from '@/lib/format';

/**
 * DFORM-46: kartu "user ditemukan" tidak lagi memakai non-null assertion pada
 * `foundUserBySlot[slot]`. Test ini memaku paritas render:
 * (a) slot dengan user ditemukan → nama/email/tanggal tampil seperti semula;
 * (b) slot tanpa user (not_found) → tidak melempar dan tidak merender data user.
 */

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        usePage: () => ({ props: { auth: { user: { email: 'viewer@example.com' } } } }),
        useForm: <T extends object>(initial: T) =>
            reactive({
                ...initial,
                errors: {},
                processing: false,
                post: vi.fn(),
                setError: vi.fn(),
                clearErrors: vi.fn(),
                reset: vi.fn(),
            }),
    };
});

vi.mock('vue-sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const FOUND_USER = { name: 'Ada Lovelace', email: 'ada@example.com', created_at: '2026-01-02' };

/** Debounce `scheduleCheck` → `runEmailCheck` di komponen (konstanta internal komponen). */
const EMAIL_CHECK_DEBOUNCE_MS = 1000;

const fetchMock = vi.fn<(url: string) => Promise<Response>>();

/** Bungkus ctx asli lewat `useFormFillPage` + `reactive`, sama seperti Fill.vue/Apply.vue. */
function mountSection(): VueWrapper {
    const Host = defineComponent({
        setup() {
            const ctx = reactive(
                useFormFillPage({
                    event: { id: 'evt-1', slug: 'demo', title: 'Demo Event' },
                    form: {
                        id: 'frm-1',
                        title: 'Demo Form',
                        description: null,
                        closed_at: null,
                        banner_url: null,
                        banner_caption: null,
                    },
                    fields: [],
                    submitUrl: '/demo/submit',
                    accessStatus: 'allowed',
                    accessMessage: '',
                    memberSlots: 1,
                    registrationMode: 'linear',
                })
            );
            return () => h(FormFillParticipantEmailsSection, { ctx });
        },
    });
    return mount(Host);
}

/** Ketik email peserta lalu tunggu debounce + fetch sampai teks penanda status muncul. */
async function typeEmailAndWait(wrapper: VueWrapper, email: string, statusText: string): Promise<void> {
    const input = wrapper.find('input[type="email"]');
    if (!input.exists()) {
        throw new Error('input email peserta tidak dirender');
    }
    await input.setValue(email);
    await vi.waitFor(
        () => {
            expect(wrapper.text()).toContain(statusText);
        },
        { timeout: EMAIL_CHECK_DEBOUNCE_MS + 2000, interval: 25 }
    );
}

describe('FormFillParticipantEmailsSection — kartu user ditemukan (DFORM-46)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('slot dengan user ditemukan → nama, email, dan tanggal tampil seperti semula', async () => {
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ exists: true, data: FOUND_USER }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const wrapper = mountSection();
        try {
            await typeEmailAndWait(wrapper, FOUND_USER.email, FOUND_USER.name);

            const text = wrapper.text();
            expect(text).toContain(FOUND_USER.name);
            expect(text).toContain(FOUND_USER.email);
            expect(text).toContain(formatDisplayDate(FOUND_USER.created_at));
            expect(text).toContain('Member since');
        } finally {
            wrapper.unmount();
        }
    });

    it('slot tanpa user (not_found) → tidak melempar dan tidak merender data user', async () => {
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ exists: false, message: 'No account exists for this email.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        const wrapper = mountSection();
        try {
            await typeEmailAndWait(wrapper, 'nobody@example.com', 'Not found');

            const text = wrapper.text();
            expect(text).not.toContain('Member since');
            expect(text).not.toContain(FOUND_USER.name);
            expect(text).not.toContain(FOUND_USER.email);
        } finally {
            wrapper.unmount();
        }
    });
});
