"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import { revalidatePath } from "next/cache";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function addMenuItem(formData: FormData) {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Sign in as a business owner to manage your menu.");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawPrice = String(formData.get("price") ?? "").trim();
  const price = Number(rawPrice);

  if (!name || name.length > 120) {
    throw new Error("Item name must be between 1 and 120 characters.");
  }
  if (description.length > 1000) {
    throw new Error("Item description must be 1,000 characters or fewer.");
  }
  if (!rawPrice || !Number.isFinite(price) || price < 0 || price > 99999999) {
    throw new Error("Enter a valid price between 0 and 99,999,999.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("menu_items").insert({
    vendor_id: vendor.id,
    name,
    description: description || null,
    price: Math.round(price * 100) / 100,
  });

  if (error) throw new Error("Could not add the menu item.");
  revalidatePath("/vendor/menu");
  revalidatePath(`/order/${vendor.slug}`);
}

export async function toggleAvailability(itemId: string, isAvailable: boolean) {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Sign in as a business owner to manage your menu.");
  if (typeof itemId !== "string" || !UUID_PATTERN.test(itemId)) throw new Error("Invalid menu item.");
  if (typeof isAvailable !== "boolean") throw new Error("Invalid availability value.");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", itemId)
    .eq("vendor_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Menu item not found for this business.");
  revalidatePath("/vendor/menu");
  revalidatePath(`/order/${vendor.slug}`);
}

export async function deleteMenuItem(itemId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Sign in as a business owner to manage your menu.");
  if (typeof itemId !== "string" || !UUID_PATTERN.test(itemId)) throw new Error("Invalid menu item.");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("vendor_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Menu item not found for this business.");
  revalidatePath("/vendor/menu");
  revalidatePath(`/order/${vendor.slug}`);
}
