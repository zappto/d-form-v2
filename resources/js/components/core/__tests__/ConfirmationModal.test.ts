import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ConfirmationModal from '../ConfirmationModal.vue';

/**
 * Spec §3.3, Task 3: tombol confirm ConfirmationModal saat `loading`
 * - terkunci (disabled + aria-busy="true")
 * - menampilkan CometSpinner ([role="status"])
 * - swap teks mengikuti variant ('Menghapus...' bila destructive, 'Menyimpan...' bila default)
 */

type TConfirmationModalProps = InstanceType<typeof ConfirmationModal>['$props'];

function mountModal(props: Partial<TConfirmationModalProps>) {
    const wrapper = mount(ConfirmationModal, {
        props: {
            open: true,
            title: 'Hapus acara Test?',
            description: 'Tindakan ini tidak dapat dibatalkan.',
            ...props,
        },
        attachTo: document.body,
    });
    return wrapper;
}

async function confirmButton(): Promise<HTMLButtonElement | null> {
    await nextTick();
    await nextTick();
    const buttons = Array.from(document.body.querySelectorAll('button'));
    const found = buttons.find(
        (b) => !(b.textContent ?? '').includes('Batal') && !(b.textContent ?? '').includes('Cancel')
    );
    return found ?? null;
}

describe('ConfirmationModal loading', () => {
    it('variant destructive + loading: disabled + spinner + teks Menghapus...', async () => {
        const wrapper = mountModal({ variant: 'destructive', confirmText: 'Hapus', loading: true });
        try {
            const btn = await confirmButton();
            expect(btn).not.toBeNull();
            expect(btn?.disabled).toBe(true);
            expect(btn?.getAttribute('aria-busy')).toBe('true');
            expect(btn?.querySelector('[role="status"]')).not.toBeNull();
            expect(btn?.textContent).toContain('Menghapus...');
        } finally {
            wrapper.unmount();
            document.body.innerHTML = '';
        }
    });

    it('variant default + loading: disabled + spinner + teks Menyimpan...', async () => {
        const wrapper = mountModal({ confirmText: 'Simpan', loading: true });
        try {
            const btn = await confirmButton();
            expect(btn).not.toBeNull();
            expect(btn?.disabled).toBe(true);
            expect(btn?.querySelector('[role="status"]')).not.toBeNull();
            expect(btn?.textContent).toContain('Menyimpan...');
        } finally {
            wrapper.unmount();
            document.body.innerHTML = '';
        }
    });

    it('tanpa loading: label asli kembali tanpa spinner', async () => {
        const wrapper = mountModal({ variant: 'destructive', confirmText: 'Hapus' });
        try {
            const btn = await confirmButton();
            expect(btn).not.toBeNull();
            expect(btn?.disabled).toBe(false);
            expect(btn?.querySelector('[role="status"]')).toBeNull();
            expect(btn?.textContent).toContain('Hapus');
            expect(btn?.textContent).not.toContain('Menghapus...');
        } finally {
            wrapper.unmount();
            document.body.innerHTML = '';
        }
    });
});
