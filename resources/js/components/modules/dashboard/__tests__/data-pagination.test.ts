import { describe, expect, it } from 'vitest';
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils';
import DataPagination from '../DataPagination.vue';

/**
 * DFORM-36 H1: `DataPagination` di atas primitif `ui/pagination` yang asli
 * (bukan stub) supaya assertion kelas/aria bermakna. Mode bernomor menyusun ulang
 * markup P1 (Users/MyInterviews) apa adanya; mode kompak meniru tombol P3.
 */

type TDataPaginationProps = InstanceType<typeof DataPagination>['$props'];

function mountPagination(
    overrides: Partial<TDataPaginationProps> = {}
): VueWrapper<InstanceType<typeof DataPagination>> {
    return mount(DataPagination, {
        props: { page: 1, total: 200, perPage: 10, ...overrides },
    });
}

function pageItems(wrapper: VueWrapper): DOMWrapper<Element>[] {
    return wrapper.findAll('[data-slot="pagination-item"]');
}

function itemByText(wrapper: VueWrapper, text: string): DOMWrapper<Element> {
    const found = pageItems(wrapper).find((item) => item.text() === text);
    if (!found) {
        throw new Error(`item halaman ${text} tidak ditemukan`);
    }
    return found;
}

describe('DataPagination — mode bernomor', () => {
    it('menampilkan jendela nomor halaman untuk total besar', () => {
        const wrapper = mountPagination({ page: 5, total: 200, perPage: 10 });

        expect(pageItems(wrapper).map((item) => item.text())).toEqual(['4', '5', '6']);

        wrapper.unmount();
    });

    it('tidak merender ellipsis pada rendering kanonik (reka show-edges nonaktif)', () => {
        const wrapper = mountPagination({ page: 10, total: 2000, perPage: 10 });

        expect(pageItems(wrapper).map((item) => item.text())).toEqual(['9', '10', '11']);
        expect(wrapper.findAll('[data-slot="pagination-ellipsis"]')).toHaveLength(0);

        wrapper.unmount();
    });

    it('item aktif memakai is-active (outline) + aria-current, item lain ghost', () => {
        const wrapper = mountPagination({ page: 5, total: 200, perPage: 10 });
        const active = itemByText(wrapper, '5');
        const inactive = itemByText(wrapper, '4');

        expect(active.classes()).toContain('bg-background');
        expect(active.attributes('aria-current')).toBe('page');
        expect(inactive.classes()).toContain('bg-transparent');
        expect(inactive.attributes('aria-current')).toBeUndefined();

        wrapper.unmount();
    });

    it('memberi aria-label kanonik `Ke halaman N`', () => {
        const wrapper = mountPagination({ page: 5, total: 200, perPage: 10 });

        expect(itemByText(wrapper, '5').attributes('aria-label')).toBe('Ke halaman 5');
        expect(itemByText(wrapper, '6').attributes('aria-label')).toBe('Ke halaman 6');

        wrapper.unmount();
    });

    it('klik nomor halaman meng-emit update:page dengan nomor halaman', async () => {
        const wrapper = mountPagination({ page: 5, total: 200, perPage: 10 });

        await itemByText(wrapper, '6').trigger('click');

        expect(wrapper.emitted('update:page')).toEqual([[6]]);

        wrapper.unmount();
    });

    it('prev disabled di halaman pertama, next disabled di halaman terakhir', () => {
        const first = mountPagination({ page: 1, total: 200, perPage: 10 });
        expect(first.find('[data-slot="pagination-previous"]').attributes('disabled')).toBeDefined();
        expect(first.find('[data-slot="pagination-next"]').attributes('disabled')).toBeUndefined();
        first.unmount();

        const last = mountPagination({ page: 20, total: 200, perPage: 10 });
        expect(last.find('[data-slot="pagination-previous"]').attributes('disabled')).toBeUndefined();
        expect(last.find('[data-slot="pagination-next"]').attributes('disabled')).toBeDefined();
        last.unmount();
    });

    it('meneruskan siblingCount ke jendela reka', () => {
        const wrapper = mountPagination({ page: 10, total: 200, perPage: 10, siblingCount: 2 });

        expect(pageItems(wrapper).map((item) => item.text())).toEqual(['8', '9', '10', '11', '12']);

        wrapper.unmount();
    });

    it('firstLast menambah tombol First/Last bernomor', () => {
        const wrapper = mountPagination({ page: 5, total: 200, perPage: 10, firstLast: true });

        expect(wrapper.find('[data-slot="pagination-first"]').exists()).toBe(true);
        expect(wrapper.find('[data-slot="pagination-last"]').exists()).toBe(true);

        wrapper.unmount();
    });

    it('memakai label default `Sebelumnya`/`Berikutnya` pada span hidden sm:block', () => {
        const wrapper = mountPagination({ page: 5, total: 200, perPage: 10 });
        const previous = wrapper.find('[data-slot="pagination-previous"]');
        const next = wrapper.find('[data-slot="pagination-next"]');

        expect(previous.text()).toContain('Sebelumnya');
        expect(next.text()).toContain('Berikutnya');
        expect(previous.find('span').classes()).toContain('hidden');
        expect(previous.find('span').classes()).toContain('sm:block');

        wrapper.unmount();
    });

    it('menghormati prevLabel/nextLabel kustom', () => {
        const wrapper = mountPagination({ page: 5, total: 200, perPage: 10, prevLabel: 'Mundur', nextLabel: 'Maju' });

        expect(wrapper.find('[data-slot="pagination-previous"]').text()).toContain('Mundur');
        expect(wrapper.find('[data-slot="pagination-next"]').text()).toContain('Maju');

        wrapper.unmount();
    });

    it('tidak memakai teleport sehingga tidak perlu attachTo document.body', () => {
        const wrapper = mountPagination({ page: 5, total: 200, perPage: 10 });

        expect(wrapper.element.tagName).toBe('NAV');
        expect(wrapper.element.getAttribute('data-slot')).toBe('pagination');
        expect(document.body.contains(wrapper.element)).toBe(false);

        wrapper.unmount();
    });
});

describe('DataPagination — mode kompak (numbers=false)', () => {
    it('hanya merender prev/next tanpa nomor halaman', () => {
        const wrapper = mountPagination({ page: 3, total: 200, perPage: 10, numbers: false });
        const buttons = wrapper.findAll('button');

        expect(wrapper.find('[data-slot="pagination"]').exists()).toBe(false);
        expect(pageItems(wrapper)).toHaveLength(0);
        expect(buttons.map((button) => button.text())).toEqual(['Sebelumnya', 'Berikutnya']);
        expect(buttons[0]?.classes()).toContain('bg-background');

        wrapper.unmount();
    });

    it('menghormati prevLabel/nextLabel kustom', () => {
        const wrapper = mountPagination({
            page: 3,
            total: 200,
            perPage: 10,
            numbers: false,
            prevLabel: 'Kembali',
            nextLabel: 'Lanjut',
        });

        expect(wrapper.findAll('button').map((button) => button.text())).toEqual(['Kembali', 'Lanjut']);

        wrapper.unmount();
    });

    it('disabled di ujung pertama dan terakhir', () => {
        const first = mountPagination({ page: 1, total: 200, perPage: 10, numbers: false });
        const firstButtons = first.findAll('button');
        expect(firstButtons[0]?.attributes('disabled')).toBeDefined();
        expect(firstButtons[1]?.attributes('disabled')).toBeUndefined();
        first.unmount();

        const last = mountPagination({ page: 20, total: 200, perPage: 10, numbers: false });
        const lastButtons = last.findAll('button');
        expect(lastButtons[0]?.attributes('disabled')).toBeUndefined();
        expect(lastButtons[1]?.attributes('disabled')).toBeDefined();
        last.unmount();
    });

    it('klik prev/next meng-emit update:page tetangga', async () => {
        const wrapper = mountPagination({ page: 3, total: 200, perPage: 10, numbers: false });
        const buttons = wrapper.findAll('button');

        await buttons[0]?.trigger('click');
        await buttons[1]?.trigger('click');

        expect(wrapper.emitted('update:page')).toEqual([[2], [4]]);

        wrapper.unmount();
    });

    it('firstLast menambah tombol ikon First/Last dengan aria-label + size-9', () => {
        const wrapper = mountPagination({ page: 3, total: 200, perPage: 10, numbers: false, firstLast: true });
        const buttons = wrapper.findAll('button');

        expect(buttons).toHaveLength(4);
        expect(buttons[0]?.attributes('aria-label')).toBe('Halaman pertama');
        expect(buttons[3]?.attributes('aria-label')).toBe('Halaman terakhir');
        expect(buttons[0]?.classes()).toContain('size-9');
        expect(buttons[0]?.classes()).toContain('rounded-full');

        wrapper.unmount();
    });

    it('klik First/Last meng-emit halaman 1 dan halaman terakhir', async () => {
        const wrapper = mountPagination({ page: 3, total: 200, perPage: 10, numbers: false, firstLast: true });
        const buttons = wrapper.findAll('button');

        await buttons[0]?.trigger('click');
        await buttons[3]?.trigger('click');

        expect(wrapper.emitted('update:page')).toEqual([[1], [20]]);

        wrapper.unmount();
    });

    it('firstLast melebarkan tombol berlabel (px-4), tanpa firstLast memakai px-3', () => {
        const withEdges = mountPagination({ page: 3, total: 200, perPage: 10, numbers: false, firstLast: true });
        expect(withEdges.findAll('button')[1]?.classes()).toContain('px-4');
        withEdges.unmount();

        const plain = mountPagination({ page: 3, total: 200, perPage: 10, numbers: false });
        expect(plain.findAll('button')[0]?.classes()).toContain('px-3');
        plain.unmount();
    });
});
