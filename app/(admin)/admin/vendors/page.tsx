import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Vendor } from "@/lib/types";
import { VendorRow } from "./vendor-row";

export default async function AdminVendorsPage() {
  const supabase = createServiceRoleClient();
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-khezwo-ink">Vendors</h1>
      <p className="mb-6 text-sm text-neutral-500">{vendors?.length ?? 0} businesses on KheZwo.</p>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">Plan</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(vendors as Vendor[] ?? []).map((vendor) => (
              <VendorRow key={vendor.id} vendor={vendor} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
