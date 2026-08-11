# Desain: Penyelesaian Issue dengan Waktu Historis

## Konteks

Alur penyelesaian Issue saat ini selalu mengisi `resolved_at` dengan waktu saat request diterima. Jika user lupa menekan tombol selesai ketika pekerjaan benar-benar selesai, histori penyelesaian dan perhitungan SLA menjadi tidak akurat.

## Tujuan

- Memungkinkan user menyelesaikan Issue dengan waktu aktual di masa lampau.
- Menjaga batas data agar waktu selesai tidak lebih awal dari `reported_at` dan tidak berada di masa depan.
- Mempertahankan alur cepat yang ada untuk penyelesaian pada waktu sekarang.
- Mempertahankan perhitungan `is_on_time` yang sudah berjalan.

## Di luar cakupan

- Tidak menambah status Issue baru.
- Tidak mengubah alur reopen.
- Tidak menambah migration atau tabel audit khusus.
- Tidak mengubah aturan otorisasi Issue yang sudah berlaku.
- Tidak mengubah form create/edit Issue selain tipe dan validasi yang dibutuhkan oleh aksi resolve.

## Desain pengalaman pengguna

Dialog **Tandai Issue Selesai** pada halaman detail tetap menjadi titik utama penyelesaian Issue. Dialog tersebut mendapatkan field **Waktu selesai** menggunakan komponen `DateTimePicker` yang sudah tersedia.

- Nilai awal field adalah waktu sekarang.
- User dapat memilih waktu aktual sebelumnya.
- Helper text menjelaskan bahwa waktu harus berada setelah waktu laporan dan tidak boleh melewati waktu sekarang.
- Catatan penyelesaian tetap opsional.
- Error validasi ditampilkan pada dialog tanpa menutupnya.
- Setelah sukses, dialog ditutup dan halaman menampilkan waktu selesai serta status SLA terbaru.

## Desain backend

Endpoint yang digunakan tetap `PATCH /issues/{issue}/resolve`.

Payload:

```text
resolved_at: optional date-time
resolution_note: optional string
```

Perilaku:

1. Jika `resolved_at` tidak dikirim, gunakan `now()` untuk menjaga kompatibilitas request lama dan alur default.
2. Jika dikirim, parse menggunakan timezone aplikasi.
3. Tolak nilai yang lebih awal dari `issue.reported_at`.
4. Tolak nilai yang lebih besar dari waktu request diterima.
5. Set `resolved_at` dan `resolution_note`, lalu simpan Issue.
6. Model `Issue` tetap menentukan `status = resolved` dan `is_on_time` saat disimpan berdasarkan `due_date`.

Validasi batas waktu harus dilakukan di server, bukan hanya pada picker, sehingga request langsung tetap aman. Tidak diperlukan perubahan schema database karena kolom `resolved_at` sudah bertipe timestamp nullable.

## Error handling

- Format tanggal/waktu yang tidak valid menghasilkan error validasi pada `resolved_at`.
- Waktu sebelum waktu laporan menghasilkan pesan bahwa waktu selesai tidak boleh mendahului waktu laporan.
- Waktu masa depan menghasilkan pesan bahwa waktu selesai tidak boleh melebihi waktu sekarang.
- Jika validasi gagal, Inertia mengembalikan error ke dialog dan tidak mengubah Issue.
- Jika berhasil, flash success yang sudah ada tetap digunakan.

## Testing

Test backend Pest pada `tests/Feature/IssueBackendTest.php` akan mencakup:

- request tanpa `resolved_at` tetap selesai menggunakan waktu sekarang;
- request dengan waktu lampau valid menyimpan waktu tersebut;
- penyelesaian tepat pada `due_date` dihitung tepat waktu;
- penyelesaian setelah `due_date` dihitung terlambat;
- waktu sebelum `reported_at` ditolak;
- waktu setelah waktu sekarang ditolak;
- `resolution_note` tetap disimpan;
- alur reopen tetap berjalan.

Validasi frontend akan dilakukan melalui pemeriksaan TypeScript/formatting dan build frontend yang relevan setelah perubahan komponen dialog.

## Kriteria selesai

- User dapat memilih dan menyimpan waktu selesai historis dari halaman detail Issue.
- Backend menolak waktu sebelum laporan dan waktu masa depan.
- `is_on_time` dan tampilan detail mengikuti waktu selesai yang dipilih.
- Test regresi terkait lulus.
- Tidak ada perubahan file di luar cakupan fitur.
