import type { BackendField } from '@/types/formBuilder';

export interface IDirtyFieldsDiff {
    dirty: BackendField[];
    deletedIds: string[];
    hasChanges: boolean;
}

function cloneRows(rows: BackendField[]): BackendField[] {
    return JSON.parse(JSON.stringify(rows)) as BackendField[];
}

/** Salinan snapshot backend terakhir yang sukses terkirim (per id). */
export function snapshotBackendFields(rows: BackendField[]): BackendField[] {
    return cloneRows(rows);
}

/**
 * Diff backend saat ini vs snapshot sukses terakhir, per id.
 * Baris kotor = id baru ATAU serialisasi berubah (termasuk `order`).
 * Id snapshot yang tak ada lagi di current = dihapus eksplisit.
 */
export function diffBackendFields(current: BackendField[], lastSent: BackendField[] | null): IDirtyFieldsDiff {
    if (lastSent === null) {
        return { dirty: [...current], deletedIds: [], hasChanges: true };
    }
    const prevById = new Map<string, string>();
    for (const row of lastSent) {
        prevById.set(row.id, JSON.stringify(row));
    }
    const currentIds = new Set<string>();
    const dirty: BackendField[] = [];
    for (const row of current) {
        currentIds.add(row.id);
        if (prevById.get(row.id) !== JSON.stringify(row)) {
            dirty.push(row);
        }
    }
    const deletedIds = lastSent.map((row) => row.id).filter((id) => !currentIds.has(id));
    return { dirty, deletedIds, hasChanges: dirty.length > 0 || deletedIds.length > 0 };
}
