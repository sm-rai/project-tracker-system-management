# Desain: Persentase OKR Kuartalan dan Snapshot Aktivitas Mingguan

|             |                                                           |
| ----------- | --------------------------------------------------------- |
| **Tanggal** | 2 November 2026                                           |
| **Status**  | Rancangan disetujui; menunggu review spesifikasi tertulis |
| **Acuan**   | `docs/PRD.md` bagian 7.7, 8, 9.5, dan 9.6                 |

## 1. Tujuan dan keputusan pengguna

Pisahkan periode penilaian OKR dari periode pelaporan aktivitas:

- Seluruh persentase OKR pada dashboard mengikuti kuartal kalender.
- Project yang masih dikerjakan tetap dinilai pada setiap kuartal, dengan progres
  kumulatif seluruh brief feature, tanpa membagi target fitur per kuartal.
- Snapshot mingguan tetap dibuat manual untuk periode Minggu–Sabtu.
- Snapshot baru hanya berisi rincian aktivitas periode terpilih; persentase OKR
  tidak ditampilkan atau dihitung sebagai metrik mingguan.
- Aktivitas mencakup item baru dan penyelesaian pada periode tersebut, termasuk
  penyelesaian item yang berasal dari minggu sebelumnya.
- Preview, PDF, dan PNG mengikuti pemisahan ini. Snapshot lama dipertahankan.

Dokumen ini menjadi acuan perubahan terhadap bagian PRD yang masih menyebut
OKR mingguan dan ringkasan OKR dalam snapshot baru.

## 2. Pendekatan yang dipilih

Tiga pendekatan penilaian project telah dibahas:

1. Project dinilai pada setiap kuartal selama masih dikerjakan, menggunakan
   progres kumulatif seluruh brief feature. **Dipilih pengguna.** Pengguna tidak
   perlu mengatur kuartal atau target fitur tambahan.
2. Project hanya dinilai pada kuartal target selesai. Lebih sederhana untuk
   daftar target penyelesaian, tetapi menghilangkan kontribusi project pada
   kuartal sebelumnya.
3. Target brief feature dibagi per kuartal. Lebih rinci untuk perencanaan, tetapi
   memerlukan pengaturan dan pengelolaan target tambahan.

Perhitungan OKR dan pengumpulan aktivitas memiliki tanggung jawab terpisah.
Snapshot aktivitas tidak mengambil persentase dari dashboard.

## 3. Persentase OKR kuartalan

### 3.1 Periode

- Q1: Januari–Maret; Q2: April–Juni; Q3: Juli–September;
  Q4: Oktober–Desember.
- Dashboard menampilkan kuartal berjalan dan tahunnya, misalnya `Q4 2026`.
- Batas tanggal mengikuti timezone bisnis dari `AppDateTime`, dengan default
  `Asia/Jakarta`; perbandingan timestamp database menggunakan UTC.
- OKR Issue dan Feature Request memakai data sejak awal kuartal sampai waktu
  dashboard dibuka. OKR project tetap kumulatif sesuai bagian 3.2.
  Data kejadian bertanggal masa depan tidak ikut dihitung.
- Pergantian kuartal mengganti periode perhitungan, tanpa menghapus data.

### 3.2 OKR 1: realisasi brief per project

- Pertahankan kelompok status development yang berlaku: `planning`,
  `in_progress`, `on_hold`, dan `completed_pending_deployment`.
- Semua project dalam kelompok tersebut ikut penilaian kuartal berjalan,
  termasuk project yang dimulai pada kuartal sebelumnya. Tidak ada penetapan
  satu kuartal khusus berdasarkan tanggal mulai atau target selesai project.
- Rumus per project tetap `(brief feature done / seluruh brief feature) × 100`.
  Fitur dan penyelesaian dari kuartal sebelumnya tetap berkontribusi.
- Target minimal tetap **75% untuk setiap project**, bukan rata-rata lintas
  project. Ringkasan jumlah project mencapai target tetap tersedia.
- Project tanpa brief feature berstatus belum dapat dinilai dan dikeluarkan
  dari denominator project yang dapat dinilai.
- Pertahankan aturan lifecycle: project berstatus `deployed_running` atau
  `deployed_maintenance` keluar dari penilaian development pada dashboard.
  Snapshot yang telah tersimpan tidak berubah ketika status project berubah.
- Persentase kumulatif project tidak kembali menjadi nol saat kuartal berganti.

Contoh: project dengan 6 dari 10 fitur selesai pada akhir Q1 tetap memiliki
realisasi 60% pada awal Q2 jika masih berstatus development. Setelah dua fitur
tambahan selesai, realisasinya menjadi 80% dan mencapai target.

### 3.3 OKR 2: Issue dan Feature Request

- Issue masuk kelompok kuartal berdasarkan `reported_at`.
- Feature Request masuk kelompok kuartal berdasarkan `requested_at`.
- Rumus tetap `(item selesai tepat waktu / seluruh item dalam kelompok) × 100`.
  Item yang masih terbuka tetap masuk denominator dan belum masuk numerator.
- Numerator memerlukan status selesai, `is_on_time = true`, dan timestamp
  penyelesaian yang tidak melewati waktu perhitungan.
- Target tetap **80% untuk Issue** dan **90% untuk Feature Request**.
- Jika tidak ada item pada kelompok kuartal, persentase tetap **100%** dengan
  keterangan bahwa belum ada item pada kuartal tersebut.
- Pertahankan aturan SLA dan penentuan `is_on_time` yang sudah berlaku.
- Penyelesaian lintas kuartal tetap terkait kuartal laporan/permintaan asal,
  bukan memindahkan item ke kuartal penyelesaian.

Contoh: Issue dilaporkan 30 Maret dan selesai 2 April. Item tersebut termasuk
kelompok Q1 untuk OKR, sedangkan penyelesaiannya masuk aktivitas mingguan yang
mencakup 2 April. Dashboard Q2 tidak memasukkannya sebagai Issue baru Q2.

## 4. Snapshot aktivitas

### 4.1 Pembuatan dan periode

- Gunakan alur pembuatan manual yang tersedia. Tidak menambah scheduler.
- Pilihan mingguan memakai Minggu pukul 00:00 sampai Sabtu akhir hari dalam
  timezone bisnis. Default tetap minggu berjalan.
- Pertahankan pilihan rentang tanggal custom untuk membuat laporan periode lain,
  termasuk minggu sebelumnya. Isi snapshot custom juga berupa aktivitas.
- Jika dibuat sebelum periode selesai, snapshot hanya memuat kejadian yang sudah
  tercatat sampai waktu pembuatan. Tampilkan waktu pembuatan dengan jelas.
- Setiap pembuatan menghasilkan snapshot baru; snapshot sebelumnya tidak ditimpa.

### 4.2 Definisi aktivitas dan sumber tanggal

| Entitas         | Aktivitas baru                       | Aktivitas penyelesaian                            |
| --------------- | ------------------------------------ | ------------------------------------------------- |
| Project         | Dicatat berdasarkan `created_at`     | Development selesai berdasarkan `actual_end_date` |
| Brief feature   | Ditambahkan berdasarkan `created_at` | Selesai berdasarkan `completed_at`                |
| Issue           | Dilaporkan berdasarkan `reported_at` | Diselesaikan berdasarkan `resolved_at`            |
| Feature Request | Diminta berdasarkan `requested_at`   | Dipenuhi berdasarkan `fulfilled_at`               |

- Penyelesaian tidak dibatasi tanggal pembuatan item. Item dari periode lama
  tetap masuk jika tanggal penyelesaiannya berada dalam periode laporan.
- Satu item yang dibuat dan selesai dalam periode yang sama memiliki dua
  aktivitas yang berbeda. Ringkasan membedakan jumlah aktivitas dan jumlah item
  unik agar tidak menimbulkan hitungan ganda.
- Project ditampilkan jika memiliki aktivitas sendiri atau aktivitas child
  pada periode tersebut. Sistem terkait ditampilkan sebagai konteks untuk
  Issue dan Feature Request, termasuk Issue tanpa sistem terkait.
- Penyelesaian project memerlukan `actual_end_date` dan status saat pembuatan
  snapshot berupa `completed_pending_deployment` atau status deployed.
  Tanggal ini berarti development selesai, bukan bukti tanggal deployment.
- Penyelesaian brief feature, Issue, dan Feature Request memerlukan tanggal
  penyelesaian serta status selesai yang sesuai pada saat snapshot dibuat.
- Tanggal penyelesaian yang kosong tidak ditebak dari `updated_at`. Perubahan
  deskripsi atau edit biasa tidak dianggap sebagai aktivitas penyelesaian.
- `actual_end_date` adalah tanggal bisnis tanpa jam; pencocokannya memakai
  rentang tanggal lokal. Timestamp lain dibandingkan pada batas waktu UTC.

Snapshot mengambil fakta yang masih tersedia pada data sumber saat dibuat,
bukan membangun audit log lengkap. Reopen dapat menghapus tanggal penyelesaian
pada data aktif; penyelesaian tersebut tidak direkonstruksi untuk snapshot baru.
Snapshot yang sudah tersimpan tetap menyimpan fakta saat pembuatannya.

### 4.3 Isi laporan baru

- Judul laporan aktivitas, periode, jenis periode, dan waktu pembuatan.
- Jumlah item baru dan penyelesaian per jenis entitas, dengan label yang jelas.
- Rincian aktivitas project dan brief feature, Issue, serta Feature Request.
- Setiap rincian menyertakan item, jenis aktivitas, tanggal kejadian, project
  terkait jika ada, serta status saat snapshot dibuat.
- Prioritas, due date, kategori kendala, dan catatan penyelesaian dapat tetap
  disajikan sebagai konteks yang sudah tersedia pada sumber data.
- Tidak memuat kartu persentase OKR, progress bar persentase realisasi,
  atau penilaian tercapai/tidak tercapai terhadap target OKR.
- Jika tidak ada aktivitas, tampilkan `Tidak ada aktivitas pada periode ini.`

Preview dan PDF menggunakan rincian snapshot tersimpan. PNG memakai ringkasan
jumlah aktivitas per jenis dan daftar project terkait agar tetap terbaca;
rincian lengkap tersedia pada preview dan PDF. Nama file snapshot baru memakai
identitas aktivitas dan periode, sedangkan nama export snapshot lama dipertahankan.

## 5. Arsitektur dan kompatibilitas data

- `BuildDashboardData` menyusun OKR kuartal berjalan dan tetap memisahkan metrik
  operasional yang tidak dibatasi periode. Perhitungan tanggal memakai
  `AppDateTime`, tanpa duplikasi konversi timezone di komponen tampilan.
- Pengumpul aktivitas menangani pemilihan kejadian dan ringkasan aktivitas.
  `GenerateReportSnapshot` menyimpan hasilnya sekali saat pembuatan.
- `ReportSnapshotController` menyajikan daftar/detail berdasarkan format
  snapshot, dan `BuildReportExportData` menyiapkan data untuk PDF/PNG dari
  snapshot yang sama. Export tidak menghitung ulang data aktif.
- Pertahankan tabel `report_snapshots`, relasi entitas, jenis periode
  `weekly_default`/`custom_range`, dan endpoint yang sudah tersedia.
- Tambahkan penanda `format_version`: data lama/default memakai versi 1;
  snapshot aktivitas baru secara eksplisit memakai versi 2. Simpan rincian
  aktivitas terstruktur dalam kolom JSON breakdown yang sudah tersedia.
- Kolom persentase OKR lama tetap dipertahankan untuk versi 1. Jadikan nullable
  melalui migration tambahan dan simpan `null` untuk versi 2 agar snapshot
  aktivitas tidak menyimpan nilai OKR palsu dari default lama.
- Migration tidak menghitung ulang, menghapus, atau mengubah isi snapshot lama.
  Jangan mengedit migration historis yang telah ada.
- Pembaca versi 1 mempertahankan ringkasan OKR, rincian, dan export historisnya.
  Pembaca versi 2 hanya menyajikan aktivitas, termasuk pada daftar laporan.
- UI tetap menggunakan komponen shadcn/ui yang tersedia dan pola Wayfinder
  yang berlaku. Implementasi mengikuti skill domain dan versi dependensi proyek.

## 6. Validasi dan penanganan kesalahan

- Pertahankan autentikasi dan otorisasi endpoint yang berlaku.
- Rentang custom wajib memiliki tanggal valid dan akhir tidak mendahului awal.
  Error validasi ditampilkan pada form; snapshot tidak dibuat jika input gagal.
- Gunakan satu waktu pembuatan sebagai batas atas pengumpulan aktivitas agar
  ringkasan dan rincian memakai batas waktu yang konsisten.
- Jika penyimpanan gagal, jangan meninggalkan snapshot parsial dan jangan
  menampilkan pesan berhasil.
- Snapshot yang tidak ditemukan tetap menghasilkan 404.
- Pertahankan penanganan kegagalan render PDF/PNG dan pembersihan file sementara.
- Database yang dipakai saat implementasi harus diverifikasi sebelum migration;
  hasil schema Boost pada sesi desain belum menampilkan tabel aplikasi.

## 7. Pengujian dan kriteria penerimaan

Perbarui pengujian Pest yang relevan, terutama `DashboardTest`,
`ReportSnapshotTest`, dan `ReportSnapshotExportTest`:

1. Kuartal dan tahun dashboard benar, termasuk pergantian kuartal/tahun pada
   tengah malam timezone bisnis.
2. Issue/Feature Request di luar kuartal atau bertanggal masa depan tidak masuk
   denominator; item pada batas awal/akhir yang valid masuk dengan benar.
3. Rumus, target, item terbuka, kondisi kosong 100%, dan penyelesaian lintas
   kuartal mengikuti aturan di bagian 3.
4. Project development lintas kuartal mempertahankan progres kumulatif; project
   deployed dan project tanpa brief mengikuti kelayakan yang berlaku.
5. Snapshot manual default tetap Minggu–Sabtu dan rentang custom tetap tersedia.
6. Item dari minggu sebelumnya yang selesai pada minggu laporan ikut aktivitas
   penyelesaian, sedangkan item lama tanpa aktivitas pada periode tidak ikut.
7. Item yang dibuat dan selesai pada periode yang sama menghasilkan dua aktivitas
   dengan ringkasan item unik yang benar.
8. Brief feature dan project memakai sumber tanggal yang ditetapkan; edit biasa,
   tanggal selesai kosong, dan item yang telah dibuka kembali tidak membuat
   penyelesaian rekaan.
9. Snapshot versi 2 tidak menghitung atau menampilkan persentase OKR pada daftar,
   detail, template PDF, atau template PNG.
10. Snapshot versi 1 tetap terbaca dan dapat diexport dengan data aslinya.
11. Perubahan data aktif setelah snapshot dibuat tidak mengubah detail/export
    snapshot tersebut. Snapshot kosong tetap dapat dibuka dan diexport.
12. Validasi rentang, akses guest, dan kegagalan export tetap ditangani.

Jalankan pengujian terdampak, pemeriksaan tipe, lint/formatting terkait, serta
build frontend setelah implementasi. Periksa tampilan dashboard, laporan baru,
laporan lama, dan contoh export. Tidak menambah dependensi untuk perubahan ini.

## 8. Batas cakupan

Pekerjaan ini berfokus pada dashboard kuartal berjalan dan snapshot aktivitas
manual. Pemilih kuartal historis, penguncian hasil OKR akhir kuartal, audit log
seluruh perubahan status, target fitur terpisah per kuartal, dan pembuatan
snapshot otomatis tidak termasuk. Tidak ada push atau deployment dalam tahap
penulisan desain ini.
