/**
 * These are Worker "bindings" - values that Cloudflare hands to the server at
 * runtime. They do NOT come from a .env file.
 *
 *   - Locally, from the un-prefixed lines in  .env
 *   - In production, from the Cloudflare dashboard: your Worker -> Settings
 *     -> Variables & Secrets (added as type "Secret")
 */
export type Bindings = {
  /** Your Supabase project URL, e.g. https://abcdefgh.supabase.co */
  SUPABASE_URL: string;
  /** The SECRET key (sb_secret_...). It bypasses all database rules.
   *  Never send this to the browser. Never put it in a VITE_ variable. */
  SUPABASE_SECRET_KEY: string;
};

/** Things our own middleware adds to the request, for handlers to read. */
export type Variables = {
  user: { id: string; email: string };
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
