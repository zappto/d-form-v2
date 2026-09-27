import { describe, expect, it } from 'vitest'
import { eventStatusUi } from '@/lib/eventShowUi'

describe('eventStatusUi (Mx-B status kanonik)', () => {
    it('memetakan label kanonik', () => {
        expect(eventStatusUi('not_yet_open').label).toBe('Segera Dibuka')
        expect(eventStatusUi('open').label).toBe('Dibuka')
        expect(eventStatusUi('closed').label).toBe('Ditutup')
        expect(eventStatusUi('full').label).toBe('Penuh')
    })
    it('memetakan kelas badge kanonik', () => {
        expect(eventStatusUi('not_yet_open').tone).toBe('border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-400')
        expect(eventStatusUi('open').tone).toBe('border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400')
        expect(eventStatusUi('closed').tone).toBe('border-border bg-muted/60 text-muted-foreground')
        expect(eventStatusUi('full').tone).toBe('border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400')
    })
})
