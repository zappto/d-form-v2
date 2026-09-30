import { describe, expect, it, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { useUserListFilter } from '../useUserListFilter';
import { routes } from '@/lib/routes';

/**
 * DFORM-68: pin perilaku filter stateful Users/Index setelah ekstraksi ke hook —
 * URL query, opsi router, dan reset harus identik dengan implementasi inline semula.
 */

const { routerGetMock } = vi.hoisted(() => ({
    routerGetMock: vi.fn<(url: string, params?: IRouterGetParams, options?: IRouterGetOptions) => void>(),
}));

vi.mock('@inertiajs/vue3', () => ({
    router: { post: vi.fn(), get: routerGetMock, delete: vi.fn(), reload: vi.fn(), visit: vi.fn() },
}));

interface IRouterGetParams {
    search?: string;
    role?: string;
    page?: number;
}

interface IRouterGetOptions {
    preserveState?: boolean;
    replace?: boolean;
}

function lastGetCall(): { url: string; params?: IRouterGetParams; options?: IRouterGetOptions } {
    expect(routerGetMock).toHaveBeenCalled();
    const calls = routerGetMock.mock.calls;
    const last = calls[calls.length - 1];
    if (!last) throw new Error('panggilan router.get tidak ditemukan');
    return { url: last[0], params: last[1], options: last[2] };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useUserListFilter (DFORM-68)', () => {
    it('inisial state mengikuti query props; tanpa filter aktif', () => {
        const filter = useUserListFilter({ initialQuery: { search: 'budi', role: 'admin' } });
        expect(filter.search.value).toBe('budi');
        expect(filter.role.value).toBe('admin');
        expect(filter.hasActiveFilters.value).toBe(true);

        const empty = useUserListFilter({ initialQuery: {} });
        expect(empty.search.value).toBe('');
        expect(empty.role.value).toBe('');
        expect(empty.hasActiveFilters.value).toBe(false);
    });

    it('perubahan search → router.get dengan param benar + preserveState/replace', async () => {
        const filter = useUserListFilter({ initialQuery: {} });
        filter.search.value = 'sari';
        await nextTick();

        const call = lastGetCall();
        expect(call.url).toBe(routes.admin.users.index);
        expect(call.params).toEqual({ search: 'sari', role: undefined, page: undefined });
        expect(call.options).toEqual({ preserveState: true, replace: true });
    });

    it('perubahan role → router.get dengan param benar', async () => {
        const filter = useUserListFilter({ initialQuery: {} });
        filter.role.value = 'member';
        await nextTick();

        const call = lastGetCall();
        expect(call.url).toBe(routes.admin.users.index);
        expect(call.params).toEqual({ search: undefined, role: 'member', page: undefined });
    });

    it('applyFilters(page) menyertakan page hanya bila >1', () => {
        const filter = useUserListFilter({ initialQuery: { search: 'agus' } });

        filter.applyFilters(3);
        expect(lastGetCall().params).toEqual({ search: 'agus', role: undefined, page: 3 });

        filter.applyFilters();
        expect(lastGetCall().params).toEqual({ search: 'agus', role: undefined, page: undefined });
    });

    it('resetFilters mengosongkan state + memicu router.get tanpa param filter', async () => {
        const filter = useUserListFilter({ initialQuery: { search: 'budi', role: 'admin' } });
        expect(filter.hasActiveFilters.value).toBe(true);

        filter.resetFilters();
        expect(filter.search.value).toBe('');
        expect(filter.role.value).toBe('');
        expect(filter.hasActiveFilters.value).toBe(false);

        await nextTick();
        const call = lastGetCall();
        expect(call.url).toBe(routes.admin.users.index);
        expect(call.params).toEqual({ search: undefined, role: undefined, page: undefined });
        expect(call.options).toEqual({ preserveState: true, replace: true });
    });
});
