"use server";

import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setVendorStatus(vendorId: string, status: "active" | "suspended") {
  await requireAdmin();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vendorId)) {
    throw new Error("Invalid vendor.");
  }
  if (status !== "active" && status !== "suspended") {
    throw new Error("Invalid vendor status.");
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("vendors").update({ status }).eq("id", vendorId);
  if (error) throw new Error("Could not update vendor status.");
  revalidatePath("/admin/vendors");
}
