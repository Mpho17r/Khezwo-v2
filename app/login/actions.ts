"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function safeInternalRedirect(value: string): string | null {
  // Next.js redirect() accepts absolute URLs, so only allow safe local paths.
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("\r") ||
    value.includes("\n")
  ) {
    return null;
  }
  return value;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeInternalRedirect(String(formData.get("redirectTo") ?? ""));

  if (!email || !password) {
    redirect("/login?error=Enter+your+email+and+password");
  }

  const supabase = createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Avoid exposing provider/internal authentication details in the URL.
    redirect("/login?error=Invalid+email+or+password");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const defaultDestination = profile?.role === "admin" ? "/admin/dashboard" : "/vendor/dashboard";

  if (redirectTo) {
    // Keep authenticated users inside the area their role is permitted to access.
    if (profile?.role === "admin" && redirectTo.startsWith("/admin/")) redirect(redirectTo);
    if (profile?.role === "vendor" && redirectTo.startsWith("/vendor/")) redirect(redirectTo);
  }

  redirect(defaultDestination);
}
