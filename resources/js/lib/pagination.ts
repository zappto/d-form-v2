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
