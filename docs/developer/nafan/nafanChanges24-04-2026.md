# Log perubahan & catatan teknis — 24 April 2026

Dokumen ini merangkum penyesuaian yang dilakukan pada sesi pengembangan (M3 / form builder, kualitas kode, dan kesiapan M4) agar **developer lain**—terutama **front-end**—bisa memahami konteks dengan cepat.

---

## Ringkasan eksekutif

| Area | Apa yang dilakukan |
|------|--------------------|
| **Rute & PHPUnit** | Perbaikan pemuatan rute agar setiap *test* memuat ulang file rute; perbaikan tes HTTP form builder. |
| **Request / otorisasi** | Resolusi `Event` & `Form` dari route agar aman jika model sudah *bound* (bukan cuma ID). |
| **Kualitas PHP** | Laravel Pint (PSR-12) diterapkan; beberapa file diformat/diperbaiki. |
| **Front-end (Vue/TS)** | ESLint dibersihkan: hilangkan `any`, variabel / impor tak terpakai, pola toast yang tipe-aman, dll. |
| **Produk (milestone)** | M3 (builder dinamis) dianggap cukup untuk memulai M4; daftar *gap* M4 dicatat di bawah. |

Tidak ada **PHPStan / Larastan** di proyek saat ini; *static analysis* PHP praktis melalui **Pint** + *review* manual.

---

## 1. Backend: rute, testing, & request

### 1.1 `routes/web.php` — `require` vs `require_once`

**Masalah:** Di PHPUnit, setiap *method test* membuat `Application` baru. Pemuatan rute lewat `require_once` **tidak** menjalankan ulang file rute setelah *first load*, sehingga **named route** (mis. `dashboard.events.forms.fields`) **hilang** dari tes ke-2, ke-3, dst. Gejalanya: `RouteNotFoundException` atau **404** saat `route()` / HTTP request setelah tes pertama dalam satu kelas.

**Perbaikan:** Ganti `require_once` menjadi **`require`** saat *loop* file di `routes/web/`, dengan komentar penjelas di kode.

**Dampak untuk developer:** Bukan perubahan perilaku *production* yang bermakna; ini terutama agar *test* dan *tooling* yang mem-*bootstrap* ulang app tetap punya rute lengkap. Jika menambah file rute baru, tetap ikuti pola *Finder* + `require` (bukan `require_once` di level ini).

### 1.2 Resolusi model di `FormRequest` (route model binding)

Di beberapa request, pemanggilan `Model::query()->find($param)` saat `$param` **sudah** instance model (karena *implicit binding*) bisa memicu perilaku tidak terduga. Pola yang dipakai: cek `instanceof Event` / `instanceof Form` dulu, baru fallback `::query()->find($id)`.

Berkas yang relevan (sesuai sesi penyesuaian):

- `app/Http/Requests/FieldModifyRequest.php` — otorisasi + `withValidator` (termasuk unik `name` per `form_id`, dsb.).
- `StoreEventFormRequest` / `UpdateEventFormRequest` — pola resolusi serupa bila disentuh.

**Catatan front-end (tidak langsung, tapi penting):** Jika sisi FE mem-*POST* ke URL yang sama dengan parameter `{event}` dan `{form}` yang benar, backend **tidak** seharusnya 404/403 karena “form tidak ditemukan” asalkan relasi `form.event_id` konsisten (ini sudah divalidasi di controller/ request).

### 1.3 Rute *batch* field (M3)

- **POST** `dashboard/events/{event}/forms/{form}/fields` — handler invokable: `FieldOperationController::__invoke` dengan `FieldModifyRequest`.
- Tes: `tests/Feature/Forms/FormBuilderHttpTest.php` memakai `route('dashboard.events.forms.fields', …)` setelah perbaikan pemuatan rute.

### 1.4 Laravel Pint (PSR-12)

- Konfigurasi: [`pint.json`](../../../pint.json) — preset `psr12`.
- Perintah: `php vendor/bin/pint --test` (cek), `php vendor/bin/pint` (perbaiki).
- Contoh *area* yang terdampak otomatis: brace/line ending, *unused import* di model, migrasi lama, kontroler terkait, dsb. **Jalankan Pint** sebelum PR besar agar gaya kode seragam.

---

## 2. Front-end: ESLint, TypeScript, & perilaku UI

Berkas di [`resources/js/`](../../../resources/js) dilint dengan:

```bash
npx eslint "resources/js/**/*.{ts,vue,js,mts,tsx}" --max-warnings 0
```

(Konfigurasi: [`eslint.config.js`](../../../eslint.config.js) — `*.ts` / `*.vue`, aturan `no-explicit-any` dsb.)

### 2.1 Poin yang di-highlight untuk **front-end**

1. **Hindari `any`**
   - Contoh: `InertiaForm<Record<string, unknown>>` di [`AuthSubmitBtn.vue`](../../../resources/js/components/core/button/AuthSubmitBtn.vue).
   - Props halaman: gunakan tipe per konteks, mis. `DashboardPageExtras` (breadcrumb + `event` ringkas) di [`DashboardFocusLayout.vue`](../../../resources/js/layouts/DashboardFocusLayout.vue), atau assertion terarah untuk `errors` di [`Auth.vue`](../../../resources/js/pages/Auth.vue).

2. **Toast setelah *flash* (login/register)**
   - Di [`AuthLoginForm.vue`](../../../resources/js/components/modules/auth/AuthLoginForm.vue) & [`AuthRegisterForm.vue`](../../../resources/js/components/modules/auth/AuthRegisterForm.vue) tidak lagi memanggil `toast[dynamic]`. Gunakan pengecekan eksplisit: `t.type === 'success'` → `toast.success`, else → `toast.error` (selaras tipe *flash* di [`types/global.d.ts`](../../../resources/js/types/global.d.ts)).

3. **`defineProps` di [`AuthToast.vue`](../../../resources/js/components/modules/auth/AuthToast.vue)**
   - Hindari `import` Vue yang tidak terpakai dan variabel `props` yang tidak dipakai; cukup `defineProps<…>()` agar *prop* `toast` tersedia di template.

4. **Ref + `const`**
   - Contoh: [`PasswordInput.vue`](../../../resources/js/components/core/input/PasswordInput.vue) — `showPassword` sebagai `const ref(…)`.
   - [`useAuth.ts`](../../../resources/js/utils/composables/useAuth.ts) — hasil `computed` disimpan di `const`, bukan `let`.

5. **Impor & kode mati**
   - Bersihkan impor icon/komponen yang tidak dipakai (contoh: [`AuthField.vue`](../../../resources/js/components/core/field/AuthField.vue), [`EventDetail.vue`](../../../resources/js/pages/EventDetail.vue), [`Profile.vue`](../../../resources/js/pages/Dashboard/Profile.vue)).
   - Hapus konstanta / helper yang tidak dipakai (contoh: `iconPaths` di [`FeaturesGrid.vue`](../../../resources/js/components/modules/landing/features/FeaturesGrid.vue), *dead code* di [`ComboboxTagInput.vue`](../../../resources/js/components/modules/dashboard/events/ComboboxTagInput.vue)).

6. **File tipe: [`types/model.d.ts`](../../../resources/js/types/model.d.ts)**
   - Sebelumnya memicu aturan `prefer-namespace-keyword` / pola `declare module` aneh. Isi disederhanakan menjadi `export {}` + komentar: **tipe *shared* Inertia** tetap di [`types/global.d.ts`](../../../resources/js/types/global.d.ts); `model.d.ts` untuk DTO *colocation* ke depan.

7. **Perubahan bukan-M3 tapi disentuh ESLint**
   - [`Create.vue`](../../../resources/js/pages/Dashboard/Events/Create.vue) — *unused* `datetimeInputClass` + impor `cn` dihapus bila sudah tidak dipakai.
   - [`Edit.vue`](../../../resources/js/pages/Dashboard/Events/Edit.vue) — impor `show` (alias `showEvent`) dihapus jika tidak terpakai.

**Rekomendasi tim FE:** sebelum *merge* PR, jalankan `npx eslint … --max-warnings 0` (atau tambahkan script `lint` di `package.json` jika disepakati).

---

## 3. Testing (PHPUnit)

- **`php artisan test`**: seluruh suite (41 test, 106 assertion) dijalankan setelah Pint/ESLint dan lulus.
- Tes fokus M3: `tests/Feature/Forms/FormBuilderHttpTest.php`, `FieldOperationTest`, `RulesBuilderTest`, plus fitur event lain yang tidak berubah perilaku sejak sesi.

---

## 4. Milestone: M3 selesai vs apa yang masuk M4

### 4.1 Yang sudah mendukung “lanjut ke M4”

- Builder admin: *persist* `form_fields`, validasi `FieldModifyRequest`, `FormFieldTypeMapping`, `FieldOperationController`.
- Ada pondasi: `RulesBuilder`, `FormSubmissionController` (dashboard), model `FormAnswer` — M4 dapat memperluas ke **halaman publik**, **file upload**, error per field di UX member.

### 4.2 Catatan *highlight* (bukan *blocker* mutlak tapi backlog jelas)

| Item | Penjelasan singkat |
|------|--------------------|
| Alur **publik** pendaftaran | PRD: member pilih event → isi form. Saat ini submit contoh ada di **rute dashboard**; M4 perlu rute + halaman publik. |
| **Upload file** | Pastikan *rules* mimes/size dari builder + storage konsisten. |
| Penamaan tabel / dokumen | PRD menyebut konsep `event_form_submissions`; kode mungkin memakai `form_answers` — selaraskan di M4. |
| **Cek migrasi Livewire (M3)** | Masih ada sisa `app/Livewire/Event/Form/*` & Blade `@livewire` di beberapa view. Form admin *baru* lewat Inertia; sisa Livewire mungkin *dead code* — perlu inventaris & pembersihan terpisah. |
| **Error per field (UI publik)** | *Wire* Inertia/validasi agar memenuhi kriteria M4. |

Rujukan: [`docs/milestone.md`](../../milestone.md), [`docs/04-contract.md`](../../04-contract.md), [`docs/prd.md`](../../prd.md).

---

## 5. Checklist singkat untuk PR berikutnya

- [ ] `php vendor/bin/pint --test` lulus.
- [ ] `npx eslint "resources/js/**/*.{ts,vue,js,mts,tsx}" --max-warnings 0` lulus.
- [ ] `php artisan test` lulus.
- [ ] (Opsional) Pertimbangkan menambah **Larastan/PHPStan** bila tim ingin analisis tipe di PHP.

---

*Ditulis untuk kolaborasi tim; bila ada penyimpangan dengan cabang/PR tertentu, rujuk *diff* Git sebagai sumber kebenaran utama.*
