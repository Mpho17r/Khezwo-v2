"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import { revalidatePath } from "next/cache";

export async function updateBranding(formData: FormData) {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("No vendor for current user");

  const supabase = createClient();
  const primaryColor = String(formData.get("primaryColor") ?? vendor.primary_color);
  const secondaryColor = String(formData.get("secondaryColor") ?? vendor.secondary_color);
  const closingMessage = String(formData.get("closingMessage") ?? "");

  const logoFile = formData.get("logo") as File | null;
  let logoUrl = vendor.logo_url;

  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop();
    const path = `${vendor.id}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("vendor-assets")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type });

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from("vendor-assets").getPublicUrl(path);
      logoUrl = publicUrl.publicUrl;
    }
  }

  await supabase
    .from("vendors")
    .update({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      closing_message: closingMessage,
      logo_url: logoUrl,
    })
    .eq("id", vendor.id);

  revalidatePath("/vendor/branding");
}
