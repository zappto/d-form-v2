import { computed, ref } from 'vue'
import { showErrorToast } from '@/lib/error-message'
import { useQrCamera } from '@/hooks/useQrCamera'
import { useQrFeed, type TQrScanSource } from '@/hooks/useQrFeed'
import type { ScanEntry, ScanResult } from '@/lib/qrScanUi'

export interface GlobalScanTargets {
    sessions: Array<{ id: string } & Record<string, unknown>>
    events: Array<{ id: string | number } & Record<string, unknown>>
}

export interface GlobalScanTargetOption {
    id: string
    label: string
    kind: 'event' | 'oprec'
    /**
     * Teks pembanding yang dipakai untuk mencocokkan opsi filter dengan
     * `eventTitle` pada entri riwayat scan. Untuk event = judul event; untuk
     * oprec = "Divisi · tanggal" seperti yang dikirim backend pada `eventTitle`
     * (mis. "Oprec · Divisi Acara · 2026-05-01").
     */
    matchKey: string
}

export interface GlobalScanSummary {
    total: number
    success: number
    already: number
    invalid: number
}

function formatSessionDate(raw: string): string {
    const text: string = raw.trim()
    if (text.length === 0) {
        return ''
    }

    const parsed = new Date(text)
    if (Number.isNaN(parsed.getTime())) {
        return text
    }

    return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function readRecordString(record: Record<string, unknown>, key: string): string {
    const value: unknown = record[key]

    return typeof value === 'string' ? value : ''
}

function sessionDivisionName(session: { id: string } & Record<string, unknown>): string {
    const division: unknown = session.division
    if (typeof division === 'object' && division !== null) {
        const name: unknown = (division as Record<string, unknown>).name
        if (typeof name === 'string' && name.trim().length > 0) {
            return name.trim()
        }
    }

    return 'Interview'
}

function sessionOptionLabel(session: { id: string } & Record<string, unknown>): string {
    const divisionName = sessionDivisionName(session)
    const date = formatSessionDate(readRecordString(session, 'session_date'))

    return date.length > 0 ? `${divisionName} · ${date}` : divisionName
}

/**
 * Backend menyusun `eventTitle` oprec sebagai
 * `Oprec · {division.name} · {session_date}`. Kunci ini meniru bagian setelah
 * prefix "Oprec · " agar cocok dengan entri riwayat hasil scan.
 */
function sessionMatchKey(session: { id: string } & Record<string, unknown>): string {
    const divisionName = sessionDivisionName(session)
    const rawDate = readRecordString(session, 'session_date')

    return `${divisionName} · ${rawDate}`
}

function eventOptionLabel(event: { id: string | number } & Record<string, unknown>): string {
    const title = readRecordString(event, 'title')

    return title.length > 0 ? title : `Event ${String(event.id)}`
}

function normalizeMatchText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Kamera QR, umpan hasil scan, opsi target filter, dan ringkasan halaman scan QR global. */
export function useGlobalQrScanPage(
    scannerContainerId: string,
    storeUrl: string,
    feedUrl: string,
    getTargets: () => GlobalScanTargets,
) {
    const registrationCodeInput = ref('')
    const selectedTarget = ref('all')
    const logExpanded = ref(false)
    const logQuery = ref('')

    const camera = useQrCamera({
        containerId: scannerContainerId,
        onDecode: (decodedText) => processScan(decodedText, 'camera'),
    })
    const feed = useQrFeed({ storeUrl, feedUrl })

    function processScan(decodedText: string, source: TQrScanSource): void {
        if (source === 'camera' && camera.isShutterActive.value) {
            return
        }

        if (!feed.acceptScanInput(decodedText)) {
            return
        }

        if (source === 'camera') {
            camera.triggerShutter()
        }

        void feed.submitScan({ raw: decodedText, source })
    }

    function submitScanPayload(raw: string, source: TQrScanSource): Promise<void> {
        return feed.submitScan({ raw, source })
    }

    const targetOptions = computed<GlobalScanTargetOption[]>(() => {
        const targets = getTargets()

        return [
            ...targets.sessions.map((session) => ({
                id: String(session.id),
                label: sessionOptionLabel(session),
                kind: 'oprec' as const,
                matchKey: sessionMatchKey(session),
            })),
            ...targets.events.map((event) => ({
                id: String(event.id),
                label: eventOptionLabel(event),
                kind: 'event' as const,
                matchKey: eventOptionLabel(event),
            })),
        ]
    })

    const selectedTargetOption = computed<GlobalScanTargetOption | null>(() => {
        if (selectedTarget.value === 'all') {
            return null
        }

        return targetOptions.value.find((candidate) => candidate.id === selectedTarget.value) ?? null
    })

    /** Nama acara yang sedang dipilih, atau "Semua acara" saat filter netral. */
    const selectedTargetLabel = computed<string>(() => selectedTargetOption.value?.label ?? 'Semua acara')

    /**
     * Filter acara bersifat global: KPI, hero "Hasil Scan Terakhir", dan riwayat
     * semuanya membaca dari `targetEntries`. Saat filter "Semua acara", perilaku
     * kembali ke seluruh riwayat. Pencarian `logQuery` tetap diterapkan terpisah di
     * QrScanSidebar sehingga filter acara dan pencarian bisa dipakai bersamaan.
     */
    const targetEntries = computed<ScanEntry[]>(() => {
        const option = selectedTargetOption.value
        if (option === null) {
            return feed.scanHistory.value
        }

        const wanted = normalizeMatchText(option.matchKey)
        if (wanted.length === 0) {
            return []
        }

        return feed.scanHistory.value.filter((entry) => {
            if (entry.eventKind !== option.kind) {
                return false
            }

            const haystack = normalizeMatchText(entry.eventTitle)
            if (haystack.length === 0) {
                return false
            }

            // Event: judul harus sama persis. Oprec: `eventTitle` backend
            // berformat "Oprec · Divisi · tanggal", cukup dicocokkan sebagian.
            return option.kind === 'event' ? haystack === wanted : haystack.includes(wanted)
        })
    })

    const logEntries = computed<ScanEntry[]>(() => targetEntries.value)

    const todayEntries = computed<ScanEntry[]>(() => targetEntries.value.filter((entry) => feed.isTodayEntry(entry)))
    const successfulScansCount = computed(() => todayEntries.value.filter((entry) => entry.status === 'success').length)
    const duplicateScansCount = computed(() => todayEntries.value.filter((entry) => entry.status === 'already').length)
    const invalidScansCount = computed(() => todayEntries.value.filter((entry) => entry.status === 'invalid').length)

    const summary = computed<GlobalScanSummary>(() => ({
        total: todayEntries.value.length,
        success: successfulScansCount.value,
        already: duplicateScansCount.value,
        invalid: invalidScansCount.value,
    }))

    /**
     * Hero "Hasil Scan Terakhir" mengikuti filter yang sama dengan KPI dan riwayat.
     * Saat "Semua acara" tetap menampilkan scan terakhir yang baru diproses; saat
     * target dipilih, hero menampilkan scan terakhir yang cocok target tersebut
     * (bisa null meski ada scan lain di acara lain).
     */
    const heroResult = computed<ScanResult | null>(() => {
        if (selectedTargetOption.value === null) {
            return feed.scanResult.value
        }

        const latest = targetEntries.value[0]
        if (latest === undefined) {
            return null
        }

        return feed.toScanResult(latest)
    })

    const eventLabel = computed(() => {
        const current = feed.scanResult.value
        if (current !== null && current.eventTitle !== '' && current.eventTitle !== '-') {
            return `${current.eventKind === 'oprec' ? 'OPREC' : 'EVENT'} · ${current.eventTitle}`
        }

        return 'Siap — mode Semua'
    })

    function submitManualCode(): void {
        const code = registrationCodeInput.value.trim()

        if (code.length === 0) {
            showErrorToast('Isi kode registrasi terlebih dahulu.')

            return
        }

        void feed.submitScan({ raw: code, source: 'manual' })
    }

    function selectTarget(id: string): void {
        selectedTarget.value = id
    }

    return {
        scannerContainerId,
        cameras: camera.cameras,
        selectedCameraId: camera.selectedCameraId,
        isCameraReady: camera.isCameraReady,
        isStartingCamera: camera.isStartingCamera,
        permissionError: camera.permissionError,
        registrationCodeInput,
        scanResult: feed.scanResult,
        heroResult,
        scanHistory: feed.scanHistory,
        logEntries,
        eventLabel,
        successfulScansCount,
        duplicateScansCount,
        invalidScansCount,
        summary,
        selectedTarget,
        selectTarget,
        selectedTargetOption,
        selectedTargetLabel,
        logExpanded,
        logQuery,
        isShutterActive: camera.isShutterActive,
        targetOptions,
        scanBusy: feed.scanBusy,
        processScan,
        submitScanPayload,
        startCameraScanner: camera.startCameraScanner,
        stopCameraScanner: camera.stopCameraScanner,
        switchCamera: camera.switchCamera,
        submitManualCode,
        clearHistory: feed.clearHistory,
    }
}
