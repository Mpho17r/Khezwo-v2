"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatZAR, nextStatus, ORDER_STATUS_LABEL } from "@/lib/utils";
import { updateOrderStatus } from "./actions";
import { ChevronRight, Ban } from "lucide-react";

type OrderWithItems = Order & { order_items: OrderItem[] };

export function LiveOrdersBoard({
  vendorId,
  initialOrders,
}: {
  vendorId: string;
  initialOrders: OrderWithItems[];
}) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${vendorId}` },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: items } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", (payload.new as Order).id);
            setOrders((prev) => [
              { ...(payload.new as Order), order_items: items ?? [] },
              ...prev,
            ]);
            // Audible + visual alert for a new order.
            try {
              new Audio("/notification.mp3").play().catch(() => {});
            } catch {}
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === (payload.new as Order).id ? { ...o, ...(payload.new as Order) } : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, supabase]);

  const activeOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const pastOrders = orders.filter((o) => o.status === "completed" || o.status === "cancelled");

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-400">
        No orders yet. Once your QR code goes live, orders will appear here instantly.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 font-display font-semibold text-khezwo-ink">
          Active ({activeOrders.length})
        </h2>
        {activeOrders.length === 0 ? (
          <p className="text-sm text-neutral-400">No active orders right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {pastOrders.length > 0 && (
        <div>
          <h2 className="mb-3 font-display font-semibold text-khezwo-ink">Completed today</h2>
          <div className="space-y-2">
            {pastOrders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm"
              >
                <span className="font-medium text-khezwo-ink">
                  #{order.order_number} — {order.customer_name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">{formatZAR(order.total)}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const [updating, setUpdating] = useState(false);
  const upcoming = nextStatus(order.status);

  async function advance() {
    if (!upcoming) return;
    setUpdating(true);
    await updateOrderStatus(order.id, upcoming);
    setUpdating(false);
  }

  async function cancel() {
    setUpdating(true);
    await updateOrderStatus(order.id, "cancelled" as OrderStatus);
    setUpdating(false);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-khezwo-ink">#{order.order_number}</span>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm font-medium text-neutral-700">{order.customer_name}</p>
      <p className="text-xs text-neutral-400">
        {order.payment_method === "cash" ? "Pay with cash" : "Paid by card"}
      </p>

      <ul className="mt-3 space-y-1 text-sm text-neutral-600">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.quantity}× {item.name_snapshot}
            </span>
            <span>{formatZAR(item.price_snapshot * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="text-sm font-semibold text-khezwo-ink">{formatZAR(order.total)}</span>
        <div className="flex items-center gap-2">
          {order.status === "received" && (
            <button onClick={cancel} disabled={updating} title="Cancel order">
              <Ban size={16} className="text-neutral-400 hover:text-khezwo-red" />
            </button>
          )}
          {upcoming && (
            <button
              onClick={advance}
              disabled={updating}
              className="flex items-center gap-1 rounded-lg bg-khezwo-ink px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Mark {ORDER_STATUS_LABEL[upcoming]}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
