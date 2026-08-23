# PRD — Project Tracker
## Divisi System Management, IT Rumah Atsiri Indonesia

| | |
|---|---|
| **Dokumen** | Product Requirements Document (PRD) |
| **Versi** | 1.4 (Export PDF lengkap & PNG ringkasan snapshot) |
| **Pemilik Produk** | Erwin — System Management, IT Rumah Atsiri Indonesia |
| **Status** | Draft — siap direview sebelum masuk fase development |
| **Tanggal** | 26 Juli 2026 |

---

## 1. Ringkasan Eksekutif

Project Tracker adalah aplikasi web internal untuk divisi System Management yang berfungsi sebagai satu sumber kebenaran (single source of truth) atas:

1. Seluruh **project pengembangan sistem baru** yang pernah, sedang, atau akan dikerjakan.
2. Seluruh **kendala (issue)** dan **request penambahan fitur** pada sistem yang sudah berjalan (business as usual).

Aplikasi ini menggantikan proses pencatatan manual/tersebar dan menjadi basis otomatis untuk perhitungan capaian OKR divisi, sekaligus menghasilkan laporan mingguan (PDF & PNG) yang siap dikirim ke Head of Department (HoD).

---

## 2. Latar Belakang & Masalah

Divisi System Management memiliki dua OKR utama yang saat ini pelaporannya masih manual:

**OKR 1 — Menyusun dan Menetapkan Alur Kerja Permintaan Program yang Jelas, Terukur, dan Berpusat pada Pengalaman Pengguna (User-Centric)**
> Target: setiap project development mencapai minimal **75%** realisasi fitur yang di-*propose* pada brief.

**OKR 2 — Memperkuat Integrasi Antar Sistem dan Kolaborasi Lintas Departemen untuk Mendukung Arsitektur Bisnis yang Terpadu**
> Target: **80%** kendala dapat teratasi sesuai timeline.
> Target: **90%** request penambahan fitur terbaru dapat terpenuhi sesuai timeline.

Tanpa sistem pencatatan terstruktur, perhitungan persentase ini dilakukan manual setiap minggu, rawan human error, tidak punya histori tren, dan sulit menghasilkan visualisasi yang layak dipresentasikan ke HoD.

---

## 3. Tujuan Produk

- Mencatat semua project (brief & breakdown fitur) secara terstruktur → basis perhitungan OKR 1.
- Mencatat semua kendala sistem dan request fitur pada sistem existing → basis perhitungan OKR 2.
- Melacak fase siklus hidup tiap project/sistem secara eksplisit — dari development, deployment, hingga status operasional (running/maintenance).
- Menghitung otomatis persentase capaian kedua OKR, termasuk tren dari minggu ke minggu.
- Menghasilkan laporan mingguan yang bisa diexport dalam format **PDF** (laporan lengkap) dan **PNG** (ringkasan snapshot utuh untuk share cepat), dengan fleksibilitas rentang tanggal.

---

## 4. Target Pengguna

| Peran | Deskripsi |
|---|---|
| **Admin / PIC System Management** | Erwin — saat ini satu-satunya user. Input & kelola semua data, generate report. |

> **Catatan desain:** meskipun user saat ini hanya 1 orang, struktur user & role dibuat *extensible* agar mudah menambah anggota tim System Management di masa depan tanpa refactor besar.

---

## 5. Ruang Lingkup (Scope)

### 5.1 In Scope (MVP)
- CRUD Project/Sistem (entitas tunggal) + breakdown Brief Feature
- Pelacakan status siklus hidup: development → deployment → operasional (running/maintenance), dalam satu field status
- CRUD Issue (kendala) — hanya untuk Project/Sistem yang sudah berstatus deployed
- CRUD Feature Request — hanya untuk Project/Sistem yang sudah berstatus deployed
- Konfigurasi SLA per prioritas (Urgent/Normal/Low)
- Dashboard ringkasan real-time
- Generate & export laporan mingguan (PDF lengkap + PNG ringkasan snapshot utuh), dengan opsi rentang tanggal custom
- Autentikasi sederhana (single user, role-ready)

### 5.2 Out of Scope (MVP) — kandidat fase berikutnya
- Manajemen role/permission granular multi-user
- Notifikasi/reminder otomatis (misal: mendekati due date SLA)
- Integrasi otomatis dari kanal lain (WhatsApp, email, ticketing tool)
- Auto-generate report terjadwal (cron mingguan tanpa trigger manual)

---

## 6. Arsitektur & Tech Stack

| Aspek | Keputusan |
|---|---|
| **Tipe aplikasi** | Standalone web app, berdiri sendiri (tidak bergantung pada sistem lain) |
| **Backend** | Laravel (versi terbaru LTS-stable) |
| **Frontend** | Inertia.js + React |
| **UI Components** | shadcn/ui (Radix UI + Tailwind CSS) — dipakai untuk seluruh komponen UI |
| **Chart / Visualisasi Data** | Komponen Chart dari shadcn/ui (berbasis Recharts) — dipakai untuk seluruh visualisasi di dashboard maupun laporan |
| **Database** | MySQL — satu database untuk seluruh entity, tidak perlu pemisahan schema mengingat skala aplikasi yang kecil dan single-purpose |
| **Hosting** | Infra existing kamu (VPS via Coolify) |
| **PDF generation** | Rekomendasi: **Spatie Browsershot** (render Blade/HTML view via headless Chrome ke PDF) — lebih presisi untuk chart dibanding DomPDF yang terbatas untuk CSS/JS modern |
| **PNG snapshot export** | Screenshot ringkasan snapshot utuh via Browsershot (server-side), berisi ringkasan OKR, statistik, realisasi project, dan status Issue/Feature Request |
| **Auth** | Laravel native auth (session-based) — cukup login email + password, tanpa alur invitation kompleks karena skala user kecil |

> **Catatan:** pattern Repository + Service Layer bisa tetap dipakai untuk menjaga konsistensi coding style, sesuai preferensi arsitektur yang biasa kamu pakai.

---

## 7. Data Model

### 7.1 `users`
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| name | string | |
| email | string | unique |
| password | string | hashed |
| role | enum | `admin` (default), disiapkan untuk role lain di masa depan |
| created_at / updated_at | timestamp | |

### 7.2 `projects` — entitas tunggal Project/Sistem (basis OKR 1 **dan** OKR 2)

> Satu row di tabel ini merepresentasikan siklus hidup penuh sebuah project/sistem — dari masih direncanakan, development, sampai deploy dan berjalan/maintenance di production. Tidak ada tabel master data sistem terpisah; status yang sama menentukan apakah sebuah entry masih dihitung di OKR 1 (development) atau sudah eligible untuk dicatat kendalanya di OKR 2 (operasional).

| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| name | string | nama project/sistem |
| description | text | nullable |
| status | enum | lihat breakdown status di bawah |
| start_date | date | nullable — kosong jika sistem lama diinput langsung sebagai `deployed_running` tanpa melalui fase development di tool ini |
| target_end_date | date | nullable |
| actual_end_date | date | nullable, terisi saat development 100% (status `completed_pending_deployment` atau lebih lanjut) |
| created_by | FK → users | |
| created_at / updated_at | timestamp | |

**Breakdown status (siklus hidup development → deployment → operasional):**

| Status | Arti | Masuk hitungan OKR 1? | Bisa jadi target Issue/Feature Request (OKR 2)? |
|---|---|---|---|
| `planning` | Baru direncanakan, brief sedang disusun | Ya | Tidak |
| `in_progress` | Development berjalan | Ya | Tidak |
| `on_hold` | Development sementara dihentikan | Ya | Tidak |
| `completed_pending_deployment` | 100% fitur brief selesai, **belum di-deploy** ke production | Ya | Tidak |
| `deployed_running` | Sudah deploy, berjalan normal di production | Tidak (dianggap 100%, lulus dari radar OKR 1) | **Ya** |
| `deployed_maintenance` | Sudah deploy, **sedang dalam maintenance/perbaikan** | Tidak | **Ya** |

> **Aturan validasi:** dropdown "sistem terkait" saat membuat Issue atau Feature Request baru **hanya menampilkan** project/sistem berstatus `deployed_running` atau `deployed_maintenance`. Project yang masih dalam fase development tidak bisa dipilih sebagai target — ini menjamin data OKR 2 murni berasal dari sistem yang sudah live.

### 7.3 `brief_features` (child dari `projects`)
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| project_id | FK → projects | |
| name | string | nama fitur yang direquest |
| description | text | nullable |
| status | enum | `todo`, `in_progress`, `done` |
| completed_at | timestamp | nullable, terisi otomatis saat status → `done` |
| created_at / updated_at | timestamp | |

**Formula % realisasi per project:**
```
% realisasi = (jumlah brief_features berstatus done / total brief_features) × 100
```

### 7.4 `sla_configs`
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| priority | enum | `urgent`, `normal`, `low` |
| target_resolution_days | integer | default: urgent=1, normal=3, low=7 |
| updated_at | timestamp | |

### 7.5 `issues` (kendala — basis OKR 2 bagian 1)
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| project_id | FK → projects | wajib berstatus `deployed_running`/`deployed_maintenance` (lihat aturan validasi §7.2); nullable jika kendala bersifat umum, tidak terikat sistem spesifik |
| title | string | |
| description | text | |
| priority | enum | `urgent`, `normal`, `low` |
| root_cause_category | enum | `system_error`, `non_system`, `other` — untuk insight tambahan, **tidak memengaruhi** perhitungan % OKR 2 |
| reported_at | timestamp | |
| due_date | date | auto-calculated: `reported_at + sla_configs.target_resolution_days` |
| resolved_at | timestamp | nullable |
| status | enum | `open`, `resolved` |
| resolution_note | text | nullable |
| is_on_time | boolean | computed: `resolved_at <= due_date` |
| created_at / updated_at | timestamp | |

### 7.6 `feature_requests` (basis OKR 2 bagian 2)
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| project_id | FK → projects | wajib berstatus `deployed_running`/`deployed_maintenance` (lihat aturan validasi §7.2) |
| title | string | |
| description | text | |
| priority | enum | `urgent`, `normal`, `low` |
| requested_at | timestamp | |
| due_date | date | auto-calculated dari SLA |
| fulfilled_at | timestamp | nullable |
| status | enum | `open`, `in_progress`, `fulfilled` |
| is_on_time | boolean | computed: `fulfilled_at <= due_date` |
| created_at / updated_at | timestamp | |

### 7.7 `report_snapshots` (histori untuk tren & analisis)
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| period_start_date | date | tanggal mulai periode (default Minggu) |
| period_end_date | date | tanggal akhir periode (default Sabtu, total 7 hari) |
| period_type | enum | `weekly_default` (laporan mingguan standar, 7 hari) atau `custom_range` (analisis ad-hoc rentang tanggal bebas) |
| okr1_project_achievement_percentage | decimal nullable | persentase project aktif yang mencapai target OKR 1 sebesar 75%; ringkasan tambahan, bukan pengganti penilaian per project |
| okr2_issue_percentage | decimal | % kendala on-time pada periode tsb |
| okr2_feature_request_percentage | decimal | % request fitur on-time pada periode tsb |
| project_breakdown_json | json | snapshot detail per project saat itu |
| issue_breakdown_json | json | snapshot detail kendala saat itu (termasuk breakdown root cause) |
| feature_request_breakdown_json | json | snapshot detail request fitur saat itu |
| pdf_file_path | string | nullable, lokasi file PDF hasil generate |
| png_file_paths | json (array) | nullable, kompatibilitas histori; export PNG MVP berupa satu ringkasan snapshot utuh dan tidak disimpan sebagai file permanen |
| generated_at | timestamp | |

> Snapshot disimpan permanen tiap kali laporan/analisis digenerate, agar tren historis tidak berubah meskipun data mentah di tabel lain kemudian diedit.

> Catatan kompatibilitas: snapshot lama dapat tetap memiliki kolom `okr1_avg_percentage`, tetapi snapshot baru menggunakan `okr1_project_achievement_percentage` dan detail `project_breakdown_json` sebagai sumber penilaian OKR 1 per project.

---

## 8. Business Logic / Perhitungan

### 8.1 OKR 1 — % Realisasi Fitur per Project
- Setiap project yang masih berada dalam fase development memiliki OKR 1 masing-masing.
- Status project yang masuk penilaian: `planning`, `in_progress`, `on_hold`, dan `completed_pending_deployment`.
- Perhitungan setiap project: `(fitur done / total fitur) × 100`.
- Project dinyatakan mencapai OKR 1 apabila realisasinya minimal **75%**.
- Dashboard dan laporan wajib menampilkan hasil per project, bukan rata-rata persentase lintas project.
- Project yang belum memiliki brief feature berstatus **belum dapat dinilai** dan tidak dimasukkan ke denominator project yang dapat dinilai. Kondisi ini tetap ditampilkan sebagai kelengkapan data yang perlu ditindaklanjuti.
- Ringkasan tambahan boleh menampilkan jumlah project yang mencapai target dibandingkan jumlah project yang dapat dinilai, tetapi tidak menjadi pengganti nilai OKR per project.
- Begitu project berstatus `deployed_running` atau `deployed_maintenance`, project tersebut dianggap **100% selesai** dan otomatis keluar dari radar OKR 1 (tetap tercatat untuk histori), sekaligus otomatis menjadi eligible untuk menerima pencatatan Issue/Feature Request di OKR 2 — tidak ada langkah linking manual, karena keduanya adalah entitas yang sama.

### 8.2 OKR 2 — Kendala & Request Fitur
- `due_date` = tanggal lapor + jumlah hari SLA sesuai prioritas (kalender hari biasa, bukan hari kerja — lihat catatan di §11).
- `is_on_time = true` jika diselesaikan (`resolved_at`/`fulfilled_at`) sebelum atau tepat `due_date`.
- % periode = `(jumlah item on_time / total item pada periode) × 100`.
- **Jika dalam satu periode tidak ada Issue/Feature Request baru sama sekali → otomatis dihitung 100%** untuk metrik terkait pada periode tersebut.
- Status `deployed_maintenance` pada `projects` bersifat informatif — menunjukkan kondisi sistem saat ini, terpisah dari pencatatan Issue individual (maintenance terjadwal tidak otomatis membuat Issue baru).
- Kategori `root_cause_category` (system_error vs non_system) ditampilkan sebagai breakdown tambahan di laporan, murni untuk insight — tidak mengubah rumus persentase utama.

---

## 9. Fitur Fungsional

### 9.1 Manajemen Project/Sistem
- Tambah/edit/hapus project/sistem, ubah status siklus hidup (`planning → in_progress → on_hold → completed_pending_deployment → deployed_running / deployed_maintenance`).
- Tambah/edit/hapus brief feature di dalamnya, ubah status per fitur (relevan selama masih fase development).
- Progress bar otomatis berdasarkan % realisasi (untuk yang masih di fase development).
- Begitu status diubah ke `deployed_running`/`deployed_maintenance`, entry yang sama otomatis muncul sebagai pilihan valid di dropdown Issue/Feature Request — tidak ada langkah linking manual terpisah, karena satu entitas yang sama.
- Sistem lama yang sudah berjalan sebelum tool ini ada bisa langsung diinput dengan status `deployed_running`, brief feature boleh dikosongkan.
- Halaman detail menampilkan riwayat lengkap: breakdown brief feature (jika ada) sekaligus seluruh Issue & Feature Request yang pernah tercatat untuknya.
- Filter & pencarian (by status, by nama, by rentang tanggal).

### 9.2 Manajemen Issue (Kendala)
- Tambah/edit Issue: pilih project/sistem terkait — dropdown otomatis **hanya menampilkan yang berstatus `deployed_running`/`deployed_maintenance`** — prioritas, kategori root cause, deskripsi.
- Due date otomatis muncul saat prioritas dipilih (berdasarkan SLA config).
- Tandai `resolved` + catatan penyelesaian.
- Indikator visual jika sudah melewati due date tapi belum resolved (overdue).

### 9.3 Manajemen Feature Request
- Sama seperti Issue, tapi untuk request fitur baru di sistem yang sudah berjalan (dropdown terfilter sama seperti di atas).

### 9.4 Konfigurasi SLA
- Halaman settings untuk mengubah `target_resolution_days` per prioritas (default: Urgent 1 hari, Normal 3 hari, Low 7 hari).

### 9.5 Dashboard Utama
- Ringkasan real-time (tidak perlu tunggu laporan mingguan):
  - Jumlah project/sistem per status (termasuk status deployment/operasional)
  - Realisasi OKR 1 per project aktif dan jumlah project yang mencapai target
  - Jumlah sistem yang sedang `deployed_maintenance`
  - Jumlah Issue & Feature Request open, termasuk yang overdue
  - % on-time OKR 2 berjalan (periode saat ini, live)

### 9.6 Generate & Export Laporan
- **Laporan Mingguan Standar:** periode default 7 hari kalender (Minggu–Sabtu), untuk kebutuhan rutin ke HoD.
- **Analisis Rentang Custom:** user bisa memilih rentang tanggal bebas (tidak harus 7 hari/kelipatan minggu) untuk kebutuhan visualisasi/analisis ad-hoc yang berbeda dari laporan mingguan standar.
- Preview laporan sebelum export.
- Export **PDF** (laporan lengkap): ringkasan OKR 1 & OKR 2, chart tren antar-periode, chart realisasi vs target, breakdown root cause, narasi otomatis (misal: "Minggu ini X kendala dilaporkan, Y% selesai tepat waktu").
- Export **PNG** ringkasan snapshot utuh untuk kebutuhan share cepat (misal ke WhatsApp/slide HoD).
- Setiap kali generate, tersimpan sebagai snapshot histori (`report_snapshots`), ditandai `period_type` sesuai jenisnya.

### 9.7 Autentikasi
- Login sederhana (email + password).
- Struktur role disiapkan untuk penambahan user di masa depan, meski MVP hanya 1 admin.

---

## 10. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Performa** | Ringan — data volume kecil (internal, single divisi), tidak perlu optimasi khusus di MVP |
| **Keamanan** | HTTPS, password hashing standar Laravel, session-based auth |
| **Observability** | Opsional: Laravel Telescope untuk debugging selama development |
| **Backup** | Database di-backup rutin sesuai kebijakan VPS existing kamu |
| **Aksesibilitas** | Akses dari desktop browser sebagai prioritas utama (dipakai untuk kerja & reporting, bukan mobile-first) |

---

## 11. Asumsi & Hal yang Perlu Divalidasi

Beberapa keputusan berikut diambil sebagai asumsi masuk akal berdasarkan brainstorming — sebaiknya dikonfirmasi ulang sebelum development dimulai:

1. **Perhitungan hari SLA** memakai kalender hari biasa (termasuk weekend), bukan hari kerja. Jika Rumah Atsiri punya definisi "hari kerja" yang berbeda, `due_date` perlu logika tambahan (skip weekend/libur).
2. **Cakupan OKR 1** hanya mencakup project berstatus `planning`/`in_progress`/`on_hold`/`completed_pending_deployment`, dengan target 75% untuk setiap project. Project yang sudah `deployed` keluar dari radar OKR 1.
3. **Status `deployed_maintenance`** murni penanda kondisi ("sistem sedang dalam maintenance"), belum tentu berkaitan langsung dengan satu Issue tertentu. Perlu dikonfirmasi apakah maintenance terjadwal (misal: update rutin) perlu tercatat sebagai entry terpisah (misal maintenance log) di fase berikutnya, atau cukup sebagai status saja untuk MVP.
4. **PDF/PNG generation approach** menggunakan Spatie Browsershot dengan Chrome/Chromium headless; konfigurasi executable dapat diarahkan melalui `BROWSERSHOT_CHROME_PATH` bila browser tidak terdeteksi otomatis.

---

## 12. Definisi Selesai (Definition of Done) — MVP

- [ ] CRUD Project/Sistem + Brief Feature berjalan, % realisasi terhitung otomatis
- [ ] Status siklus hidup (development → deployment → operasional) bisa diubah dan tervisualisasi dengan jelas dalam satu field status
- [ ] CRUD Issue & Feature Request berjalan, due date & status on-time terhitung otomatis dari SLA
- [ ] Validasi berfungsi: dropdown Issue/Feature Request hanya menampilkan project/sistem berstatus `deployed_running`/`deployed_maintenance`
- [ ] Halaman konfigurasi SLA berfungsi
- [ ] Dashboard menampilkan ringkasan real-time yang akurat
- [ ] Laporan mingguan standar (7 hari) maupun analisis rentang custom bisa digenerate, dengan snapshot tersimpan
- [ ] Export PDF lengkap dan PNG ringkasan snapshot utuh berhasil dan layak dikirim ke HoD tanpa editing manual tambahan
- [ ] Login berfungsi dengan aman (single user)

---

## 13. Roadmap Potensial Setelah MVP

- Notifikasi/reminder otomatis mendekati due date SLA
- Auto-generate & auto-kirim laporan mingguan terjadwal (misal tiap Jumat pagi)
- Multi-user dengan role & permission (jika tim System Management bertambah)
- Integrasi input kendala dari kanal lain (form WhatsApp bot, email parsing, dsb.)
- Log riwayat maintenance terjadwal per sistem (maintenance window history)
