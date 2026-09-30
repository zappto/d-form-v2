import { describe, expect, it } from 'vitest';
import {
    BROADCAST_DATASET_SOURCES,
    BROADCAST_DELAY_MAX_SECONDS,
    BROADCAST_MANUAL_SAMPLE_NAME,
    BROADCAST_SNAPSHOT_SOURCE_OPTIONS,
    DEFAULT_BROADCAST_SNAPSHOT_SOURCES,
} from '../broadcastDataset';

/**
 * DFORM-70: kunci satu sumber dataset broadcast (cermin enum BE
 * `EmailDatasetSourceType`) + turunan opsi/default + batas delay
 * + nama contoh manual agar duplikasi literal tak kembali.
 */

describe('broadcastDataset', () => {
    it('sumber kanonik: 4 nilai enum BE berurutan', () => {
        expect(BROADCAST_DATASET_SOURCES).toEqual(['event_participants', 'recruitment_applicants', 'users', 'custom']);
    });

    it('opsi snapshot: kanonik tanpa custom (custom butuh id dataset)', () => {
        expect(BROADCAST_SNAPSHOT_SOURCE_OPTIONS).toEqual(['event_participants', 'recruitment_applicants', 'users']);
    });

    it('default snapshot: turunan users dari kanonik', () => {
        expect(DEFAULT_BROADCAST_SNAPSHOT_SOURCES).toEqual(['users']);
    });

    it('batas delay selaras StoreBroadcastRequest (max:3600)', () => {
        expect(BROADCAST_DELAY_MAX_SECONDS).toBe(3600);
    });

    it('nama contoh manual untuk placeholder kartu dataset', () => {
        expect(BROADCAST_MANUAL_SAMPLE_NAME).toBe('Nafan');
    });
});
