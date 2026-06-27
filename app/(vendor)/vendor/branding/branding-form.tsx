"use client";

import { useState, useTransition } from "react";
import type { Vendor } from "@/lib/types";
import { updateBranding } from "./actions";

export function BrandingForm({ vendor }: { vendor: Vendor }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(vendor.logo_url);

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateBranding(formData);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        });
      }}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6"
    >
      <div>
        <label className="text-sm font-medium text-khezwo-ink">
          Your logo (shown to customers — not KheZwo&apos;s)
        </label>
        <div className="mt-2 flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-400">
              No logo
            </div>
          )}
          <input
            name="logo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-khezwo-ink">Primary color</label>
          <input
            name="primaryColor"
            type="color"
            defaultValue={vendor.primary_color}
            className="mt-1 h-10 w-full rounded-lg border border-neutral-200"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-khezwo-ink">Secondary color</label>
          <input
            name="secondaryColor"
            type="color"
            defaultValue={vendor.secondary_color}
            className="mt-1 h-10 w-full rounded-lg border border-neutral-200"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-khezwo-ink">Closed message</label>
        <textarea
          name="closingMessage"
          defaultValue={vendor.closing_message ?? ""}
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          placeholder="Shown to customers when you're closed"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-khezwo-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Saving…" : saved ? "Saved ✓" : "Save branding"}
      </button>
    </form>
  );
}
