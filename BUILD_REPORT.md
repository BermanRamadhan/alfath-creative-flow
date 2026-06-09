# Al-Fath Flow Build Report

## Scope

Build Al-Fath Flow as an internal workflow webapp based on `al-fath-flow-master-plan.md` and the follow-up product decisions.

## Product Decisions

- Bank Konten is created per final asset, not per request.
- A content request can create multiple bank content assets after ACC.
- Each bank content asset has its own performance status: `READY_TEST`, `WINNER`, `LOSER`, `BIASA`, `ARCHIVED`.
- CC claims tasks independently by clicking Start.
- Returned revisions go back to `REVISI` after advertiser clarification.
- Product grouping is normalized from product name.
- Outputs are external links only. There is no file upload and no Google Drive integration.

## Implementation Plan

1. Scaffold Next.js App Router with TypeScript, Tailwind CSS, Prisma, SQLite, and custom username/password auth.
2. Implement database schema, Prisma client, auth/session helpers, business logic, and seed data.
3. Build role-aware app shell, dashboard, request forms, task flow, review flow, bank content, products, reports, team, and settings.
4. Add compact operational UI with tables, badges, filters, cross-links, and dark-mode capable styling.
5. Run Prisma migration/seed, lint/build/test, fix errors, and record verification results.

## Completed Work

- Initial report created.
- Project scaffolded with Next.js App Router, TypeScript, Tailwind CSS, Prisma Client, SQLite, bcrypt-based custom auth dependencies, and lucide icons.
- Prisma schema created for users, sessions, products, work requests, time logs, submissions, submission assets, notes, review logs, bank content, feedback, CC status logs, and settings.
- SQLite enum limitation handled by storing constrained values as strings and validating values in application/business logic.
- Prisma schema engine failed on this Windows environment without a detailed error, so local SQLite bootstrap is handled by `scripts/setup_db.py` while Prisma Client remains the runtime ORM.
- Seed data and smoke test scripts added.
- Custom username/password login with 30-day session cookie.
- Role-aware app shell with compact sidebar, topbar, metric strips, tables, filters, badges, and dark-mode capable theme.
- Request LP and Request Konten forms with auto product grouping and optional WhatsApp admin notification page.
- Request LP and Request Konten now support explicit draft saving. Advertisers/admin can save incomplete input, continue it later, submit it into the normal request workflow, or delete the draft.
- Pending requests can be edited or deleted only while status is `BELUM` and only by the requester or admin. Once a CC starts the work, the edit/delete page becomes read-only and sends the user back to task detail.
- Task Content list/detail with CC claim/start, timer logs, submit per-asset links, notes, returned revision, and read-only advertiser task history for cross-linking.
- Review page/detail with ACC, revision request, and clarification for returned revisions.
- ACC creates one Bank Konten row per submitted final asset.
- Bank Konten table/card views with search/filter, per-asset status update, feedback form, optional scores/money metrics, and cross-links to product/report/task.
- Product list/detail with auto-grouped request/bank history and admin metadata editing.
- Product, creator, and workflow reports.
- Team admin pages for user create/update/reset password/active status and CC status logs.
- Settings page for profile, dark mode, global WhatsApp number, and CC ON/OFF.
- Browser verification screenshots saved under `screenshots/`.
- External link handling fixed so Drive/reference/LP links without a protocol open as absolute `https://...` URLs instead of relative localhost paths.
- Report pages upgraded with visual charts: donut status breakdowns, stacked output bars, horizontal ranking bars, and 7-day workflow trend bars.
- Added a separate `Mentahan & Referensi` menu for raw materials, references, JSON/template links, and submission bundle links. These records are stored in `MaterialReference`, separate from final Bank Konten assets.
- Request reference/raw links and submission bundle links now automatically create material/reference records. Existing sample data was backfilled with `npm run materials:ensure`.
- Global UI compact pass completed: sidebar, topbar, page headers, metrics, tables, forms, cards, badges, and report charts now use denser internal-SaaS spacing.
- Materials page simplified to focus on list, filters, metrics, and manual add form. Explanatory storage rules were removed from the main screen, and the menu label was shortened to `Mentahan`.
- Task detail now has a clear `Durasi kerja` panel showing total duration, work session label, start time, and submit time. Technical labels like `INITIAL_WORK`, `REVISION_REQUESTED`, `REVISION_1`, and `REVISI_DIKEMBALIKAN` are converted to Indonesian UI labels.
- Review, task filters, submissions, notes, asset kinds, material/test statuses, and CC OFF reasons now use Indonesian display labels instead of raw database-style codes.
- Added per-user WhatsApp numbers and manual `wa.me` notification flow for task submit, revision request, ACC/beres, and returned revision events.
- Settings and Admin Team pages can edit each user's WhatsApp number. Team list shows whether a user already has a number.
- Existing SQLite databases can be patched without reset using `npm run db:ensure-whatsapp`; fresh setup includes `User.whatsappNumber`.
- Added repeatable E2E workflow script `npm run test:e2e` covering advertiser request creation, CC start/submit, WhatsApp notifications, revision request, returned revision, clarification, revision submit, ACC, Bank Konten creation, Materials capture, Reports rendering, Team WhatsApp column, Settings WhatsApp field, and final database assertions.
- UI label polish after audit: Materials, Bank Konten, Settings, Team list, Team detail, and New User form now use more consistent Indonesian labels such as `Cari`, `Sumber`, `Aksi`, `Buka`, `Tabel`, `Kartu`, `Skor`, `Aktif`, and `Nonaktif`.
- Request success WhatsApp notification target is set to admin number `6289635998869`. Settings global route now normalizes `+62...` input before saving, and request success uses the shared `waMeHref()` helper.
- Added reusable request form components so new request, draft continuation, and pending edit screens share the same LP/content fields and validation names.
- Added `RequestDraft` database model, non-destructive DB patch script, API routes for draft save/submit/delete, and API routes for pending request update/delete.
- E2E workflow now covers draft save, draft continuation, draft submit, pending request edit, and pending request delete before running the full CC/review/ACC flow.
- Mobile UI implementation completed based on `MOBILE_UI_IMPLEMENTATION_PLAN.md`.
- Added server-side role-aware nav alert helper for actionable red dots: request drafts/editable pending request, task queue/revision/overdue work, review waiting/clarification, Bank Konten `READY_TEST`, Team missing WhatsApp/overdue CC OFF, and Settings missing WhatsApp.
- Added compact mobile app shell with hidden desktop sidebar under mobile breakpoint, compact topbar, role-aware bottom nav, mobile drawer for secondary menus, and red dot indicators.
- Added shared mobile card/list pattern for Dashboard recent tasks, Task list, Review list, Request Drafts, Bank Konten table mode, Materials, Products, Team, Workflow Report, Product Report, and Creator Report.
- Added mobile action panel styling hooks for Task detail Start/Submit/Return Revision and Review detail ACC/Revisi/Klarifikasi blocks.
- Hardened mobile CSS against horizontal overflow with `min-width: 0`, shrink-safe card internals, compact form/button spacing, compact charts, and bottom-nav safe-area padding.
- Verified external asset/material links still render as absolute external URLs and do not prepend the local app origin.
- Standardized app time handling to Indonesia time (`Asia/Jakarta`) with 24-hour display/input formatting.
- Deadline request, draft deadline, edit request deadline, CC OFF expected time, feedback test date, dashboard "hari ini", task "hari ini", and workflow 7-day report now use WIB-aware helpers instead of server-local timezone parsing.

## Latest Mobile UI Implementation Plan

1. Audit `MOBILE_UI_IMPLEMENTATION_PLAN.md`, current app shell, global CSS, and workflow pages.
2. Implement role-aware nav alerts, mobile bottom nav, mobile drawer, compact topbar, and desktop-safe sidebar behavior.
3. Convert mobile-heavy table pages into compact cards without removing desktop tables.
4. Verify Task, Review, Request/Draft/Edit, Bank Konten, Materials, Reports, Team, Settings, and external links.
5. Run lint/build, browser-check 390px and 430px role flows, update this report, then commit and push.

## Seed Accounts

- Admin: `admin / admin123`
- Advertiser: `andi / advertiser123`
- CC: `budi / cc123`
- CC: `citra / cc123`
- Seed WhatsApp numbers: admin `6289635998869`, Andi `628111222333`, Budi `628222333444`, Citra `628333444555`

## Routes

- `/login`
- `/dashboard`
- `/requests/new`
- `/requests/new/lp`
- `/requests/new/content`
- `/requests/drafts`
- `/requests/drafts/[id]`
- `/requests/[id]/edit`
- `/requests/success`
- `/tasks`
- `/tasks/[id]`
- `/review`
- `/review/[id]`
- `/bank-konten`
- `/bank-konten/[id]`
- `/materials`
- `/notifications/whatsapp`
- `/products`
- `/products/[id]`
- `/reports`
- `/reports/products/[id]`
- `/reports/creators/[id]`
- `/reports/workflow`
- `/team`
- `/team/new`
- `/team/[id]`
- `/settings`

## Database & Models

- Runtime ORM: Prisma Client.
- Production-ready database: PostgreSQL via Prisma `provider = "postgresql"`.
- Previous local SQLite bootstrap remains in `scripts/setup_db.py` for reference, but active `db:setup`/`prisma:migrate` now run `prisma db push`.
- Bootstrap script: `npm run db:setup`.
- Existing DB patch script: `npm run db:ensure-whatsapp`.
- Existing DB patch script for draft support: `npm run db:ensure-drafts`.
- Seed script: `npm run prisma:seed`.
- Bank Konten is modeled per asset via `SubmissionAsset` and `ContentBank`.
- Request draft state is modeled separately in `RequestDraft`, so incomplete request input does not create a task until submitted.
- Product grouping uses normalized product names plus product slugs.
- Seed script now skips automatically when users already exist, to avoid wiping a non-empty Neon database. Use `RESET_SEED=true` only for an intentional reset.
- Build script runs `prisma generate && next build` so Vercel dependency caching does not ship an outdated Prisma Client.
- Local SQLite data can be imported into Neon/Postgres with `npm run db:import-local`; the import script backs up current Neon contents into `.tmp/` before replacing data.

## Workflow Verification

- Smoke test created a content request, simulated claim/start, submit two assets, revision, returned revision, clarification back to `REVISI`, ACC, two Bank Konten items, and asset-level Winner feedback.
- Browser opened the local app, verified login page, logged in as advertiser, verified dashboard, opened `/tasks` as advertiser, opened Bank Konten card view, and confirmed the final production URL at `http://127.0.0.1:3001`.
- Screenshots:
  - `screenshots/dashboard.png`
  - `screenshots/bank-konten.png`

## Test Results

- `npm test`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: passed.
- Latest compact UI verification:
  - `npm run lint`: passed.
  - `npm test`: passed.
  - `npm run build`: passed.
  - Browser verified `/materials` on `http://127.0.0.1:3001/materials`: compact header rendered, storage rules copy absent, topbar height reduced, and external Drive link still opens as `https://drive.google.com/salep-raw`.
- Latest duration UI verification:
  - `npm run lint`: passed.
  - `npm test`: passed.
  - `npm run build`: passed.
  - Browser verified `/tasks/cmpz2jzm200026jh0whude837`: duration panel rendered with `Total`, `Sesi`, `Mulai`, `Submit`, `Kerja awal`, and no raw `INITIAL_WORK`, `REVISION_REQUESTED`, or `REVISI_DIKEMBALIKAN` text.
- Latest WhatsApp notification verification:
  - `npm run db:ensure-whatsapp`: passed and added `User.whatsappNumber` to the active SQLite DB.
  - `npm run prisma:generate`: passed after stopping the locked Next server.
  - `npm run lint`: passed.
  - `npm test`: passed.
  - `npm run build`: passed.
  - Browser verified `/notifications/whatsapp?event=task_submitted&task=cmpz4odci0002fkkwno8ihhtq`: page rendered `Task selesai disubmit`, recipient number `628111222333`, `https://wa.me/628111222333?...`, manual-send note, and `Lanjut` button.
  - Browser verified `/settings`: `whatsappNumber` input rendered with logged-in user's number.
- Latest full-flow audit:
  - `npm run lint`: passed.
  - `npm test`: passed.
  - `npm run build`: passed.
  - `npm run test:e2e`: passed against the production server at `http://127.0.0.1:3001`.
  - Final E2E task: `cmpz6djhe0005s0hvqqwd16y7`, product `QA Full Flow 192859`.
  - E2E verified final task status `BERES`, at least two finished duration logs, initial and revision submissions, two Bank Konten items from final revision, Materials records from request/submissions, and clarification review log.
- Latest request WhatsApp target verification:
  - Active DB `admin_whatsapp_number`: `6289635998869`.
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - HTTP verification of `/requests/success?id=...`: rendered `https://wa.me/6289635998869...` and did not include the old seed number.
- Latest draft/edit request verification:
  - `npm run db:ensure-drafts`: passed and added `RequestDraft` to the active SQLite DB.
  - `npm run prisma:generate`: first attempt failed with a Windows file lock from the running Next server; after stopping that server, rerun passed.
  - `npm run lint`: passed.
  - `npm test`: passed.
  - `npm run build`: passed.
  - `npm run test:e2e`: passed against `http://127.0.0.1:3001`.
  - E2E verified: advertiser saves incomplete draft, opens draft detail, completes draft, submits draft into a pending request, edits that pending request, deletes that pending request, then completes the full request -> CC start/submit -> revision -> clarification -> ACC -> Bank Konten flow.
  - Browser verified `/requests/new/content`, `/requests/drafts`, `/requests/drafts/[id]`, `/requests/[id]/edit`, and `/tasks?status=BELUM`: save/continue/submit/delete/edit controls render correctly, and advertiser task list no longer exposes CC Start forms.
- Latest mobile UI verification:
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Browser 390px admin: `/dashboard` and `/team` rendered mobile bottom nav `Dashboard Request Task Review Bank Lainnya`, sidebar hidden, mobile cards shown, overflow `0`.
  - Browser 430px advertiser: `/requests/new`, `/review`, and `/bank-konten` rendered role-aware bottom nav `Dashboard Request Review Bank Report Lainnya`, sidebar hidden, Review/Bank mobile cards shown, overflow `0`.
  - Browser 390px CC: `/tasks`, `/materials`, `/reports`, and `/settings` rendered role-aware bottom nav `Dashboard Task Bahan Report Setting Lainnya`, sidebar hidden, Task/Materials mobile cards shown, overflow `0`.
  - Desktop check 1280px: `/dashboard` kept desktop sidebar visible, mobile bottom nav hidden, overflow `0`.
  - Red dot check was read-only: visible bottom-nav dots were present only on actionable menus for each logged-in role; non-actionable menus such as Dashboard had no dot.
  - External link check sampled `/bank-konten` and `/materials`: target blank links resolved to `https://...` URLs and no sampled link started with `http://127.0.0.1:3001`.
  - `npm test` and `npm run test:e2e` were intentionally not rerun in this phase to avoid creating new QA data in the active Neon database.
- Latest WIB/24-hour time verification:
  - `npm run lint`: passed.
  - `npm run build`: passed.
  - Helper verification: `2026-06-09T14:30` parses to `2026-06-09T07:30:00.000Z` and renders back as `2026-06-09T14:30` for WIB input.
  - HTTP verification without creating workflow data: `/requests/new/content` rendered deadline value like `2026-06-10T10:37`; `/settings` for an active CC session rendered `expectedUntil` like `2026-06-09T10:37`; both matched `YYYY-MM-DDTHH:mm`.
  - `npm test` and `npm run test:e2e` were intentionally not rerun in this phase to avoid creating new QA data in the active Neon database.
- `npm audit --omit=dev`: failed due remaining Next.js 13.x advisories. The available audit fix upgrades to Next 16, which is a breaking upgrade and not compatible with the current Node 18.16 local runtime without broader environment changes.

## Bugs Found & Fixed

- Prisma SQLite connector does not support native enum declarations in this installed Prisma version. Fixed by changing schema fields to strings and enforcing allowed values in application logic.
- `prisma migrate dev` / `prisma db push` failed with `Schema engine error:` and no detailed message. Fixed local setup path by adding explicit SQLite schema bootstrap script using Python's built-in sqlite3 module.
- Initial `npm install` failed because `tsx` pulled `esbuild`, and `esbuild.exe` was locked on Windows. Fixed by removing `tsx` and using JavaScript seed/smoke scripts.
- Login and form actions initially redirected with HTTP 307, which preserved POST and prevented clean page navigation. Fixed all POST redirects to HTTP 303.
- Advertiser dashboard linked to `/tasks` while the list was originally Admin/CC only. Fixed by allowing advertiser read-only access to their own task list, while work actions remain Admin/CC only.
- ESLint config needed explicit `es-abstract` with the pinned Next/ESLint version. Added dev dependency.
- Build failed once with `EPERM` on `.next/trace` while dev server was running. Fixed by stopping the local dev server before production build.
- External links entered without `https://` were treated by the browser as relative app paths. Fixed with `externalHref()` and normalized storage for new request/submission links.
- Report pages were too table-heavy and hard to scan. Added reusable server-rendered chart components and visual summaries across report overview, product report, creator report, and workflow report.
- Mentahan/reference links were previously only visible inside task detail or Bank Konten detail as supporting data. Fixed by adding a dedicated materials table, sidebar menu, filterable UI, manual add form, and automatic backfill.
- Materials/global UI felt too spacious and text-heavy in the in-app browser. Fixed by reducing spacing, hiding page-header explainer copy in the app shell, removing non-essential materials explanation copy, shortening the materials nav label, and making the topbar user-focused.
- Brand lockup became too tight after the compact pass in a narrow viewport. Fixed by making brand title/subtitle block-level and removing the extra topbar title.
- Work duration was technically present only in task history and used raw log names. Fixed by adding a dedicated duration panel and UI label helpers for work logs, review decisions, note types, submission types, asset kinds, test statuses, material labels, and CC OFF reasons.
- WhatsApp notification was previously only an admin setting/request-success helper. Fixed by adding per-user WhatsApp numbers, seed values, a non-destructive DB patch script, and a manual `wa.me` notification page after core workflow actions.
- Full-flow test initially exposed two testability issues: local redirects sometimes used `localhost` while the server listens on `127.0.0.1`, and product display title-casing changed `QA` to `Qa`. Fixed the E2E script to normalize local redirects and compare product text case-insensitively.
- Prisma Client generation hit `EPERM` when the production server was still running and locking `query_engine-windows.dll.node`. Fixed by stopping the workspace server, regenerating Prisma Client, then starting the server again.
- Advertiser task list could show CC `Start` forms for pending/revision tasks even though the API did not allow advertiser work actions. Fixed the list to show work actions only for admin/CC, and show pending edit only for requester/admin.
- Mobile `/materials` initially overflowed horizontally at 390px because nested grid/flex children inside mobile cards kept `min-width:auto`. Fixed by adding shrink-safe `min-width:0`, explicit mobile-card grid columns, and wrapping safeguards for card meta/content.
- `datetime-local` values could be interpreted in the server timezone on Vercel because browser input strings do not include timezone. Fixed by parsing these values explicitly as `Asia/Jakarta` and formatting all app date/time displays with 24-hour WIB output.

## Known Limitations

- Local MVP uses SQLite and a Python bootstrap script instead of Prisma Migrate because Prisma's schema engine failed in this Windows environment.
- Next.js is pinned to `13.5.11` to remain compatible with Node `18.16.0`; npm audit still recommends a breaking upgrade to Next 16 for full advisory remediation.
- There is no upload/storage integration by design; all outputs are links.
- There is no automated email/WhatsApp sending; WhatsApp notification opens a manual `wa.me` URL after request creation and selected workflow actions.
- Draft saving is explicit via the `Simpan Draft` button; there is no background autosave on every keystroke yet.
- UI is server-rendered and form-based for MVP reliability; dynamic inline asset rows can be improved later.
- Product grouping normalizes names, but there is no merge UI yet for historical duplicates beyond normalized auto-grouping.
- Mobile browser verification for this phase was read-only against the active database; no new workflow QA data was created.

## How To Run

- Install dependencies: `npm install`
- Generate Prisma Client: `npm run prisma:generate`
- Create/reset local SQLite schema: `npm run db:setup`
- Patch an existing DB for draft support: `npm run db:ensure-drafts`
- Seed data: `npm run prisma:seed`
- Run smoke test: `npm test`
- Run full workflow E2E test against a running server: `npm run test:e2e`
- Run lint: `npm run lint`
- Run production build: `npm run build`
- Start local dev server: `npm run dev`
- Open: `http://localhost:3000`
- Current verified server in this workspace: `npm run start -- --hostname 127.0.0.1 --port 3001`
- Current URL: `http://127.0.0.1:3001`
