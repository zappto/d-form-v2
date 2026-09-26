import type { BackendField, BuilderField } from '@/types/form-builder'
import { diffBackendFields, type DirtyFieldsDiff } from '@/components/modules/builder/dirtyFields'
import { toBackendFields } from '@/components/modules/builder/fieldMapping'
import { prependFormBannerToBackendPayload, type FormBannerState } from '@/components/modules/builder/formBanner'

/**
 * Guard hydrate anti-timpa (Fase 1-B): lewati hydrate bila draft id SAMA dan
 * ada perubahan lokal yang belum tersimpan sukses.
 * Mount segar (lastHydratedId null) / id berubah → hydrate normal (false).
 * File banner pending ikut terjaga: bannerFile yang dibuang hydrate
 * (bannerFile=null) dianggap kotor walau snapshot string kebetulan sama.
 */
export function shouldSkipHydrate(args: {
    lastHydratedId: string | null
    currentId: string
    lastCleanSnapshot: string | null
    currentSnapshot: string
    hasPendingBannerFile: boolean
}): boolean {
    if (args.lastHydratedId === null) return false
    if (args.lastHydratedId !== args.currentId) return false
    if (args.lastCleanSnapshot === null) return false
    if (args.hasPendingBannerFile) return true
    return args.currentSnapshot !== args.lastCleanSnapshot
}

export interface UnloadBeaconPayload {
    fields: BackendField[]
    deleted_ids: string[]
}

/**
 * Bangun payload sendBeacon unload (Fase 1-A): full fields + deleted_ids
 * terkini. Null bila tak ada yang perlu dikirim (steady-empty / bersih).
 * Pure + testable; pengiriman via navigator.sendBeacon ada di halaman.
 */
export function buildUnloadPayload(args: {
    canvasFields: BuilderField[]
    banner: FormBannerState
    lastSent: BackendField[] | null
}): UnloadBeaconPayload | null {
    const merged = prependFormBannerToBackendPayload(args.canvasFields, args.banner)
    const backend = toBackendFields(merged, args.lastSent)
    const diff: DirtyFieldsDiff = diffBackendFields(backend, args.lastSent)
    if (backend.length === 0 && diff.deletedIds.length === 0) return null
    if (!diff.hasChanges) return null
    return { fields: backend, deleted_ids: diff.deletedIds }
}
