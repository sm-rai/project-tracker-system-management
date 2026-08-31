# Desain MCP Bulk Brief Feature

## Tujuan

Menambahkan operasi MCP yang dapat menemukan project aktif dan menambahkan satu atau banyak Brief Feature secara aman. Operasi ini tersedia melalui server MCP lokal dan production yang sudah ada, serta tetap memerlukan persetujuan pengguna sebelum menulis data.

## Ruang Lingkup

Implementasi menambahkan dua tool:

- `list-brief-feature-projects` untuk menampilkan project yang dapat menerima Brief Feature.
- `create-tracker-brief-features` untuk membuat 1 sampai 100 Brief Feature dalam satu permintaan atomik.

Tidak ada operasi update atau delete Brief Feature dalam perubahan ini. Tidak ada perubahan schema database karena tabel `brief_features` sudah mendukung seluruh field yang diperlukan.

## Project yang Eligible

Project dianggap aktif dan dapat menerima Brief Feature ketika statusnya salah satu dari:

- `planning`
- `in_progress`
- `deployed_running`
- `deployed_maintenance`

Project dengan status `on_hold` atau `completed_pending_deployment` ditolak.

Tool daftar khusus dipisahkan dari `list-tracker-projects` agar perilaku import Issue dan Feature Request tidak berubah. Kedua operasi tersebut tetap hanya menerima project deployed.

## Kontrak Tool Daftar

`list-brief-feature-projects` tidak menerima argumen dan mengembalikan:

- Environment aplikasi.
- ID project.
- Nama project.
- Status project.
- Jumlah Brief Feature yang sudah ada.

Hasil diurutkan berdasarkan nama project agar preview stabil dan mudah dibandingkan.

## Kontrak Tool Penulisan

`create-tracker-brief-features` menerima:

- `project_id`: ID project aktif yang menjadi target.
- `features`: array berisi minimal 1 dan maksimal 100 item.
- `features.*.name`: string wajib, maksimal 255 karakter.
- `features.*.description`: string opsional.
- `features.*.status`: salah satu `todo`, `in_progress`, atau `done`; default `todo`.
- `confirmed`: wajib bernilai true setelah pengguna menyetujui preview.

Brief Feature berstatus `done` menggunakan lifecycle model yang sudah ada, sehingga `completed_at` diisi pada saat import. Status selain `done` tidak memiliki `completed_at`.

## Alur Data

1. Codex memanggil `list-brief-feature-projects`.
2. Codex memastikan environment pada respons sesuai target pengguna.
3. Codex menyusun dan menampilkan preview Brief Feature tanpa menulis data.
4. Setelah pengguna menyetujui preview, Codex memanggil `create-tracker-brief-features` dengan `confirmed=true`.
5. Server memvalidasi project, status project, jumlah item, field setiap item, dan konfirmasi.
6. Server menormalisasi nama dengan memangkas whitespace, merapikan whitespace berulang, dan membandingkan nama tanpa membedakan kapitalisasi.
7. Server menolak nama duplikat di dalam payload.
8. Server mengambil cache lock berdasarkan `project_id`.
9. Dalam satu database transaction, server melewati item yang sudah ada pada project tersebut dan membuat seluruh item baru.
10. Server mengembalikan environment, jumlah item `created`, jumlah item `existing`, dan detail hasil setiap item.

## Idempotensi dan Konsistensi

Identitas Brief Feature adalah kombinasi project dan nama yang sudah dinormalisasi. Pemanggilan ulang dengan nama yang sama pada project yang sama tidak membuat duplikasi dan mengembalikan hasil `existing`.

Nama yang sama tetap boleh digunakan pada project berbeda. Duplikasi di dalam satu payload dianggap kesalahan input dan menyebabkan seluruh permintaan ditolak sebelum transaksi dimulai.

Cache lock per project mencegah dua import paralel melewati pemeriksaan duplikasi secara bersamaan. Database transaction memastikan tidak ada penulisan parsial jika pembuatan salah satu item gagal.

## Error Handling

Operasi ditolak tanpa menulis data ketika:

- `confirmed` tidak bernilai true.
- Project tidak ditemukan atau statusnya tidak eligible.
- Daftar kosong atau melebihi 100 item.
- Nama kosong atau lebih dari 255 karakter.
- Status tidak dikenal.
- Terdapat nama duplikat dalam payload setelah normalisasi.
- Lock project sedang digunakan proses lain.
- Salah satu insert database gagal.

Pesan error menggunakan bahasa yang menjelaskan field atau kondisi yang harus diperbaiki. Kegagalan lock meminta pemanggil mencoba lagi setelah proses aktif selesai.

## Server Instructions

Instruksi `ProjectTrackerServer` diperbarui agar Codex:

- Memanggil `list-brief-feature-projects` sebelum membuat Brief Feature.
- Memastikan environment sesuai target pengguna.
- Menampilkan preview terlebih dahulu.
- Tidak memanggil tool penulisan sebelum pengguna memberikan persetujuan eksplisit.
- Menggunakan tool Issue dan Feature Request yang sudah ada tanpa perubahan perilaku.

## Pengujian

Pengujian MCP mencakup:

- Tool daftar hanya mengembalikan empat status aktif.
- Project `on_hold` dan `completed_pending_deployment` tidak ditampilkan dan tidak dapat menjadi target.
- Bulk create menyimpan semua item valid.
- Status yang tidak diberikan menjadi `todo`.
- Status `in_progress` dan `done` tersimpan dengan benar.
- Status `done` mengisi `completed_at`.
- Nama existing pada project yang sama menghasilkan `existing` tanpa record tambahan.
- Perbandingan duplikasi tidak membedakan kapitalisasi dan whitespace.
- Nama yang sama pada project berbeda tetap dapat dibuat.
- Duplikasi internal payload menolak seluruh permintaan.
- Satu item invalid tidak meninggalkan penulisan parsial.
- `confirmed=false` menolak seluruh permintaan.
- Kegagalan saat insert membatalkan seluruh transaction.
- Respons daftar dan penulisan menyertakan environment.
- Server mendaftarkan kedua tool baru untuk transport lokal dan production.

Test yang relevan dijalankan secara terfokus, kemudian seluruh test suite dijalankan sebelum implementasi dinyatakan selesai.
