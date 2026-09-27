/**
 * Panjang judul (event/builder) maksimum dalam karakter untuk counter FE.
 * Ini batas FE, bukan backend: kolom `events.title`/`forms.title` dan rule backend memakai `max:100`; nilai 200 dipertahankan atas keputusan user.
 */
export const TITLE_MAX_LENGTH = 200;

/** Panjang teks jawaban maksimum dalam karakter; batas input `maxLength` field teks builder. */
export const TEXT_MAX_LENGTH = 100_000;

/** Ukuran gambar yang disarankan (rasio 4:3) untuk unggahan gambar/cover. */
export const IMAGE_UPLOAD_RECOMMENDED_SIZE = '1200 x 900';

/** Batas ukuran unggahan banner dalam KB; backend memakai `banner_file max:5120`. */
export const BANNER_MAX_SIZE_KB = 5120;

/** Batas ukuran unggahan berkas non-gambar dalam KB; selaras metadata `file_upload` builder. */
export const FILE_UPLOAD_MAX_SIZE_KB = 10240;

/** Ekstensi banner kanonik yang diterima FE; satu sumber untuk metadata `accepts` dan picker. */
export const BANNER_ACCEPT_EXTENSIONS: readonly string[] = ['gif', 'png', 'jpg', 'jpeg'];

/** Padanan MIME tiap ekstensi banner untuk atribut `<input accept>`; `jpg` dan `jpeg` sama-sama `image/jpeg`. */
const BANNER_EXTENSION_MIME: Record<string, string> = {
    gif: 'image/gif',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
};

/** Tipe MIME unik banner (dedup, urutan mengikuti ekstensi) untuk validasi picker. */
export const BANNER_ACCEPT_TYPES: readonly string[] = [
    ...new Set(BANNER_ACCEPT_EXTENSIONS.map((ext) => BANNER_EXTENSION_MIME[ext])),
];

/** Nilai `accept` picker banner, diturunkan dari BANNER_ACCEPT_TYPES. */
export const BANNER_PICKER_ACCEPT = BANNER_ACCEPT_TYPES.join(',');

/** Nilai `accepts` metadata banner builder (daftar ekstensi polos dipisah koma-spasi), diturunkan dari BANNER_ACCEPT_EXTENSIONS. */
export const BANNER_ACCEPT_MIMES = BANNER_ACCEPT_EXTENSIONS.join(', ');
