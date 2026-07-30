# Design Spec: Manajemen Feature Request

| | |
|---|---|
| **Tanggal** | 30 Juli 2026 |
| **Topik** | Manajemen Feature Request Sistem Operasional |
| **Status** | Approved by User |
| **Target PRD** | Section 5.1, 7.6 (`feature_requests`), 8.2, 9.1, 9.3, dan 12 |

---

## 1. Ringkasan Fitur

Modul Feature Request mencatat permintaan penambahan fitur pada sistem yang sudah
berjalan. Modul ini menjadi sumber data **OKR 2 Part 2**, yaitu target minimal
**90% feature request terpenuhi sesuai timeline**.

Scope implementasi mencakup CRUD lengkap, transisi status, perhitungan SLA dan
ketepatan waktu, indikator overdue, KPI minggu berjalan, integrasi ke detail
Project/Sistem, serta otorisasi. Dashboard dan laporan lintas-OKR tetap berada
di scope implementasi berikutnya.

---

## 2. Pendekatan yang Dipilih

Feature Request dibangun sebagai modul mandiri yang sejajar dengan modul Issue.
Modul memiliki route, controller, form request, halaman, filter, metrik, dan
pengujian sendiri. Pendekatan ini dipilih karena:

- mengikuti struktur aplikasi yang sudah dipahami pengguna;
- tidak memerlukan refactor besar terhadap modul Issue;
- menyediakan daftar lintas sistem yang mudah dicari dan dipresentasikan;
- menghasilkan data terstruktur yang langsung dapat dipakai Dashboard dan
  Report Snapshot pada tahap berikutnya.

---

## 3. Data Model

Tabel `feature_requests` yang sudah ada tetap menjadi sumber data utama. Satu
migration tambahan menambahkan:

| Field | Tipe | Aturan |
|---|---|---|
| `fulfillment_note` | `text`, nullable | Catatan implementasi/penyelesaian terakhir; opsional |

Field existing yang digunakan:

- `project_id`: wajib dan mengarah ke Project/Sistem berstatus
  `deployed_running` atau `deployed_maintenance`;
- `title`: ringkasan permintaan;
- `description`: kebutuhan dan konteks permintaan;
- `priority`: `urgent`, `normal`, atau `low`;
- `requested_at`: waktu permintaan diterima;
- `due_date`: tanggal target yang dihitung otomatis;
- `fulfilled_at`: timestamp saat request dipenuhi;
- `status`: `open`, `in_progress`, atau `fulfilled`;
- `is_on_time`: hasil perbandingan `fulfilled_at` dengan akhir hari `due_date`.

---

## 4. Aturan Bisnis

### 4.1 Project/Sistem yang Eligible

- Feature Request wajib terkait dengan satu Project/Sistem.
- Dropdown hanya menampilkan project berstatus `deployed_running` atau
  `deployed_maintenance`.
- Validasi backend menerapkan aturan yang sama sehingga project development
  tidak dapat dikirim melalui request manual.
- Feature Request yang sudah tercatat tetap dapat dilihat dalam histori project.

### 4.2 SLA dan Due Date

- `due_date = requested_at + target_resolution_days`.
- SLA diambil dari `sla_configs` sesuai prioritas saat data dibuat atau saat
  `requested_at`/`priority` diedit.
- Perhitungan menggunakan hari kalender.
- Form menampilkan preview tanggal target sebelum disimpan.

### 4.3 Transisi Status

Transisi yang didukung:

1. Feature Request baru selalu berstatus `open`.
2. `open -> in_progress` melalui aksi **Mulai Dikerjakan**.
3. `open` atau `in_progress -> fulfilled` melalui aksi
   **Tandai Terpenuhi**.
4. `fulfilled -> in_progress` melalui aksi **Buka Kembali**.

Saat ditandai terpenuhi:

- `fulfilled_at` diisi timestamp saat aksi dilakukan;
- `fulfillment_note` disimpan jika pengguna mengisinya;
- `is_on_time = true` jika `fulfilled_at <= due_date 23:59:59`;
- status otomatis menjadi `fulfilled`.

Saat dibuka kembali:

- status menjadi `in_progress`;
- `fulfilled_at` dan `is_on_time` menjadi `null`;
- `fulfillment_note` terakhir tetap tersimpan sebagai konteks histori dan dapat
  diganti pada penyelesaian berikutnya.

Status tidak diedit bebas dari form umum. Perubahan status dilakukan melalui
aksi khusus agar timestamp dan `is_on_time` selalu konsisten.

### 4.4 Overdue

Feature Request dianggap overdue bila:

- status bukan `fulfilled`; dan
- tanggal saat ini sudah melewati `due_date`.

Status overdue merupakan kondisi turunan untuk tampilan dan filter, bukan nilai
status baru di database.

### 4.5 KPI OKR 2 Feature Request

Halaman daftar menampilkan KPI minggu kalender berjalan, Senin sampai Minggu:

```text
persentase on-time =
    jumlah feature request periode yang is_on_time = true
    / seluruh feature request yang requested_at berada dalam periode
    x 100
```

Aturan tambahan:

- request open/in-progress dalam periode tetap masuk denominator;
- bila tidak ada request dalam periode, nilai otomatis `100%`;
- target pembanding adalah `90%`;
- UI menampilkan periode, nilai aktual, target, jumlah item on-time, total item,
  dan status target **Tercapai** atau **Belum Tercapai**.

KPI ini merupakan presentasi operasional awal untuk OKR tim System Management.
Tren antarperiode, snapshot permanen, PDF, dan PNG tetap menjadi tanggung jawab
modul Reporting.

---

## 5. Backend

### 5.1 Form Request

`SaveFeatureRequestRequest` menangani validasi create dan update:

- `project_id`: required dan exists pada project deployed;
- `title`: required, string, maksimal 255 karakter;
- `description`: required, string;
- `priority`: required dan sesuai enum `Priority`;
- `requested_at`: required dan tanggal/waktu valid.

Pesan validasi dan nama atribut menggunakan Bahasa Indonesia.

### 5.2 Controller dan Route

`FeatureRequestController` menyediakan:

- `GET /feature-requests` (`feature-requests.index`);
- `GET /feature-requests/create` (`feature-requests.create`);
- `POST /feature-requests` (`feature-requests.store`);
- `GET /feature-requests/{featureRequest}` (`feature-requests.show`);
- `GET /feature-requests/{featureRequest}/edit` (`feature-requests.edit`);
- `PUT/PATCH /feature-requests/{featureRequest}` (`feature-requests.update`);
- `DELETE /feature-requests/{featureRequest}` (`feature-requests.destroy`);
- `PATCH /feature-requests/{featureRequest}/start`
  (`feature-requests.start`);
- `PATCH /feature-requests/{featureRequest}/fulfill`
  (`feature-requests.fulfill`);
- `PATCH /feature-requests/{featureRequest}/reopen`
  (`feature-requests.reopen`).

Controller index mendukung:

- pencarian judul/deskripsi;
- filter project;
- filter priority;
- filter status;
- filter overdue;
- pagination yang mempertahankan query string;
- ringkasan jumlah total, open, in-progress, fulfilled, overdue;
- KPI OKR minggu berjalan.

### 5.3 Otorisasi

Semua aksi controller menjalankan policy:

- user terautentikasi dapat melihat, membuat, memperbarui, memulai,
  memenuhi, dan membuka kembali Feature Request;
- hanya admin dapat menghapus;
- aksi yang tidak diizinkan menghasilkan HTTP 403;
- tombol hapus hanya ditampilkan kepada admin.

---

## 6. Frontend dan UX

Seluruh UI menggunakan komponen shadcn/ui yang sudah tersedia dan mempertahankan
visual language modul Issue.

### 6.1 Halaman Daftar

`resources/js/pages/feature-requests/index.tsx` berisi:

- judul dan CTA **Catat Feature Request**;
- kartu OKR 2 dengan realisasi minggu berjalan vs target 90%;
- kartu ringkas total, open, in-progress, fulfilled, dan overdue;
- search dan filter Project/Sistem, prioritas, status, serta overdue;
- tabel berisi request, sistem, prioritas, status, waktu request, due date, dan
  aksi;
- badge overdue serta empty state yang kontekstual;
- pagination valid dan type-safe.

### 6.2 Form Create/Edit

Komponen bersama `FeatureRequestForm` digunakan oleh halaman create dan edit:

- project deployed wajib dipilih;
- title dan description;
- requested date-time;
- priority;
- preview SLA dan due date;
- ringkasan error yang dapat mengarahkan fokus ke field;
- proteksi saat meninggalkan form dengan perubahan yang belum disimpan.

### 6.3 Halaman Detail

Halaman detail menampilkan:

- identitas request dan Project/Sistem terkait;
- status, priority, requested date, due date, dan indikator overdue;
- timeline open, in-progress, serta fulfilled;
- hasil on-time/late;
- fulfillment note bila tersedia;
- aksi sesuai status: mulai, fulfill, reopen, edit, dan delete untuk admin.

Dialog fulfillment menyediakan `fulfillment_note` opsional.

### 6.4 Navigasi dan Detail Project

- Sidebar mendapat menu **Feature Request**.
- Detail project deployed mengganti placeholder dengan dua bagian operasional:
  daftar Issue dan daftar Feature Request terkait.
- Setiap baris mengarah ke halaman detail masing-masing.
- Project yang belum deployed tetap menonaktifkan tab operasional.

Semua navigasi dan submit baru menggunakan fungsi route type-safe Laravel
Wayfinder, bukan URL string baru yang ditulis manual.

---

## 7. Penanganan Error dan Konsistensi Data

- Input invalid kembali ke form dengan pesan per field.
- Project non-deployed ditolak oleh validasi backend.
- Aksi status yang tidak sesuai state saat ini ditolak dengan validation error,
  misalnya memulai request yang sudah fulfilled.
- Kalkulasi due date dan is_on_time dilakukan di backend sebagai sumber
  kebenaran; frontend hanya memberikan preview.
- Operasi perubahan status menyimpan timestamp dan field terkait dalam satu
  proses yang konsisten.

---

## 8. Pengujian

Pest feature tests mencakup:

- guest tidak dapat mengakses route Feature Request;
- halaman index/create/show/edit dapat dirender oleh user terautentikasi;
- create berhasil dan menghitung due date dari SLA;
- project development ditolak;
- project deployed running/maintenance diterima;
- update menghitung ulang due date ketika priority/requested_at berubah;
- pencarian dan seluruh filter index;
- transisi `open -> in_progress`;
- fulfill dengan dan tanpa `fulfillment_note`;
- kalkulasi on-time dan late;
- reopen mengosongkan timestamp/ketepatan waktu tetapi mempertahankan note;
- indikator/filter overdue;
- non-admin tidak dapat delete dan admin dapat delete;
- detail project menerima daftar Issue serta Feature Request terkait;
- KPI minggu berjalan mengikuti formula PRD dan menghasilkan 100% bila periode
  tidak memiliki request.

Verifikasi akhir mencakup:

- test Feature Request terfilter;
- seluruh Pest suite;
- Laravel Pint untuk file PHP yang berubah;
- Wayfinder generation;
- TypeScript type-check;
- ESLint pada file frontend yang berubah;
- production build.

---

## 9. Batas Scope

Tidak termasuk dalam implementasi ini:

- Dashboard lintas OKR;
- report snapshot dan tren historis;
- export PDF/PNG;
- notifikasi SLA;
- auto-generate atau auto-send laporan;
- integrasi input eksternal;
- refactor menyeluruh modul Issue.

Modul ini harus menyediakan data yang benar dan antarmuka KPI awal agar
Dashboard serta Reporting dapat dibangun tanpa mengubah kontrak Feature Request.
