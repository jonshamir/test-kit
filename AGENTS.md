# AGENTS.md

Instructions for AI coding assistants working in this repository. Humans: read
this too, it is the shortest description of how the project fits together.

## What this is

A starter template for Product Jam, a year-long course where design students and
computer science students build web apps for non-profit organisations. The
people editing this code range from designers who have never used a terminal to
CS students who have never built for the web. The finished app is handed to the
organisation at the end of the year.

Optimise for **clarity over cleverness**. Slightly repetitive code that can be
read top to bottom beats an abstraction that saves ten lines.

## The three boxes

Every file belongs to exactly one of these, and which one decides what it can
do.

| Folder    | Runs                     | Can                                            |
| --------- | ------------------------ | ---------------------------------------------- |
| `client/` | In the visitor's browser | Draw the screen. **Never** touch the database. |
| `server/` | On Cloudflare Workers    | Talk to the database. Holds the secrets.       |
| `shared/` | Imported by both         | Plain data rules both sides must agree on.     |

`client/` calls `server/` over HTTP at `/api/*`. Nothing else crosses. ESLint
enforces this - it will refuse a `document` in `server/`, or an import of
`client/` from `shared/`.

Inside `client/`:

- `components/` - the design system. Generic; knows nothing about events.
- `features/<name>/` - hooks and forms for one resource.
- `pages/` - one file per URL. Mostly assembles the other two. Plus
  `Layout.tsx`, the header and footer around them (applied in `App.tsx`).

## The server runs on Workers, not Node

- No `fs`, no child processes, no native modules. **These will not work:**
  `sharp`, `bcrypt`, `canvas`, `puppeteer`, `multer` disk storage, `nodemailer`
  and anything else using raw TCP or SMTP. Use fetch-based libraries and HTTP
  APIs instead.
- About **10ms of CPU per request**. Waiting on the network is free; heavy
  computation is not.
- **Nothing survives between requests.** No in-memory caches, no module-level
  mutable state. (`server/middleware/auth.ts` caches public keys and explains at
  length why that one is safe - match that standard before adding another.)
- Secrets come from `c.env`, never `process.env`. Locally they are read from the
  lines in `.env` **without** a `VITE_` prefix; in production
  `SUPABASE_SECRET_KEY` is set in the Cloudflare dashboard (Worker → Settings →
  Variables & Secrets, as a **Secret**, never Text, and never in
  `wrangler.jsonc` - that file is in git). `SUPABASE_URL` is not a secret and is
  copied into the Worker's config at build time by `serverUrlFromEnv` in
  `vite.config.ts`. Anything `VITE_` is public and ends up in the browser.

## Data access rules

- The browser uses `supabase-js` for **auth only**: sign in, sign out, session,
  access token. See `client/lib/supabase.ts`.
- All data and files go through `/api/*`, using `api()` from
  `client/lib/api.ts`. Never call `fetch` directly for our own API.
- Every table has **Row Level Security on with no policies**. That makes the
  publishable key useless for data access, on purpose. **Do not write RLS
  policies.** Decide who sees what in `server/routes/`, where it can be read and
  tested.
- The secret key must never appear in `client/`, nor in any `VITE_` variable.
  Anything `VITE_` is public and ends up in the browser.
- The server's Supabase client bypasses every database rule, so **your handler
  is the security**. Filter by `c.var.user.id` on anything per-user.

## Adding a feature

Copy the `events` example. It is five places, in this order:

1. `supabase/migrations/` - a new numbered `.sql` file, RLS enabled, no policies
2. `shared/schemas/` - Zod schemas; infer types with `z.infer`, never hand-write
   them
3. `server/routes/` - the handlers, registered in `server/index.ts`
4. `client/features/<name>/hooks.ts` - TanStack Query hooks
5. `client/pages/` - the screens, routed in `client/App.tsx`

Full walkthrough: `docs/05-adding-a-feature.md`.

## Styling

- **CSS Modules only.** No Tailwind, no CSS-in-JS, no inline `style=` for
  anything themeable.
- **Read from tokens.** Every colour, space, radius, font size and duration
  comes from `client/styles/tokens.css`. No hex codes in component CSS. There
  are ~50 tokens; eight colours are written by hand and the rest are derived
  from them with `color-mix()`. Add a token only if none of them fits - a size
  that belongs to one component (a switch track, a calendar cell) is a local
  `--var` at the top of that component's module instead.
- **Logical properties only.** `margin-inline-start`, `padding-inline`,
  `inset-inline-end`, `text-align: start`. Never `left` or `right` - the app
  ships right-to-left and physical properties break it. The one exception is
  centring, where `inset: 0; margin: auto` is correct in both directions.
- Style states with Base UI's data attributes (`[data-open]`, `[data-disabled]`,
  `[data-highlighted]`), not classes toggled from JS.
- Keep visible focus rings. Respect `prefers-reduced-motion`.

## Components

**Use what is in `client/components/` before building anything new.** There
are 22. If you genuinely need a new primitive, build it on
[Base UI](https://base-ui.com), in its own folder with `Component.tsx`,
`Component.module.css` and `index.ts`.

Base UI has no Card, Spinner or calendar - see how those three are done.

## Commands

```bash
npm run dev         # http://localhost:3000, client and server together
npm run build       # into dist/
npm run preview     # build, then serve it - check this before deploying
npm run deploy      # what Cloudflare runs on every push to main - not run by hand
npm run typecheck   # tsc -b
npm run lint        # eslint
npm run format      # prettier --write
npm test            # vitest
```

## Do not

- Add a framework or a major dependency without asking. Specifically not:
  Tailwind, Next.js, an ORM, a state library, a form library, a CSS-in-JS
  library, or an i18n framework.
- Put a secret in `client/` or in a `VITE_` variable.
- Write RLS policies.
- Reach the database from the browser.
- Use `left`/`right` in layout CSS.
- Use `any`.
