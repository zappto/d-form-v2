<?php

namespace App\Services\Broadcasting;

use App\Models\EmailBroadcast;
use App\Models\EmailBroadcastAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BroadcastAttachmentService
{
    /** Batas unggah broadcast 1.5 MB (1572864 byte) untuk attachment dan inline image; pecah lagi bila kebutuhan keduanya berbeda. */
    public const MAX_BROADCAST_UPLOAD_BYTES = 1572864;

    /** Ekstensi lampiran email-attachment-safe (dokumen, gambar raster, teks, arsip); satu-satunya definisi dipakai request + service. */
    public const ALLOWED_EXTENSIONS = [
        'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp',
        'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'txt', 'csv', 'zip',
    ];

    /** MIME jujur pasangan ALLOWED_EXTENSIONS; application/zip ikut karena finfo kerap menebak OOXML sebagai zip. */
    public const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        'application/zip',
    ];

    /** Ekstensi executable/script yang menandakan serangan bila muncul di segmen nama sebelum ekstensi akhir. */
    private const BLOCKED_MIDDLE_EXTENSIONS = [
        'php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar',
        'html', 'htm', 'xhtml', 'shtml',
        'js', 'mjs', 'svg', 'swf',
        'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'ps1', 'vbs', 'jar', 'sh',
    ];

    /** MIME konten berbahaya yang langsung ditolak walau ekstensi akhir lolos allowlist (anti MIME-spoof). */
    private const BLOCKED_CONTENT_MIME_TYPES = [
        'text/x-php', 'application/x-php',
        'text/html',
        'image/svg+xml',
        'application/x-msdownload', 'application/x-msdos-program',
        'application/x-executable', 'application/x-elf',
        'application/x-shockwave-flash',
        'application/x-javascript', 'text/x-shellscript',
    ];

    /** Daftar ekstensi allowlist untuk rules `mimes:`; dipakai StoreBroadcastAttachmentRequest. */
    public static function allowedExtensions(): array
    {
        return self::ALLOWED_EXTENSIONS;
    }

    /** Daftar MIME allowlist untuk rules `mimetypes:`; dipakai StoreBroadcastAttachmentRequest. */
    public static function allowedMimeTypes(): array
    {
        return self::ALLOWED_MIME_TYPES;
    }

    public function store(EmailBroadcast $broadcast, UploadedFile $file): EmailBroadcastAttachment
    {
        $size = $file->getSize() ?? 0;

        abort_if($size > self::MAX_BROADCAST_UPLOAD_BYTES, 422, 'Attachment melebihi 1.5 MB.');

        $originalName = $file->getClientOriginalName();

        $this->rejectUnsafeBroadcastFilename($originalName);
        $this->rejectDangerousBroadcastContent($file);

        $path = $file->storeAs(
            'broadcasts/'.$broadcast->id,
            Str::uuid()->toString().'_'.self::sanitizedBroadcastBasename($originalName),
            'local',
        );

        return $broadcast->attachments()->create([
            'file_name' => $originalName,
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $size,
        ]);
    }

    /** Tolak traversal, ekstensi non-allowlist, dan double-extension berbahaya sebelum file disimpan. */
    private function rejectUnsafeBroadcastFilename(string $originalName): void
    {
        if ($originalName === '' || str_contains($originalName, "\0") || str_contains($originalName, '..')
            || str_contains($originalName, '/') || str_contains($originalName, '\\')) {
            abort(422, 'Nama file lampiran tidak valid.');
        }

        $segments = explode('.', $originalName);

        abort_if(count($segments) < 2, 422, 'Tipe file lampiran tidak didukung.');

        $extension = strtolower($segments[count($segments) - 1]);

        abort_unless(in_array($extension, self::ALLOWED_EXTENSIONS, true), 422, 'Tipe file lampiran tidak didukung.');

        foreach (array_slice($segments, 0, -1) as $middle) {
            abort_if(in_array(strtolower($middle), self::BLOCKED_MIDDLE_EXTENSIONS, true), 422, 'Nama file lampiran tidak valid.');
        }
    }

    /** Tolak konten terdeteksi executable/script walau ekstensi akhirnya lolos allowlist. */
    private function rejectDangerousBroadcastContent(UploadedFile $file): void
    {
        $guessed = strtolower((new \finfo(FILEINFO_MIME_TYPE))->file($file->getPathname()) ?: '');

        abort_if(in_array($guessed, self::BLOCKED_CONTENT_MIME_TYPES, true), 422, 'Isi file lampiran tidak didukung.');
    }

    /** Normalkan basename simpan: karakter asing jadi `_`, buang titik depan, batasi 200 char. */
    private static function sanitizedBroadcastBasename(string $originalName): string
    {
        $clean = preg_replace('/[^A-Za-z0-9._-]+/', '_', basename($originalName)) ?? 'file';
        $clean = ltrim($clean, '.');

        if ($clean === '') {
            return 'file';
        }

        return mb_substr($clean, 0, 200);
    }

    public function delete(EmailBroadcastAttachment $attachment): void
    {
        Storage::disk('local')->delete($attachment->file_path);
        $attachment->delete();
    }

    public function deleteAllFor(EmailBroadcast $broadcast): void
    {
        foreach ($broadcast->attachments()->get() as $attachment) {
            Storage::disk('local')->delete($attachment->file_path);
        }

        Storage::disk('local')->deleteDirectory('broadcasts/'.$broadcast->id);
    }

    /**
     * Validasi inline image base64 dari Tiptap (data:image/...).
     * @return array{ok:bool, message?:string}
     */
    public function validateInlineImages(?string $html): array
    {
        if ($html === null || $html === '') {
            return ['ok' => true];
        }

        preg_match_all('#src="(data:image/[^"]+)"#', $html, $matches);

        foreach ($matches[1] ?? [] as $dataUrl) {
            $compact = preg_replace('/\s+/', '', $dataUrl);
            $parts = explode(',', $compact, 2);

            if (count($parts) !== 2) {
                return ['ok' => false, 'message' => 'Inline image tidak valid.'];
            }

            $binary = base64_decode($parts[1], true);

            if ($binary === false) {
                return ['ok' => false, 'message' => 'Inline image tidak valid (base64).'];
            }

            if (strlen($binary) > self::MAX_BROADCAST_UPLOAD_BYTES) {
                return ['ok' => false, 'message' => 'Inline image melebihi 1.5 MB.'];
            }
        }

        return ['ok' => true];
    }
}
