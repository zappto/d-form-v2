// global.d.ts
import '@inertiajs/core';
import type { ISharedSeoProps } from './seo';

declare global {
    interface IUser {
        id: string;
        name: string;
        email: string;
        /** URL tampilan (path `storage/` sudah di-resolve di `HandleInertiaRequests`). */
        avatar: string | null;
        email_verified_at?: string | null;
        roles?: string[];
        /** True when the user has a password hash (email/password accounts); false for OAuth-only signups. */
        has_local_password?: boolean;
        /** Selaras middleware organizer: permission events.list */
        can_manage_events?: boolean;
        /** Permission users.list (super-admin) */
        can_manage_users?: boolean;
        /** Permission email-broadcast.view */
        can_access_broadcast?: boolean;
        /** Permission recruitment.dashboard.view */
        can_access_recruitment?: boolean;
        /** Permission recruitment.periods.list */
        can_manage_recruitment_periods?: boolean;
        /** Permission recruitment.applications.list */
        can_list_recruitment_applications?: boolean;
        /** Permission recruitment.screening.decide */
        can_screen_recruitment_applications?: boolean;
        /** Permission recruitment.interviews.schedule */
        can_schedule_recruitment_interviews?: boolean;
        /** Permission recruitment.corrections.review */
        can_review_recruitment_corrections?: boolean;
        /** Permission recruitment.queue.view */
        can_view_recruitment_queue?: boolean;
        /** Permission recruitment.attendance.scan */
        can_scan_recruitment_attendance?: boolean;
        /** Permission recruitment.evaluations.view */
        can_view_my_recruitment_interviews?: boolean;
        /** Permission recruitment.activity.view */
        can_view_recruitment_activity?: boolean;
        /** Permission recruitment.final.decide */
        can_decide_recruitment_final?: boolean;
        /** Permission recruitment.reports.view */
        can_view_recruitment_reports?: boolean;
        /** Interviewee dengan akses terbatas: hanya halaman interview miliknya. */
        is_recruitment_interviewer_only?: boolean;
        created_at?: string;
        updated_at?: string;
        deleted_at?: string;
    }

    type TPageProps = {
        auth: { user: IUser | null };
        appName: string;
        seo: ISharedSeoProps;
    };

    type User = IUser;
    type TProps = TPageProps;
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: TPageProps;
        flashDataType: {
            toast?: { type: 'success' | 'error'; message: string };
        };
        errorValueType: string;
    }
}

export {};
