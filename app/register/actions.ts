"use server";

import { randomUUID } from "crypto";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!businessName || businessName.length > 120 || !email || email.length > 254 || password.length < 6 || password.length > 128) {
    redirect("/register?error=Please+check+your+details+and+try+again");
  }

  const supabase = await createClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUpData.user || signUpData.user.identities?.length === 0) {
    // Avoid exposing provider details or confirming whether an email is registered.
    redirect("/register?error=We+could+not+create+your+account.+Check+your+details+or+try+logging+in");
  }

  const userId = signUpData.user.id;
  const baseSlug = slugify(businessName).slice(0, 60) || "business";
  // A random suffix avoids predictable collisions and reduces registration races.
  const slug = `${baseSlug}-${randomUUID().replace(/-/g, "").slice(0, 8)}`;

  // Provisioning uses a narrowly scoped database RPC exposed only to service_role.
  // It creates the fixed vendor role and business in one database transaction.
  const adminClient = createServiceRoleClient();
  const { error: provisionError } = await adminClient.rpc("provision_vendor_account", {
    p_user_id: userId,
    p_business_name: businessName,
    p_slug: slug,
  });

  if (provisionError) {
    // Do not return database internals to the browser. Auth account creation may
    // already have succeeded, so direct the user to support/login rather than
    // attempting a destructive cleanup of the newly created Auth identity.
    redirect("/register?error=Your+account+could+not+be+fully+set+up.+Please+try+logging+in+or+contact+support");
  }

  // Provision first, so email-confirmation settings cannot leave an orphaned
  // Auth account without its profile/business records.
  if (!signUpData.session) {
    redirect("/login?error=Check+your+email+to+confirm+your+account%2C+then+log+in");
  }

  redirect("/vendor/dashboard");
}
