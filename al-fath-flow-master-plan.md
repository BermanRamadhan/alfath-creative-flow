# Al-Fath Flow — Master Plan / PRD

## 1. Product Overview

**Product Name:** Al-Fath Flow  
**Company:** Al-Fath  
**Purpose:** Internal webapp untuk mengatur workflow antara tim pengiklan/advertiser dan content creator, dari request pekerjaan, pengerjaan, review, revisi, sampai hasil final masuk ke bank konten dan diberi feedback performa setelah dites.

Al-Fath Flow bukan file storage dan tidak mengintegrasikan Google Drive. Semua output disimpan sebagai **link** seperti Google Drive, link landing page, link template JSON, link referensi, atau link mentahan.

Core value aplikasi:

```text
Request kerja → CC kerjakan → Review → ACC/Revisi → Bank Konten → Feedback performa
```

---

## 2. Core Principles

1. **Simple workflow**
   - Jangan terlalu birokratis.
   - Admin tidak menjadi bagian dari alur utama.
   - Request langsung masuk sebagai pekerjaan yang bisa dilihat CC.

2. **Link-based system**
   - Tidak upload file ke sistem.
   - Tidak integrasi Google Drive.
   - Semua output berupa link.

3. **Content bank first**
   - Semua hasil yang sudah ACC masuk ke Bank Konten.
   - Bank Konten menjadi knowledge base internal untuk referensi ke depan.

4. **Feedback loop**
   - Pengiklan bisa memberi status performa: Ready Test, Winner, Loser, Biasa, Archived.
   - Penilaian objektif tersedia, tapi tidak wajib.

5. **Produk, Report, dan Bank Konten saling terhubung**
   - Dari report bisa klik ke bank konten terkait.
   - Dari bank konten bisa klik ke produk/report/task asal.
   - Dari produk bisa melihat semua LP, konten, winner, loser, report, dan bank konten.

6. **Compact UI**
   - Dashboard dan task page harus informatif, tipis, cepat dibaca.
   - Hindari UI terlalu banyak card besar.
   - Fokus pada tabel, badge, filter, dan shortcut action.

---

## 3. User Roles

### 3.1 Admin

Admin tidak masuk ke alur kerja utama, tapi punya akses pengelolaan sistem.

Permissions:
- Melihat semua data.
- CRUD user.
- Reset password user.
- Mengatur nomor WhatsApp admin.
- Mengatur setting global.
- Melihat status ON/OFF CC dan log-nya.
- Melihat semua report.
- Melihat semua bank konten.
- Melihat semua task.

### 3.2 Advertiser / Pengiklan

Permissions:
- Membuat request LP.
- Membuat request konten.
- Melihat request yang dibuat.
- Melakukan review hasil CC.
- Memberikan ACC atau revisi.
- Melihat Bank Konten.
- Memberikan feedback performa.
- Mengubah status bank konten: Ready Test, Winner, Loser, Biasa, Archived.
- Melihat Produk dan Report.
- Data uang seperti budget, spend, ROAS, sales, profit bersifat opsional.

### 3.3 Content Creator / CC

Permissions:
- Melihat list pekerjaan di Task Content.
- Klik Start untuk mulai mengerjakan.
- Submit hasil berupa link.
- Memberikan note jika ada kendala.
- Mengerjakan revisi.
- Mengembalikan revisi jika revisi tidak jelas.
- Melihat Bank Konten.
- Melihat Produk dan Report.
- Mengubah status profil ON/OFF dengan alasan dan log waktu.

---

## 4. Main Workflow

```text
Pengiklan buat request
↓
Request muncul di Task Content
↓
CC klik Start
↓
Status jadi DIKERJAKAN + timer mulai
↓
CC submit hasil berupa link
↓
Status jadi SUDAH
↓
Pengiklan review
↓
ACC / Revisi
↓
Kalau ACC, status BERES dan masuk Bank Konten
↓
Pengiklan isi feedback setelah asset dites
↓
Asset diberi label Ready Test / Winner / Loser / Biasa / Archived
```

---

## 5. Task Status

### 5.1 Main Status

Use enum:

```text
BELUM
DIKERJAKAN
SUDAH
REVISI
REVISI_DIKEMBALIKAN
BERES
```

Meaning:

| Status | Meaning |
|---|---|
| BELUM | Request sudah dibuat, belum dikerjakan CC |
| DIKERJAKAN | CC sudah klik Start dan timer berjalan |
| SUDAH | CC sudah submit hasil link dan menunggu review |
| REVISI | Pengiklan meminta revisi |
| REVISI_DIKEMBALIKAN | CC mengembalikan revisi karena tidak jelas/butuh klarifikasi |
| BERES | Pengiklan ACC, hasil masuk Bank Konten |

### 5.2 Additional Badge

```text
OVERDUE
```

Rules:
- Jika deadline sudah lewat dan status belum BERES, tampilkan badge OVERDUE.
- OVERDUE bukan status utama.

Examples:
```text
BELUM · OVERDUE
DIKERJAKAN · OVERDUE
REVISI · OVERDUE
SUDAH · OVERDUE
```

---

## 6. Request Editing Rules

Request boleh diedit hanya jika status:

```text
BELUM
```

Jika status sudah:

```text
DIKERJAKAN
SUDAH
REVISI
REVISI_DIKEMBALIKAN
BERES
```

maka brief tidak diedit langsung.

Jika ada tambahan/koreksi setelah pekerjaan dimulai, gunakan:
- comment
- note
- clarification message

Tujuan:
- Menghindari reset timer.
- Menghindari birokrasi.
- Menjaga transparansi perubahan.

---

## 7. Request LP Form

Access:
- Admin
- Advertiser

Output:
- LP dianggap sebagai 1 output saja.

Fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| nama_produk | text | yes | Tidak perlu produk dibuat dulu di database |
| post_dimana | enum | yes | Meta, TikTok, Organic, Website, Shopee, Lainnya |
| domain_lp_url | url/text | yes | Domain/link landing page |
| style | enum | yes | Hardselling / Softselling |
| angle | text | no | Jika kosong, CC bebas menentukan angle |
| reference_links | array of urls | no | Banyak link, bisa referensi LP/Drive/TikTok/JSON |
| deadline_at | datetime | yes | Wajib tanggal dan jam |
| additional_notes | text | no | Catatan tambahan |

Post platform enum:

```text
META
TIKTOK
ORGANIC
WEBSITE
SHOPEE
LAINNYA
```

Style enum:

```text
HARDSELLING
SOFTSELLING
```

---

## 8. Request Konten Form

Access:
- Admin
- Advertiser

Output yang dihitung:
- Video
- Gambar

Fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| nama_produk | text | yes | Tidak perlu produk dibuat dulu |
| video_amount | number | yes | Default 0 |
| image_amount | number | yes | Default 0 |
| use_frame | enum | yes | Ya / Tidak / Bebas Creator |
| post_dimana | enum | yes | Meta, TikTok, Organic, Shopee, Lainnya |
| raw_or_reference_links | array of urls | no | Link mentahan/referensi, bisa TikTok/Drive |
| angle_preference | text | no | Opsional |
| hook_preference | text | no | Opsional |
| deadline_at | datetime | yes | Wajib tanggal dan jam |
| additional_notes | text | no | Catatan tambahan |

Validation:
```text
video_amount + image_amount >= 1
```

Use frame enum:

```text
YA
TIDAK
BEBAS_CREATOR
```

Notes:
- CC boleh submit lebih banyak dari jumlah yang diminta.
- Sistem harus menyimpan jumlah requested dan jumlah submitted.

Example:
```text
Diminta: 3 video + 2 gambar
Disubmit: 4 video + 3 gambar
```

---

## 9. CC Task Flow

### 9.1 Task Content Page

Access:
- Admin
- CC

Top overview should be compact, not large cards.

Example compact summary:

```text
Hari ini: 3 selesai · 2 belum · 1 revisi · 5h 20m total kerja
```

Below summary: table list.

Visible task types:
- BELUM
- DIKERJAKAN
- REVISI
- REVISI_DIKEMBALIKAN
- SUDAH if useful for tracking

Historical BERES can be viewed in another filter/history page.

Recommended table columns:
- Deadline
- Produk
- Tipe request
- Platform
- Jumlah output
- Style
- Status
- Overdue badge
- Action

Actions:
- View detail
- Start
- Submit result
- Start revision
- Return revision

### 9.2 Start Work

When CC clicks Start:
- Set status to DIKERJAKAN.
- Create time log with type INITIAL_WORK.
- Store started_at.
- Timer starts.

### 9.3 Submit Result

When CC submits:
- Store main_link.
- Store additional_links.
- Store submitted_video_amount.
- Store submitted_image_amount.
- Store note.
- End active time log.
- Calculate duration_seconds.
- Set status to SUDAH.

### 9.4 Note / Kendala

CC can add note during or after work.

Example notes:
```text
Kendala: link mentahan tidak bisa dibuka, saya lanjut pakai referensi lain.
```

```text
Catatan: hasil dibuat 2 versi karena brief agak luas.
```

Notes must appear in task history.

---

## 10. Revision Flow

### 10.1 Advertiser Requests Revision

When advertiser reviews SUDAH task:
- Choose Revisi.
- Must fill revision_note.
- Status becomes REVISI.

### 10.2 CC Starts Revision

When CC clicks Start Revision:
- Create new time log.
- log_type should increment:
  - REVISION_1
  - REVISION_2
  - REVISION_3
  - etc.
- Timer starts.

### 10.3 CC Submits Revision

When CC submits revision:
- Store new submission version.
- End active revision time log.
- Status becomes SUDAH.

### 10.4 CC Returns Revision

CC can return revision if unclear.

Reasons:
- Brief revisi tidak jelas.
- Link/referensi kurang.
- Permintaan berubah dari brief awal.
- Butuh klarifikasi.
- Revisi terlalu besar.

When returned:
- Status becomes REVISI_DIKEMBALIKAN.
- CC must fill return_note.

Advertiser can then clarify and request revision again.

---

## 11. Advertiser Review Page

Access:
- Admin
- Advertiser

Shows:
- Tasks with status SUDAH.
- Tasks with status REVISI_DIKEMBALIKAN.
- Review history.

Actions:
- ACC / Beres
- Minta Revisi
- Reply clarification for returned revision

### 11.1 ACC

When advertiser clicks ACC:
- Status becomes BERES.
- System creates 1 item in Bank Konten.
- 1 request = 1 bank konten item.
- All submitted links are stored inside the bank content item.

### 11.2 Revisi

When advertiser clicks Revisi:
- revision_note is required.
- Status becomes REVISI.

---

## 12. Bank Konten

Access:
- Admin
- Advertiser
- CC

Important:
- Bank Konten stores only metadata and links.
- No file upload.
- No Google Drive API integration.
- 1 request = 1 bank content item.

### 12.1 Bank Content Types

```text
LP
CONTENT
MENTAHAN
REFERENSI
JSON_TEMPLATE
LAINNYA
```

For MVP, most items will be:
- LP
- CONTENT

### 12.2 Status Test

Status is given by advertiser/requester.

```text
READY_TEST
WINNER
LOSER
BIASA
ARCHIVED
```

Rules:
- After ACC, default status is READY_TEST.
- Winner/Loser/Biasa can be set without detailed scoring.
- If status is Winner/Loser/Biasa without scoring, show label:
  - "Unscored"
  - or "Belum ada penilaian detail"

### 12.3 Bank Konten Data

Each item should store:

| Field | Notes |
|---|---|
| title | Auto-generated or editable |
| nama_produk | From request |
| request_type | LP / CONTENT |
| platform | Meta/TikTok/etc |
| style | Hardselling/Softselling |
| angle | optional |
| hook | optional |
| requested_video_amount | for content |
| requested_image_amount | for content |
| submitted_video_amount | for content |
| submitted_image_amount | for content |
| main_link | Google Drive / LP / JSON / etc |
| additional_links | array |
| creator_id | if available |
| requester_id | advertiser |
| test_status | Ready Test/Winner/Loser/Biasa/Archived |
| score_total | optional |
| feedback_count | number |
| created_at | ACC date |

### 12.4 Bank Konten UI

Provide 2 views:

#### Table View

Columns:
- Produk
- Asset
- Tipe
- Platform
- Status Test
- Score
- Creator
- Link
- Feedback
- Actions

#### Card View

Example:

```text
[Konten] [Meta] [Winner]

Salep Varises - 3 Video + 2 Gambar
Creator: Budi
Requester: Andi
Style: Hardselling
Score: 23/25

Open Link
View Feedback
View Product
View Report
```

### 12.5 Link Representation

Do not show raw long URLs as primary display.

Use buttons/badges:
- Open Google Drive
- Open Landing Page
- Open JSON Template
- Open Reference
- Open Raw Material

---

## 13. Feedback and Scoring

Access:
- Admin
- Advertiser

CC can view feedback.

### 13.1 Feedback Is Optional

Advertiser can set status:
- Winner
- Loser
- Biasa
- Archived

without filling complete score.

But scoring form should be available.

### 13.2 Feedback Form General Fields

| Field | Required | Notes |
|---|---|---|
| test_status | yes | Ready Test/Winner/Loser/Biasa/Archived |
| tested_platform | no | Meta/TikTok/etc |
| test_date | no | Date |
| test_result | no | Bagus/Biasa/Jelek/Belum cukup data |
| feedback_note | no | General feedback |
| suggestion_for_creator | no | Advice for future content |
| score fields | no | Optional |
| money fields | no | Optional |

### 13.3 Money Fields Optional

Optional fields:
- budget_spent
- spend
- ctr
- cpc
- cpm
- cpl
- roas
- leads
- sales
- revenue
- profit
- conversion_rate

These should not block saving feedback.

### 13.4 Content Scoring Criteria

Score 1–5, optional.

| Criteria | Description |
|---|---|
| hook_strength | 3 detik pertama kuat atau tidak |
| visual_clarity | Visual jelas atau tidak |
| product_visibility | Produk terlihat jelas atau tidak |
| message_clarity | Pesan mudah dipahami atau tidak |
| platform_fit | Cocok untuk Meta/TikTok atau tidak |

Total:
```text
total_score = sum(all filled score fields)
```

If all 5 fields filled:
```text
Max score = 25
```

### 13.5 LP Scoring Criteria

Score 1–5, optional.

| Criteria | Description |
|---|---|
| first_impression | Bagian awal LP kuat atau tidak |
| message_clarity | Orang langsung paham produk atau tidak |
| visual_quality | Visual meyakinkan atau tidak |
| cta_strength | CTA jelas dan kuat atau tidak |
| mobile_experience | Nyaman dibuka di HP atau tidak |

Total:
```text
total_score = sum(all filled score fields)
```

---

## 14. Product Database

Important:
- Product does not need to be created before request.
- Request form only needs product name as text.
- Product menu acts as future reference/knowledge base.

### 14.1 Product Data

Minimal fields:
- id
- name
- category optional
- niche optional
- notes optional
- created_at
- updated_at

Optional fields:
- main_lp_url
- drive_reference_url
- description
- tags

### 14.2 Auto Product Grouping

When request is created:
- Use product name to group data.
- If product does not exist, system may auto-create minimal product record with that name.
- Avoid blocking request creation.

### 14.3 Product Detail Page

Product detail should show:
- All requests for this product.
- All LP bank content.
- All content bank content.
- Winner items.
- Loser items.
- Biasa items.
- Archived items.
- Feedback history.
- Report summary.
- Direct links to filtered Bank Konten and Report.

Example actions:
```text
View Bank Konten for this product
View Report for this product
View Winner Content
View Loser Content
View Task History
```

---

## 15. Report

Access:
- Admin
- Advertiser
- CC

Money metrics optional.

### 15.1 Report Types

- Product report
- Content performance report
- LP performance report
- Creator performance report
- Workflow productivity report

### 15.2 Product Report

Should show:
- Total requests
- Total LP
- Total content
- Total requested videos
- Total requested images
- Total submitted videos
- Total submitted images
- Winner count
- Loser count
- Biasa count
- Archived count
- Average score
- Revision count
- Average production time
- Related bank konten items
- Related feedback

### 15.3 Creator Report

Should show:
- Total tasks completed
- Total video submitted
- Total image submitted
- Average initial work duration
- Average revision duration
- Revision count
- Overdue count
- Winner output count
- Loser output count

### 15.4 Workflow Report

Should show:
- Tasks created this week/month
- Tasks completed this week/month
- Average completion time
- Overdue tasks
- Revision rate
- Total output count
- Total video count
- Total image count

---

## 16. Cross-Linking UX Requirement

This is mandatory.

### 16.1 From Product Page

User can click:
- Bank Konten for this product
- Report for this product
- Winner content
- Loser content
- LP items
- Content items
- Task history

Example URLs:
```text
/bank-konten?product=salep-varises
/reports/products/salep-varises
/tasks?product=salep-varises
```

### 16.2 From Report Page

User can click:
- View related Bank Konten
- View related Product
- View specific asset
- View task origin
- View feedback detail

Example:
```text
/report/product/salep-varises → click → /bank-konten?product=salep-varises
```

### 16.3 From Bank Konten

User can click:
- View Product
- View Product Report
- View Task Origin
- View Feedback
- Open Link

Example:
```text
/bank-konten/item/123 → /products/salep-varises
/bank-konten/item/123 → /reports/products/salep-varises
/bank-konten/item/123 → /tasks/456
```

---

## 17. Dashboard

Access:
- All roles

Dashboard content should be role-aware but transparent.

### 17.1 Advertiser Dashboard

Show:
- Requests dibuat
- Menunggu review
- Revisi aktif
- Ready Test belum diberi feedback
- Winner terbaru
- Loser terbaru
- Deadline terdekat
- Overdue

### 17.2 CC Dashboard

Show compact summary:
```text
Hari ini: 3 selesai · 2 belum · 1 revisi · 5h 20m total kerja
```

Show:
- Task BELUM
- Task DIKERJAKAN
- Task REVISI
- Overdue
- Total work duration today
- Submit pending

### 17.3 Admin Dashboard

Show:
- Total requests
- Total active tasks
- Total overdue
- Total beres
- CC ON/OFF status
- Recent requests
- Recent bank content
- Recent feedback

---

## 18. Menu Structure

### 18.1 Dashboard

Access:
- Admin
- Advertiser
- CC

### 18.2 Request Baru

Access:
- Admin
- Advertiser

Pages:
- New LP Request
- New Content Request

### 18.3 Task Content

Access:
- Admin
- CC

Contains:
- Compact summary
- Current work table
- Start/submit/revision actions

### 18.4 Review

Access:
- Admin
- Advertiser

Contains:
- Submitted tasks
- ACC/Revisi actions
- Revisi dikembalikan
- Review history

### 18.5 Bank Konten

Access:
- Admin
- Advertiser
- CC

Contains:
- Table view
- Card view
- Filter
- Search
- Feedback
- Status update
- Cross-links

### 18.6 Produk

Access:
- Admin
- Advertiser
- CC

Admin can edit product metadata.  
Others can view.

### 18.7 Report

Access:
- Admin
- Advertiser
- CC

Money metrics optional.

### 18.8 Team

Access:
- Admin only

Contains:
- CRUD user
- Reset password
- Role management
- CC status log
- User active/inactive

### 18.9 Settings

Access:
- All users for personal settings
- Admin for global settings

Personal:
- Dark mode
- Change username
- Change password

Admin global:
- Admin WhatsApp number
- Session duration
- Platform options
- Style options

---

## 19. CC ON/OFF Status

CC can set profile status:
```text
ON
OFF
```

If OFF, must fill:
- reason
- note optional
- started_at
- expected_until optional

Reasons:
```text
SAKIT
IZIN
PROJECT_LUAR
ISTIRAHAT
LAINNYA
```

System must log:
- user_id
- status
- reason
- note
- started_at
- ended_at
- duration

When CC switches back ON:
- close active OFF log
- store ended_at
- calculate duration

---

## 20. WhatsApp Admin Notification

Important:
- Optional feature only.
- Not part of main workflow.
- Request must work even if user does not notify admin.

### 20.1 Admin WhatsApp Number

Stored in settings:
```text
admin_whatsapp_number = 628xxxxxxxxxx
```

### 20.2 Popup After Request Created

After advertiser creates request:

```text
Request berhasil dibuat.

Mau beritahu admin lewat WhatsApp?
[Ya, kirim WhatsApp] [Nanti saja]
```

If "Nanti saja":
- Close popup.
- Nothing else happens.

If "Ya":
- Redirect to WhatsApp URL.

### 20.3 WhatsApp URL

Format:
```text
https://wa.me/{admin_whatsapp_number}?text={encoded_message}
```

### 20.4 Template for LP Request

```text
Halo Admin, ada request pekerjaan baru di Al-Fath Flow.

Tipe: LP
Produk: {nama_produk}
Platform: {post_dimana}
Style: {style}
Deadline: {deadline_at}
Requester: {requester_name}

Mohon dicek.
```

### 20.5 Template for Content Request

```text
Halo Admin, ada request pekerjaan baru di Al-Fath Flow.

Tipe: Konten
Produk: {nama_produk}
Jumlah Video: {video_amount}
Jumlah Gambar: {image_amount}
Platform: {post_dimana}
Pakai Frame: {use_frame}
Deadline: {deadline_at}
Requester: {requester_name}

Mohon dicek.
```

---

## 21. Authentication

Internal-only simple login.

Login fields:
```text
username
password
```

No email required.

Example:
```text
username: budi
password: 123
```

Security rule:
- Store password_hash, not plain text.
- Session should be long-lived.
- Suggested session: 30 days.
- Auto logout only when token expires or admin disables user.

---

## 22. Recommended Tech Stack

Suggested stack for MVP:

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui or similar component system

### Backend / Database
Option A:
- Supabase PostgreSQL
- Supabase Auth can be bypassed/custom if username login needed

Option B:
- Next.js API routes
- PostgreSQL
- Prisma ORM
- Custom auth with username/password

Recommended for Codex:
- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL or SQLite for local MVP
- Tailwind CSS
- bcrypt for password hashing
- jose or next-auth/custom session for auth

For quickest local development:
- SQLite + Prisma
- Later migrate to PostgreSQL

---

## 23. Database Schema Draft

### 23.1 users

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ADVERTISER', 'CC')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 23.2 products

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  niche TEXT,
  description TEXT,
  notes TEXT,
  main_lp_url TEXT,
  drive_reference_url TEXT,
  tags TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 23.3 work_requests

```sql
CREATE TABLE work_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('LP', 'CONTENT')),
  product_name TEXT NOT NULL,
  product_id TEXT,
  requester_id TEXT NOT NULL,
  title TEXT NOT NULL,

  post_platform TEXT NOT NULL,
  style TEXT,
  angle TEXT,
  hook TEXT,

  domain_lp_url TEXT,
  reference_links TEXT,
  raw_or_reference_links TEXT,

  video_amount INTEGER NOT NULL DEFAULT 0,
  image_amount INTEGER NOT NULL DEFAULT 0,
  use_frame TEXT,

  deadline_at DATETIME NOT NULL,
  additional_notes TEXT,

  status TEXT NOT NULL DEFAULT 'BELUM',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (requester_id) REFERENCES users(id)
);
```

Notes:
- `reference_links`, `raw_or_reference_links`, and similar link arrays can be stored as JSON text for SQLite.
- For PostgreSQL use JSONB.

### 23.4 work_time_logs

```sql
CREATE TABLE work_time_logs (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  log_type TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  duration_seconds INTEGER,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES work_requests(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);
```

log_type examples:
```text
INITIAL_WORK
REVISION_1
REVISION_2
REVISION_3
```

### 23.5 work_submissions

```sql
CREATE TABLE work_submissions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('INITIAL', 'REVISION')),
  main_link TEXT NOT NULL,
  additional_links TEXT,
  submitted_video_amount INTEGER NOT NULL DEFAULT 0,
  submitted_image_amount INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES work_requests(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);
```

### 23.6 task_notes

```sql
CREATE TABLE task_notes (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'GENERAL',
  note TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES work_requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

note_type examples:
```text
GENERAL
KENDALA
CLARIFICATION
REVISION_RETURN
```

### 23.7 review_logs

```sql
CREATE TABLE review_logs (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('ACC', 'REVISION_REQUESTED', 'REVISION_RETURNED_BY_CC', 'CLARIFICATION')),
  review_note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES work_requests(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
```

### 23.8 content_bank

```sql
CREATE TABLE content_bank (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  title TEXT NOT NULL,

  asset_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  style TEXT,
  angle TEXT,
  hook TEXT,

  requested_video_amount INTEGER NOT NULL DEFAULT 0,
  requested_image_amount INTEGER NOT NULL DEFAULT 0,
  submitted_video_amount INTEGER NOT NULL DEFAULT 0,
  submitted_image_amount INTEGER NOT NULL DEFAULT 0,

  main_link TEXT NOT NULL,
  additional_links TEXT,

  creator_id TEXT,
  requester_id TEXT NOT NULL,

  test_status TEXT NOT NULL DEFAULT 'READY_TEST',
  score_total INTEGER,
  feedback_count INTEGER NOT NULL DEFAULT 0,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES work_requests(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (requester_id) REFERENCES users(id)
);
```

asset_type:
```text
LP
CONTENT
MENTAHAN
REFERENSI
JSON_TEMPLATE
LAINNYA
```

test_status:
```text
READY_TEST
WINNER
LOSER
BIASA
ARCHIVED
```

### 23.9 asset_feedback

```sql
CREATE TABLE asset_feedback (
  id TEXT PRIMARY KEY,
  content_bank_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,

  test_status TEXT,
  tested_platform TEXT,
  test_date DATETIME,
  test_result TEXT,

  budget_spent REAL,
  spend REAL,
  ctr REAL,
  cpc REAL,
  cpm REAL,
  cpl REAL,
  roas REAL,
  leads INTEGER,
  sales INTEGER,
  revenue REAL,
  profit REAL,
  conversion_rate REAL,

  score_1 INTEGER,
  score_2 INTEGER,
  score_3 INTEGER,
  score_4 INTEGER,
  score_5 INTEGER,
  total_score INTEGER,

  feedback_note TEXT,
  suggestion_for_creator TEXT,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (content_bank_id) REFERENCES content_bank(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
```

### 23.10 creator_status_logs

```sql
CREATE TABLE creator_status_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ON', 'OFF')),
  reason TEXT,
  note TEXT,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  duration_seconds INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 23.11 app_settings

```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Example:
```text
admin_whatsapp_number
session_days
```

---

## 24. Required Business Logic

### 24.1 Create Request

When creating LP request:
- Validate required fields.
- Create product automatically if product_name does not exist.
- Create work_request with status BELUM.
- Show optional WhatsApp admin notification popup.

When creating Content request:
- Validate `video_amount + image_amount >= 1`.
- Create product automatically if product_name does not exist.
- Create work_request with status BELUM.
- Show optional WhatsApp admin notification popup.

### 24.2 Start Task

Allowed if:
```text
status = BELUM
status = REVISI
```

Actions:
- Set status DIKERJAKAN.
- Create active time log.
- For revision, use next revision log type.

### 24.3 Submit Task

Allowed if:
```text
status = DIKERJAKAN
```

Actions:
- Create work_submission.
- End active time log.
- Set status SUDAH.

### 24.4 Request Revision

Allowed if:
```text
status = SUDAH
```

Actions:
- Create review_log.
- Set status REVISI.

### 24.5 Return Revision

Allowed if:
```text
status = REVISI
```

Actions:
- Create review_log or task_note with return note.
- Set status REVISI_DIKEMBALIKAN.

### 24.6 ACC Task

Allowed if:
```text
status = SUDAH
```

Actions:
- Create review_log with ACC.
- Set status BERES.
- Create 1 content_bank item from latest submission.
- Default content_bank.test_status = READY_TEST.

### 24.7 Update Bank Content Status

Allowed:
- Admin
- Advertiser

Actions:
- Update test_status.
- If feedback submitted, create asset_feedback.
- Update score_total and feedback_count.

---

## 25. UI/UX Guidelines

### 25.1 Visual Style

Brand:
- Clean
- Operational
- Modern
- Internal SaaS
- Compact
- Professional

Suggested color direction:
- Deep green / emerald for Al-Fath identity.
- Neutral background.
- Status badges with clear contrast.
- Dark mode support.

### 25.2 Layout

Use:
- Sidebar navigation
- Topbar with user info/status
- Compact metric strips
- Tables with filters
- Drawer/detail modal for task detail
- Badge-based status
- Quick action buttons

Avoid:
- Too many large cards
- Overly decorative dashboard
- Too many unnecessary steps
- Heavy file preview features

### 25.3 Bank Konten UX

Must feel like organized library even though it stores links.

Use:
- Search
- Filter by product
- Filter by status
- Filter by platform
- Filter by type
- Filter by creator
- Filter by date
- Table/card switch
- Clear link buttons

---

## 26. MVP Development Phases

### Phase 1 — Core Workflow

Build:
- Username/password login
- Role-based access
- Dashboard basic
- Request LP form
- Request Konten form
- Task Content page
- Start task
- Time log
- Submit link result
- Review page
- ACC/Revisi
- Auto-create Bank Konten item on ACC
- Basic Bank Konten table
- WhatsApp admin optional popup

### Phase 2 — Bank Konten & Feedback

Build:
- Bank Konten filters
- Bank Konten card view
- Status update Ready Test/Winner/Loser/Biasa/Archived
- Feedback form
- Optional scoring
- Money metrics optional
- Cross-links to product/report/task

### Phase 3 — Product & Report

Build:
- Product database
- Product detail page
- Product auto-grouping
- Product linked to bank konten and report
- Report product
- Report creator
- Report workflow

### Phase 4 — Team & Settings

Build:
- Team CRUD
- Reset password
- User active/inactive
- CC ON/OFF status
- CC status logs
- Dark mode
- Change username/password
- Admin WhatsApp setting

### Phase 5 — UX Polish

Build:
- Saved filters
- Better search
- Mobile responsive
- Better empty states
- Better overdue indicators
- Export CSV if needed
- Dashboard refinements

---

## 27. Suggested Routes

```text
/login
/dashboard

/requests/new
/requests/new/lp
/requests/new/content

/tasks
/tasks/:id

/review
/review/:id

/bank-konten
/bank-konten/:id

/products
/products/:id

/reports
/reports/products/:productId
/reports/creators/:creatorId
/reports/workflow

/team
/team/new
/team/:id

/settings
```

---

## 28. Access Control Matrix

| Page/Feature | Admin | Advertiser | CC |
|---|---:|---:|---:|
| Dashboard | yes | yes | yes |
| Create Request | yes | yes | no |
| Task Content | yes | no | yes |
| Review | yes | yes | no |
| Bank Konten View | yes | yes | yes |
| Bank Konten Status Update | yes | yes | no |
| Feedback Create | yes | yes | no |
| Product View | yes | yes | yes |
| Product Edit | yes | no | no |
| Report View | yes | yes | yes |
| Team CRUD | yes | no | no |
| Settings Personal | yes | yes | yes |
| Settings Global | yes | no | no |
| CC ON/OFF | no | no | yes |
| View CC Status | yes | yes | yes |

---

## 29. Important Edge Cases

1. Request has no reference links.
   - Allowed.

2. Angle is empty.
   - Means CC has creative freedom.

3. CC submits more than requested.
   - Allowed.
   - Store requested and submitted amount.

4. Deadline passed.
   - Show OVERDUE badge.

5. Pengiklan does not fill feedback.
   - Allowed.
   - Bank content remains READY_TEST or manually changed status without score.

6. Winner/Loser without scoring.
   - Allowed.
   - Show "Unscored" label.

7. Google Drive link broken.
   - System does not validate deeply.
   - User can edit link in bank content if permitted.

8. Request needs correction after started.
   - Do not edit request.
   - Use notes/comments.

9. Revisi unclear.
   - CC can return revision.
   - Status REVISI_DIKEMBALIKAN.

10. Product not existing in product database.
   - Auto-create minimal product by name.
   - Do not block request.

---

## 30. Codex Build Instruction Summary

Build Al-Fath Flow as an internal workflow webapp with:

- Simple username/password auth.
- Role system: ADMIN, ADVERTISER, CC.
- Request LP and Request Konten forms.
- No file upload.
- No Google Drive integration.
- All outputs are external links.
- Task statuses: BELUM, DIKERJAKAN, SUDAH, REVISI, REVISI_DIKEMBALIKAN, BERES.
- OVERDUE as badge only.
- CC can start task and timer logs work duration.
- CC can submit result links and submitted amount.
- Advertiser can ACC or request revision.
- ACC creates 1 Bank Konten item per request.
- Bank Konten stores metadata and links.
- Advertiser can update test status and feedback.
- Product, Report, and Bank Konten must be deeply cross-linked.
- Optional WhatsApp admin notification after request creation.
- Compact, modern, internal SaaS UI.
- Dark mode support.
