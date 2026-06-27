"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import { revalidatePath } from "next/cache";

export async function addMenuItem(formData: FormData) {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("No vendor for current user");

  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = parseFloat(String(formData.get("price") ?? "0"));

  if (!name || isNaN(price)) throw new Error("Name and price are required");

  await supabase.from("menu_items").insert({
    vendor_id: vendor.id,
    name,
    description: description || null,
    price,
  });

  revalidatePath("/vendor/menu");
}

export async function toggleAvailability(itemId: string, isAvailable: boolean) {
  const supabase = createClient();
  await supabase.from("menu_items").update({ is_available: isAvailable }).eq("id", itemId);
  revalidatePath("/vendor/menu");
}

export async function deleteMenuItem(itemId: string) {
  const supabase = createClient();
  await supabase.from("menu_items").delete().eq("id", itemId);
  revalidatePath("/vendor/menu");
}
