import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatZAR } from "@/lib/utils";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  const [{ count: vendorCount }, { count: activeVendorCount }, { data: orders }] =
    await Promise.all([
      supabase.from("vendors").select("*", { count: "exact", head: true }),
      supabase
        .from("vendors")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("orders").select("total, platform_fee, status"),
    ]);

  const validOrders = (orders ?? []).filter((o) => o.status !== "cancelled");
  const gmv = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const platformRevenue = validOrders.reduce((sum, o) => sum + Number(o.platform_fee), 0);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-khezwo-ink">
        Platform overview
      </h1>
      <p className="mb-6 text-sm text-neutral-500">All vendors, all-time.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Vendors" value={String(vendorCount ?? 0)} />
        <Stat label="Active vendors" value={String(activeVendorCount ?? 0)} />
        <Stat label="Gross order value" value={formatZAR(gmv)} />
        <Stat label="Platform fee revenue" value={formatZAR(platformRevenue)} />
      </div>

      <p className="mt-8 text-xs text-neutral-400">
        Ad and subscription revenue are tracked outside this MVP build — wire
        them up once your payment provider (e.g. PayFast / Yoco) and AdSense
        account are connected.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-xs uppercase text-neutral-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-khezwo-ink">{value}</p>
    </div>
  );
}
