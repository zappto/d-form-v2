<?php

namespace App\Http\Controllers\Dashboard\Events\Forms;

use App\Http\Controllers\Controller;
use App\Http\Requests\FieldModifyRequest;
use App\Models\Form;
use App\Models\FormField;
use App\Models\Event;
use App\Support\FormFieldTypeMapping;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FieldOperationController extends Controller
{
    public function __invoke(FieldModifyRequest $request, Event $event, Form $form)
    {
        abort_unless($form->event_id === $event->id, 404);

        $formId = $form->id;
        $validated = $request->validated();
        $rows = $validated['fields'] ?? [];
        if (!is_array($rows)) {
            $rows = [];
        }
        // Dirty-subset mode: client mengirim hanya baris tambah/edit + daftar
        // hapus eksplisit. Kehadiran key `deleted_ids` menandai payload parsial
        // sehingga diff omission legacy TIDAK diterapkan (kalau tidak, baris
        // bersih yang tak ikut terkirim akan ikut terhapus).
        $partialMode = array_key_exists('deleted_ids', $validated);
        $explicitDeletedIds = $validated['deleted_ids'] ?? [];
        if (!is_array($explicitDeletedIds)) {
            $explicitDeletedIds = [];
        }

        try {
            // Upload banner form builder: file opsional `banner_file`
            // (image, max 10MB — mengikuti pola banner event). Disimpan ke disk
            // public `forms/banners`; DB hanya menyimpan path, bukan base64.
            // Tanpa banner_file berperilaku seperti sekarang (path string terus).
            $storedBannerPath = null;
            $bannerFile = $request->file('banner_file');
            if ($bannerFile instanceof UploadedFile) {
                $storedBannerPath = $this->storeBannerFile($form, $bannerFile);
                $rows = $this->applyStoredBannerPath($rows, $storedBannerPath, $bannerFile->getClientOriginalName());
            }
            // Upload gambar opsi (checkbox/radio): file opsional
            // `option_images[fieldId][optionId]` (image, max 10MB — samakan
            // banner). Disimpan ke disk public `forms/options`; DB hanya
            // menyimpan path, bukan base64. Tanpa file berperilaku seperti
            // sekarang. Baris DB lama ber-base64 dibiarkan (tanpa backfill).
            $storedOptionPaths = [];
            $optionImageFiles = $request->file('option_images', []);
            if (is_array($optionImageFiles) && $optionImageFiles !== []) {
                $storedOptionPaths = $this->storeOptionImageFiles($optionImageFiles);
                if ($storedOptionPaths !== []) {
                    $rows = $this->applyStoredOptionImagePaths($rows, $storedOptionPaths);
                }
            }
            try {
                $this->syncFields($formId, $rows, $partialMode, $explicitDeletedIds);
            } catch (QueryException $e) {
                if (! $this->isDuplicateKeyError($e)) {
                    throw $e;
                }
                // Anti-race 1062: dua flush paralel insert id baru yang sama.
                // Di dalam transaksi pertama baris pemenang tak terlihat
                // (snapshot REPEATABLE READ), jadi ulangi sekali dengan
                // snapshot baru — baris itu kini jadi update, bukan 500/422.
                $this->syncFields($formId, $rows, $partialMode, $explicitDeletedIds);
            }

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Fields have been saved',
            ]);

            // Autosave wizard (background, tanpa navigasi) → JSON.
            if ($request->expectsJson()) {
                $payload = ['ok' => true];
                if (is_string($storedBannerPath) && $storedBannerPath !== '') {
                    $payload['banner_url'] = $storedBannerPath;
                }
                if ($storedOptionPaths !== []) {
                    $payload['option_images'] = $storedOptionPaths;
                }

                return response()->json($payload);
            }

            return to_route('dashboard.events.forms.show', ['event' => $event, 'form' => $form]);
        } catch (\Exception $e) {
            Log::error('[FieldOperationController, __invoke]: ' . $e->getMessage());

            if ($request->expectsJson()) {
                return response()->json(['ok' => false, 'message' => 'Fields cannot be saved'], 422);
            }

            return Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Fields cannot be saved',
            ])->back();
        }
    }

    private function isDuplicateKeyError(QueryException $e): bool
    {
        $sqlState = $e->errorInfo[0] ?? null;
        $driverCode = $e->errorInfo[1] ?? null;
        if ($sqlState === '23000' || $driverCode === 1062 || $driverCode === 19) {
            return true;
        }
        $message = strtolower($e->getMessage());
        return str_contains($message, 'duplicate entry')
            || str_contains($message, 'unique constraint failed')
            || str_contains($message, 'duplicate key');
    }

    /**
     * Sinkronisasi baris fields dalam satu transaksi.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, mixed>  $explicitDeletedIds
     */
    private function syncFields(string $formId, array $rows, bool $partialMode, array $explicitDeletedIds): void
    {
        DB::transaction(function () use ($rows, $formId, $partialMode, $explicitDeletedIds) {
            $oldById = FormField::query()->where('form_id', $formId)->get()->keyBy('id');
            // Reuse id baris soft-deleted (mis. banner sticky pasca-hapus):
            // PK-nya masih ditempati sehingga create mentok 1062 — restore
            // eksplisit di sini, bukan mengandalkan rescue pasca-gagal.
            $trashedById = FormField::onlyTrashed()->where('form_id', $formId)->get()->keyBy('id');

            if ($partialMode) {
                $ids = collect($explicitDeletedIds)
                    ->filter(fn ($id) => is_string($id) && $id !== '')
                    ->all();
                if ($ids !== []) {
                    FormField::query()
                        ->where('form_id', $formId)
                        ->whereIn('id', $ids)
                        ->delete();
                    foreach ($ids as $id) {
                        $oldById->forget($id);
                    }
                }
            } else {
                // Kompatibilitas payload full lama: omission = delete.
                $incomingIds = collect($rows)->pluck('id')->filter()->all();

                $toDelete = $oldById->keys()->diff($incomingIds);
                if ($toDelete->isNotEmpty()) {
                    FormField::query()
                        ->where('form_id', $formId)
                        ->whereIn('id', $toDelete)
                        ->delete();
                }
            }

            foreach ($rows as $row) {
                $id = $row['id'] ?? null;
                $attrs = $this->rowToModelAttributes($row);
                if (is_string($id) && $id !== '' && $oldById->has($id)) {
                    $oldById->get($id)->update($attrs);

                    continue;
                }
                if (is_string($id) && $id !== '' && $trashedById->has($id)) {
                    $trashed = $trashedById->get($id);
                    $trashed->restore();
                    $trashed->update($attrs);

                    continue;
                }

                // Lomba insert id identik (flush paralel) memicu 1062 di sini
                // dan ditangani pemanggil via sync ulang snapshot baru.
                FormField::query()->create(array_merge(
                    $attrs,
                    [
                        'id' => (is_string($id) && $id !== '') ? $id : (string) Str::uuid(),
                        'form_id' => $formId,
                    ]
                ));
            }
        });
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function rowToModelAttributes(array $row): array
    {
        return [
            'input_type' => FormFieldTypeMapping::toInputType($row['type']),
            'label' => $row['label'],
            'description' => $row['description'] ?? null,
            'name' => $row['name'],
            'order' => (int) $row['order'],
            'metadata' => $row['metadata'],
            'is_append' => (bool) ($row['is_append'] ?? false),
        ];
    }

    /**
     * Simpan file banner ke disk public `forms/banners` (mengikuti pola
     * banner event di EventService) + sinkronkan kolom `forms.banner_url`.
     * Baris DB lama ber-base64 dibiarkan apa adanya; hanya upload baru
     * yang ditulis sebagai path.
     */
    private function storeBannerFile(Form $form, UploadedFile $bannerFile): string
    {
        $previousPath = is_string($form->banner_url) ? trim($form->banner_url) : '';
        $storedPath = $bannerFile->store('forms/banners', 'public');

        $form->update(['banner_url' => $storedPath]);
        $this->syncStoredBannerToExistingRows($form, $storedPath);

        if ($previousPath !== '' && $previousPath !== $storedPath && ! str_starts_with($previousPath, 'data:') && ! preg_match('#^https?://#i', $previousPath)) {
            $normalized = ltrim($previousPath, '/');
            if (str_starts_with($normalized, 'storage/')) {
                $normalized = substr($normalized, strlen('storage/'));
            }
            if ($normalized !== '' && Storage::disk('public')->exists($normalized)) {
                Storage::disk('public')->delete($normalized);
            }
        }

        return $storedPath;
    }

    /**
     * Ganti base64/URL lama pada baris banner di payload dengan stored path.
     * Bila payload dirty-subset tak memuat baris banner (seharusnya selalu
     * disertakan frontend saat ada file), fallback sinkronisasi baris
     * existing dilakukan di storeBannerFile().
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function applyStoredBannerPath(array $rows, string $storedPath, ?string $clientName): array
    {
        foreach ($rows as $index => $row) {
            if (! is_array($row) || ! $this->isBannerRow($row)) {
                continue;
            }
            $metadata = $row['metadata'] ?? [];
            if (! is_array($metadata)) {
                $metadata = [];
            }
            $metadata['bannerUrl'] = $storedPath;
            if (is_string($clientName) && trim($clientName) !== '') {
                $metadata['bannerFileName'] = $clientName;
            }
            $rows[$index]['metadata'] = $metadata;
        }

        return $rows;
    }

    /**
     * Simpan file gambar opsi ke disk public `forms/options`.
     * Kunci peta "fieldId:optionId" => stored path agar frontend bisa
     * mengganti imageUrl dengan path (tiruan applyStoredBannerPath).
     * Entri bukan UploadedFile dilewati; baris DB lama ber-base64 dibiarkan.
     *
     * @param  array<mixed>  $nested  $request->file('option_images')
     * @return array<string, string>
     */
    private function storeOptionImageFiles(array $nested): array
    {
        $stored = [];
        foreach ($nested as $fieldId => $perOption) {
            if (! is_string($fieldId) || $fieldId === '' || ! is_array($perOption)) {
                continue;
            }
            foreach ($perOption as $optionId => $file) {
                if (! is_string($optionId) || $optionId === '') {
                    continue;
                }
                if (! $file instanceof UploadedFile) {
                    continue;
                }
                $storedPath = $file->store('forms/options', 'public');
                $stored["{$fieldId}:{$optionId}"] = $storedPath;
            }
        }

        return $stored;
    }

    /**
     * Ganti imageUrl '' pada metadata.optionChoices di payload dengan stored
     * path SEBELUM tulis metadata (pola applyStoredBannerPath).
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<string, string>  $storedMap
     * @return array<int, array<string, mixed>>
     */
    private function applyStoredOptionImagePaths(array $rows, array $storedMap): array
    {
        if ($storedMap === []) {
            return $rows;
        }
        foreach ($rows as $index => $row) {
            if (! is_array($row)) {
                continue;
            }
            $fieldId = $row['id'] ?? null;
            if (! is_string($fieldId) || $fieldId === '') {
                continue;
            }
            $metadata = $row['metadata'] ?? [];
            if (! is_array($metadata)) {
                continue;
            }
            $choices = $metadata['optionChoices'] ?? null;
            if (! is_array($choices)) {
                continue;
            }
            $changed = false;
            foreach ($choices as $choiceIndex => $choice) {
                if (! is_array($choice)) {
                    continue;
                }
                $optionId = $choice['id'] ?? null;
                if (! is_string($optionId) || $optionId === '') {
                    continue;
                }
                $key = "{$fieldId}:{$optionId}";
                if (! array_key_exists($key, $storedMap)) {
                    continue;
                }
                $choices[$choiceIndex]['imageUrl'] = $storedMap[$key];
                $changed = true;
            }
            if ($changed) {
                $metadata['optionChoices'] = $choices;
                $rows[$index]['metadata'] = $metadata;
            }
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function isBannerRow(array $row): bool
    {
        if (($row['name'] ?? null) === 'form_banner') {
            return true;
        }
        if (($row['type'] ?? null) === 'banner') {
            return true;
        }
        $metadata = $row['metadata'] ?? null;
        if (is_array($metadata)) {
            if (($metadata['formBanner'] ?? null) === true) {
                return true;
            }
            if (($metadata['builderType'] ?? null) === 'banner') {
                return true;
            }
        }

        return false;
    }

    /**
     * Fallback: bila file diupload tanpa baris banner di payload,
     * perbarui metadata baris banner yang sudah tersimpan agar tak stale.
     */
    private function syncStoredBannerToExistingRows(Form $form, string $storedPath): void
    {
        $existing = FormField::query()->where('form_id', $form->id)->get();
        foreach ($existing as $field) {
            $metadata = $field->metadata;
            if ($metadata instanceof \Illuminate\Support\Collection) {
                $metadata = $metadata->all();
            } elseif (! is_array($metadata)) {
                $metadata = (array) $metadata;
            }
            $row = [
                'name' => $field->name,
                'type' => FormFieldTypeMapping::toApiType($field->input_type),
                'metadata' => $metadata,
            ];
            if (! $this->isBannerRow($row)) {
                continue;
            }
            $metadata['bannerUrl'] = $storedPath;
            $field->update(['metadata' => $metadata]);
        }
    }
}
