/** Parse kategori acara dari array atau string ber-koma menjadi daftar string; dipakai di halaman detail acara. */
export function parseEventCategories(raw: unknown): string[] {
    if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
    if (typeof raw === 'string')
        return raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    return [];
}

export interface IEventStatusUi {
    label: string;
    tone: string;
}

const EVENT_STATUS_UI: Record<TEventRegistrationStatus, IEventStatusUi> = {
    not_yet_open: {
        label: 'Segera Dibuka',
        tone: 'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-400',
    },
    open: { label: 'Dibuka', tone: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    closed: { label: 'Ditutup', tone: 'border-border bg-muted/60 text-muted-foreground' },
    full: { label: 'Penuh', tone: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400' },
};

/** Label + kelas badge kanonik untuk satu status registrasi (satu sumber kebenaran). */
export function eventStatusUi(status: TEventRegistrationStatus): IEventStatusUi {
    return EVENT_STATUS_UI[status];
}
