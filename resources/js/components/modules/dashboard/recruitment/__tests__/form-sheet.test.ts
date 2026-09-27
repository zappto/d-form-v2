import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils';
import FormSheet from '../FormSheet.vue';
import {
    FORM_SHEET_FOOTER_CLASS,
    FORM_SHEET_HEADER_CLASS,
    FORM_SHEET_OVERLAY_CLASS,
    FORM_SHEET_WIDTH_CLASS,
    formSheetContentClass,
    type TFormSheetSize,
} from '../formSheetClasses';

/**
 * DFORM-35 F1: shell `FormSheet`. Kelas shell (prefix + lebar, overlay, header, footer)
 * satu sumber di `formSheetClasses.ts`; slot `#header`/`#footer` opsional; isi default
 * dirender langsung di dalam `SheetContent` (tanpa wrapper); `v-model:open` transparan.
 */

enableAutoUnmount(afterEach);

const CONTENT_PREFIX_TOKENS: string[] = [
    'inset-y-0',
    'right-0',
    'h-full',
    'w-full',
    'gap-0',
    'p-0',
    'sm:inset-y-3',
    'sm:right-3',
    'sm:h-[calc(100%-1.5rem)]',
    'sm:max-w-[calc(100vw-1.5rem)]',
    'sm:rounded-2xl',
    'sm:border',
    'sm:shadow-xl',
];

const DEFAULT_WIDTH_TOKEN = 'sm:w-[28rem]';
const WIDE_WIDTH_TOKEN = 'sm:w-[52rem]';

const HEADER_TOKENS: string[] = [
    'border-border/70',
    'shrink-0',
    'space-y-1',
    'border-b',
    'py-4',
    'pl-4',
    'pr-12',
    'text-left',
];

const FOOTER_TOKENS: string[] = ['border-border/70', 'shrink-0', 'border-t', 'p-4'];

interface SheetProps {
    open?: boolean;
    title?: string;
    description?: string;
    size?: TFormSheetSize;
}

function mountSheet(props: SheetProps = {}, slots: Record<string, string> = {}) {
    return mount(FormSheet, { props, slots, attachTo: document.body });
}

function requireElement(selector: string): HTMLElement {
    const element = document.body.querySelector<HTMLElement>(selector);
    if (element === null) throw new Error(`elemen ${selector} tidak ditemukan`);
    return element;
}

function hasAllClasses(element: HTMLElement, tokens: string[]): boolean {
    return tokens.every((token: string): boolean => element.classList.contains(token));
}

describe('formSheetClasses', () => {
    it('formSheetContentClass(default) = prefix kanonik + token 28rem', () => {
        const contentClass = formSheetContentClass('default');

        for (const token of CONTENT_PREFIX_TOKENS) {
            expect(contentClass).toContain(token);
        }
        expect(contentClass).toContain(DEFAULT_WIDTH_TOKEN);
        expect(contentClass).not.toContain(WIDE_WIDTH_TOKEN);
    });

    it('formSheetContentClass(wide) memakai token 52rem, bukan 28rem', () => {
        const contentClass = formSheetContentClass('wide');

        for (const token of CONTENT_PREFIX_TOKENS) {
            expect(contentClass).toContain(token);
        }
        expect(contentClass).toContain(WIDE_WIDTH_TOKEN);
        expect(contentClass).not.toContain(DEFAULT_WIDTH_TOKEN);
    });

    it('FORM_SHEET_WIDTH_CLASS memetakan tiap ukuran ke satu token lebar', () => {
        expect(FORM_SHEET_WIDTH_CLASS).toEqual({
            default: DEFAULT_WIDTH_TOKEN,
            wide: WIDE_WIDTH_TOKEN,
        });
    });

    it('overlay/header/footer memakai kelas kanonik recruitment', () => {
        expect(FORM_SHEET_OVERLAY_CLASS).toBe('bg-black/60 backdrop-blur-sm');
        expect(FORM_SHEET_HEADER_CLASS.split(' ').sort()).toEqual([...HEADER_TOKENS].sort());
        expect(FORM_SHEET_FOOTER_CLASS.split(' ').sort()).toEqual([...FOOTER_TOKENS].sort());
    });
});

describe('FormSheet shell (primitif ui/sheet asli)', () => {
    it('SheetContent memakai prefix kanonik + lebar default', async () => {
        mountSheet({ open: true });
        await nextTick();

        const content = requireElement('[data-slot="sheet-content"]');
        expect(hasAllClasses(content, CONTENT_PREFIX_TOKENS)).toBe(true);
        expect(content.classList.contains(DEFAULT_WIDTH_TOKEN)).toBe(true);
        expect(content.classList.contains(WIDE_WIDTH_TOKEN)).toBe(false);
    });

    it('size="wide" menukar token lebar ke 52rem', async () => {
        mountSheet({ open: true, size: 'wide' });
        await nextTick();

        const content = requireElement('[data-slot="sheet-content"]');
        expect(hasAllClasses(content, CONTENT_PREFIX_TOKENS)).toBe(true);
        expect(content.classList.contains(WIDE_WIDTH_TOKEN)).toBe(true);
        expect(content.classList.contains(DEFAULT_WIDTH_TOKEN)).toBe(false);
    });

    it('overlay memakai kelas kanonik', async () => {
        mountSheet({ open: true });
        await nextTick();

        const overlay = requireElement('[data-slot="sheet-overlay"]');
        expect(overlay.classList.contains('bg-black/60')).toBe(true);
        expect(overlay.classList.contains('backdrop-blur-sm')).toBe(true);
    });

    it('header kanonik dirender bila ada title + description', async () => {
        mountSheet({ open: true, title: 'Divisi', description: 'Daftar divisi open recruitment' });
        await nextTick();

        const header = requireElement('[data-slot="sheet-header"]');
        expect(hasAllClasses(header, HEADER_TOKENS)).toBe(true);
        expect(header.textContent).toContain('Divisi');
        expect(header.textContent).toContain('Daftar divisi open recruitment');
    });

    it('header absen tanpa title, description, dan #header', async () => {
        mountSheet({ open: true }, { default: '<div data-testid="body">Isi</div>' });
        await nextTick();

        expect(document.body.querySelector('[data-slot="sheet-header"]')).toBeNull();
    });

    it('slot #header menggantikan fallback title/description di dalam SheetHeader kanonik', async () => {
        mountSheet(
            { open: true, title: 'Judul prop', description: 'Deskripsi prop' },
            { header: '<div data-testid="header">Header dinamis</div>' }
        );
        await nextTick();

        const header = requireElement('[data-slot="sheet-header"]');
        expect(hasAllClasses(header, HEADER_TOKENS)).toBe(true);
        expect(header.querySelector('[data-testid="header"]')).not.toBeNull();
        expect(header.textContent).toContain('Header dinamis');
        expect(header.textContent).not.toContain('Judul prop');
        expect(header.textContent).not.toContain('Deskripsi prop');
    });

    it('slot #header tanpa props tetap memunculkan SheetHeader kanonik', async () => {
        mountSheet({ open: true }, { header: '<div data-testid="header">Hanya header</div>' });
        await nextTick();

        const header = requireElement('[data-slot="sheet-header"]');
        expect(hasAllClasses(header, HEADER_TOKENS)).toBe(true);
        expect(header.textContent).toContain('Hanya header');
    });

    it('slot #footer dirender di dalam SheetFooter dengan kelas kanonik', async () => {
        mountSheet({ open: true }, { footer: '<button data-testid="footer">Tutup</button>' });
        await nextTick();

        const footer = requireElement('[data-slot="sheet-footer"]');
        expect(hasAllClasses(footer, FOOTER_TOKENS)).toBe(true);
        expect(footer.querySelector('[data-testid="footer"]')).not.toBeNull();
    });

    it('SheetFooter absen bila slot #footer tidak diberikan', async () => {
        mountSheet({ open: true }, { default: '<div data-testid="body">Isi</div>' });
        await nextTick();

        expect(document.body.querySelector('[data-slot="sheet-footer"]')).toBeNull();
    });

    it('slot default dirender langsung di dalam SheetContent (tanpa wrapper)', async () => {
        mountSheet({ open: true }, { default: '<div data-testid="body">Isi formulir</div>' });
        await nextTick();

        const content = requireElement('[data-slot="sheet-content"]');
        const body = requireElement('[data-testid="body"]');
        expect(body.parentElement).toBe(content);
    });

    it('open=true merender isi; open=false menyembunyikannya', async () => {
        const wrapper = mountSheet({ open: true }, { default: '<div data-testid="body">Isi</div>' });
        await nextTick();
        expect(document.body.querySelector('[data-testid="body"]')).not.toBeNull();

        await wrapper.setProps({ open: false });
        await nextTick();
        await nextTick();

        expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull();
        expect(document.body.querySelector('[data-testid="body"]')).toBeNull();
    });

    it('tombol X bawaan menutup dan meng-emit update:open=false', async () => {
        const wrapper = mountSheet({ open: true }, { default: '<div data-testid="body">Isi</div>' });
        await nextTick();

        const content = requireElement('[data-slot="sheet-content"]');
        const closeButton = content.querySelector('button');
        if (closeButton === null) throw new Error('tombol X bawaan tidak ditemukan');

        await new DOMWrapper(closeButton).trigger('click');

        expect(wrapper.emitted('update:open')).toEqual([[false]]);
    });
});
