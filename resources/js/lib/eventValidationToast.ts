import { toast } from 'vue-sonner'

const fieldLabels: Record<string, string> = {
    title: 'Judul',
    location: 'Lokasi',
    description: 'Deskripsi',
    banner: 'Banner',
    start_date: 'Tanggal mulai acara',
    end_date: 'Tanggal selesai acara',
    registration_start: 'Mulai pendaftaran',
    registration_end: 'Akhir pendaftaran',
    quota: 'Kuota',
    price: 'Harga',
    session: 'Sesi',
    category: 'Kategori',
    publish: 'Terbitkan',
}

function messageText(msg: string | string[] | undefined): string {
    if (msg == null) return ''
    return Array.isArray(msg) ? (msg[0] ?? '') : msg
}

/** Toast ringkas berisi semua pesan validasi Laravel (mudah dibaca). */
export function showEventValidationToast(errors: Record<string, string | string[]>) {
    const entries = Object.entries(errors).filter(([, v]) => messageText(v).length > 0)
    if (entries.length === 0) {
        toast.error('Validasi gagal. Periksa kembali formulir.')
        return
    }
    const lines = entries.map(([key, msg]) => {
        const label = fieldLabels[key] ?? key.replace(/_/g, ' ')
        return `${label}: ${messageText(msg)}`
    })
    toast.error('Validasi gagal', {
        description: lines.join('\n'),
        duration: Math.min(12000, 4000 + entries.length * 800),
    })
}
