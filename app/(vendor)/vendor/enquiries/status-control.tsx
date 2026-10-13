"use client";

import { useState, useTransition } from "react";
import { updateEnquiryStatus } from "./actions";

export function EnquiryStatusControl({ enquiryId, status }: { enquiryId: string; status: "new" | "contacted" | "closed" }) {
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
      Status
      <select
        value={current}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as "new" | "contacted" | "closed";
          setCurrent(next);
          startTransition(async () => {
            try {
              await updateEnquiryStatus(enquiryId, next);
            } catch {
              setCurrent(current);
            }
          });
        }}
        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-700"
      >
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="closed">Closed</option>
      </select>
    </label>
  );
}
