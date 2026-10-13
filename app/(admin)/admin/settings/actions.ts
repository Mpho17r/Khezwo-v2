"use server";

import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePlatformFee(formData: FormData) {
  await requireAdmin();

  const rawPercent = String(formData.get("percent") ?? "");
  const percent = Number(rawPercent);
  if (!rawPercent.trim() || !Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error("Platform fee must be a number between 0 and 100.");
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ value: percent })
    .eq("key", "default_platform_fee_percent");

  if (error) throw new Error("Could not update platform fee.");
  revalidatePath("/admin/settings");
}

export async function addSponsorAd(formData: FormData) {
  await requireAdmin();

  const businessName = String(formData.get("businessName") ?? "").trim();
  const rawLinkUrl = String(formData.get("linkUrl") ?? "").trim();
  if (!businessName || businessName.length > 160) {
    throw new Error("Enter a business name of 1–160 characters.");
  }

  let linkUrl: string | null = null;
  if (rawLinkUrl) {
    try {
      const parsed = new URL(rawLinkUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        throw new Error();
      }
      linkUrl = parsed.toString();
    } catch {
      throw new Error("Sponsor link must be a valid HTTP or HTTPS URL.");
    }
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("sponsor_ads").insert({
    business_name: businessName,
    link_url: linkUrl,
    active: true,
  });

  if (error) throw new Error("Could not add sponsor ad.");
  revalidatePath("/admin/settings");
}

export async function toggleSponsorAd(adId: string, active: boolean) {
  await requireAdmin();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(adId)) {
    throw new Error("Invalid sponsor ad.");
  }
  if (typeof active !== "boolean") throw new Error("Invalid sponsor ad state.");

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("sponsor_ads").update({ active }).eq("id", adId);
  if (error) throw new Error("Could not update sponsor ad.");
  revalidatePath("/admin/settings");
}
