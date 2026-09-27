import type { IApplicationDetail } from '@/components/modules/dashboard/recruitment/ApplicantDetailContent.vue';

type TRecruitmentAuthUser = {
    roles?: string[];
    can_manage_users?: boolean;
    can_screen_recruitment_applications?: boolean;
};

/** Tentukan boleh-tidaknya kirim ulang tautan tracking pelamar; dipakai menyembunyikan tombol resend di detail pelamar. */
export function applicantAllowsTrackingResend(application: IApplicationDetail): boolean {
    if (application.can_resend_tracking === true) {
        return true;
    }

    if (application.can_resend_tracking === false) {
        return false;
    }

    return application.personal_email.trim().length > 0;
}

/** Tentukan izin pengguna mengirim ulang tautan tracking dari role/permission-nya; dipakai sebagai gerbang aksi resend. */
export function userAllowsTrackingResend(user: TRecruitmentAuthUser | null | undefined): boolean {
    if (!user) {
        return false;
    }

    if (user.roles?.includes('super-admin') === true || user.can_manage_users === true) {
        return true;
    }

    return user.can_screen_recruitment_applications === true;
}
