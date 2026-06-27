"use server";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!businessName || !email || !password) {
    redirect("/register?error=Please+fill+in+every+field");
  }

  const supabase = createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUpData.user) {
    redirect(`/register?error=${encodeURIComponent(signUpError?.message ?? "Sign up failed")}`);
  }

  const userId = signUpData.user!.id;

  // No session yet (e.g. email confirmation is required by your Supabase
  // project settings) — ask the person to confirm their email, then log in.
  if (!signUpData.session) {
    redirect("/login?error=Check+your+email+to+confirm+your+account%2C+then+log+in");
  }

  // Create the profile row.
  await supabase.from("profiles").insert({
    id: userId,
    role: "vendor",
    full_name: businessName,
  });

  // Generate a unique slug for the public ordering URL.
  const baseSlug = slugify(businessName) || "vendor";
  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 5) {
    const { data: existing } = await supabase
      .from("vendors")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { error: vendorError } = await supabase.from("vendors").insert({
    owner_id: userId,
    name: businessName,
    slug,
  });

  if (vendorError) {
    redirect(`/register?error=${encodeURIComponent(vendorError.message)}`);
  }

  redirect("/vendor/dashboard");
}
