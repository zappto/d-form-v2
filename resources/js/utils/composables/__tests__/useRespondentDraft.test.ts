import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useRespondentDraft } from '../useRespondentDraft'

const KEY = 'dform:test-draft'
const LEGACY_KEY = 'oprec-apply-draft-v1'

beforeEach(() => {
    window.localStorage.clear()
    vi.useRealTimers()
})

describe('useRespondentDraft', () => {
    it('write: schedule menulis sinkron + lastSavedAt ter-set + status saved', async () => {
        const text = ref('{"values":{"nama":"Ayu"}}')
        const draft = useRespondentDraft<{ values: { nama: string } }>(() => text.value, KEY, {
            debounceMs: 800,
        })

        expect(draft.status.value).toBe('idle')
        expect(draft.lastSavedAt.value).toBeNull()

        text.value = '{"values":{"nama":"Budi"}}'
        await nextTick()

        expect(window.localStorage.getItem(KEY)).toBe('{"values":{"nama":"Budi"}}')
        expect(draft.lastSavedAt.value).toBeInstanceOf(Date)
        expect(draft.status.value).toBe('saved')

        draft.cancel()
    })

    it('restore: kembalikan parsed atau null (hilang / korup)', () => {
        const draft = useRespondentDraft<{ step: number }>(() => '{}', KEY)

        expect(draft.restore()).toBeNull()

        window.localStorage.setItem(KEY, '{"step":2}')
        expect(draft.restore()).toEqual({ step: 2 })

        window.localStorage.setItem(KEY, 'bukan-json{{{')
        expect(draft.restore()).toBeNull()

        draft.cancel()
    })

    it('clear: hapus key + reset lastSavedAt + status idle', async () => {
        const text = ref('{"values":{"a":"1"}}')
        const draft = useRespondentDraft<{ values: unknown }>(() => text.value, KEY)

        draft.schedule()
        expect(window.localStorage.getItem(KEY)).not.toBeNull()
        expect(draft.lastSavedAt.value).toBeInstanceOf(Date)

        draft.clear()
        expect(window.localStorage.getItem(KEY)).toBeNull()
        expect(draft.lastSavedAt.value).toBeNull()
        expect(draft.status.value).toBe('idle')
    })

    it('compat: key lama oprec-apply-draft-v1 format {step, values} terbaca', () => {
        window.localStorage.setItem(
            LEGACY_KEY,
            JSON.stringify({ step: 2, values: { full_name: 'Ayu', nim: 'A11' } }),
        )
        const draft = useRespondentDraft<{ step?: unknown; values?: unknown }>(
            () => JSON.stringify({ step: 1, values: {} }),
            LEGACY_KEY,
        )

        const parsed = draft.restore()
        expect(parsed).toEqual({ step: 2, values: { full_name: 'Ayu', nim: 'A11' } })

        draft.cancel()
    })

    it('flush tanpa error walau save no-op (async () => false)', async () => {
        const draft = useRespondentDraft<unknown>(() => '{"values":{}}', KEY)
        draft.schedule()
        await expect(draft.flush()).resolves.toBeUndefined()
        // Draft lokal tetap tersimpan walau remote no-op.
        expect(window.localStorage.getItem(KEY)).toBe('{"values":{}}')
        expect(draft.lastSavedAt.value).toBeInstanceOf(Date)
        draft.cancel()
    })
})
