import { describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import UserShow from '../Show.vue';
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/format';
import { routes } from '@/lib/routes';

/**
 * DFORM-69: kunci output identik setelah dedup Show.vue.
 * Halaman wajib tetap memakai lib/format + roleLabels/abilities dari server;
 * salinan lokal formatDate/formatDateTime/roleLabels/canEdit-canDelete dihapus.
 */
vi.mock('@inertiajs/vue3', () => ({
    Head: { name: 'Head', template: '<span></span>' },
    Link: {
        name: 'Link',
        props: { href: { type: String, required: true } },
        template: '<a :href="href"><slot /></a>',
    },
    router: { delete: vi.fn() },
}));

/** Props dasar halaman detail; izin + tanggal dapat dioverride per kasus. */
interface IUserShowPropsFixture {
    createdAt: string | null;
    emailVerifiedAt: string | null;
    roles: string[];
    canEdit: boolean;
    canDelete: boolean;
}

/** Bangun props fixture untuk satu kombinasi izin/tanggal/role. */
function buildProps(fixture: IUserShowPropsFixture): InstanceType<typeof UserShow>['$props'] {
    return {
        user: {
            id: 'user-1',
            name: 'Detail Member',
            email: 'detail-member@example.com',
            avatar_url: null,
            email_verified_at: fixture.emailVerifiedAt,
            created_at: fixture.createdAt,
            updated_at: '2026-09-20T10:00:00+07:00',
            deleted_at: null,
            roles: fixture.roles,
            has_local_password: true,
            oauth: { google: false, github: false },
        },
        stats: {
            events_joined: 1,
            registrations_pending: 0,
            registrations_accepted: 1,
            attendances_as_participant: 0,
            events_created: 0,
            recruitment_applications: 1,
            scans_recorded: 0,
            interviews_assigned: 0,
        },
        registrations: [
            {
                form_answer_id: 'fa-1',
                registration_code: 'REG-1',
                review_status: 'accepted',
                registration_role: null,
                member_confirmation_status: null,
                created_at: '2026-09-10T09:00:00+07:00',
                attended_at: null,
                event: {
                    id: 'ev-1',
                    title: 'Workshop',
                    slug: 'workshop',
                    start_date: '2026-10-01',
                    status: 'published',
                },
                form: { id: 'form-1', title: 'Form Pendaftaran' },
            },
        ],
        events_created: [],
        recruitment_applications: [
            {
                id: 'app-1',
                registration_number: 'OPREC-1',
                full_name: 'Detail Member',
                stage: null,
                result: null,
                submitted_at: null,
                match: 'personal_email',
                period: null,
                primary_division: null,
            },
        ],
        staff: {
            interviewer_divisions: [],
            interviews_assigned_count: 0,
            scans_recorded_count: 0,
        },
        permissions: { can_edit: fixture.canEdit, can_delete: fixture.canDelete },
        roleLabels: {
            'super-admin': 'Super Admin',
            admin: 'Admin',
            member: 'Member',
            'recruitment-staff': 'Recruitment Staff',
            'recruitment-interviewer': 'Recruitment Interviewer',
        },
    };
}

/** Pasang halaman dengan fixture; pemanggil wajib unmount via try/finally. */
function mountShow(fixture: IUserShowPropsFixture): VueWrapper<InstanceType<typeof UserShow>> {
    return mount(UserShow, { props: buildProps(fixture) });
}

/** Props default: tanggal valid + role campuran + izin penuh. */
function defaultFixture(): IUserShowPropsFixture {
    return {
        createdAt: '2026-09-15T08:30:00+07:00',
        emailVerifiedAt: '2026-09-15T08:00:00+07:00',
        roles: ['member'],
        canEdit: true,
        canDelete: true,
    };
}

describe('Users/Show dedup DFORM-69 — tanggal dari lib/format', () => {
    it('tanggal valid memakai formatDisplayDate/Time; null memakai fallback lama', () => {
        const wrapper = mountShow(defaultFixture());
        try {
            const text = wrapper.text();
            expect(text).toContain(formatDisplayDateTime('2026-09-15T08:30:00+07:00'));
            expect(text).toContain(formatDisplayDateTime('2026-09-15T08:00:00+07:00'));
            expect(text).toContain(formatDisplayDate('2026-10-01'));
        } finally {
            wrapper.unmount();
        }
    });

    it('created_at null tetap tampil strip; email belum verifikasi tetap "Belum"', () => {
        const wrapper = mountShow({ ...defaultFixture(), createdAt: null, emailVerifiedAt: null });
        try {
            const text = wrapper.text();
            expect(text).toContain('—');
            expect(text).toContain('Belum');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Users/Show dedup DFORM-69 — label role dari props server', () => {
    it('role dikenal memakai label prop; role asing jatuh ke kunci mentah', () => {
        const wrapper = mountShow({
            ...defaultFixture(),
            roles: ['super-admin', 'recruitment-staff', 'custom-x'],
        });
        try {
            const text = wrapper.text();
            expect(text).toContain('Super Admin');
            expect(text).toContain('Recruitment Staff');
            expect(text).toContain('custom-x');
        } finally {
            wrapper.unmount();
        }
    });
});

describe('Users/Show dedup DFORM-69 — tombol mengikuti abilities server', () => {
    it('izin penuh → tautan Edit dan tombol Hapus tampil', () => {
        const wrapper = mountShow(defaultFixture());
        try {
            expect(wrapper.find(`a[href="${routes.admin.users.edit('user-1')}"]`).exists()).toBe(true);
            expect(wrapper.findAll('button').filter((button) => button.text().includes('Hapus')).length).toBe(1);
        } finally {
            wrapper.unmount();
        }
    });

    it('tanpa izin → tautan Edit dan tombol Hapus hilang', () => {
        const wrapper = mountShow({ ...defaultFixture(), canEdit: false, canDelete: false });
        try {
            expect(wrapper.find(`a[href="${routes.admin.users.edit('user-1')}"]`).exists()).toBe(false);
            expect(wrapper.findAll('button').filter((button) => button.text().includes('Hapus')).length).toBe(0);
        } finally {
            wrapper.unmount();
        }
    });

    it('hanya can_edit → Edit tampil, Hapus hilang', () => {
        const wrapper = mountShow({ ...defaultFixture(), canEdit: true, canDelete: false });
        try {
            expect(wrapper.find(`a[href="${routes.admin.users.edit('user-1')}"]`).exists()).toBe(true);
            expect(wrapper.findAll('button').filter((button) => button.text().includes('Hapus')).length).toBe(0);
        } finally {
            wrapper.unmount();
        }
    });
});
