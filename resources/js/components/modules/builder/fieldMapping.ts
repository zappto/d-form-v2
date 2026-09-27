/**
 * Maps between the rich builder field types (17) and the 5 backend API types.
 * Backend API_TYPES: input, select, textarea, datePicker, fileUpload
 */

import type { BackendField, BuilderField, FieldOptionEntry } from '@/types/form-builder';

export type { BackendField, BuilderField, FieldOptionEntry };

/** Label opsi yang sudah di-trim; dipakai saat menampilkan dan menyerialkan pilihan field. */
export function optionLabel(entry: FieldOptionEntry): string {
    return String(entry.label ?? '').trim();
}

/** URL gambar opsi yang sudah di-trim, atau undefined bila kosong; dipakai render opsi bergambar. */
export function optionImageUrl(entry: FieldOptionEntry): string | undefined {
    return entry.imageUrl?.trim() || undefined;
}

function serializeOptionChoices(options: readonly FieldOptionEntry[]): Record<string, unknown>[] {
    return options.map((o) => {
        const label = String(o.label ?? '').trim();
        // File pending → kirim imageUrl '' agar tak ada base64 baru yang
        // tertulis; server mengganti dengan stored path hasil upload.
        const hasPendingFile = o.imageFile instanceof File;
        return {
            id: o.id,
            type: o.type,
            label,
            imageUrl: hasPendingFile ? '' : (o.imageUrl ?? ''),
        };
    });
}

function parseOptionChoices(raw: unknown): FieldOptionEntry[] | null {
    if (!Array.isArray(raw)) return null;
    const out: FieldOptionEntry[] = [];
    for (const item of raw) {
        if (item && typeof item === 'object' && item !== null) {
            const row = item as Record<string, unknown>;
            const id = String(row.id ?? crypto.randomUUID());
            const type = row.type === 'image' ? 'image' : 'text';
            const label = String(row.label ?? '').trim();
            const imageUrl = String(row.imageUrl ?? '').trim();
            out.push({ id, type, label, imageUrl });
        } else if (typeof item === 'string') {
            const label = item.trim();
            out.push({ id: crypto.randomUUID(), type: 'text', label });
        }
    }
    return out.length > 0 ? out : null;
}

function preservedMeta(f: BuilderField): Record<string, unknown> {
    const raw = f.metadata && typeof f.metadata === 'object' && !Array.isArray(f.metadata) ? { ...f.metadata } : {};
    // API validation allows only string|null for metadata.options (radio/checkbox).
    // Stale array-shaped `options` from DB or legacy clients must not be re-submitted.
    delete raw.options;
    return raw;
}

function withMeta(f: BuilderField, specific: Record<string, unknown>): Record<string, unknown> {
    return { ...preservedMeta(f), ...specific };
}

/** Batas panjang teks untuk short/long — disimpan sebagai rules.min (0) + rules.max di API. */
function mergeTextRules(req: Record<string, unknown>, f: BuilderField): Record<string, unknown> {
    const merged = { ...req };
    const raw = f.metadata?.maxLength;
    const n =
        typeof raw === 'number' ? raw : raw != null && String(raw).trim() !== '' ? parseInt(String(raw), 10) : NaN;
    if (Number.isFinite(n) && n > 0) {
        merged.min = 0;
        merged.max = Math.min(Math.floor(n), 100_000);
    }
    return merged;
}

/** Konversi field builder ke payload backend (5 tipe API) lengkap dengan metadata/rules; dipakai saat simpan form. */
export function toBackendField(f: BuilderField, order: number): BackendField {
    const base = {
        id: f.id,
        label: f.label,
        description: f.description || null,
        name: f.name || `field_${f.id.replace(/-/g, '').slice(0, 12)}`,
        order,
        is_append: f.is_append === true,
    };
    const req: Record<string, unknown> = f.required ? { required: true } : {};

    switch (f.type) {
        case 'short_text':
            return {
                ...base,
                type: 'input',
                metadata: withMeta(f, {
                    type: 'text',
                    placeholder: f.placeholder || '',
                    rules: mergeTextRules(req, f),
                    builderType: 'short_text',
                }),
            };
        case 'email':
            return {
                ...base,
                type: 'input',
                metadata: withMeta(f, {
                    type: 'email',
                    placeholder: f.placeholder || '',
                    rules: req,
                    builderType: 'email',
                }),
            };
        case 'phone':
            return {
                ...base,
                type: 'input',
                metadata: withMeta(f, {
                    type: 'tel',
                    placeholder: f.placeholder || '',
                    rules: req,
                    builderType: 'phone',
                }),
            };
        case 'number':
            return {
                ...base,
                type: 'input',
                metadata: withMeta(f, {
                    type: 'number',
                    placeholder: f.placeholder || '',
                    rules: req,
                    builderType: 'number',
                }),
            };
        case 'time':
            return {
                ...base,
                type: 'input',
                metadata: withMeta(f, { type: 'text', placeholder: 'HH:MM', rules: req, builderType: 'time' }),
            };
        case 'rating':
            return {
                ...base,
                type: 'input',
                metadata: withMeta(f, {
                    type: 'number',
                    placeholder: '',
                    rules: { ...req, min: 1, max: (f.metadata?.maxStars as number) ?? 5 },
                    builderType: 'rating',
                    maxStars: (f.metadata?.maxStars as number) ?? 5,
                }),
            };
        case 'heading':
            return {
                ...base,
                type: 'input',
                metadata: withMeta(f, {
                    type: 'text',
                    placeholder: '',
                    rules: {},
                    builderType: 'heading',
                    content: (f.metadata?.content as string) || 'Section Heading',
                }),
            };
        case 'divider':
            return {
                ...base,
                type: 'input',
                metadata: withMeta(f, { type: 'text', placeholder: '', rules: {}, builderType: 'divider' }),
            };

        case 'long_text':
            return {
                ...base,
                type: 'textarea',
                metadata: withMeta(f, {
                    placeholder: f.placeholder || '',
                    rules: mergeTextRules(req, f),
                    builderType: 'long_text',
                }),
            };
        case 'paragraph':
            return {
                ...base,
                type: 'textarea',
                metadata: withMeta(f, {
                    placeholder: '',
                    rules: {},
                    builderType: 'paragraph',
                    content: (f.metadata?.content as string) || '',
                }),
            };

        case 'dropdown': {
            const choices = serializeOptionChoices(
                (f.options || []).map((opt) => ({
                    ...opt,
                    type: 'text',
                    imageUrl: '',
                    label: String(opt.label ?? '').trim(),
                }))
            );
            const inCsv = choices.map((c) => c.label).join(',');
            return {
                ...base,
                type: 'select',
                metadata: withMeta(f, {
                    is_multiple: false,
                    rules: { ...req, in: inCsv },
                    builderType: 'dropdown',
                    optionChoices: choices,
                }),
            };
        }
        case 'checkbox': {
            const choices = serializeOptionChoices(f.options || []);
            const inCsv = choices.map((c) => c.label).join(',');
            return {
                ...base,
                type: 'checkbox',
                metadata: withMeta(f, {
                    is_multiple: true,
                    rules: { ...req, in: inCsv },
                    builderType: 'checkbox',
                    optionChoices: choices,
                }),
            };
        }
        case 'radio': {
            const choices = serializeOptionChoices(f.options || []);
            const inCsv = choices.map((c) => c.label).join(',');
            return {
                ...base,
                type: 'radio',
                metadata: withMeta(f, {
                    is_multiple: false,
                    rules: { ...req, in: inCsv },
                    builderType: 'radio',
                    optionChoices: choices,
                }),
            };
        }

        case 'date':
            return { ...base, type: 'datePicker', metadata: withMeta(f, { rules: req, builderType: 'date' }) };
        case 'image_upload': {
            const mimes = ((f.metadata?.accepts as string) || '').trim().replace(/\s+/g, '') || 'png,jpg,jpeg';
            return {
                ...base,
                type: 'fileUpload',
                metadata: withMeta(f, { rules: { ...req, mimes, max_size: 5120 }, builderType: 'image_upload' }),
            };
        }
        case 'file_upload': {
            const mimes = ((f.metadata?.accepts as string) || '').trim().replace(/\s+/g, '') || 'pdf,doc,xls';
            return {
                ...base,
                type: 'fileUpload',
                metadata: withMeta(f, { rules: { ...req, mimes, max_size: 10240 }, builderType: 'file_upload' }),
            };
        }
        case 'banner':
            return {
                ...base,
                type: 'fileUpload',
                metadata: withMeta(f, {
                    rules: {},
                    builderType: 'banner',
                    accepts: 'gif, png, jpg, jpeg',
                    bannerUrl: (f.metadata?.bannerUrl as string) || '',
                    bannerFileName: (f.metadata?.bannerFileName as string) || '',
                    content: (f.metadata?.content as string) || '',
                    formBanner: Boolean(f.metadata?.formBanner),
                }),
            };

        default:
            return { ...base, type: 'input', metadata: withMeta(f, { type: 'text', placeholder: '', rules: req }) };
    }
}

function guessType(apiType: string, m: Record<string, unknown>): string {
    if (apiType === 'input') {
        if (m.type === 'email') return 'email';
        if (m.type === 'tel') return 'phone';
        if (m.type === 'number') return 'number';
        return 'short_text';
    }
    if (apiType === 'textarea') return 'long_text';
    if (apiType === 'select') return m.is_multiple ? 'checkbox' : 'dropdown';
    if (apiType === 'checkbox') return 'checkbox';
    if (apiType === 'radio') return 'radio';
    if (apiType === 'datePicker') return 'date';
    if (apiType === 'fileUpload') return 'file_upload';
    return 'short_text';
}

/** Konversi field backend ke bentuk builder (menebak tipe builder bila metadata minim); dipakai saat memuat form ke editor. */
export function fromBackendField(bf: BackendField): BuilderField {
    const mFull: Record<string, unknown> =
        bf.metadata && typeof bf.metadata === 'object' ? (bf.metadata as Record<string, unknown>) : {};
    const m: Record<string, unknown> = { ...mFull };
    delete m.options;
    const rules = (m.rules as Record<string, unknown>) || {};
    const bt = (m.builderType as string) || guessType(bf.type, m);
    const inStr = (rules.in as string) || '';
    const parsedChoices = parseOptionChoices(m.optionChoices);
    const optsRaw: FieldOptionEntry[] =
        parsedChoices ??
        (['dropdown', 'checkbox', 'radio'].includes(bt)
            ? inStr
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((label) => ({ id: crypto.randomUUID(), type: 'text' as const, label }))
            : []);
    const opts: FieldOptionEntry[] =
        bt === 'dropdown'
            ? optsRaw.map((opt) => ({
                  ...opt,
                  type: 'text',
                  imageUrl: '',
                  label: String(opt.label ?? '').trim(),
              }))
            : optsRaw;

    const maxFromRules = rules.max;
    let maxLengthForMeta: number | undefined;
    if (['short_text', 'long_text'].includes(bt) && maxFromRules != null && String(maxFromRules) !== '') {
        const n = Number(maxFromRules);
        if (Number.isFinite(n) && n > 0) {
            maxLengthForMeta = n;
        }
    }

    return {
        id: bf.id,
        type: bt,
        label: bf.label || '',
        description: bf.description || '',
        name: bf.name || '',
        placeholder: (m.placeholder as string) || '',
        required: !!rules.required,
        options: opts,
        is_append: bf.is_append === true,
        order: bf.order,
        metadata: {
            ...m,
            maxStars: (m.maxStars as number) || 5,
            accepts: ((rules.mimes as string) || '').replace(/,/g, ', '),
            formBanner: m.formBanner === true,
            ...(maxLengthForMeta != null ? { maxLength: maxLengthForMeta } : {}),
        },
    };
}

/**
 * Spaced ordering (anti order-shift): gap antar baris 1000.
 * Insert baru dialokasikan di tengah antar tetangga (midpoint; di ujung
 * tetangga ± 1000), baris existing TAK dinomori ulang sehingga diff
 * per-id hanya menandai baris baru sebagai kotor.
 * Backend memvalidasi `order` integer min:0 + mengurutkan numerik murni
 * (ORDER BY `order` + index komposit) sehingga nilai spaced tetap valid.
 */
export const FIELD_ORDER_GAP = 1000;

/** Alokasi satu order di antara tetangga (edge ± GAP, tengah midpoint floor). */
export function allocateSpacedOrder(prev: number | null, next: number | null): number {
    if (prev === null && next === null) return FIELD_ORDER_GAP;
    if (prev === null) return (next as number) - FIELD_ORDER_GAP;
    if (next === null) return prev + FIELD_ORDER_GAP;
    return Math.floor((prev + next) / 2);
}

function asKnownOrder(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Math.trunc(value);
}

/**
 * Alokasikan `count` order integer >=0 strictly di antara anchor.
 * Null bila tak ada slot integer (pemanggil fallback rebalance penuh).
 */
export function allocateOrderRun(prev: number | null, next: number | null, count: number): number[] | null {
    if (count <= 0) return [];
    if (prev === null && next === null) {
        return Array.from({ length: count }, (_, i) => (i + 1) * FIELD_ORDER_GAP);
    }
    if (prev === null && next !== null) {
        const spacedFirst = next - count * FIELD_ORDER_GAP;
        if (spacedFirst >= 0) {
            return Array.from({ length: count }, (_, i) => spacedFirst + i * FIELD_ORDER_GAP);
        }
        // Fallback padat: [next-count, .., next-1] bila muat di >=0.
        if (next >= count && next > 0) {
            return Array.from({ length: count }, (_, i) => next - count + i);
        }
        return null;
    }
    if (prev !== null && next === null) {
        return Array.from({ length: count }, (_, i) => prev + (i + 1) * FIELD_ORDER_GAP);
    }
    const gap = (next as number) - (prev as number);
    if (gap <= count) return null;
    const step = Math.floor(gap / (count + 1));
    if (step < 1) return null;
    return Array.from({ length: count }, (_, i) => (prev as number) + (i + 1) * step);
}

function prevMapFrom(prevOrders: Map<string, number> | BackendField[] | null | undefined): Map<string, number> {
    if (prevOrders instanceof Map) return prevOrders;
    const map = new Map<string, number>();
    if (Array.isArray(prevOrders)) {
        for (const row of prevOrders) {
            const order = asKnownOrder(row?.order);
            if (typeof row?.id === 'string' && order !== null) map.set(row.id, order);
        }
    }
    return map;
}

/**
 * Konversi canvas → backend dengan order spaced.
 * - Baris existing (order terbawa via `BuilderField.order` atau `prevOrders`)
 *   dipertahankan apa adanya bila urutan kanvas masih menaik.
 * - Baris baru (tanpa order dikenal) dialokasikan midpoint antar tetangga.
 * - Reorder eksplisit (urutan dikenal tak lagi menaik) menulis ulang HANYA
 *   rentang kanvas yang dipindah (genuinely kotor); bila slot integer habis,
 *   fallback rebalance penuh `(i+1)*GAP` (langka: >10 insert di celah sama).
 */
export function toBackendFields(
    builderFields: BuilderField[],
    prevOrders?: Map<string, number> | BackendField[] | null
): BackendField[] {
    const n = builderFields.length;
    if (n === 0) return [];
    const prevMap = prevMapFrom(prevOrders);
    const known: (number | null)[] = builderFields.map((f) => {
        const carried = asKnownOrder(f.order);
        if (carried !== null) return carried;
        const prev = prevMap.get(f.id);
        return asKnownOrder(prev ?? null);
    });

    if (!known.some((v) => v !== null)) {
        return builderFields.map((f, i) => toBackendField(f, (i + 1) * FIELD_ORDER_GAP));
    }

    const knownSeq: Array<{ idx: number; order: number }> = [];
    known.forEach((v, idx) => {
        if (v !== null) knownSeq.push({ idx, order: v });
    });
    let increasing = true;
    for (let k = 1; k < knownSeq.length; k++) {
        if (knownSeq[k].order <= knownSeq[k - 1].order) {
            increasing = false;
            break;
        }
    }

    const resultOrders: number[] = new Array<number>(n);

    if (increasing) {
        known.forEach((v, i) => {
            if (v !== null) resultOrders[i] = v;
        });
        let i = 0;
        while (i < n) {
            if (known[i] !== null) {
                i++;
                continue;
            }
            let j = i;
            while (j < n && known[j] === null) j++;
            const count = j - i;
            const prevVal: number | null = i > 0 ? resultOrders[i - 1] : null;
            const nextVal: number | null = j < n ? (known[j] as number) : null;
            const alloc = allocateOrderRun(prevVal, nextVal, count);
            if (alloc === null) {
                return builderFields.map((f, k) => toBackendField(f, (k + 1) * FIELD_ORDER_GAP));
            }
            for (let k = 0; k < count; k++) resultOrders[i + k] = alloc[k];
            i = j;
        }
        return builderFields.map((f, idx) => toBackendField(f, resultOrders[idx]));
    }

    // ── Reorder eksplisit: tulis ulang hanya rentang yang dipindah ──
    let firstInvSeq = -1;
    let lastInvSeq = -1;
    for (let k = 1; k < knownSeq.length; k++) {
        if (knownSeq[k].order <= knownSeq[k - 1].order) {
            if (firstInvSeq === -1) firstInvSeq = k - 1;
            lastInvSeq = k;
        }
    }
    const lo = knownSeq[firstInvSeq].idx;
    const hi = knownSeq[lastInvSeq].idx;
    const prevAnchor: number | null = firstInvSeq > 0 ? knownSeq[firstInvSeq - 1].order : null;
    const nextAnchor: number | null = lastInvSeq + 1 < knownSeq.length ? knownSeq[lastInvSeq + 1].order : null;
    const windowSize = hi - lo + 1;
    const windowAlloc = allocateOrderRun(prevAnchor, nextAnchor, windowSize);
    if (windowAlloc === null) {
        return builderFields.map((f, k) => toBackendField(f, (k + 1) * FIELD_ORDER_GAP));
    }
    for (let k = 0; k < windowSize; k++) resultOrders[lo + k] = windowAlloc[k];
    // Known di luar window dipertahankan.
    known.forEach((v, i) => {
        if (v !== null && (i < lo || i > hi)) resultOrders[i] = v;
    });
    // Unknown di luar window dialokasikan seperti kasus increasing.
    let i = 0;
    while (i < n) {
        if (i >= lo && i <= hi) {
            i = hi + 1;
            continue;
        }
        if (known[i] !== null) {
            i++;
            continue;
        }
        let j = i;
        while (j < n && !(j >= lo && j <= hi) && known[j] === null) j++;
        // j berhenti di window atau known berikutnya; next anchor = resultOrders[j] bila j di window/known.
        const count = j - i;
        const prevVal: number | null = i > 0 ? resultOrders[i - 1] : null;
        let nextVal: number | null = null;
        if (j < n) {
            if (j >= lo && j <= hi) nextVal = resultOrders[j];
            else if (known[j] !== null) nextVal = known[j] as number;
            else nextVal = null;
        }
        const alloc = allocateOrderRun(prevVal, nextVal, count);
        if (alloc === null) {
            return builderFields.map((f, k) => toBackendField(f, (k + 1) * FIELD_ORDER_GAP));
        }
        for (let k = 0; k < count; k++) resultOrders[i + k] = alloc[k];
        i = j;
    }
    return builderFields.map((f, idx) => toBackendField(f, resultOrders[idx]));
}
