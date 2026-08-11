# Desain: Tabel Index Issue yang Compact

## Konteks

Row Issue pada halaman index saat ini menampilkan judul dan satu baris deskripsi. Deskripsi panjang membuat tabel memakai lebar minimum besar dan dapat memicu scroll horizontal, padahal halaman index digunakan untuk scanning dan navigasi cepat.

## Tujuan

- Membuat row Issue lebih ringkas dan mudah dipindai.
- Menghindari pelebaran tabel yang tidak perlu akibat deskripsi atau teks panjang.
- Mempertahankan akses ke deskripsi lengkap melalui halaman detail Issue.

## Desain UI

- Hapus render issue.description dari cell Issue pada resources/js/pages/issues/index.tsx.
- Pertahankan judul sebagai link ke halaman detail dan gunakan truncation agar judul panjang tidak memaksa kolom melebar.
- Gunakan tabel table-fixed dengan lebar minimum yang lebih proporsional serta lebar kolom terkontrol untuk Sistem, Issue, Prioritas, Waktu Lapor, Status, dan Aksi.
- Pertahankan horizontal scrolling internal hanya sebagai fallback untuk viewport yang lebih kecil; halaman tidak boleh melebar karena content intrinsic.
- Jangan mengubah filter pencarian: deskripsi tetap dapat dicari melalui backend meskipun tidak ditampilkan di row.
- Jangan mengubah halaman detail, model, controller, atau payload Issue.

## Testing

Tambahkan test presentasi Pest yang membaca source index dan memastikan:

- tabel memakai layout fixed dengan batas lebar yang disepakati;
- row tidak lagi merender issue.description;
- link judul dan kolom utama tetap ada.

Jalankan test presentasi terkait, Prettier, TypeScript check, dan build frontend. Verifikasi akhir harus memastikan hanya file index Issue dan test presentasi (beserta spec/plan) yang berubah.

## Kriteria selesai

- Deskripsi tidak tampil pada row index Issue.
- Tabel tidak melebar karena deskripsi atau judul panjang.
- Deskripsi tetap tersedia di halaman detail dan tetap dipakai untuk pencarian.
- Test dan pemeriksaan frontend lulus.

