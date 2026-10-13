import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  // Next 15 keeps synchronous cookie access as a deprecated compatibility path.
  // Keep this helper sync for existing server actions while we finish the migration;
  // this cast only bridges Next 15's updated TypeScript signature.
  const cookieStore = cookies() as unknown as {
    get(name: string): { value: string } | undefined;
    set(options: { name: string; value: string; [key: string]: unknown }): void;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — safe to ignore because
            // middleware refreshes the session on every request.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // see note above
          }
        },
      },
    }
  );
}

// A privileged client that bypasses RLS. Only ever import this inside
// server actions / route handlers, never in client components, and only
// for the specific platform-admin operations that genuinely need it
// (e.g. listing every vendor regardless of who's logged in).
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
