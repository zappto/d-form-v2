import { describe, expect, it } from 'vitest';
import {
    extractQrCandidate,
    parseGlobalScanCursor,
    parseGlobalScanFeedRows,
    type TIGlobalScanFeedRow,
} from '../qrScanUi';

/** Nilai JSON sembarang dari sumber eksternal; cukup konkret untuk menguji toleransi parser tanpa tipe longgar. */
type TScanPayloadValue = string | number | boolean | null | TScanPayloadValue[] | { [key: string]: TScanPayloadValue };

/** Bangun baris feed terketik dengan nilai default; dipakai agar ekspektasi fokus ke kolom yang diuji. */
function feedRow(overrides: Partial<TIGlobalScanFeedRow>): TIGlobalScanFeedRow {
    return {
        id: '',
        ts: '',
        type: 'event',
        eventTitle: '',
        name: '',
        identifier: '',
        queueNumber: null,
        ...overrides,
    };
}

describe('toleransi parser payload QR scan', () => {
    const feedRowCases: Array<[TScanPayloadValue, TIGlobalScanFeedRow[]]> = [
        [{}, []],
        [{ rows: {} }, []],
        [{ rows: 'x' }, []],
        [{ rows: null }, []],
        [{ rows: [1, 'a', null, [], {}] }, []],
        [{ rows: [{ id: 123 }] }, []],
        [{ rows: [{ id: '1', queueNumber: '5' }] }, [feedRow({ id: '1' })]],
        [
            { rows: [{ id: '1', queueNumber: 5, type: 'recruitment' }] },
            [feedRow({ id: '1', type: 'recruitment', queueNumber: 5 })],
        ],
    ];

    it.each(feedRowCases)('parseGlobalScanFeedRows menjaga paritas toleransi baris rusak', (payload, expected) => {
        expect(parseGlobalScanFeedRows(payload)).toEqual(expected);
    });

    const candidateCases: Array<[string, string]> = [
        ['{"application_id":"ABC"}', 'ABC'],
        ['{"application_id":123}', '{"application_id":123}'],
        ['{}', '{}'],
        ['{bukan json}', '{bukan json}'],
        ['PLAIN', 'PLAIN'],
    ];

    it.each(candidateCases)('extractQrCandidate mengembalikan kode atau teks mentah', (decodedText, expected) => {
        expect(extractQrCandidate(decodedText)).toBe(expected);
    });

    const cursorCases: Array<[TScanPayloadValue, string]> = [
        [{ cursor: 'c1' }, 'c1'],
        [{}, ''],
        [{ cursor: 5 }, ''],
        ['bukan objek', ''],
    ];

    it.each(cursorCases)('parseGlobalScanCursor hanya menerima cursor bertipe string', (payload, expected) => {
        expect(parseGlobalScanCursor(payload)).toBe(expected);
    });
});
