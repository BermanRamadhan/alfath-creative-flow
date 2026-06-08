# Mobile UI Implementation Plan

## Tujuan

Merevisi seluruh tampilan mobile Al-Fath Flow agar lebih compact, mudah diakses dengan satu tangan, dan memberi sinyal jelas lewat titik merah saat ada pekerjaan yang perlu ditindak.

Target utama:

- Mobile terasa seperti internal SaaS yang padat dan cepat, bukan versi desktop yang diperkecil.
- Aksi harian advertiser, CC, dan admin bisa dijangkau cepat.
- Titik merah muncul hanya untuk item yang actionable sesuai role user.
- Desktop view tetap stabil dan tidak ikut rusak.

## Prinsip Desain Mobile

- Gunakan topbar compact dan bottom navigation untuk layar kecil.
- Sidebar desktop tetap dipakai untuk tablet/desktop.
- Kurangi white space pada mobile: padding, gap, heading, card, dan table spacing dibuat lebih rapat.
- Hindari teks penjelasan panjang di viewport pertama.
- Prioritaskan informasi status, deadline, produk, owner, dan aksi.
- Tabel mobile diubah menjadi list/card compact.
- Tombol aksi utama diletakkan dekat area jempol, idealnya sticky bottom action pada halaman detail/form.
- Teks dan tombol tidak boleh overlap di viewport 390px dan 430px.
- Red dot tidak boleh menjadi noise; hanya tampil jika user punya pekerjaan yang perlu ditindak.

## Struktur Navigasi Mobile

### Bottom Nav Default

Menu utama mobile:

- Dashboard
- Request
- Task
- Review
- Bank Konten

Menu tambahan masuk ke drawer/menu lain:

- Mentahan
- Produk
- Report
- Team
- Settings

### Role-Based Mobile Nav

Admin:

- Dashboard
- Request
- Task
- Review
- Bank Konten
- Drawer: Mentahan, Produk, Report, Team, Settings

Advertiser:

- Dashboard
- Request
- Review
- Bank Konten
- Report
- Drawer: Task, Mentahan, Produk, Settings

CC:

- Dashboard
- Task
- Mentahan
- Report
- Settings
- Drawer: Bank Konten jika perlu read-only

Catatan konservatif:

- Jangan hilangkan akses route yang sudah ada; hanya ubah prioritas tampilan mobile.
- Kalau role masih butuh akses ke menu tertentu, pindahkan ke drawer, bukan dihapus.

## Aturan Titik Merah

Titik merah berarti ada item yang perlu ditindak user tersebut.

### Dashboard

Tidak perlu red dot khusus kecuali nanti ada pusat notifikasi global.

### Request

Tampilkan red dot jika:

- User advertiser/admin punya `RequestDraft` yang belum dikirim.
- Ada request `BELUM` milik advertiser/admin yang masih bisa diedit sebelum dikerjakan.

### Task

Admin:

- Ada task `BELUM`.
- Ada task `REVISI`.
- Ada task `DIKERJAKAN` yang overdue.

CC:

- Ada task `BELUM` yang bisa diclaim.
- Ada task `REVISI` milik CC tersebut.
- Ada task `DIKERJAKAN` milik CC tersebut.

Advertiser:

- Tidak wajib red dot untuk `Task`, karena advertiser fokus di `Review`.
- Optional: red dot jika ada task miliknya yang overdue.

### Review

Advertiser/admin:

- Ada task status `SUDAH` yang menunggu review.
- Ada task status `REVISI_DIKEMBALIKAN` yang perlu klarifikasi.

CC:

- Tidak wajib tampil sebagai bottom nav utama.

### Bank Konten

Advertiser/admin:

- Ada asset `READY_TEST` yang belum diberi nilai/performa.

CC:

- Optional: ada asset dari creator tersebut yang baru ACC.

### Mentahan

Default tidak perlu red dot.

Optional red dot jika nanti ada:

- Material tanpa product jelas.
- Material manual baru yang belum ditinjau.

### Team

Admin saja:

- Ada user aktif tanpa nomor WhatsApp.
- Ada CC status OFF melewati `expectedUntil`.

### Settings

Semua role:

- User belum isi nomor WhatsApp.

## Data Helper Yang Dibutuhkan

Buat helper server-side untuk badge nav, misalnya:

- `src/lib/nav-alerts.ts`

Output yang disarankan:

```ts
type NavAlertKey =
  | "dashboard"
  | "request"
  | "task"
  | "review"
  | "bank"
  | "materials"
  | "products"
  | "reports"
  | "team"
  | "settings";

type NavAlerts = Record<NavAlertKey, boolean>;
```

Helper membaca `user.id` dan `user.role`, lalu query count yang relevan.

Catatan:

- Pakai `count()` bukan `findMany()` untuk efisiensi.
- Query harus role-aware agar user tidak melihat dot dari pekerjaan orang lain.
- Jika query gagal, nav tetap render tanpa dot daripada membuat seluruh app error.

## Fase Implementasi

### Fase 1 - Mobile App Shell

File utama:

- `src/components/app-shell.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/globals.css`
- `src/lib/nav-alerts.ts`

Pekerjaan:

- Tambah bottom nav untuk mobile.
- Tambah drawer/menu tambahan mobile.
- Sidebar desktop tetap ada di breakpoint desktop.
- Tambah red dot di nav item.
- Pastikan active state jelas.
- Pastikan topbar mobile compact.

Acceptance:

- Di width 390px, nav mudah diklik.
- Tidak ada sidebar desktop muncul di mobile.
- Red dot muncul sesuai data role.
- Desktop tetap memakai sidebar.

### Fase 2 - Task Mobile

File utama:

- `src/app/(app)/tasks/page.tsx`
- `src/app/(app)/tasks/[id]/page.tsx`
- `src/app/globals.css`

Pekerjaan:

- Ubah table mobile menjadi card/list compact.
- Card task menampilkan: deadline, produk, status, output, creator/requester, action.
- Detail task dibuat section compact.
- Tombol `Start`, `Submit`, `Return Revision` dibuat mudah dijangkau di mobile.
- Durasi kerja tetap jelas.

Acceptance:

- CC bisa claim task dalam maksimal 2 tap dari bottom nav.
- Advertiser tidak melihat tombol Start.
- Tidak ada overflow horizontal di 390px.

### Fase 3 - Review Mobile

File utama:

- `src/app/(app)/review/page.tsx`
- `src/app/(app)/review/[id]/page.tsx`
- `src/app/globals.css`

Pekerjaan:

- Review list menjadi compact cards.
- Detail review menonjolkan hasil submit, asset links, note, dan action.
- `ACC`, `Minta Revisi`, dan `Klarifikasi` masuk mobile action area.

Acceptance:

- Advertiser bisa menemukan item yang menunggu review dari red dot.
- Action review terlihat tanpa scroll panjang yang membingungkan.

### Fase 4 - Request & Draft Mobile

File utama:

- `src/app/(app)/requests/new/page.tsx`
- `src/app/(app)/requests/new/content/page.tsx`
- `src/app/(app)/requests/new/lp/page.tsx`
- `src/app/(app)/requests/drafts/page.tsx`
- `src/app/(app)/requests/drafts/[id]/page.tsx`
- `src/app/(app)/requests/[id]/edit/page.tsx`
- `src/components/request-forms.tsx`
- `src/app/globals.css`

Pekerjaan:

- Form request dibuat lebih ringkas di mobile.
- Field penting berada di atas.
- `Simpan Draft`, `Kirim Request`, dan `Hapus Draft` mudah dijangkau.
- Draft list mobile berupa compact cards.

Acceptance:

- Advertiser bisa mulai request baru dari bottom nav.
- Draft yang belum selesai diberi red dot di menu Request.

### Fase 5 - Bank Konten & Mentahan Mobile

File utama:

- `src/app/(app)/bank-konten/page.tsx`
- `src/app/(app)/bank-konten/[id]/page.tsx`
- `src/app/(app)/materials/page.tsx`
- `src/app/globals.css`

Pekerjaan:

- Filter menjadi chip horizontal atau compact controls.
- Card asset lebih padat.
- Status performa dan link utama mudah dibuka.
- Asset `READY_TEST` jelas untuk advertiser/admin.

Acceptance:

- Red dot Bank Konten hilang setelah semua actionable asset dinilai.
- Link external tetap absolute dan tidak membawa domain localhost/Vercel.

### Fase 6 - Reports, Team, Settings Mobile

File utama:

- `src/app/(app)/reports/page.tsx`
- `src/app/(app)/reports/products/[id]/page.tsx`
- `src/app/(app)/reports/creators/[id]/page.tsx`
- `src/app/(app)/reports/workflow/page.tsx`
- `src/app/(app)/team/page.tsx`
- `src/app/(app)/team/[id]/page.tsx`
- `src/app/(app)/settings/page.tsx`
- `src/app/globals.css`

Pekerjaan:

- Metric cards jadi 2 kolom compact.
- Chart tetap readable di layar kecil.
- Team list menjadi compact cards.
- Settings menonjolkan profil dan WhatsApp.

Acceptance:

- Report tidak overflow.
- Team admin bisa melihat user tanpa WA dengan cepat.
- Settings red dot hilang setelah WhatsApp diisi.

## Testing Plan

### Automated

Jalankan:

```bash
npm run lint
npm run build
```

Jangan jalankan `npm test` atau `npm run test:e2e` langsung ke Neon production kecuali memang ingin membuat data QA baru.

### Browser Viewports

Cek minimal:

- 390 x 844
- 430 x 932
- 768 x 1024
- Desktop normal

### Role Test

Login dan cek nav red dot untuk:

- Admin
- Advertiser
- CC

### Manual Flow Test

Admin:

- Buka dashboard.
- Cek task/review/team red dot.
- Buka Team dan Settings.

Advertiser:

- Buat draft request.
- Pastikan Request dot muncul.
- Submit draft.
- Setelah CC submit, pastikan Review dot muncul.
- ACC dan cek Bank Konten dot jika asset `READY_TEST`.

CC:

- Cek Task dot.
- Claim task.
- Submit hasil.
- Cek revisi jika ada.

## Risiko & Mitigasi

Risiko:

- Red dot terlalu banyak dan jadi noise.

Mitigasi:

- Dot hanya untuk status actionable, bukan sekadar data baru.

Risiko:

- Query nav alert memperlambat setiap halaman.

Mitigasi:

- Gunakan query `count()`, parallel `Promise.all`, dan role-specific filtering.

Risiko:

- Perubahan CSS mobile merusak desktop.

Mitigasi:

- Semua perubahan mobile dibungkus media query mobile-first atau breakpoint yang jelas.
- Desktop sidebar tetap dipertahankan.

Risiko:

- Tabel lama masih overflow di beberapa halaman.

Mitigasi:

- Gunakan responsive pattern yang konsisten: desktop table, mobile cards.

## Definition of Done

- Bottom nav mobile aktif dan role-aware.
- Red dot muncul/hilang sesuai actionable count.
- Semua halaman utama mobile tidak horizontal overflow.
- Task, Review, Request, Bank Konten mobile bisa dipakai nyaman di 390px.
- Desktop tetap stabil.
- `npm run lint` passed.
- `npm run build` passed.
- `BUILD_REPORT.md` diupdate dengan hasil implementasi dan testing.
