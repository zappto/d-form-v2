# M5 Email & QR — backlog backend (untuk tim BE)

Dokumen ini merangkum **apa yang belum ada di backend** agar alur M5 (email konfirmasi, QR, observabilitas) bisa dipasangkan penuh dengan UI. FE saat ini **sengaja tidak bergantung** pada endpoint berikut; implementasi BE bisa mengikuti urutan prioritas di bawah.

**Konvensi:** route admin berada di grup `routes/web/admin/event.php` dengan prefix `/dashboard` dan nama `dashboard.*`. Route user member di `routes/web/admin/index.php` grup `dashboard.user.*`.

---

## 1. Endpoint gambar QR in-app (member)

**Masalah:** Job/mail sudah bisa menghasilkan PNG (`RegistrationQrPngGenerator`), tetapi browser tidak punya URL aman untuk `<img src="…">` di halaman peserta.

**Usulan BE:**

| Item | Detail |
|------|--------|
| Method | `GET` |
| Path (contoh) | `/dashboard/user/events/{event}/submissions/{formAnswer}/qr.png` |
| Nama route (contoh) | `dashboard.user.events.submissions.qr` |
| Response | Biner `image/png` (bukan Inertia), mis. `response($binary, 200, ['Content-Type' => 'image/png', 'Cache-Control' => 'private, max-age=3600'])` |
| Otorisasi | Wajib login. `form_answer.user_id === auth()->id()`. `form_answer.form.event_id === $event->id`. Selain itu `403` / `404`. |
| Implementasi | Controller tipis memanggil `app(RegistrationQrPngGenerator::class)->pngForSubmission($formAnswer->id)`. |

**FE nanti:** `EventDetail` (user) bisa menerima prop opsional `formAnswerId` dari closure route `events.show` dan mengikat `<img :src="…">` ke URL di atas + fallback jika error.

---

## 2. Prop `formAnswerId` (opsional) di halaman event user

**Masalah:** Tanpa ID submission, FE tidak bisa membangun URL QR di poin 1.

**Usulan BE:** Di handler `GET /dashboard/user/events/{event}` (Inertia `EventDetail`), jika user punya `FormAnswer` untuk form event tersebut, kirim juga `form_answer_id` (UUID) di props, mis. `formAnswerId: $registration?->id`.

---

## 3. Flash pasca-submit (opsional, pola Inertia)

**Masalah:** UX “baru saja submit” (banner sekali tampil) membutuhkan sinyal server.

**Usulan BE:** Setelah sukses di `FormSubmissionController`, selain `Inertia::flash('toast', …)` tambahkan mis. `Inertia::flash('registration_just_submitted', true)`. Pastikan middleware share Inertia tidak menimpa objek `flash` secara inkompatibel dengan perilaku `Inertia::flash` yang sudah ada.

**FE nanti:** Baca `usePage().props.flash?.registration_just_submitted` dan tampilkan banner singkat.

---

## 4. Admin: index `email_logs` per form

**Masalah:** Model `EmailLog` dan penulisan log di job sudah ada; belum ada **route HTTP** untuk admin melihat riwayat kirim per form/event.

**Usulan BE:**

| Item | Detail |
|------|--------|
| Method | `GET` (Inertia) |
| Path (contoh) | `/dashboard/events/{event}/forms/{form}/email-logs` |
| Nama route (contoh) | `dashboard.events.forms.email-logs` |
| Otorisasi | Sama seperti submissions: `$this->authorize('view', $event)` + `abort_unless($form->event_id === $event->id, 404)`. |
| Query | Paginate `EmailLog` yang `form_answer_id` termasuk jawaban untuk `form_id` tersebut; `with('user')` bila perlu; urut `created_at` desc. |
| Response | `Inertia::render('Dashboard/Events/Forms/EmailLogs', …)` dengan struktur paginator konsisten dengan `FormSubmissionsController`. |

**FE nanti:** Halaman `EmailLogs.vue` + link dari `Forms/Show.vue` (sudah pernah didesain; bisa dihidupkan kembali setelah route ada).

---

## 5. Template email (opsional polish)

**Catatan:** Peningkatan readability HTML/text mail (`resources/views/mail/registration-confirmation*.blade.php`) murni **server-side**. Tim BE bisa iterasi font size, kontras, `alt` pada gambar QR, tanpa mengubah Vue.

---

## 6. Operasional & tooling

- **Queue:** Email hanya terkirim andil worker jika `QUEUE_CONNECTION` bukan `sync`. Dokumentasikan di README/internal runbook bila perlu.
- **Wayfinder:** Setelah route baru stabil dan dipakai dari TS, jalankan generate di dalam container, mis.:

```bash
docker exec d_form_app php artisan wayfinder:generate
```

- **Smoke:** Submit form → cek baris `email_logs` → cek inbox (Mailpit/dsn) → (nanti) GET QR sebagai `image/png`.

---

## Ringkasan prioritas

1. **Tinggi:** Endpoint QR (1) + prop `formAnswerId` (2) — menutup celah “QR hanya di email”.
2. **Sedang:** Index `email_logs` (4) — observabilitas admin.
3. **Rendah / polish:** Flash (3), template mail (5).

Jika ada pertanyaan integrasi FE, rujuk nama route dan bentuk props di atas agar kontrak stabil.
