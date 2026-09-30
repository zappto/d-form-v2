/** Sumber dataset broadcast; cermin string `EmailDatasetSourceType` backend (kanonik BE). */
export type TBroadcastDatasetSource = 'event_participants' | 'recruitment_applicants' | 'users' | 'custom';

/** Seluruh sumber dataset broadcast (4 nilai enum BE); satu sumber untuk opsi snapshot. */
export const BROADCAST_DATASET_SOURCES: readonly TBroadcastDatasetSource[] = [
    'event_participants',
    'recruitment_applicants',
    'users',
    'custom',
];

/** Sumber yang bisa dipilih di kartu snapshot tanpa id dataset; `custom` butuh id sehingga dikecualikan. */
export const BROADCAST_SNAPSHOT_SOURCE_OPTIONS: readonly TBroadcastDatasetSource[] = BROADCAST_DATASET_SOURCES.filter(
    (source: TBroadcastDatasetSource): boolean => source !== 'custom'
);

/** Sumber dataset yang dicentang bawaan saat kartu snapshot dibuka; turunan dari kanonik. */
export const DEFAULT_BROADCAST_SNAPSHOT_SOURCES: readonly TBroadcastDatasetSource[] = BROADCAST_DATASET_SOURCES.filter(
    (source: TBroadcastDatasetSource): boolean => source === 'users'
);

/** Delay pengiriman maksimum (detik); selaras `StoreBroadcastRequest` (`max:3600`). */
export const BROADCAST_DELAY_MAX_SECONDS = 3600;

/** Nama contoh baris manual snapshot; satu sumber untuk placeholder kartu dataset. */
export const BROADCAST_MANUAL_SAMPLE_NAME = 'Nafan';
