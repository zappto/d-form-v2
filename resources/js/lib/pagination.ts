/** Link paginator Laravel; `url` null pada halaman pertama/terakhir. */
export interface IPaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** Bentuk paginator Laravel; varian halaman diturunkan via Pick/Partial, bukan ditulis ulang. */
export interface IPaginator<GItem> {
    data: GItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links?: IPaginationLink[];
    from?: number | null;
    to?: number | null;
}

/** Page-size fallback daftar pengguna (Users Index); mirror default backend `IndexUserRequest` (10). */
export const USERS_PAGE_SIZE = 10;

/** Page-size fallback daftar interview saya; mirror default backend `MyInterviewService` (20). */
export const MY_INTERVIEWS_PAGE_SIZE = 20;

/** Page-size default paginasi LOKAL daftar applicant periode (FE memuat semua baris, mengiris di klien). */
export const PERIOD_APPLICANTS_PAGE_SIZE = 20;
