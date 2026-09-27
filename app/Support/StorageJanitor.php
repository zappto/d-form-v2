<?php

namespace App\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

final class StorageJanitor
{
    /** Hapus satu path di disk public; lewati blank, data:-URI, dan URL http(s). */
    public static function deletePublic(?string $path): void
    {
        $normalized = self::normalizePublicPath($path);
        if ($normalized === null) {
            return;
        }
        if (Storage::disk('public')->exists($normalized)) {
            Storage::disk('public')->delete($normalized);
        }
    }

    /** Hapus satu path di disk local (dokumen rekrutmen); guard sama tanpa strip storage/. */
    public static function deleteLocal(?string $path): void
    {
        if (! is_string($path) || trim($path) === '' || self::isExternal(trim($path))) {
            return;
        }
        $normalized = ltrim(trim($path), '/');
        if ($normalized !== '' && Storage::disk('local')->exists($normalized)) {
            Storage::disk('local')->delete($normalized);
        }
    }

    /** Hapus banyak path public sekaligus (lewati non-path satu per satu). */
    public static function deletePublicMany(array $paths): void
    {
        foreach ($paths as $path) {
            self::deletePublic(is_string($path) ? $path : null);
        }
    }

    /**
     * Kumpulkan path file jawaban (string diawali form-uploads/) dari JSON answers.
     * Dipakai FormAnswerObserver + DeleteDeclinedInvitationMemberSubmissionJob.
     */
    public static function formAnswerPaths(mixed $answers): array
    {
        $items = $answers instanceof Collection ? $answers->all() : (array) $answers;
        $paths = [];
        foreach ($items as $value) {
            if (is_string($value) && str_starts_with($value, 'form-uploads/')) {
                $paths[] = $value;
            }
        }

        return $paths;
    }

    /**
     * Kumpulkan path gambar dari metadata banner/field (bannerUrl + optionChoices[].imageUrl).
     * Dipakai FormObserver + FormFieldObserver.
     */
    public static function metadataImagePaths(mixed $metadata): array
    {
        $meta = $metadata instanceof Collection ? $metadata->all() : (array) $metadata;
        $paths = [];
        if (isset($meta['bannerUrl']) && is_string($meta['bannerUrl'])) {
            $paths[] = $meta['bannerUrl'];
        }
        $choices = $meta['optionChoices'] ?? [];
        $choices = $choices instanceof Collection ? $choices->all() : (array) $choices;
        foreach ($choices as $choice) {
            $row = $choice instanceof Collection ? $choice->all() : (array) $choice;
            if (isset($row['imageUrl']) && is_string($row['imageUrl'])) {
                $paths[] = $row['imageUrl'];
            }
        }

        return $paths;
    }

    private static function isExternal(string $value): bool
    {
        return str_starts_with($value, 'data:') || (bool) preg_match('#^https?://#i', $value);
    }

    private static function normalizePublicPath(?string $path): ?string
    {
        if (! is_string($path) || trim($path) === '') {
            return null;
        }
        $value = trim($path);
        if (self::isExternal($value)) {
            return null;
        }
        $normalized = ltrim($value, '/');
        if (str_starts_with($normalized, 'storage/')) {
            $normalized = substr($normalized, strlen('storage/'));
        }

        return $normalized === '' ? null : $normalized;
    }
}
