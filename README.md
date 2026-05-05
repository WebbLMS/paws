# Paws of Cape Town

Marketplace for Cape Town rescue shelters to list animals and manage adoption enquiries.

For the full implementation notes, data model, deployment notes, and operational checklist, see [SITE_BUILD.md](./SITE_BUILD.md).

## Local Development

Start Postgres:

```bash
npm run db:up
```

Run database migrations:

```bash
npm run db:migrate
```

Seed sample shelters, animals, admin-facing data, and settings:

```bash
npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deployment Notes

- Keep secrets in the hosting platform environment, not in git.
- Run `npx prisma migrate deploy` against the staging or production database.
- Runtime uploads are ignored from git. Use persistent object storage, such as DigitalOcean Spaces, before accepting real shelter photos.
