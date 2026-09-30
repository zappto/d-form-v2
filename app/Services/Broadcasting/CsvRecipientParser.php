<?php

namespace App\Services\Broadcasting;

/**
 * Parse isi CSV menjadi baris recipient ternormalisasi.
 * Dipakai snapshot & dataset agar semantik CSV tunggal (header + fallback tanpa header).
 */
class CsvRecipientParser
{
    private const MIN_PAIR_COLUMNS = 2;

    /**
     * Ubah isi CSV mentah jadi daftar valid/invalid; baris kosong dilewati.
     *
     * @return array{valid:array<int,array{name:string|null,email:string}>, invalid:array<int,string>}
     */
    public function parse(string $contents): array
    {
        $rows = $this->dataRows($contents);

        if ($rows === []) {
            return ['valid' => [], 'invalid' => []];
        }

        $indexes = $this->headerIndexes($rows[0]);
        $dataRows = $indexes['hasHeader'] ? array_slice($rows, 1) : $rows;

        $valid = [];
        $invalid = [];

        foreach ($dataRows as $row) {
            $normalized = $this->normalizeRow($row, ['email' => $indexes['email'], 'name' => $indexes['name']]);

            if ($normalized['valid'] !== null) {
                $valid[] = $normalized['valid'];
            }

            if ($normalized['invalid'] !== null) {
                $invalid[] = $normalized['invalid'];
            }
        }

        return ['valid' => $valid, 'invalid' => $invalid];
    }

    /**
     * Pecah isi CSV per baris via str_getcsv; baris kosong dilewati.
     *
     * @return array<int,array<int,string>>
     */
    private function dataRows(string $contents): array
    {
        $rows = [];

        foreach (preg_split('/\r\n|\r|\n/', $contents) ?: [] as $line) {
            if (trim($line) === '') {
                continue;
            }

            $row = str_getcsv($line);

            if ($row !== [null]) {
                $rows[] = array_map(fn ($cell) => (string) $cell, $row);
            }
        }

        return $rows;
    }

    /**
     * Petakan indeks kolom dari baris pertama; tanpa 'email' berarti tanpa header.
     *
     * @param  array<int,string>  $header
     * @return array{hasHeader:bool, email:int, name:int|null}
     */
    private function headerIndexes(array $header): array
    {
        $lower = array_map(fn ($cell) => strtolower(trim((string) $cell)), $header);
        $hasHeader = in_array('email', $lower, true);

        if (! $hasHeader) {
            return ['hasHeader' => false, 'email' => 0, 'name' => null];
        }

        $nameIdx = array_search('name', $lower, true);

        return [
            'hasHeader' => true,
            'email' => (int) array_search('email', $lower, true),
            'name' => $nameIdx === false ? null : $nameIdx,
        ];
    }

    /**
     * Normalisasi satu baris data; dukung pasangan "name,email" tanpa header.
     *
     * @param  array<int,string>  $row
     * @param  array{email:int, name:int|null}  $indexes
     * @return array{valid:array{name:string|null, email:string}|null, invalid:string|null}
     */
    private function normalizeRow(array $row, array $indexes): array
    {
        $email = trim((string) ($row[$indexes['email']] ?? ''));
        $name = $indexes['name'] !== null ? trim((string) ($row[$indexes['name']] ?? '')) : null;

        if ($name === null && $indexes['email'] === 0 && count($row) >= self::MIN_PAIR_COLUMNS) {
            $maybeEmail = trim((string) ($row[1] ?? ''));

            if (filter_var($maybeEmail, FILTER_VALIDATE_EMAIL) !== false) {
                $name = trim((string) ($row[0] ?? ''));
                $email = $maybeEmail;
            }
        }

        $email = strtolower($email);

        if ($email === '') {
            return ['valid' => null, 'invalid' => null];
        }

        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return ['valid' => null, 'invalid' => $email];
        }

        return ['valid' => ['name' => $name === '' || $name === null ? null : $name, 'email' => $email], 'invalid' => null];
    }
}
