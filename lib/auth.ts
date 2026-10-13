import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Enforce platform-admin access inside server-rendered pages and server actions.
 * Middleware is useful for navigation, but is not an authorization boundary.
 */
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    redirect("/vendor/dashboard");
  }

  return user;
}
