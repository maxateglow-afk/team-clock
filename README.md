# Team Clock

A simple clock-in/clock-out app for a small team. Each person picks their name and enters
their own PIN to clock in or out; an admin dashboard (separate PIN) manages team members and
the timesheet.

## Stack

Next.js (App Router) + TypeScript + Prisma, backed by a local SQLite database file (via
`@libsql/client`). No external services required to run it.

## Getting started

```bash
npm install
cp .env.example .env   # then set your own ADMIN_PIN
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000. There are no team members yet — go to **Admin dashboard** (bottom
of the home page), enter your `ADMIN_PIN`, and add each teammate with a name and a 4-8 digit
PIN. They can then find their name on the home page and clock in/out with that PIN.

## Admin dashboard

Visit `/admin` and enter the `ADMIN_PIN` from your `.env` file. From there you can:

- Add team members and set their PIN
- Deactivate someone who leaves (keeps their history, hides them from the clock-in screen)
- Reset a forgotten PIN
- View and edit the timesheet (fix a forgotten clock-out, delete a mistaken entry)
- Export the timesheet as CSV for payroll

## Deploying

This runs anywhere Node.js runs. The default setup uses a local `dev.db` SQLite file, which
is fine for a single always-on server (a small VPS, a Docker container with a persistent
volume, Fly.io, Railway, etc.) — make sure the disk holding the `.db` file persists across
deploys/restarts.

If you deploy to a serverless platform (e.g. Vercel) there's no persistent local disk, so
point `DATABASE_URL` (and `DATABASE_AUTH_TOKEN`) at a hosted libSQL/Turso database instead —
the app already uses the libSQL Prisma adapter, so no code changes are needed, just env vars.

## Notes

- PINs are hashed (scrypt) before being stored, not saved in plain text.
- Sessions are a plain httpOnly cookie holding just the logged-in employee/admin id — fine for
  a small trusted-network team tool, not intended as a public-internet auth system.
