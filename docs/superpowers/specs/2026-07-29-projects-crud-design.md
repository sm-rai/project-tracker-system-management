# Technical Design Spec: CRUD Project / Sistem (+ Brief Features)

- **Date:** 2026-07-29
- **Author:** System Management Development Team
- **Status:** Draft (Awaiting User Review)

---

## 1. Overview & Objectives

Modul **Project / Sistem (+ Brief Features)** berfungsi sebagai entitas tunggal pencatatan seluruh project pengembangan sistem baru maupun sistem existing yang berjalan di Rumah Atsiri Indonesia.

Modul ini menyediakan:
1. **CRUD Project/Sistem** lengkap dengan tracking status siklus hidup (`planning` → `in_progress` → `on_hold` → `completed_pending_deployment` → `deployed_running` / `deployed_maintenance`).
2. **Breakdown Brief Features** untuk setiap project, dengan status `todo`, `in_progress`, dan `done`.
3. **Kalkulasi otomatis % Realisasi Brief (Basis OKR 1)**: `(jumlah brief_features berstatus done / total brief_features) * 100`.
4. **Detail View Interaktif**: Menampilkan progress bar realisasi, manajemen cepat Brief Feature (inline status change & modal form), serta tab riwayat (persiapan pencatatan Issue & Feature Request untuk sistem yang `deployed`).

---

## 2. Architecture & Data Flow

```
[ Inertia React Client ] 
       │
       ├─ (GET /projects) ──────────────► ProjectController@index ──► Render Inertia Pages/Projects/Index
       ├─ (GET /projects/create) ───────► ProjectController@create ─► Render Inertia Pages/Projects/Create
       ├─ (POST /projects) ─────────────► ProjectController@store ──► FormRequest Validation ──► DB Transaction (Project + BriefFeatures)
       ├─ (GET /projects/{project}) ────► ProjectController@show ───► Render Inertia Pages/Projects/Show
       ├─ (PUT /projects/{project}) ────► ProjectController@update ─► FormRequest Validation ──► DB Update
       │
       └─ Brief Feature Actions:
          ├─ (POST /projects/{project}/brief-features) ─────────► BriefFeatureController@store
          ├─ (PATCH /brief-features/{briefFeature}/status) ─────► BriefFeatureController@updateStatus
          └─ (DELETE /brief-features/{briefFeature}) ──────────► BriefFeatureController@destroy
```

---

## 3. Backend Implementation Details

### 3.1 Controllers & Form Requests

1. **`App\Http\Controllers\ProjectController`**:
   - `index(Request $request)`: Filter `search` (nama/deskripsi) dan `status`. Mengembalikan list project dengan pagination, count brief features, & `realization_percentage`.
   - `create()`: Render form pembuatan project.
   - `store(StoreProjectRequest $request)`: Simpan project baru + optional initial `brief_features` menggunakan `DB::transaction`.
   - `show(Project $project)`: Load relasi `briefFeatures`, `creator`, `users`, serta hitung `realization_percentage`.
   - `edit(Project $project)`: Render form edit project.
   - `update(UpdateProjectRequest $request, Project $project)`: Update data. Jika status diubah ke `completed_pending_deployment` atau `deployed_*` dan `actual_end_date` masih kosong, otomatis set ke `now()`.
   - `destroy(Project $project)`: Hapus project (brief features terhapus otomatis via cascade constraint DB).

2. **`App\Http\Controllers\BriefFeatureController`**:
   - `store(StoreBriefFeatureRequest $request, Project $project)`: Tambah brief feature ke project.
   - `update(UpdateBriefFeatureRequest $request, BriefFeature $briefFeature)`: Edit nama/deskripsi.
   - `updateStatus(Request $request, BriefFeature $briefFeature)`: Validasi status (`todo`, `in_progress`, `done`). Model `booted()` event otomatis menangani `completed_at`.
   - `destroy(BriefFeature $briefFeature)`: Hapus brief feature.

3. **Validation Rules**:
   - `StoreProjectRequest` / `UpdateProjectRequest`:
     - `name`: `required|string|max:255`
     - `description`: `nullable|string`
     - `status`: `required|enum:ProjectStatus`
     - `start_date`: `nullable|date`
     - `target_end_date`: `nullable|date|after_or_equal:start_date`
     - `actual_end_date`: `nullable|date`
     - `brief_features`: `nullable|array`
     - `brief_features.*.name`: `required_with:brief_features|string|max:255`
     - `brief_features.*.status`: `nullable|enum:BriefFeatureStatus`

---

## 4. Frontend Implementation Details (Inertia + React + shadcn/ui)

### 4.1 Pages

1. **`resources/js/pages/projects/index.tsx`**:
   - **Header & Metric Cards**: Summary total project, in-progress, deployed, dan Rata-rata Realisasi OKR 1.
   - **Filter Bar**: Input search nama project & Select Filter `ProjectStatus`.
   - **Data Table / Grid**: List project dengan badge status, indikator progress bar, tanggal target, dan aksi (`View`, `Edit`, `Delete`).
   - **Pagination**: Komponen pagination standar.

2. **`resources/js/pages/projects/create.tsx`**:
   - Form card dengan layout responsif.
   - Field: Name, Description, Status, Start Date, Target End Date.
   - Dynamic Brief Features section: Tombol "+ Tambah Feature Brief Awal" untuk menambahkan baris fitur sebelum menyimpan.

3. **`resources/js/pages/projects/show.tsx`** (Core Interface):
   - **Hero Header Card**: Nama Project, Badge Status Lifecycle, Status Operational, Start/Target/Actual Dates, Admin Creator.
   - **OKR 1 Realization Progress Card**: Gauge / Progress bar besar menampilkan % realisasi (`X dari Y fitur selesai`).
   - **Brief Features Card**:
     - Quick Action Header: Tombol "+ Tambah Feature Brief".
     - Table/List Brief Features dengan **Quick Status Toggle**: Dropdown / Select badge langsung di baris fitur (`todo` [abu-abu], `in_progress` [biru], `done` [hijau]). Memicu Inertia router patch request untuk mengupdate status secara cepat.
     - Inline Edit / Delete action per feature.
   - **Modal / Dialog Form**: `CreateBriefFeatureModal` dan `EditBriefFeatureModal` untuk input detail fitur.
   - **Placeholder Tabs**: Preparation tab untuk Issue & Feature Request (aktif jika status = `deployed_*`).

4. **`resources/js/pages/projects/edit.tsx`**:
   - Form edit atribut utama project.

### 4.2 Shared Components
- `ProjectStatusBadge`: Komponen badge warna-warni menyesuaikan Enum status project.
- `BriefFeatureStatusBadge`: Komponen badge status fitur.
- `ProgressBar`: Custom UI progress bar dengan tooltip / indikator persentase.

---

## 5. Wayfinder & Route Definitions

Daftar route di `routes/web.php`:
```php
Route::middleware('auth')->group(function () {
    // Project CRUD
    Route::resource('projects', ProjectController::class);

    // Brief Feature Nested Endpoints
    Route::post('/projects/{project}/brief-features', [BriefFeatureController::class, 'store'])
        ->name('projects.brief-features.store');
    Route::put('/brief-features/{briefFeature}', [BriefFeatureController::class, 'update'])
        ->name('brief-features.update');
    Route::patch('/brief-features/{briefFeature}/status', [BriefFeatureController::class, 'updateStatus'])
        ->name('brief-features.update-status');
    Route::delete('/brief-features/{briefFeature}', [BriefFeatureController::class, 'destroy'])
        ->name('brief-features.destroy');
});
```

Menjalankan `php artisan wayfinder:generate` untuk menghasilkan helper TypeScript yang *type-safe* di `@/actions` / `@/routes`.

---

## 6. Verification & Testing Plan

### 6.1 Pest Feature Tests (`tests/Feature/ProjectControllerTest.php`)
- `it('can list projects with pagination and filters')`
- `it('can create a project with initial brief features')`
- `it('autofills actual_end_date when status changes to completed_pending_deployment or deployed')`
- `it('can update project details')`
- `it('can delete a project and cascade delete brief features')`

### 6.2 Pest Feature Tests (`tests/Feature/BriefFeatureControllerTest.php`)
- `it('can add brief feature to a project')`
- `it('automatically updates completed_at when status is marked done')`
- `it('resets completed_at when status is changed from done back to in_progress or todo')`
- `it('recalculates realization_percentage on project after feature status change')`

---

## 7. Definition of Done for this Spec

- [x] Schema DB & Model verified.
- [ ] Backend controllers & form requests created.
- [ ] Pest tests written and passing (`100% green`).
- [ ] Frontend Inertia React pages (`Index`, `Create`, `Show`, `Edit`) created with `shadcn/ui`.
- [ ] Quick status toggle brief feature functioning smoothly without full page refresh.
- [ ] Code formatted with `vendor/bin/pint --format agent`.
