/** Panjang judul (event/builder) maksimum dalam karakter; selaras rule validasi backend. */
export const TITLE_MAX_LENGTH = 200;

/** Panjang teks jawaban maksimum dalam karakter; batas input `maxLength` field teks builder. */
export const TEXT_MAX_LENGTH = 100_000;

/** Ukuran gambar yang disarankan (rasio 4:3) untuk unggahan gambar/cover. */
export const IMAGE_UPLOAD_RECOMMENDED_SIZE = '1200 x 900';

/** Batas ukuran unggahan banner dalam KB; backend memakai `banner_file max:5120`. */
export const BANNER_MAX_SIZE_KB = 5120;

/** Batas ukuran unggahan berkas non-gambar dalam KB; selaras metadata `file_upload` builder. */
export const FILE_UPLOAD_MAX_SIZE_KB = 10240;

/** Nilai `accepts` field banner builder; daftar MIME polos (bukan picker `image/png,...` maupun `.ext`). */
export const BANNER_ACCEPT_MIMES = 'gif, png, jpg, jpeg';
