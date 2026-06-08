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

For full E2E, start the app first, then run:

```bash
npm run test:e2e
```

## Vercel Deployment Note

The local MVP uses SQLite at `prisma/dev.db`. For Vercel production, use a separate managed database because Vercel serverless deployments do not provide a persistent writable SQLite database.

Recommended production path:

1. Create a managed Postgres database, preferably Neon via Vercel Marketplace.
2. Set production `DATABASE_URL` in Vercel.
3. Migrate Prisma schema/provider from SQLite to Postgres before production deploy.
4. Seed production users with fresh passwords and do not reuse local seed credentials.
