import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useFormFillPage, type TFormFillPageContext } from '@/hooks/useFormFillPage';

vi.mock('@inertiajs/vue3', async () => {
    const { reactive } = await import('vue');
    return {
        usePage: () => ({ props: {} }),
        useForm: (initial: Record<string, unknown>) =>
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

interface IHookHost {
    ctx: TFormFillPageContext;
    unmount: () => void;
}

/** Mount host tipis agar `useFormFillPage` berjalan dengan lifecycle component aktif. */
function mountFillHook(memberSlots: number): IHookHost {
    const holder: { ctx: TFormFillPageContext | null } = { ctx: null };
    const host = defineComponent({
        setup() {
            holder.ctx = useFormFillPage({
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
                memberSlots,
                registrationMode: 'linear',
            });
            return () => h('div');
        },
    });
    const wrapper = mount(host);
    if (!holder.ctx) throw new Error('useFormFillPage tidak terinisialisasi');
    return { ctx: holder.ctx, unmount: () => wrapper.unmount() };
}

describe('useFormFillPage — penulisan jawaban', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('setFieldAnswer menulis nilai pada key yang diberikan tanpa menyentuh key lain', () => {
        const host = mountFillHook(0);
        try {
            host.ctx.answerForm.full_name = 'Ayu';
            host.ctx.setFieldAnswer('rating_score', '4');
            expect(host.ctx.answerForm.rating_score).toBe('4');
            expect(host.ctx.answerForm.full_name).toBe('Ayu');
        } finally {
            host.unmount();
        }
    });

    it('setTeamMemberEmail mengisi slot, mempertahankan entri lain, dan menjaga panjang array = memberSlots', () => {
        const host = mountFillHook(3);
        try {
            expect(host.ctx.answerForm.team_member_emails).toEqual(['', '', '']);
            const previousEmails = host.ctx.answerForm.team_member_emails;
            host.ctx.setTeamMemberEmail(1, 'a@example.com');
            expect(host.ctx.answerForm.team_member_emails).not.toBe(previousEmails);
            host.ctx.setTeamMemberEmail(3, 'c@example.com');
            expect(host.ctx.answerForm.team_member_emails).toEqual(['a@example.com', '', 'c@example.com']);
        } finally {
            host.unmount();
        }
    });

    it('setTeamMemberEmail memadatkan array yang lebih pendek dari jumlah slot', () => {
        const host = mountFillHook(3);
        try {
            host.ctx.answerForm.team_member_emails = ['x@example.com'];
            host.ctx.setTeamMemberEmail(3, 'z@example.com');
            expect(host.ctx.answerForm.team_member_emails).toEqual(['x@example.com', '', 'z@example.com']);
        } finally {
            host.unmount();
        }
    });
});
