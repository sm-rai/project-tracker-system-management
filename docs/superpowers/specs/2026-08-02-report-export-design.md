# Design Spec: Export Snapshot Laporan OKR

| | |
|---|---|
| **Tanggal** | 2 Agustus 2026 |
| **Topik** | Export snapshot laporan ke PDF dan PNG |
| **Status** | Approved by User |
| **Target PRD** | Section 5.1, 7.7, 9.6, dan 12 |

---

## 1. Ringkasan Fitur

Snapshot laporan OKR yang sudah tersimpan dapat diexport dalam dua format:

- **PDF lengkap** untuk laporan resmi dan arsip. PDF memuat ringkasan OKR,
  detail project, Issue, Feature Request, serta breakdown pendukung.
- **PNG ringkasan** untuk dibagikan cepat melalui WhatsApp, slide, atau kanal
  komunikasi lain. PNG hanya memuat informasi ringkasan yang tetap terbaca
  tanpa tabel panjang.

Export selalu menggunakan data dari `report_snapshots`. Data aktif tidak
dihitung ulang sehingga hasil export identik dengan snapshot yang sedang
dibuka.

File dibuat saat user menekan tombol export, langsung dikirim sebagai download,
dan tidak disimpan ke storage aplikasi pada MVP ini.

## 2. Pendekatan yang Dipilih

Export menggunakan template HTML khusus dan Browsershot/headless Chrome.
Template export dipisahkan dari halaman Inertia agar pagination PDF, ukuran
kanvas PNG, tipografi, dan page break dapat dikontrol secara konsisten.

Pendekatan ini dipilih karena:

- PDF dapat memuat tabel panjang dan berpindah halaman dengan rapi;
- layout PNG tidak bergantung pada ukuran viewport browser user;
- data yang sama dapat dipakai oleh template PDF dan PNG;
- tidak memerlukan penyimpanan file hasil export;
- hasil export dapat memiliki styling khusus dokumen tanpa mengubah UI aplikasi.

Alternatif client-side seperti screenshot halaman React atau `window.print()`
tidak digunakan karena pagination tabel dan hasil lintas-browser lebih sulit
dikontrol.

## 3. Entry Point dan Alur Data

Pada halaman detail `/reports/{reportSnapshot}`, ditambahkan dua aksi:

- `Export PDF` menuju endpoint download PDF;
- `Export PNG` menuju endpoint download PNG.

Endpoint berada di dalam middleware `auth` dan menggunakan route model binding
untuk `ReportSnapshot`. Alur request:

1. User membuka detail snapshot.
2. User menekan salah satu tombol export.
3. Controller mengambil snapshot berdasarkan ID.
4. Presenter/export data builder mengubah JSON breakdown snapshot menjadi data
   presentasi yang konsisten untuk kedua template.
5. View Blade export dirender menjadi HTML.
6. Browsershot menghasilkan PDF atau PNG.
7. Response mengirim file sebagai attachment dengan nama file berdasarkan
   periode snapshot.
8. File sementara PNG dihapus setelah response selesai.

Snapshot tidak diubah selama proses export. Kolom `pdf_file_path` dan
`png_file_paths` tetap kompatibel untuk kebutuhan fase berikutnya, tetapi tidak
digunakan pada implementasi MVP ini.

## 4. Isi PDF Lengkap

PDF menggunakan format dokumen portrait dengan header dan footer berulang jika
dibutuhkan. Isi dokumen terdiri dari:

### 4.1 Header dan Ringkasan

- Identitas Project Tracker dan Rumah Atsiri Indonesia.
- Judul `Snapshot Laporan OKR`.
- Periode laporan, jenis periode, dan waktu snapshot dibuat.
- Ringkasan OKR 1 per project dengan target 75%.
- Ringkasan Issue SLA dengan target 80%.
- Ringkasan Feature Request SLA dengan target 90%.
- Statistik total project, project aktif, Issue, dan Feature Request.

### 4.2 Detail OKR 1 per Project

Tabel memuat project development dan project deployed sebagai konteks:

- nama project;
- status lifecycle;
- jumlah brief feature selesai dibanding total;
- persentase realisasi;
- status pencapaian target;
- penanda `Belum ada brief`, `Belum dapat dinilai`, atau `Selesai / deployed`
  sesuai data snapshot.

### 4.3 Detail Issue dan Feature Request

Masing-masing bagian memuat tabel item dengan:

- judul dan project;
- prioritas;
- status;
- tanggal laporan/permintaan;
- batas waktu;
- status ketepatan waktu.

Jika tidak ada item, PDF menampilkan copy laporan:
`Tidak ada issue baru pada periode ini.` atau
`Tidak ada Feature Request baru pada periode ini.`

### 4.4 Breakdown Pendukung

PDF menyertakan tabel ringkas untuk:

- distribusi status Issue;
- distribusi prioritas Issue;
- distribusi root cause Issue;
- distribusi status Feature Request;
- distribusi prioritas Feature Request.

Breakdown ini bersifat informatif dan tidak mengubah formula OKR.

## 5. Isi PNG Ringkasan

PNG menggunakan layout ringkasan khusus dengan lebar kanvas yang konsisten dan
tinggi yang dapat bertambah mengikuti jumlah project aktif. PNG memuat:

- identitas laporan, periode, dan waktu snapshot;
- tiga kartu OKR utama;
- ringkasan pencapaian OKR 1 per project;
- progress bar setiap project development yang dapat dinilai;
- statistik project, Issue, dan Feature Request;
- ringkasan status Issue dan Feature Request;
- empty state yang informatif saat tidak ada item.

PNG tidak memuat tabel Issue/Feature Request yang panjang. Detail tersebut
tersedia di PDF.

## 6. Naming dan Response

Nama file menggunakan slug periode snapshot, contoh:

- `snapshot-okr-27-jul-2026-02-agu-2026.pdf`;
- `snapshot-okr-27-jul-2026-02-agu-2026.png`.

Response menggunakan content type sesuai format dan disposition `attachment`
agar browser langsung mengunduh file.

## 7. Error Handling dan Environment

- Guest diarahkan ke login seperti route laporan lain.
- Snapshot yang tidak ditemukan menghasilkan 404 Laravel standar.
- Jika Browsershot atau Chrome tidak tersedia, export gagal dengan pesan
  aplikasi yang dapat dipahami user dan error detail dicatat di log aplikasi.
- Dependensi `spatie/browsershot` ditambahkan melalui Composer.
- Environment development dan deployment perlu memiliki Node.js serta browser
  Chromium/Chrome yang dapat dijalankan oleh Browsershot.
- Tidak ada file export permanen yang perlu dibersihkan oleh job atau scheduler
  pada MVP.

## 8. Testing dan Definition of Done

Testing mencakup:

- guest tidak dapat mengakses endpoint export;
- endpoint menerima snapshot yang valid dan menolak snapshot yang tidak ada;
- PDF mengembalikan content type dan nama file yang benar;
- PNG mengembalikan content type dan nama file yang benar;
- data export menggunakan snapshot, termasuk empty state Issue dan Feature
  Request;
- snapshot dengan banyak project tetap merender layout ringkasan;
- `npm run types:check`, lint file terkait, test PHP, dan `npm run build`
  berhasil.

Definition of Done:

- Tombol export tersedia pada detail snapshot.
- PDF lengkap dapat diunduh dan memuat seluruh detail snapshot.
- PNG ringkasan dapat diunduh dan terbaca untuk share cepat.
- Export tidak mengubah data snapshot.
- File sementara PNG dibersihkan otomatis.
- PRD menjelaskan PNG ringkasan, bukan PNG per-chart.

