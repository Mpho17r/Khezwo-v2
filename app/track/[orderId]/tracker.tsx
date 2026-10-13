"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/utils";
import { Check } from "lucide-react";
import clsx from "clsx";

const VALID_STATUSES: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

export function OrderTracker({
  trackingToken,
  initialStatus,
  primaryColor,
}: {
  trackingToken: string;
  initialStatus: OrderStatus;
  primaryColor: string;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refreshStatus() {
      const { data, error } = await supabase.rpc("get_public_order_status", {
        p_tracking_token: trackingToken,
      });
      if (!active || error || !Array.isArray(data) || !data[0]) return;

      const next = data[0].status as OrderStatus;
      if (VALID_STATUSES.includes(next)) setStatus(next);
    }

    void refreshStatus();
    const intervalId = window.setInterval(() => void refreshStatus(), 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [trackingToken]);

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
      <p className="mt-4 text-center text-xs text-neutral-400">Status checks every 5 seconds.</p>
    </div>
  );
}
