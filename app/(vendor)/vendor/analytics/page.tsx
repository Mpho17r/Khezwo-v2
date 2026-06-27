import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import { formatZAR } from "@/lib/utils";

export default async function VendorAnalyticsPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  const supabase = createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("vendor_id", vendor.id)
    .neq("status", "cancelled")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const completed = orders ?? [];
  const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = completed.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  const itemCounts = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const order of completed) {
    for (const item of order.order_items ?? []) {
      const existing = itemCounts.get(item.name_snapshot) ?? {
        name: item.name_snapshot,
        qty: 0,
        revenue: 0,
      };
      existing.qty += item.quantity;
      existing.revenue += item.quantity * Number(item.price_snapshot);
      itemCounts.set(item.name_snapshot, existing);
    }
  }
  const topItems = [...itemCounts.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const hourCounts = new Array(24).fill(0);
  for (const order of completed) {
    hourCounts[new Date(order.created_at).getHours()] += 1;
  }
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-khezwo-ink">Analytics</h1>
      <p className="mb-6 text-sm text-neutral-500">Last 30 days.</p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Revenue" value={formatZAR(totalRevenue)} />
        <Stat label="Orders" value={String(totalOrders)} />
        <Stat label="Avg. order value" value={formatZAR(avgOrderValue)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-3 font-display font-semibold text-khezwo-ink">Top sellers</h3>
          {topItems.length === 0 ? (
            <p className="text-sm text-neutral-400">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {topItems.map((item) => (
                <li key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-khezwo-ink">{item.name}</span>
                  <span className="text-neutral-500">
                    {item.qty} sold · {formatZAR(item.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-3 font-display font-semibold text-khezwo-ink">Peak hour</h3>
          {totalOrders === 0 ? (
            <p className="text-sm text-neutral-400">No orders yet.</p>
          ) : (
            <p className="text-sm text-khezwo-ink">
              Most orders come in around{" "}
              <span className="font-semibold">{formatHour(peakHour)}</span>.
            </p>
          )}
        </div>
      </div>
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

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}
