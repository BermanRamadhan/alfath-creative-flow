# QC Workflow Test Plan

## Tujuan

Dokumen ini adalah checklist QC manual untuk mengetes semua workflow Al-Fath Flow dari awal sampai akhir, baik di lokal maupun Vercel.

Gunakan plan ini sebelum app dipakai tim, setelah deploy baru, dan setelah perubahan besar pada UI/workflow.

## Scope QC

Yang wajib dites:

- Auth dan akses role.
- Admin team/user management.
- Request LP.
- Request Konten.
- Draft request.
- Edit/hapus request sebelum dikerjakan.
- CC claim task.
- Timer kerja start sampai submit.
- Submit hasil LP/konten.
- Mentahan/referensi/materials.
- Review advertiser.
- Revisi.
- Revisi dikembalikan CC.
- Klarifikasi advertiser.
- ACC.
- Bank Konten per asset.
- Feedback performa asset.
- Product grouping.
- Reports.
- WhatsApp manual notification.
- Settings dan nomor WhatsApp.
- External link behavior.
- Mobile responsive.
- Vercel production sanity.

## Persiapan QC

### Environment

Tes minimal di:

- Lokal: `http://127.0.0.1:3001`
- Vercel production/preview: URL deploy terbaru.

### Browser

Tes minimal:

- Desktop Chrome/Edge.
- Mobile viewport 390px.
- Mobile viewport 430px.

### Akun Role

Gunakan akun yang tersedia di database:

- Admin.
- Advertiser.
- CC.

Catat username/password yang dipakai di dokumen internal terpisah, jangan di halaman login dan jangan commit ke repo.

### Data Uji

Buat nama produk unik agar mudah dilacak:

```text
QC Produk [tanggal] [inisial]
```

Contoh:

```text
QC Produk 2026-06-08 BR
```

Gunakan link dummy yang valid secara format:

```text
drive.google.com/qc-raw
tiktok.com/@qc/reference
example.com/qc-lp-final
```

Expected:

- Link tanpa `https://` tetap terbuka sebagai external link `https://...`.
- Link tidak boleh menjadi `/drive.google.com/...` di domain app.

## Matrix Role & Akses

### Admin

Admin harus bisa:

- Login.
- Melihat dashboard semua data.
- Melihat semua task.
- Melihat semua review.
- Melihat semua bank konten.
- Melihat materials.
- Melihat report.
- Membuat/edit/reset user.
- Mengubah nomor WhatsApp global.
- Mengubah nomor WhatsApp user.

Admin tidak wajib:

- Menjadi aktor utama workflow harian.

### Advertiser

Advertiser harus bisa:

- Login.
- Membuat request LP/konten.
- Menyimpan draft.
- Melanjutkan draft.
- Edit/hapus request yang masih `BELUM`.
- Melihat request miliknya.
- Review hasil status `SUDAH`.
- Minta revisi.
- Klarifikasi revisi yang dikembalikan CC.
- ACC.
- Melihat Bank Konten.
- Memberi feedback performa.
- Melihat report/product terkait.

Advertiser tidak boleh:

- Start task sebagai CC.
- Submit hasil sebagai CC.
- Mengelola user/team.

### CC

CC harus bisa:

- Login.
- Melihat task `BELUM`.
- Claim task dengan Start.
- Melihat task miliknya.
- Submit hasil.
- Mengerjakan revisi.
- Mengembalikan revisi jika brief revisi tidak jelas.
- Melihat durasi kerja.
- Mengubah status ON/OFF sendiri.

CC tidak boleh:

- Review/ACC hasil sendiri sebagai advertiser.
- Mengubah Bank Konten performance.
- Mengelola user/team.

## QC 1 - Auth & Session

### 1.1 Login Berhasil

Steps:

1. Buka `/login`.
2. Login sebagai admin.
3. Logout.
4. Login sebagai advertiser.
5. Logout.
6. Login sebagai CC.

Expected:

- Login berhasil redirect ke `/dashboard`.
- Topbar menampilkan nama dan role yang benar.
- Logout mengembalikan ke login.
- Halaman login tidak menampilkan seed credentials.

### 1.2 Login Gagal

Steps:

1. Login dengan password salah.

Expected:

- Tetap di login.
- Muncul pesan error.
- Tidak masuk dashboard.

### 1.3 Role Guard

Steps:

1. Login sebagai CC.
2. Buka `/team`.
3. Login sebagai advertiser.
4. Buka `/team`.

Expected:

- CC dan advertiser tidak bisa akses Team admin.
- Redirect/forbidden sesuai implementasi.

## QC 2 - Admin Team & Settings

### 2.1 Buat User Baru

Steps:

1. Login admin.
2. Buka `/team`.
3. Klik buat user baru.
4. Isi username, nama, role, password, WhatsApp.
5. Simpan.

Expected:

- User muncul di Team list.
- Role benar.
- Nomor WhatsApp tampil.
- User baru bisa login.

### 2.2 Edit User

Steps:

1. Buka detail user.
2. Ubah display name.
3. Ubah nomor WhatsApp.
4. Simpan.

Expected:

- Perubahan tampil di Team list/detail.
- Tidak merusak login user.

### 2.3 Reset Password

Steps:

1. Admin reset password user test.
2. Logout.
3. Login sebagai user test pakai password baru.

Expected:

- Login password lama gagal.
- Login password baru berhasil.

### 2.4 Active/Inactive User

Steps:

1. Admin nonaktifkan user test.
2. Coba login user tersebut.
3. Aktifkan kembali.
4. Login lagi.

Expected:

- User inactive tidak bisa masuk.
- User active bisa masuk.

### 2.5 Global WhatsApp

Steps:

1. Buka `/settings` sebagai admin.
2. Ubah nomor WhatsApp admin.
3. Buat request baru sebagai advertiser.
4. Cek halaman success WhatsApp.

Expected:

- Link `wa.me` memakai nomor admin baru.
- Nomor dinormalisasi ke format `62...`.

## QC 3 - Request Konten

### 3.1 Buat Request Konten Normal

Steps:

1. Login advertiser.
2. Buka `/requests/new/content`.
3. Isi:
   - Nama produk.
   - Platform.
   - Jumlah video.
   - Jumlah gambar.
   - Pakai frame.
   - Deadline.
   - Link mentahan/referensi.
   - Angle.
   - Hook.
   - Catatan.
4. Submit request.

Expected:

- Redirect ke success.
- Ada link WhatsApp admin.
- Request masuk `/tasks`.
- Status awal `BELUM`.
- Product grouping dibuat dari nama produk.
- Material/reference otomatis muncul di `/materials`.

### 3.2 Validasi Request Konten

Steps:

1. Buat request konten dengan video 0 dan gambar 0.

Expected:

- Ditolak.
- Pesan: jumlah video + gambar minimal 1.

### 3.3 External Link Mentahan

Steps:

1. Masukkan link `drive.google.com/qc-raw`.
2. Buka detail task.
3. Klik reference/material link.

Expected:

- Link terbuka ke `https://drive.google.com/qc-raw`.
- Tidak membawa domain app di depan.

## QC 4 - Request LP

### 4.1 Buat Request LP Normal

Steps:

1. Login advertiser.
2. Buka `/requests/new/lp`.
3. Isi:
   - Nama produk.
   - Platform.
   - Domain/link LP.
   - Style.
   - Deadline.
   - Angle.
   - Reference links.
   - Catatan.
4. Submit request.

Expected:

- Request status `BELUM`.
- Output task adalah `1 LP`.
- Reference links masuk `/materials` sebagai referensi.

### 4.2 Validasi Request LP

Steps:

1. Kosongkan domain/link LP.
2. Submit.

Expected:

- Ditolak.
- Pesan domain/link LP wajib diisi.

## QC 5 - Draft Request

### 5.1 Simpan Draft Belum Lengkap

Steps:

1. Login advertiser.
2. Buka request konten/LP.
3. Isi sebagian field saja.
4. Klik `Simpan Draft`.

Expected:

- Draft tersimpan.
- Masuk `/requests/drafts/[id]`.
- Belum membuat task.
- Draft muncul di `/requests/drafts`.

### 5.2 Lanjutkan Draft

Steps:

1. Buka `/requests/drafts`.
2. Klik lanjutkan.
3. Lengkapi field.
4. Klik `Kirim Request`.

Expected:

- Draft berubah menjadi request.
- Draft hilang dari daftar draft.
- Request masuk task status `BELUM`.

### 5.3 Hapus Draft

Steps:

1. Buat draft baru.
2. Hapus draft.

Expected:

- Draft hilang.
- Tidak ada task baru.

## QC 6 - Edit/Hapus Request Sebelum Dikerjakan

### 6.1 Edit Request `BELUM`

Steps:

1. Login advertiser.
2. Buat request baru.
3. Buka task detail.
4. Klik `Edit Request`.
5. Ubah produk/deadline/link/catatan.
6. Simpan.

Expected:

- Data task berubah.
- Materials dari request ikut berubah sesuai link baru.
- Status tetap `BELUM`.

### 6.2 Hapus Request `BELUM`

Steps:

1. Buat request baru.
2. Buka edit request.
3. Klik hapus.

Expected:

- Request hilang dari task list.
- Materials terkait request ikut hilang.

### 6.3 Edit Tidak Boleh Setelah Start

Steps:

1. CC start task.
2. Advertiser buka edit request.

Expected:

- Edit/hapus tidak tersedia.
- Request dianggap sudah mulai dikerjakan.

## QC 7 - CC Claim & Timer

### 7.1 CC Claim Task

Steps:

1. Login CC.
2. Buka `/tasks?status=BELUM`.
3. Pilih task.
4. Klik `Start`.

Expected:

- Status menjadi `DIKERJAKAN`.
- Creator terisi CC tersebut.
- Timer/durasi mulai.
- CC lain tidak bisa claim task yang sama.

### 7.2 Durasi Kerja

Steps:

1. Setelah start, buka task detail.
2. Cek panel durasi kerja.

Expected:

- Ada total durasi.
- Ada sesi kerja.
- Ada waktu mulai.
- Submit masih kosong jika belum submit.

## QC 8 - Submit Hasil

### 8.1 Submit Konten

Steps:

1. Login CC yang claim task konten.
2. Isi video links.
3. Isi image links jika diminta.
4. Isi additional/bundle links.
5. Submit.

Expected:

- Status task menjadi `SUDAH`.
- Timer selesai.
- Durasi kerja terisi.
- Submission asset dibuat per link.
- Additional links masuk `/materials`.
- Muncul halaman WhatsApp notification ke advertiser.

### 8.2 Submit LP

Steps:

1. Login CC yang claim task LP.
2. Isi link LP final.
3. Submit.

Expected:

- Status `SUDAH`.
- Submission asset kind `LP`.
- WhatsApp notification ke advertiser.

### 8.3 Validasi Submit Kosong

Steps:

1. Submit task tanpa link hasil.

Expected:

- Ditolak.
- Minimal satu link hasil wajib diisi.

## QC 9 - Review, Revisi, Klarifikasi

### 9.1 Advertiser Review List

Steps:

1. Login advertiser.
2. Buka `/review`.

Expected:

- Task status `SUDAH` muncul.
- Task milik advertiser lain tidak muncul.

### 9.2 Minta Revisi

Steps:

1. Buka detail review.
2. Isi catatan revisi.
3. Klik minta revisi.

Expected:

- Status task menjadi `REVISI`.
- Review log tercatat.
- WhatsApp notification ke CC.

### 9.3 CC Kerjakan Revisi

Steps:

1. Login CC pemilik task.
2. Buka task revisi.
3. Klik Start Revision.
4. Submit hasil revisi.

Expected:

- Status kembali `SUDAH`.
- Submission version bertambah.
- Log durasi revisi tercatat.

### 9.4 CC Return Revision

Steps:

1. Advertiser minta revisi.
2. Login CC.
3. Klik Return Revision.
4. Isi alasan revisi tidak jelas.

Expected:

- Status menjadi `REVISI_DIKEMBALIKAN`.
- Note/log tercatat.
- WhatsApp notification ke advertiser.

### 9.5 Advertiser Klarifikasi

Steps:

1. Login advertiser.
2. Buka review/task revisi dikembalikan.
3. Isi klarifikasi.
4. Submit.

Expected:

- Status kembali menjadi `REVISI`.
- CC bisa start revision lagi.

## QC 10 - ACC & Bank Konten

### 10.1 ACC Konten

Steps:

1. Advertiser buka review task status `SUDAH`.
2. Klik ACC.

Expected:

- Status task menjadi `BERES`.
- Satu final asset menjadi satu item Bank Konten.
- Jika submit 2 video + 1 gambar, Bank Konten bertambah 3 item.
- Default test status `READY_TEST`.
- WhatsApp notification ke CC.

### 10.2 ACC LP

Steps:

1. Advertiser ACC task LP.

Expected:

- Bank Konten punya asset kind `LP`.
- Link LP final bisa dibuka.

### 10.3 ACC Pakai Submission Terbaru

Steps:

1. Buat initial submit.
2. Minta revisi.
3. Submit revisi.
4. ACC.

Expected:

- Bank Konten dibuat dari submission revisi terbaru, bukan submit awal.

## QC 11 - Bank Konten Feedback

### 11.1 Ubah Status Performa

Steps:

1. Login advertiser.
2. Buka `/bank-konten`.
3. Buka asset.
4. Ubah status ke Winner/Loser/Biasa/Archived.

Expected:

- Status berubah di detail dan list.
- Asset lain dari request yang sama tidak ikut berubah.

### 11.2 Isi Feedback Performa

Steps:

1. Isi platform test.
2. Isi skor 1-5.
3. Isi spend/CTR/CPC/ROAS/sales/profit opsional.
4. Simpan.

Expected:

- Feedback tercatat.
- Score total terhitung.
- Feedback count naik.
- Report ikut mencerminkan data baru.

### 11.3 Asset Status Independen

Steps:

1. Request menghasilkan 2 asset.
2. Set asset 1 Winner.
3. Set asset 2 Loser.

Expected:

- Status masing-masing asset berbeda.
- Product report menampilkan breakdown yang benar.

## QC 12 - Materials / Mentahan

### 12.1 Auto Materials Dari Request

Steps:

1. Buat request dengan raw/reference links.
2. Buka `/materials`.

Expected:

- Link muncul.
- Source `Dari Request`.
- Material type sesuai heuristik: mentahan/referensi/template JSON.

### 12.2 Auto Materials Dari Submission

Steps:

1. Submit task dengan additional/bundle links.
2. Buka `/materials`.

Expected:

- Link muncul.
- Source `Dari Submission`.
- Terhubung ke request/submission terkait.

### 12.3 Manual Add Material

Steps:

1. Buka `/materials`.
2. Tambah material manual.

Expected:

- Material muncul.
- Link external benar.
- Product grouping benar jika product diisi.

## QC 13 - Product Grouping

### 13.1 Normalisasi Nama Produk

Steps:

1. Buat request dengan nama `Produk QC`.
2. Buat request kedua dengan nama ` produk   qc `.

Expected:

- Masuk product group yang sama.
- Product page menampilkan history keduanya.

### 13.2 Product Detail

Steps:

1. Buka `/products`.
2. Buka detail produk QC.

Expected:

- Ada request history.
- Ada bank konten terkait.
- Ada link ke report produk.

## QC 14 - Reports

### 14.1 Report Overview

Steps:

1. Buka `/reports`.

Expected:

- Chart status performa tampil.
- Ranking produk/creator tampil.
- Tidak ada raw label seperti `READY_TEST`.

### 14.2 Product Report

Steps:

1. Buka report produk dari product/bank konten.

Expected:

- Data request, asset, status, feedback sesuai produk.

### 14.3 Creator Report

Steps:

1. Buka creator report.

Expected:

- Data durasi, task selesai, revisi, asset sesuai creator.

### 14.4 Workflow Report

Steps:

1. Buka workflow report.

Expected:

- Breakdown status task dan flow masuk akal.

## QC 15 - WhatsApp Notification

### 15.1 Request Created

Steps:

1. Advertiser buat request.
2. Buka success page.

Expected:

- Ada link `wa.me` ke nomor admin global.
- Pesan berisi konteks request.

### 15.2 Task Submitted

Steps:

1. CC submit hasil.

Expected:

- Redirect ke notification WhatsApp.
- Recipient advertiser benar.

### 15.3 Revision Requested

Steps:

1. Advertiser minta revisi.

Expected:

- Recipient CC benar.

### 15.4 ACC

Steps:

1. Advertiser ACC task.

Expected:

- Recipient CC benar.

### 15.5 User Tanpa WA

Steps:

1. Kosongkan nomor WA user test.
2. Trigger notification ke user itu.

Expected:

- UI memberi info nomor belum tersedia.
- App tidak crash.

## QC 16 - External Links

Tes semua jenis link:

- Reference links.
- Raw/material links.
- Domain LP.
- Submission final links.
- Bank Konten main link.
- Additional/bundle links.
- Product main LP/drive reference.
- WhatsApp `wa.me`.

Expected:

- Semua external link membuka URL external.
- Link tanpa protocol otomatis menjadi `https://...`.
- Tidak ada link external yang menjadi `https://app-domain.com/drive.google.com/...`.

## QC 17 - Mobile Responsive

### 17.1 Global Mobile

Viewport:

- 390 x 844.
- 430 x 932.

Expected:

- Tidak ada horizontal scroll.
- Text tidak overlap.
- Tombol bisa diklik.
- Header tidak terlalu tinggi.

### 17.2 Mobile Pages

Cek:

- Dashboard.
- Request new.
- Drafts.
- Tasks.
- Task detail.
- Review.
- Review detail.
- Bank Konten.
- Bank Konten detail.
- Materials.
- Products.
- Reports.
- Team.
- Settings.

Expected:

- Layout tetap compact.
- Tabel/list masih readable.
- Action utama mudah ditemukan.

### 17.3 Red Dot Mobile

Jika fitur red dot sudah diimplementasikan:

- Draft request membuat dot di Request.
- Task actionable membuat dot di Task.
- Review pending membuat dot di Review.
- Asset `READY_TEST` membuat dot di Bank Konten.
- User tanpa WhatsApp membuat dot di Settings/Team sesuai role.

Expected:

- Dot muncul hanya untuk role terkait.
- Dot hilang setelah item dibereskan.

## QC 18 - Vercel Production

### 18.1 Runtime Env

Vercel env wajib:

```text
DATABASE_URL
SESSION_COOKIE_NAME
```

Expected:

- URL production tidak 500.
- Login page tampil.

### 18.2 Production Data

Steps:

1. Buka production URL.
2. Login admin.
3. Buka Team.
4. Buka Tasks.
5. Buka Bank Konten.

Expected:

- Data sama dengan Neon.
- User lokal yang sudah di-import muncul.

### 18.3 Production Mutation

Steps:

1. Buat request kecil di production.
2. Cek data muncul.

Expected:

- Data tersimpan di Neon.
- Refresh page data tetap ada.

## QC 19 - Security & Privacy

Checklist:

- Login page tidak menampilkan seed credential.
- `.env` tidak ada di GitHub.
- `prisma/dev.db` tidak ada di GitHub.
- `.tmp` tidak ada di GitHub.
- Password tidak pernah tampil di UI.
- User inactive tidak bisa login.
- Role guard berjalan.

## QC 20 - Regression Smoke

Setelah semua QC manual, lakukan smoke singkat:

1. Admin login.
2. Advertiser buat request konten.
3. CC start dan submit.
4. Advertiser ACC.
5. Cek Bank Konten.
6. Cek Report.

Expected:

- Tidak ada error 500.
- Tidak ada link rusak.
- Tidak ada tampilan raw label teknis yang mengganggu.

## Bug Report Template

Gunakan format ini saat menemukan bug:

```text
Judul:
Environment: Lokal / Vercel
Role:
URL:
Steps:
Expected:
Actual:
Screenshot/Video:
Priority: P0/P1/P2/P3
Catatan:
```

Priority:

- P0: app tidak bisa dipakai/login/data hilang.
- P1: workflow utama gagal.
- P2: fitur penting terganggu tapi ada workaround.
- P3: visual/copy minor.

## Definition of Done QC

QC dianggap selesai jika:

- Semua role bisa login dan role guard benar.
- Request -> Task -> Submit -> Review -> ACC -> Bank Konten berjalan.
- Draft/edit/delete pending request berjalan.
- Revisi dan return revision berjalan.
- Materials otomatis dan manual berjalan.
- Feedback performa asset berjalan.
- Reports bisa dibuka dan data masuk akal.
- WhatsApp links benar.
- External links tidak membawa domain app.
- Mobile tidak overflow.
- Production Vercel tidak 500.
- Tidak ada seed credentials di login.
