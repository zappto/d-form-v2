import { computed, ref, watch } from 'vue';
import { router } from '@inertiajs/vue3';
import { routes } from '@/lib/routes';

/** Query filter halaman daftar pengguna dari server; dipakai sebagai inisial state filter. */
export interface IUserListQuery {
    search?: string;
    role?: string | null;
    per_page?: number;
}

/** Argumen useUserListFilter: query awal dari props Inertia. */
export interface IUseUserListFilterArgs {
    initialQuery: IUserListQuery;
}

/** State filter daftar pengguna + sinkronisasi query URL via router.get; dipakai di Users/Index. */
export function useUserListFilter(args: IUseUserListFilterArgs) {
    const search = ref(args.initialQuery.search ?? '');
    const role = ref(args.initialQuery.role ?? '');

    const hasActiveFilters = computed(() => Boolean(search.value || role.value));

    /** Kirim filter ke URL dengan state dipertahankan; halaman >1 ditambahkan ke query. */
    function applyFilters(pageNumber: number = 1): void {
        router.get(
            routes.admin.users.index,
            {
                search: search.value || undefined,
                role: role.value || undefined,
                page: pageNumber > 1 ? pageNumber : undefined,
            },
            { preserveState: true, replace: true }
        );
    }

    watch([search, role], () => applyFilters());

    /** Kosongkan filter; watch memicu router.get tanpa param filter. */
    function resetFilters(): void {
        search.value = '';
        role.value = '';
    }

    return { search, role, hasActiveFilters, applyFilters, resetFilters };
}
