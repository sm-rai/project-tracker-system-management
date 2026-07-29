# Design Spec: Konfigurasi SLA & Manajemen Issue (Kendala)

| | |
|---|---|
| **Tanggal** | 29 Juli 2026 |
| **Topik** | Konfigurasi SLA & Manajemen Issue (Kendala System) |
| **Status** | Approved by User |
| **Target PRD** | Section 5.1, 7.4 (`sla_configs`), 7.5 (`issues`), 8.2, 9.2, 9.4 |

---

## 1. Ringkasan Fitur

Modul ini memfasilitasi pencatatan dan penanganan kendala sistem (*Issue Management*) serta pengelolaan *Service Level Agreement* (SLA) untuk divisi System Management. Fitur ini menjadi dasar utama untuk perhitungan persentase pencapaian **OKR 2 Part 1** (Penanganan kendala tepat waktu).

---

## 2. Arsitektur & Aturan Bisnis (Business Rules)

### 2.1 Konfigurasi SLA (`sla_configs`)
- Tabel `sla_configs` memiliki 3 record utama berdasarkan prioritas: `urgent`, `normal`, `low`.
- Masing-masing menyimpan `target_resolution_days` (default: Urgent = 1 hari, Normal = 3 hari, Low = 7 hari).
- Admin dapat memperbarui `target_resolution_days` di halaman Pengaturan SLA (`/settings/sla`).

### 2.2 Manajemen Issue (`issues`)
- **Penetapan Project/Sistem Terkait:**
  - Dropdown pilihan project hanya menampilkan project yang berstatus `deployed_running` atau `deployed_maintenance`.
  - `project_id` bersifat opsional (`nullable`) jika isu tergolong isu umum / infrastruktur yang tidak terikat pada satu sistem spesifik.
- **Waktu Pelaporan & Kalkulasi Tenggat (`reported_at` & `due_date`):**
  - `reported_at` diisi tanggal & waktu pelaporan (default `now()`, tetapi dapat dipilih/diberikan tanggal & waktu susulan/backdate).
  - `due_date` dihitung otomatis: `reported_at + target_resolution_days` (berdasarkan SLA prioritas yang dipilih). Perhitungan menggunakan hari biasa kalender.
- **Penyelesaian Issue & Indikator Ketepatan Waktu (`is_on_time`):**
  - Saat isu ditandai `resolved`, `resolved_at` mencatat timestamp saat ini.
  - `resolution_note` bersifat opsional.
  - `is_on_time` bernilai `true` jika `resolved_at` <= `due_date 23:59:59`, sebaliknya `false`.
  - Jika isu di-reopen (berubah kembali ke `open`), `resolved_at` dan `is_on_time` di-reset menjadi `null`.
- **Status Overdue:**
  - Isu dianggap *Overdue* jika `status === 'open'` dan waktu saat ini (`now()`) telah melewati `due_date 23:59:59`.

---

## 3. Rute & Controller Backend

### 3.1 SLA Config Controller (`SlaConfigController`)
- `GET /settings/sla` (`sla.index`) -> Render halaman `sla/index`
- `PUT /settings/sla` (`sla.update`) -> Update data `sla_configs`

### 3.2 Issue Controller (`IssueController`)
- `GET /issues` (`issues.index`) -> Render `issues/index` dengan data list issue ter-paginate, statistik summary (Total, Open, Resolved, Overdue, % On-Time), dan data filter.
- `GET /issues/create` (`issues.create`) -> Render `issues/create` dengan list project `deployed_running` & `deployed_maintenance` serta data SLA configs.
- `POST /issues` (`issues.store`) -> Validasi input, kalkulasi `due_date`, simpan issue.
- `GET /issues/{issue}` (`issues.show`) -> Render `issues/show` menampilkan detail isu dan timeline.
- `GET /issues/{issue}/edit` (`issues.edit`) -> Render `issues/edit` untuk form pengubahan data isu.
- `PUT /issues/{issue}` (`issues.update`) -> Update data isu.
- `PATCH /issues/{issue}/resolve` (`issues.resolve`) -> Update status isu menjadi `resolved`, hitung `is_on_time`, simpan `resolution_note`.
- `PATCH /issues/{issue}/reopen` (`issues.reopen`) -> Reset status isu menjadi `open`.
- `DELETE /issues/{issue}` (`issues.destroy`) -> Hapus data isu.

---

## 4. Struktur Halaman & Komponen Frontend

1. **`resources/js/pages/sla/index.tsx`**
   - Form tabel pengeditan `target_resolution_days` per prioritas SLA.

2. **`resources/js/pages/issues/index.tsx`**
   - Header Cards: Total Issues, Open Issues, Overdue Issues, % On-Time.
   - Filter & Search Bar: Search title/description, Filter Project, Priority, Root Cause, Status, Overdue toggle.
   - Data Table dengan Badge Status, Badge Priority, Tanggal Lapor & Tenggat Waktu (highlight merah jika overdue), dan tombol Aksi.

3. **`resources/js/pages/issues/create.tsx`**
   - Form terstruktur dengan dropdown Project terfilter, Input Title, Textarea Description, Select Priority, Select Root Cause, dan Date-Time Picker `reported_at`.

4. **`resources/js/pages/issues/show.tsx`**
   - Detail tampilan isu, banner status (Open/Overdue/Resolved On-Time/Resolved Late), timeline lapor, dan form/modal aksi penyelesaian isu.

5. **`resources/js/pages/issues/edit.tsx`**
   - Form pengubahan data isu existing.

---

## 5. Pengujian & Verifikasi (Verification Plan)

- **Unit & Feature Tests (Pest PHP):**
  - Test seeding/default SLA config.
  - Test pengubahan SLA config.
  - Test pembuatan issue kalkulasi `due_date` berdasarkan SLA prioritas.
  - Test validasi dropdown project (hanya project `deployed_running` / `deployed_maintenance`).
  - Test penyelesaian issue (`resolved`) dan kalkulasi `is_on_time` (on time vs late).
  - Test re-open issue.
  - Test filter & pencarian di index issues.
