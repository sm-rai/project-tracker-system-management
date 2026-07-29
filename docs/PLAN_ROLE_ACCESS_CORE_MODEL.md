# Plan — Role-Based Access & Core Data Model (Project, Brief Feature, Issue, Feature Request)

| | |
|---|---|
| **Status** | Draft — menunggu eksekusi |
| **Terkait** | `docs/PRD.md` §7 (Data Model), §5.2 (dulu out-of-scope, sekarang in-scope) |
| **Tujuan** | Membangun fondasi data model inti + role-based access (Admin/User) sekaligus, karena tabel `projects`, `brief_features`, `issues`, `feature_requests` belum ada satupun di codebase. |

---

## 1. Konteks & Keputusan yang Sudah Disepakati

- Hanya **2 role**: `admin` dan `user`. Tidak ada konsep PIC terpisah.
- **Admin** membuat Project baru dan **assign satu atau lebih User** ke project tsb (many-to-many).
- **User yang di-assign** ke sebuah Project boleh CRUD penuh (create/edit/**delete**) `brief_features` di project tersebut, termasuk **edit detail project** (nama/deskripsi) miliknya — tapi **tidak** boleh mengubah status lifecycle project, tidak boleh assign/unassign user lain, dan tidak boleh menghapus Project itu sendiri.
- **Issue & Feature Request**: siapapun yang login (Admin maupun User, apapun assignment project-nya) boleh tambah/edit/resolve. **Hapus** tetap Admin-only.
- **SLA Config**, **generate laporan**, dan **kelola user lain** tetap Admin-only.
- 2 akun awal (Admin + Erwin) di-hardcode langsung di seeder (bukan `.env`).

### Matriks Final

| Aksi | Admin | User |
|---|---|---|
| Lihat semua data | ✅ | ✅ |
| Tambah/Hapus Project | ✅ | ❌ |
| Ubah status lifecycle Project | ✅ | ❌ |
| Edit detail Project (nama/deskripsi) | ✅ | ✅ (hanya project yang di-assign ke dia) |
| Assign/unassign User ke Project | ✅ | ❌ |
| CRUD Brief Feature (create/edit/delete/ubah status) | ✅ | ✅ (hanya di project yang di-assign ke dia) |
| Tambah/Edit/Resolve Issue & Feature Request | ✅ | ✅ (project apapun, tanpa syarat assignment) |
| Hapus Issue & Feature Request | ✅ | ❌ |
| Ubah konfigurasi SLA | ✅ | ❌ |
| Generate & export laporan resmi | ✅ | ❌ |
| Kelola user lain (invite/nonaktifkan) | ✅ | ❌ |

---

## 2. Perubahan Skema Database

### 2.1 `users` — tambah kolom role
Migration baru: `add_role_to_users_table`.

| Field | Tipe | Keterangan |
|---|---|---|
| role | enum(`admin`,`user`) | default `user` |

> Catatan: migration `create_users_table` saat ini **belum** punya kolom `role` sama sekali (berbeda dari draft awal PRD §7.1), jadi ini murni penambahan baru, bukan modifikasi ulang draft lama.

### 2.2 `projects` (baru) — sesuai PRD §7.2

| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| name | string | |
| description | text | nullable |
| status | enum | `planning`, `in_progress`, `on_hold`, `completed_pending_deployment`, `deployed_running`, `deployed_maintenance` |
| start_date | date | nullable |
| target_end_date | date | nullable |
| actual_end_date | date | nullable |
| created_by | FK → users | admin pembuat |
| timestamps | | |

### 2.3 `project_user` (baru) — pivot assignment

| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| project_id | FK → projects | cascade on delete |
| user_id | FK → users | cascade on delete |
| timestamps | | |

Unique constraint: (`project_id`, `user_id`).

### 2.4 `brief_features` (baru) — sesuai PRD §7.3

| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| project_id | FK → projects | cascade on delete |
| name | string | |
| description | text | nullable |
| status | enum | `todo`, `in_progress`, `done` |
| completed_at | timestamp | nullable, auto-set saat status → `done` |
| timestamps | | |

### 2.5 `sla_configs` (baru) — dependency untuk Issue/Feature Request, sesuai PRD §7.4

| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| priority | enum | `urgent`, `normal`, `low` |
| target_resolution_days | integer | default: urgent=1, normal=3, low=7 |
| updated_at | timestamp | |

> Ditambahkan sekarang karena `issues`/`feature_requests` butuh ini untuk menghitung `due_date` (PRD §8.2), meski secara role/permission ini murni Admin-only dan bukan bagian dari desain assignment.

### 2.6 `issues` (baru) — sesuai PRD §7.5

| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| project_id | FK → projects | nullable; wajib berstatus `deployed_running`/`deployed_maintenance` saat dipilih |
| title | string | |
| description | text | |
| priority | enum | `urgent`, `normal`, `low` |
| root_cause_category | enum | `system_error`, `non_system`, `other` |
| reported_at | timestamp | |
| due_date | date | auto-calculated dari `sla_configs` |
| resolved_at | timestamp | nullable |
| status | enum | `open`, `resolved` |
| resolution_note | text | nullable |
| is_on_time | boolean | computed: `resolved_at <= due_date` |
| timestamps | | |

### 2.7 `feature_requests` (baru) — sesuai PRD §7.6

| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| project_id | FK → projects | wajib berstatus `deployed_running`/`deployed_maintenance` |
| title | string | |
| description | text | |
| priority | enum | `urgent`, `normal`, `low` |
| requested_at | timestamp | |
| due_date | date | auto-calculated dari SLA |
| fulfilled_at | timestamp | nullable |
| status | enum | `open`, `in_progress`, `fulfilled` |
| is_on_time | boolean | computed: `fulfilled_at <= due_date` |
| timestamps | | |

> `report_snapshots` (PRD §7.7) **tidak** termasuk plan ini — akan dibuat di fase laporan/dashboard terpisah, karena tidak berkaitan langsung dengan role-based access.

---

## 3. Model & Relasi Eloquent

- `User`
  - `role` cast ke enum PHP `App\Enums\UserRole` (`Admin`, `User`).
  - `projects()` → `belongsToMany(Project::class)` via `project_user`.
  - Helper: `isAdmin(): bool`.
- `Project`
  - `belongsTo(User::class, 'created_by')`.
  - `users()` → `belongsToMany(User::class)` via `project_user` (assigned members).
  - `briefFeatures()` → `hasMany(BriefFeature::class)`.
  - `issues()` → `hasMany(Issue::class)`.
  - `featureRequests()` → `hasMany(FeatureRequest::class)`.
  - Helper: `isAssignedTo(User $user): bool`.
  - Accessor: `realizationPercentage` (`done / total brief_features * 100`).
- `BriefFeature`
  - `belongsTo(Project::class)`.
  - Model event: set `completed_at` otomatis saat `status` berubah ke `done`.
- `SlaConfig` — model sederhana, key by `priority`.
- `Issue`, `FeatureRequest`
  - `belongsTo(Project::class)`.
  - Model event saat create: hitung `due_date` dari `SlaConfig::where('priority', $priority)`.
  - Model event saat `resolved_at`/`fulfilled_at` diisi: hitung `is_on_time`.

Enum baru: `App\Enums\UserRole`, `App\Enums\ProjectStatus`, `App\Enums\BriefFeatureStatus`, `App\Enums\Priority`, `App\Enums\RootCauseCategory`, `App\Enums\IssueStatus`, `App\Enums\FeatureRequestStatus` (PHP native backed enum, TitleCase keys sesuai konvensi project).

---

## 4. Authorization — Laravel Policies

| Policy | Aturan Utama |
|---|---|
| `ProjectPolicy` | `viewAny`/`view`: semua user login. `create`/`delete`/`updateStatus`/`manageAssignment`: admin only. `update` (detail): admin **atau** user yang ter-assign ke project tsb. |
| `BriefFeaturePolicy` | `viewAny`/`view`: semua user login. `create`/`update`/`delete`: admin **atau** user yang ter-assign ke project induk. |
| `IssuePolicy` | `viewAny`/`view`/`create`/`update`: semua user login (tanpa syarat assignment). `delete`: admin only. |
| `FeatureRequestPolicy` | sama seperti `IssuePolicy`. |
| `SlaConfigPolicy` | semua aksi tulis: admin only. Read: semua user login. |
| `UserPolicy` | semua aksi kelola user (create/update/deactivate): admin only. |

Tidak menambah package baru (`spatie/laravel-permission` dsb.) — cukup native Laravel Policy + Gate karena aturan cuma 2 role dan cukup eksplisit.

---

## 5. Seeder

`DatabaseSeeder` diperbarui untuk membuat 2 akun awal langsung (hardcoded, bukan lewat `.env`):

| Akun | Email | Role | Password (dev default) |
|---|---|---|---|
| Admin | `admin@rumahatsiri.com` | `admin` | `password` |
| Erwin | `erwin@rumahatsiri.com` | `user` | `password` |

> Nilai di atas asumsi awal — bisa disesuaikan sebelum eksekusi kalau kamu mau pakai email/password lain.

Juga siapkan factory states: `UserFactory::admin()`, `ProjectFactory` (dengan state per status), `BriefFeatureFactory`, `SlaConfigFactory`, `IssueFactory`, `FeatureRequestFactory` — untuk kebutuhan test.

---

## 6. Urutan Eksekusi (Checklist)

1. [ ] Migration `add_role_to_users_table` + update `User` model (enum cast, relasi, helper `isAdmin()`).
2. [ ] Buat enum-enum PHP di `app/Enums/`.
3. [ ] Migration + Model + Factory: `projects`.
4. [ ] Migration (pivot) + relasi many-to-many: `project_user`.
5. [ ] Migration + Model + Factory: `brief_features` (+ model event `completed_at`).
6. [ ] Migration + Model + Factory: `sla_configs` (+ seeder default 3 baris: urgent/normal/low).
7. [ ] Migration + Model + Factory: `issues` (+ model event hitung `due_date` & `is_on_time`).
8. [ ] Migration + Model + Factory: `feature_requests` (+ model event sama seperti Issue).
9. [ ] Buat semua Policy (`ProjectPolicy`, `BriefFeaturePolicy`, `IssuePolicy`, `FeatureRequestPolicy`, `SlaConfigPolicy`, `UserPolicy`) + register via auto-discovery Laravel 13.
10. [ ] Update `DatabaseSeeder` — 2 akun awal (Admin, Erwin) + seed default `sla_configs`.
11. [ ] Pest Feature Tests otorisasi:
    - User bukan anggota project → gagal update/hapus Project & Brief Feature (403).
    - User anggota project → berhasil CRUD Brief Feature & edit detail project miliknya, tetap gagal ubah status lifecycle & assignment.
    - User manapun → berhasil create/update Issue & Feature Request project apapun, gagal hapus.
    - Admin → berhasil semua aksi.
12. [ ] `vendor/bin/pint --dirty --format agent` + `php artisan test --compact`.

---

## 7. Di Luar Scope Plan Ini

- UI/halaman CRUD (React/Inertia pages untuk Project, Brief Feature, Issue, Feature Request, SLA config) — menyusul sebagai fase implementasi terpisah setelah fondasi backend ini selesai.
- `report_snapshots` & fitur generate laporan (PRD §7.7, §9.6).
- Dashboard ringkasan (PRD §9.5).
- Notifikasi, invite user via email, dsb (tetap out-of-scope MVP sesuai PRD §5.2).
