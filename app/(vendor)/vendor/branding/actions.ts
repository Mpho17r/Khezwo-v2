"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import { revalidatePath } from "next/cache";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function updateBranding(formData: FormData) {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Sign in as a business owner to update branding.");

  const primaryColor = String(formData.get("primaryColor") ?? vendor.primary_color).trim();
  const secondaryColor = String(formData.get("secondaryColor") ?? vendor.secondary_color).trim();
  const closingMessage = String(formData.get("closingMessage") ?? "").trim();

  if (!HEX_COLOR.test(primaryColor) || !HEX_COLOR.test(secondaryColor)) {
    throw new Error("Brand colours must be valid six-digit hex colours.");
  }
  if (closingMessage.length > 500) {
    throw new Error("The closing message must be 500 characters or fewer.");
  }

  const supabase = await createClient();
  const logoField = formData.get("logo");
  let logoUrl = vendor.logo_url;

  if (logoField instanceof File && logoField.size > 0) {
    const extension = LOGO_TYPES[logoField.type];
    if (!extension) throw new Error("Logo must be a PNG, JPEG or WebP image.");
    if (logoField.size > MAX_LOGO_BYTES) {
      throw new Error("Logo must be 2 MB or smaller.");
    }

    const path = `${vendor.id}/logo-${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("vendor-assets")
      .upload(path, logoField, {
        upsert: false,
        contentType: logoField.type,
        cacheControl: "3600",
      });

    if (uploadError) throw new Error("Could not upload the logo. Check the image and try again.");

    const { data: publicUrl } = supabase.storage.from("vendor-assets").getPublicUrl(path);
    logoUrl = publicUrl.publicUrl;
  }

  const { error } = await supabase
    .from("vendors")
    .update({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      closing_message: closingMessage || null,
      logo_url: logoUrl,
    })
    .eq("id", vendor.id);

  if (error) throw new Error("Could not save branding changes.");
  revalidatePath("/vendor/branding");
  revalidatePath("/vendor/menu");
}
