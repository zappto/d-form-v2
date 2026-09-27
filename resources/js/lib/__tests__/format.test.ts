import { describe, expect, it } from 'vitest';
import {
    formatBytes,
    formatChartCount,
    chartTickCallback,
    formatCountNumber,
    formatDisplayDate,
    formatDisplayDateTime,
    formatRupiahPrice,
    formatSavedTimeLabel,
    formatSubmissionDateTime,
    initialsOf,
    padQueueNumber,
} from '../format';

/** Formatter referensi id-ID; helper wajib menyamai keluaran kanonis ini. */
function referenceDisplayDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Formatter referensi id-ID untuk tanggal + jam; pin anti-drift en-US. */
function referenceDisplayDateTime(value: string): string {
    return new Date(value).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Formatter submission referensi: tiga call-site lama memakai bentuk ini. */
function referenceSubmissionDateTime(value: string): string {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

/** Label jam tersimpan referensi seperti Apply.vue sebelum migrasi. */
function referenceSavedTimeLabel(value: Date): string {
    return value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

describe('formatDisplayDate', () => {
    it('menyamai formatter id-ID dan berbeda dari drift en-US dummyData', () => {
        const sample = '2026-09-26T10:00:00+07:00';
        expect(formatDisplayDate(sample)).toBe(referenceDisplayDate(sample));
        const drift = new Date(sample).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
        expect(formatDisplayDate(sample)).not.toBe(drift);
    });
});

describe('formatDisplayDateTime', () => {
    it('menyamai formatter id-ID tanggal-jam dan berbeda dari drift en-US', () => {
        const sample = '2026-09-26T10:00:00+07:00';
        expect(formatDisplayDateTime(sample)).toBe(referenceDisplayDateTime(sample));
        const drift = new Date(sample).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        expect(formatDisplayDateTime(sample)).not.toBe(drift);
    });
});

describe('formatSubmissionDateTime', () => {
    it('menyamai ketiga formatter lama (formSubmissionsUi, RegistrantsDataTable, ApplicantDetailContent)', () => {
        const sample = '2026-09-26T10:00:00+07:00';
        expect(formatSubmissionDateTime(sample)).toBe(referenceSubmissionDateTime(sample));
    });
});

describe('formatCountNumber', () => {
    it('mengelompokkan angka id-ID tanpa mengubah nilai', () => {
        expect(formatCountNumber(1234567)).toBe((1234567).toLocaleString('id-ID'));
        expect(formatCountNumber(0)).toBe('0');
    });
});

describe('formatRupiahPrice', () => {
    it('memformat angka id-ID tanpa fallback; fallback tetap milik call-site', () => {
        expect(formatRupiahPrice(50000)).toBe(Number(50000).toLocaleString('id-ID'));
        expect(formatRupiahPrice(0)).toBe('0');
        expect(formatRupiahPrice(50000)).not.toContain('Rp');
        expect(formatRupiahPrice(50000)).not.toContain('Free');
        expect(formatRupiahPrice(50000)).not.toContain('Gratis');
    });
});

describe('formatChartCount', () => {
    it('angka id-ID plus satuan call-site; satuan tetap argumen agar copy tak tercampur', () => {
        expect(formatChartCount(1234567, 'pengajuan')).toBe(`${(1234567).toLocaleString('id-ID')} pengajuan`);
        expect(formatChartCount(2500, 'acara')).toBe(`${(2500).toLocaleString('id-ID')} acara`);
        expect(formatChartCount(0, 'pengajuan')).toBe('0 pengajuan');
    });
});

describe('chartTickCallback', () => {
    it('angka diformat id-ID; non-angka dikembalikan utuh', () => {
        expect(chartTickCallback(1234567)).toBe((1234567).toLocaleString('id-ID'));
        expect(chartTickCallback(0)).toBe('0');
        expect(chartTickCallback('Q1')).toBe('Q1');
    });
});

describe('padQueueNumber', () => {
    it('null/undefined menjadi strip; angka di-pad dua digit', () => {
        expect(padQueueNumber(null)).toBe('-');
        expect(padQueueNumber(undefined)).toBe('-');
        expect(padQueueNumber(3)).toBe('03');
        expect(padQueueNumber(12)).toBe('12');
    });
});

describe('formatSavedTimeLabel', () => {
    it('null menjadi label kosong; ter-set menjadi jam id-ID dua digit', () => {
        expect(formatSavedTimeLabel(null)).toBe('');
        const sample = new Date('2026-09-26T14:05:00+07:00');
        expect(formatSavedTimeLabel(sample)).toBe(referenceSavedTimeLabel(sample));
    });
});

describe('formatBytes', () => {
    it('nullish/tak-hingga/nol menjadi null; satuan B/KB/MB satu desimal', () => {
        expect(formatBytes(null)).toBeNull();
        expect(formatBytes(undefined)).toBeNull();
        expect(formatBytes(0)).toBeNull();
        expect(formatBytes(512)).toBe('512 B');
        expect(formatBytes(2048)).toBe('2.0 KB');
        expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    });
});

describe('initialsOf', () => {
    it('dua huruf depan dua kata pertama; kosong menjadi strip', () => {
        expect(initialsOf('Ayu Lestari')).toBe('AL');
        expect(initialsOf('Budi')).toBe('B');
        expect(initialsOf('')).toBe('—');
        expect(initialsOf('   ')).toBe('—');
    });
});
