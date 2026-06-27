"use client";

import { useTransition } from "react";
import type { Vendor } from "@/lib/types";
import { setVendorStatus } from "./actions";
import clsx from "clsx";

export function VendorRow({ vendor }: { vendor: Vendor }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-t border-neutral-100">
      <td className="px-4 py-3">
        <p className="font-medium text-khezwo-ink">{vendor.name}</p>
        <p className="text-xs text-neutral-400">/order/{vendor.slug}</p>
      </td>
      <td className="px-4 py-3 capitalize text-neutral-600">{vendor.plan}</td>
      <td className="px-4 py-3">
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            vendor.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}
        >
          {vendor.status}
        </span>
      </td>
      <td className="px-4 py-3 text-neutral-500">
        {new Date(vendor.created_at).toLocaleDateString("en-ZA")}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              setVendorStatus(vendor.id, vendor.status === "active" ? "suspended" : "active")
            )
          }
          className="text-xs font-semibold text-khezwo-red hover:underline disabled:opacity-50"
        >
          {vendor.status === "active" ? "Suspend" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}
