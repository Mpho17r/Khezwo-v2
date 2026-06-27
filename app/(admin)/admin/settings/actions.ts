"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePlatformFee(formData: FormData) {
  const supabase = createServiceRoleClient();
  const percent = parseFloat(String(formData.get("percent") ?? "5"));
  await supabase
    .from("platform_settings")
    .update({ value: percent })
    .eq("key", "default_platform_fee_percent");
  revalidatePath("/admin/settings");
}

export async function addSponsorAd(formData: FormData) {
  const supabase = createServiceRoleClient();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  if (!businessName) return;

  await supabase.from("sponsor_ads").insert({
    business_name: businessName,
    link_url: linkUrl || null,
    active: true,
  });
  revalidatePath("/admin/settings");
}

export async function toggleSponsorAd(adId: string, active: boolean) {
  const supabase = createServiceRoleClient();
  await supabase.from("sponsor_ads").update({ active }).eq("id", adId);
  revalidatePath("/admin/settings");
}
