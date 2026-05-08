# Paws of Cape Town Site Build

Paws of Cape Town is a marketplace for rescue animal adoption in the Western Cape. It lets approved shelters manage their own listings and enquiries, while the public can search animals, view shelter profiles, share animal profiles, submit adoption enquiries, and save search alerts.

This document records the current build state, architecture, local setup, operational notes, and important implementation decisions for source control.

## Product Scope

The platform supports three primary user groups:

- Public visitors: search and filter adoptable animals, view animal and shelter profiles, submit adoption enquiries, share animal profiles, and create saved search alerts.
- Shelter teams: sign up or log in, manage shelter profile details, create/edit animal listings, upload photos, review enquiries, add notes, and track enquiry status changes.
- Admin users: approve/suspend/delete shelters, manage users, inspect animals and platform activity, configure branding, analytics, and SMTP settings.

PAWS is not a shelter or rescue. Public copy and legal pages state that PAWS does not handle animal placements or adoption enquiries directly; enquiries go to the relevant shelter.

## Technology Stack

- Framework: Next.js 16 App Router
- UI: React 19, CSS in `src/app/globals.css`, Tailwind CSS available
- Database: PostgreSQL
- ORM: Prisma 7 with generated client in `src/generated/prisma`
- Auth: Better Auth with Prisma adapter
- Email: Nodemailer through configurable SMTP settings
- Local database: Docker Compose Postgres

## Key Routes

Public:

- `/` - homepage with search, filters, animal cards, rescue partner scroller, CTA, footer
- `/animals/[slug]` - public animal profile with gallery, enquiry action, sharing, health/medical info, and shelter card
- `/shelters/[slug]` - public shelter profile with cover image, logo, website CTA, and shelter-filtered animals
- `/privacy` - privacy policy with POPIA reference
- `/terms` - terms of service with South African law and PAWS role clarification

Shelter:

- `/shelter/login` - shelter login, access creation, and password reset request
- `/shelter/register` - shelter registration request
- `/shelter` - shelter dashboard
- `/shelter/animals` - shelter animal inventory
- `/shelter/animals/new` - create animal listing
- `/shelter/animals/[id]/edit` - edit animal, photos, medical flags, traits, and enquiry activity
- `/shelter/enquiries` - enquiry CRM view with notes and status tracking
- `/shelter/profile` - shelter profile and image upload settings
- `/shelter/reset-password` - forced or email-token password reset

Admin:

- `/admin/login` - admin login
- `/admin` - platform dashboard
- `/admin/activity` - platform activity stream
- `/admin/search` - global search for shelters, animals, and users
- `/admin/shelters` - shelter list
- `/admin/shelters/new` - create shelter
- `/admin/shelters/[id]` - shelter detail and approval/suspension actions
- `/admin/shelters/[id]/edit` - edit shelter profile and images
- `/admin/users` - user list with active and recent session data
- `/admin/users/new` - create user
- `/admin/users/[id]` - user detail and recent sessions
- `/admin/users/[id]/edit` - edit user, suspend user, send reset link
- `/admin/settings` - branding, Google Analytics, and SMTP configuration

## Local Development

Install dependencies:

```bash
npm install
```

Start Postgres:

```bash
npm run db:up
```

Apply migrations:

```bash
npm run db:migrate
```

Seed sample data:

```bash
npm run db:seed
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Use `.env.example` as the baseline.

Required locally:

```text
DATABASE_URL="postgresql://paws:paws_dev_password@localhost:5432/paws_dev?schema=public"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-a-generated-secret"
MASTER_ADMIN_USERNAME="admin"
MASTER_ADMIN_PASSWORD="password1234"
```

Optional development shortcut:

```text
DEV_SHELTER_ADMIN_EMAIL=""
DEV_SHELTER_ADMIN_SHELTER_SLUG=""
```

If set, a user signing up with `DEV_SHELTER_ADMIN_EMAIL` is linked to the shelter matching `DEV_SHELTER_ADMIN_SHELTER_SLUG`.

Production must use a strong `BETTER_AUTH_SECRET` and must not rely on the default admin password.

## Authentication

Shelter authentication uses Better Auth email/password credentials. New shelter users are linked automatically when their email matches a shelter record, or through the development shortcut environment variables.

Admin authentication is a lightweight signed cookie flow in `src/lib/admin-auth.ts`. Current defaults are:

```text
username: admin
password: password1234
```

The admin session cookie is `paws_admin_session`. Logout clears both the current cookie and the previous legacy cookie name.

User controls include:

- user suspension
- shelter access assignment
- forced password reset
- email reset link
- recent session display

## Database Model Summary

Core tables:

- `Shelter`: partner shelter profile, status, contact details, website/social links, cover/logo images
- `User`: Better Auth user profile, role, shelter link, suspension and reset flags
- `Session`: Better Auth sessions
- `Account`: Better Auth credential accounts
- `Animal`: public listing details, photos, traits, health flags, status, and shelter link
- `AdoptionEnquiry`: public enquiries routed to shelters
- `EnquiryNote`: shelter CRM notes with author tracking
- `EnquiryStatusEvent`: enquiry status change audit trail
- `SavedSearchAlert`: public search alert records
- `ProfileView`: animal and shelter profile view tracking
- `PlatformSettings`: branding, analytics, and SMTP settings
- `PlatformActivity`: explicit search, enquiry, shelter, and user activity events

Important statuses:

- Shelter: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- Animal: `DRAFT`, `AVAILABLE`, `RESERVED`, `ADOPTED`, `ARCHIVED`
- Enquiry: `NEW`, `CONTACTED`, `APPROVED`, `DECLINED`, `CLOSED`

## Image Uploads

Images are currently stored under `public/uploads`.

Animal uploads:

```text
public/uploads/animals
```

Shelter uploads:

```text
public/uploads/shelters
```

Platform branding uploads:

```text
public/uploads/platform
```

Current implementation is local filesystem storage. For DigitalOcean App Platform production, replace this with object storage or a persistent upload strategy before relying on uploads long term. App Platform containers are not a durable file store.

## Email and SMTP

SMTP is configured in `/admin/settings` and stored in `PlatformSettings`.

Supported fields:

- enabled/disabled
- SMTP host
- port
- security: `TLS`, `SSL`, or `NONE`
- auth type, default `LOGIN`
- username, usually `apikey` for SendGrid
- password/API key
- session limit
- no-reply email
- default sender name

Email path:

```text
src/lib/email.ts -> sendPlatformEmail()
```

Current tested SendGrid setup:

```text
host: smtp.sendgrid.net
port: 587
security: TLS
auth: LOGIN
username: apikey
from: no-reply@webblms.com
```

The SMTP test accepted:

```text
hannes@webblms.com
hannesgeld@gmail.com
```

SendGrid requires the configured from address to match a verified Sender Identity.

## Analytics and Branding

Admin settings can configure:

- Google Analytics measurement ID
- site logo
- site icon
- SMTP settings

Public chrome uses the configured branding through:

```text
src/app/public-chrome.tsx
src/lib/platform-settings.ts
```

Google Analytics is injected only when a valid measurement ID is configured.

## Public Search and Filtering

Homepage search supports:

- text search with weighted matching
- multiple animal types
- multiple sizes
- multiple areas
- shelter multi-select dropdown
- health flags: vaccinated, neutered, microchipped, tick/flea protected
- popular quick searches

Animal cards open the animal profile when clicked. The explicit “View Profile” button was removed.

## Animal Profiles

Animal profile pages include:

- shared PAWS header and footer
- breadcrumb with species filter link
- shelter/location line
- main photo and thumbnails
- sticky right column with enquiry action and shelter context
- social sharing inside the enquiry/action card
- traits under the About section
- health and medical cards
- profile view tracking

The right column uses sticky positioning inside the profile body so it stays anchored while the left column scrolls, then yields to the footer once the page reaches the bottom.

## Shelter Dashboard

Shelter users can:

- see active listing and enquiry summaries
- manage animal inventory
- create and edit listings
- upload and choose primary animal photos
- manage shelter profile, website, logo, and cover images
- view enquiries and status
- add notes and track actions by author

The shelter profile editor uses upload controls instead of raw image URL fields.

## Admin Dashboard

Admin users can:

- inspect platform stats
- approve, reject, suspend, or delete shelters
- manage associated listings when shelters are suspended/deleted
- manage users and reset passwords
- view recent sessions
- search globally
- inspect platform activity
- configure SMTP, analytics, logo, and icon

Sidebar badge behavior:

- Shelters badge only appears when there are pending shelter approvals.
- Users badge is intentionally not shown.

## Platform Activity

Explicit activity is stored in `PlatformActivity`.

Recorded activity includes:

- public searches and filters
- enquiries
- saved alerts
- shelter registration and admin approval actions
- relevant admin/user operations

The admin dashboard and `/admin/activity` both show a unified stream. If the explicit activity table has little or no data, the activity page also falls back to recent animals, enquiries, and shelter registrations so it does not appear empty while dashboard activity exists.

## Legal Pages

The site includes short Terms and Privacy pages:

- Terms clarify that PAWS is a marketplace, not an adoption decision-maker or shelter.
- Privacy references South African law and POPIA.
- Privacy states that information will not be resold.

## Verification Commands

Use these before committing:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Note: `npm run build` has occasionally hung in the local environment even when lint and TypeScript checks pass. If it hangs, kill the stuck `next build` process and rerun.

## Staging Deployment

Staging currently runs on the DigitalOcean VPS at `159.223.208.156`. It is not behind a domain yet, so staging URLs should use the request host/IP rather than a hardcoded hostname.

Server layout:

- Repository checkout: `/opt/paws`
- Environment file: `/opt/paws/.env.staging`
- Compose file: `docker-compose.staging.yml`
- Public entrypoint: Caddy on ports `80` and `443`
- App container: Next.js on `127.0.0.1:3000`
- Database: Postgres container with persistent Docker volume
- Uploads: `paws_uploads` Docker volume mounted at `/app/public/uploads`

Deploy latest `main` to staging:

```bash
ssh root@159.223.208.156
cd /opt/paws
git pull --ff-only origin main
docker compose --env-file .env.staging -f docker-compose.staging.yml build app
docker compose --env-file .env.staging -f docker-compose.staging.yml run --rm app npx prisma migrate deploy
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d
```

Verify staging:

```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
curl -I http://159.223.208.156/
curl -I http://159.223.208.156/admin/logout
```

The logout response should redirect to the same IP host, for example `http://159.223.208.156/admin/login`.

## Production Deployment Notes

Recommended production shape:

- Next.js app deployed as a DigitalOcean App Platform service
- Managed PostgreSQL database
- environment variables configured in App Platform
- production `BETTER_AUTH_URL` matching the public domain
- strong `BETTER_AUTH_SECRET`
- changed admin credentials
- SendGrid or equivalent SMTP configured in Admin settings
- object storage for uploaded images before production launch

Deployment checklist:

- Set production `DATABASE_URL`
- Run Prisma migrations
- Seed only if production seed data is intended
- Set `BETTER_AUTH_URL`
- Set `BETTER_AUTH_SECRET`
- Set `MASTER_ADMIN_USERNAME`
- Set `MASTER_ADMIN_PASSWORD`
- Configure SMTP sender identity
- Configure Google Analytics if required
- Confirm public upload strategy
- Test shelter signup/login
- Test admin logout/login
- Test animal enquiry email routing
- Test password reset email

## Current Known Technical Debt

- Uploaded images are local filesystem assets and need durable production storage.
- Admin auth is intentionally simple for early build; replace or harden before public launch.
- Some public copy and footer links are placeholders and should be finalized.
- Saved search alerts are stored, but recurring alert delivery still needs a scheduled job.
- Social sharing includes outbound links; Instagram does not support direct web share in the same way as Facebook/WhatsApp.
- Email templates are functional but basic.
- Production audit logging should be reviewed before launch.

## Useful Commands

```bash
npm run db:up
npm run db:down
npm run db:migrate
npm run db:generate
npm run db:studio
npm run db:seed
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```
