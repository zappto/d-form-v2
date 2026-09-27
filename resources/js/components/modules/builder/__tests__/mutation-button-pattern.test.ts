import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import type { DOMWrapper } from '@vue/test-utils';
import FormBuilderToolbar from '../FormBuilderToolbar.vue';

/**
 * Pola button mutasi standar (spec §3.2, Task 2):
 * - processing true → CometSpinner 16px inline + teks 'Menyimpan...' + disabled + aria-busy="true"
 * - processing false → label asli kembali, tanpa spinner
 *
 * FormBuilderToolbar adalah pembawa pola untuk semua halaman builder
 * (Forms/Create, Forms/Show, Events/Create wizard) — pola ini disalin Task 4–8.
 */

function mountToolbar(processing: boolean, saveLabel = 'Save Form') {
    return mount(FormBuilderToolbar, {
        props: {
            backHref: '/admin/events/1',
            toolbarSubtitle: 'New form',
            headingTitle: '',
            isReadyToSave: true,
            validationIssueCount: 0,
            isEmpty: false,
            processing,
            saveLabel,
        },
    });
}

/** Tombol save = button toolbar yang bukan tombol pratinjau. */
function saveButton(wrapper: ReturnType<typeof mountToolbar>): DOMWrapper<HTMLButtonElement> {
    const found = wrapper.findAll('button').find((b) => b.attributes('aria-label') !== 'Pratinjau formulir');
    if (!found) throw new Error('tombol save tidak ditemukan');
    return found as DOMWrapper<HTMLButtonElement>;
}

describe('mutation-button-pattern (FormBuilderToolbar)', () => {
    it('processing=true: spinner + teks Menyimpan... + disabled + aria-busy', () => {
        const wrapper = mountToolbar(true);
        const btn = saveButton(wrapper);

        expect(btn.find('[role="status"]').exists()).toBe(true);
        expect(btn.text()).toContain('Menyimpan...');
        expect(btn.attributes('disabled')).not.toBeUndefined();
        expect(btn.attributes('aria-busy')).toBe('true');
    });

    it('processing=false: label asli kembali tanpa spinner', () => {
        const wrapper = mountToolbar(false, 'Save Form');
        const btn = saveButton(wrapper);

        expect(btn.find('[role="status"]').exists()).toBe(false);
        expect(btn.text()).toContain('Save Form');
        expect(btn.text()).not.toContain('Menyimpan...');
        expect(btn.attributes('disabled')).toBeUndefined();
        expect(btn.attributes('aria-busy')).toBe('false');
    });
});
