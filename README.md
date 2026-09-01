# gonext
A VALORANT Premier Coordinator App

## Development

Database is Postgres (via Neon's serverless driver adapter) — see **Deployment** below to
provision one. Once you have `DATABASE_URL` / `DATABASE_URL_UNPOOLED` in `.env`:

```bash
npm install
npx prisma migrate dev   # applies the schema
npx prisma db seed       # seeds the team (empty roster) and this week's matches
npm run dev
```

See [CONTEXT.md](./CONTEXT.md) for the domain glossary.

## Discord login setup

Login uses Discord OAuth via Auth.js. `AUTH_SECRET` is already generated for you in
`.env.local`; you need to supply the two Discord values yourself:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create
   a new application.
2. Under **OAuth2 → General**, copy the **Client ID** and **Client Secret**.
3. Under **OAuth2 → Redirects**, add: `http://localhost:3000/api/auth/callback/discord`
   (add your production callback URL here too once deployed, e.g.
   `https://your-app.vercel.app/api/auth/callback/discord`)
4. Paste both values into `.env.local` (already gitignored):
   ```
   AUTH_DISCORD_ID="your client id"
   AUTH_DISCORD_SECRET="your client secret"
   ```
5. Restart `npm run dev`.

The roster starts empty — there's no manual "add teammate" step. The only way onto the team is
the invite link: visit `/join/{team's invite token}` (find the token by checking the seeded
`Team` row, e.g. via `npx prisma studio`), sign in with Discord, and you're on the roster as
yourself. The first person to join a team becomes its Coach, who can then find and share the
real invite link from the Roster page. Only your own row is ever editable; everyone else's
stays read-only.

## Deployment (Vercel + Neon)

1. **Push to GitHub** — the repo already has a remote (`origin`); commit and push `main`.
2. **Create the Vercel project** at [vercel.com/new](https://vercel.com/new), importing this
   GitHub repo. Framework preset (Next.js) is auto-detected.
3. **Add a Postgres database**: in the Vercel project, go to the **Storage** tab → **Marketplace**
   → install the **Neon** integration (Vercel-managed billing is simplest — no separate Neon
   signup). This auto-injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED` into the project's
   environment variables.
4. **Set the remaining environment variables** in the Vercel project settings (Production
   environment):
   - `AUTH_SECRET` — generate a fresh one (`openssl rand -base64 33`), don't reuse the dev value
   - `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` — same Discord app as local dev
   - `AUTH_URL` is **not** needed — Auth.js auto-detects the host on Vercel
5. **Add the production redirect URI** in the Discord Developer Portal (OAuth2 → Redirects):
   `https://<your-vercel-domain>/api/auth/callback/discord`
6. **Run the migration against the new database** (locally, pointed at the Neon URLs, or via
   `vercel env pull` first): `npx prisma migrate deploy && npx prisma db seed`
7. Deploy — pushing to `main` triggers it automatically once the Vercel project is linked.

No custom domain needed for a beta — the default `*.vercel.app` URL is fine.
