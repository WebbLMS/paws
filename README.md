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

- Staging currently runs on the DigitalOcean VPS at `159.223.208.156` using `docker-compose.staging.yml`.
- Staging secrets live in `/opt/paws/.env.staging` on the server, not in git.
- Run `npx prisma migrate deploy` against the staging or production database before restarting the app.
- Runtime uploads are ignored from git. Use persistent object storage, such as DigitalOcean Spaces, before accepting real shelter photos.

Staging deploy:

```bash
ssh root@159.223.208.156
cd /opt/paws
git pull --ff-only origin main
docker compose --env-file .env.staging -f docker-compose.staging.yml build app
docker compose --env-file .env.staging -f docker-compose.staging.yml run --rm app npx prisma migrate deploy
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d
```

Verify:

```bash
curl -I http://159.223.208.156/
curl -I http://159.223.208.156/admin/logout
```
