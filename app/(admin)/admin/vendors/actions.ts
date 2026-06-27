"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setVendorStatus(vendorId: string, status: "active" | "suspended") {
  const supabase = createServiceRoleClient();
  await supabase.from("vendors").update({ status }).eq("id", vendorId);
  revalidatePath("/admin/vendors");
}
