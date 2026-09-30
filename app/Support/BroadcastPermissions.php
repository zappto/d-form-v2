<?php

namespace App\Support;

/**
 * Satu-satunya sumber nama permission Spatie modul Email Broadcasting.
 *
 * Nilai string DIKUNCI identik dengan baris RoleSeeder + permission di DB existing;
 * mengubah nilai berarti migrasi data, bukan refactor.
 */
final class BroadcastPermissions
{
    /** Izin melihat daftar/detail broadcast. */
    public const VIEW = 'email-broadcast.view';

    /** Izin membuat broadcast; juga dipakai gate authorize() request-request jalur simpan (lihat DFORM-55). */
    public const CREATE = 'email-broadcast.create';

    /** Izin menjadwalkan ulang / memicu penjadwalan broadcast. */
    public const SCHEDULE = 'email-broadcast.schedule';

    /** Izin membatalkan broadcast terjadwal. */
    public const CANCEL = 'email-broadcast.cancel';

    /** Izin mengulang kirim yang gagal. */
    public const RETRY = 'email-broadcast.retry';

    /** Izin menghapus broadcast. */
    public const DELETE = 'email-broadcast.delete';
}
