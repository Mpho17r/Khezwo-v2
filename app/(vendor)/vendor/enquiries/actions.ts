"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import { revalidatePath } from "next/cache";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateEnquiryStatus(enquiryId: string, status: "new" | "contacted" | "closed") {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("Sign in as a business owner to manage enquiries.");
  if (!UUID_PATTERN.test(enquiryId)) throw new Error("Invalid enquiry.");
  if (!["new", "contacted", "closed"].includes(status)) throw new Error("Invalid enquiry status.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_enquiries")
    .update({ status })
    .eq("id", enquiryId)
    .eq("vendor_id", vendor.id)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Could not update this enquiry.");
  revalidatePath("/vendor/enquiries");
}
