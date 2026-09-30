<?php

namespace App\Http\Requests\Users\Concerns;

trait SharesUserValidationMessages
{
    /**
     * Pesan validasi Indonesia bersama untuk akun user; dipakai saat tambah & ubah user.
     *
     * @return array<string, string>
     */
    protected function userAccountMessages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'role.required' => 'Role wajib dipilih.',
            'role.in' => 'Role tidak valid.',
        ];
    }
}
