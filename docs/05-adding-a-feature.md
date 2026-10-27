# 5. Adding a feature

The app comes with one worked example: **events**. Everything you build should
look like it. This page walks through adding a second resource, `volunteers`, by
copying the same five steps.

Read `events` as you go - every file mentioned here has an `events` version to
copy from.

## The five places

Adding a resource touches five places, in this order. They go outside-in:
database first, screen last.

| #   | Where                             | What                       |
| --- | --------------------------------- | -------------------------- |
| 1   | `supabase/migrations/`            | the table                  |
| 2   | `shared/schemas/`                 | what counts as valid       |
| 3   | `server/routes/`                  | the API                    |
| 4   | `client/features/<name>/hooks.ts` | fetching it in the browser |
| 5   | `client/pages/`                   | the screens                |

It is five files because the three-box model is real: the database, the server
and the browser are genuinely separate, and this is where they meet.

## 1. The table

Create `supabase/migrations/20260401120000_volunteers.sql` - the number is a
timestamp, so files sort in the order they must run.

```sql
create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create index if not exists volunteers_owner_id_idx
  on public.volunteers (owner_id);

-- Always. No policies - see AGENTS.md.
alter table public.volunteers enable row level security;
```

Apply it:

```bash
npx supabase db push
```

## 2. What counts as valid

`shared/schemas/volunteers.ts`. This is checked by the browser before sending
and by the server before saving, so it is written once.

```ts
import { z } from "zod";

export const volunteerSchema = z.object({
  id: z.uuid(),
  owner_id: z.uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
});

export const createVolunteerSchema = z.object({
  name: z.string().trim().min(1, "Please enter a name"),
  phone: z.string().trim().max(40).nullish(),
});

export const updateVolunteerSchema = createVolunteerSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields were sent" });

export const volunteerIdParamSchema = z.object({ id: z.uuid("Invalid id") });

// Never hand-write these - let them follow the schemas.
export type Volunteer = z.infer<typeof volunteerSchema>;
export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>;
```

The error messages are written for people, not developers, because they are
shown to the user next to the field that was wrong.

## 3. The API

`server/routes/volunteers.ts`. Copy `server/routes/events.ts` and change the
names. The one thing to get right:

**Every query filters by `c.get("user").id`.** The server's database key ignores
all database rules, so this filter _is_ the security. Miss it on one query and
everyone can read everyone's data.

```ts
export const volunteers = new Hono<AppEnv>()
  .get("/", async (c) => {
    const { data, error } = await createAdminClient(c.env)
      .from("volunteers")
      .select(COLUMNS)
      .eq("owner_id", c.get("user").id); // <- this line
    ...
  })
```

Then register it in `server/index.ts`, **below** the `app.use` line so it
requires a login:

```ts
app.route("/api/volunteers", volunteers);
```

## 4. Fetching it in the browser

`client/features/volunteers/hooks.ts`. Copy the events one. It is five hooks and
a `queryKeys` object.

The part worth understanding is invalidation: after a change, throw away the
cached list so anything showing it refetches.

```ts
export const volunteerKeys = {
  all: ["volunteers"] as const,
  one: (id: string) => ["volunteers", id] as const,
};

export function useCreateVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVolunteerInput) =>
      api<Volunteer>("/api/volunteers", { method: "POST", body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
    },
  });
}
```

Forget `invalidateQueries` and the screen shows stale data after a save - the
most common bug in this kind of app.

## 5. The screens

`client/pages/VolunteersPage.tsx` and friends. Use the components in
`client/components/` - do not write new ones for this.

Handle **all four states**. "It works with data in it" is not enough:

```tsx
if (query.isPending) return <Spinner />;
if (query.isError) return <p role="alert">Could not load.</p>;
if (query.data.length === 0) return <p>No volunteers yet.</p>;
return <ul>{/* ... */}</ul>;
```

Then add the routes in `client/App.tsx`, wrapped in `RequireAuth`.

## Check it

```bash
npm run typecheck && npm run lint && npm test
```

Then in the browser: create one, edit it, delete it. And the one people forget -
**log in as a second user and check you cannot see the first user's data.** If
you can, a query is missing its `owner_id` filter.

## Next

[6. Styling and right-to-left](06-styling-and-rtl.md).
