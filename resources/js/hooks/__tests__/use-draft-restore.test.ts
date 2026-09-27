import { beforeEach, describe, expect, it } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { buildValuesDraftSnapshot, useDraftRestore, type IDraftValuesSnapshot } from '../useDraftRestore';
import type { TFormFillAnswerMap } from '@/types/form';

const KEY = 'dform:test-restore';

beforeEach(() => {
    window.localStorage.clear();
});

/** Host tipis agar onMounted/onBeforeUnmount hook berjalan seperti di halaman. */
function mountRestoreHost(args: {
    snapshot: () => string;
    storageKey: string;
    restoreIntoForm: (draft: IDraftValuesSnapshot) => void;
}) {
    const applied = ref<IDraftValuesSnapshot | null>(null);
    const host = defineComponent({
        setup() {
            const draft = useDraftRestore({
                snapshot: args.snapshot,
                storageKey: args.storageKey,
                restoreIntoForm: (parsed: IDraftValuesSnapshot) => {
                    applied.value = parsed;
                    args.restoreIntoForm(parsed);
                },
            });
            const label = computed<string>(() => draft.savedTimeLabel.value);
            return () =>
                h(
                    'div',
                    { id: 'draft-label' },
                    `${draft.status.value}|${label.value}|${draft.lastSavedAt.value === null ? 'empty' : 'set'}`
                );
        },
    });
    const wrapper = mount(host);
    return { applied, wrapper };
}

describe('useDraftRestore', () => {
    it('restore toleran: key hilang/korup tidak memanggil apply; valid menuangkan ke form', () => {
        const seen: IDraftValuesSnapshot[] = [];
        const first = mountRestoreHost({
            snapshot: () => '{}',
            storageKey: KEY,
            restoreIntoForm: (parsed: IDraftValuesSnapshot) => {
                seen.push(parsed);
            },
        });
        expect(seen).toEqual([]);
        first.wrapper.unmount();

        window.localStorage.setItem(KEY, 'bukan-json{{{');
        const second = mountRestoreHost({
            snapshot: () => '{}',
            storageKey: KEY,
            restoreIntoForm: (parsed: IDraftValuesSnapshot) => {
                seen.push(parsed);
            },
        });
        expect(seen).toEqual([]);
        second.wrapper.unmount();

        window.localStorage.setItem(KEY, JSON.stringify({ values: { full_name: 'Ayu' } }));
        const form = ref<TFormFillAnswerMap>({ full_name: '' });
        const third = mountRestoreHost({
            snapshot: () => JSON.stringify({ values: form.value }),
            storageKey: KEY,
            restoreIntoForm: (parsed: IDraftValuesSnapshot) => {
                const name = parsed.values.full_name;
                if (typeof name === 'string') form.value.full_name = name;
            },
        });
        expect(form.value.full_name).toBe('Ayu');
        expect(third.applied.value).toEqual({ values: { full_name: 'Ayu' } });
        third.wrapper.unmount();
    });

    it('status gabungan + label jam: idle lalu saved berlabel id-ID setelah schedule', async () => {
        const text = ref('{"values":{"nama":"Ayu"}}');
        const host = defineComponent({
            setup() {
                const draft = useDraftRestore({
                    snapshot: () => text.value,
                    storageKey: KEY,
                    restoreIntoForm: () => {},
                });
                return () =>
                    h(
                        'div',
                        `${draft.status.value}|${draft.savedTimeLabel.value}|${draft.lastSavedAt.value === null ? 'empty' : 'set'}`
                    );
            },
        });
        const wrapper = mount(host);
        expect(wrapper.text()).toMatch(/^idle\|/);

        text.value = '{"values":{"nama":"Budi"}}';
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        const rendered: string = wrapper.text();
        expect(rendered).toMatch(/^saved\|/);
        expect(rendered).toContain('|set');
        const label: string = rendered.split('|')[1] ?? '';
        expect(label.length).toBeGreaterThan(0);
        wrapper.unmount();
    });

    it('clear menghapus key + reset label; unmount membatalkan timer tanpa error', () => {
        window.localStorage.setItem(KEY, '{"values":{"a":"1"}}');
        const text = ref('{"values":{"a":"1"}}');
        const host = defineComponent({
            setup() {
                const draft = useDraftRestore({
                    snapshot: () => text.value,
                    storageKey: KEY,
                    restoreIntoForm: () => {},
                });
                return { draft };
            },
            render() {
                return h('div', 'host');
            },
        });
        const wrapper = mount(host);
        const exposed = wrapper.vm.draft;
        expect(window.localStorage.getItem(KEY)).not.toBeNull();
        exposed.clear();
        expect(window.localStorage.getItem(KEY)).toBeNull();
        expect(exposed.status.value).toBe('idle');
        wrapper.unmount();
    });

    it('snapshot File dikecualikan; kunci internal Inertia dilewati', () => {
        const form = {
            full_name: 'Ayu',
            isDirty: true,
            errors: {},
            data: () => ({ full_name: 'Ayu' }),
            post: () => {},
            cv: new File(['isi'], 'cv.pdf'),
        };
        const parsed: IDraftValuesSnapshot = JSON.parse(buildValuesDraftSnapshot(form));
        expect(parsed.values.full_name).toBe('Ayu');
        expect(parsed.values).not.toHaveProperty('isDirty');
        expect(parsed.values).not.toHaveProperty('errors');
        expect(parsed.values).not.toHaveProperty('post');
        expect(parsed.values).not.toHaveProperty('cv');
    });
});
