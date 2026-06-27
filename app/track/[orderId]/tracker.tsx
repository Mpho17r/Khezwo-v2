"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/utils";
import { Check } from "lucide-react";
import clsx from "clsx";

export function OrderTracker({
  orderId,
  initialStatus,
  primaryColor,
}: {
  orderId: string;
  initialStatus: OrderStatus;
  primaryColor: string;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`track-order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setStatus((payload.new as Order).status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  if (status === "cancelled") {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
        This order was cancelled. Please speak to staff if you have questions.
      </p>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <ol className="space-y-4">
        {ORDER_STATUS_FLOW.map((step, idx) => {
          const done = idx <= currentIndex;
          return (
            <li key={step} className="flex items-center gap-3">
              <span
                className={clsx(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                  done ? "border-transparent text-white" : "border-neutral-200 text-neutral-300"
                )}
                style={done ? { backgroundColor: primaryColor } : undefined}
              >
                {done ? <Check size={14} /> : idx + 1}
              </span>
              <span className={clsx("font-medium", done ? "text-neutral-800" : "text-neutral-400")}>
                {ORDER_STATUS_LABEL[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
