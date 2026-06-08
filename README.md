# Al-Fath Flow

Internal CreativeOps app for request, task, review, materials, reports, and Bank Konten workflows.

## Local Run

```bash
npm install
npm run prisma:generate
npm run db:setup
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Test

```bash
npm run lint
npm test
npm run build
```

`npm run build` runs `prisma generate` before `next build`, which is required on Vercel because dependency caching can otherwise leave Prisma Client outdated.

For full E2E, start the app first, then run:

```bash
npm run test:e2e
```

## Vercel Deployment Note

This app is configured for Postgres via Prisma. Use a managed database such as Neon for Vercel production.

Recommended production path:

1. Create a managed Postgres database, preferably Neon via Vercel Marketplace.
2. Set production `DATABASE_URL` in Vercel.
3. Run `npx prisma db push` once to create tables.
4. Seed production users with fresh passwords and do not reuse local seed credentials.

`npm run prisma:seed` skips automatically when users already exist. To intentionally reset seed data, run it with `RESET_SEED=true`.
