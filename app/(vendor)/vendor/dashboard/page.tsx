import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import { LiveOrdersBoard } from "./live-orders";
import Link from "next/link";

export default async function VendorDashboardPage() {
  const vendor = await getCurrentVendor();

  if (!vendor) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
        We couldn&apos;t find a business linked to your account.
      </div>
    );
  }

  const supabase = await createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("vendor_id", vendor.id)
    .gte("created_at", startOfToday.toISOString())
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-khezwo-ink">
            Hi, {vendor.name} 👋
          </h1>
          <p className="text-sm text-neutral-500">Here&apos;s what&apos;s happening today.</p>
        </div>
        <Link
          href="/vendor/branding"
          className="rounded-lg border border-khezwo-ink/15 bg-white px-4 py-2 text-sm font-medium text-khezwo-ink hover:bg-neutral-50"
        >
          View my QR code
        </Link>
      </div>

      <LiveOrdersBoard vendorId={vendor.id} initialOrders={orders ?? []} />
    </div>
  );
}
