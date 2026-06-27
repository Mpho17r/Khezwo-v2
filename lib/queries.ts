import { createClient } from "@/lib/supabase/server";
import type { Vendor } from "@/lib/types";

/** Returns the logged-in vendor owner's vendor row, or null. */
export async function getCurrentVendor(): Promise<Vendor | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  return (data as Vendor) ?? null;
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
