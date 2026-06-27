"use client";

import { useState, useTransition } from "react";
import type { MenuItem } from "@/lib/types";
import { formatZAR } from "@/lib/utils";
import { addMenuItem, toggleAvailability, deleteMenuItem } from "./actions";
import { Plus, Trash2 } from "lucide-react";

export function MenuEditor({ items, freeTierLimit }: { items: MenuItem[]; freeTierLimit: number | null }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const atLimit = freeTierLimit !== null && items.length >= freeTierLimit;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {items.length} item{items.length === 1 ? "" : "s"}
          {freeTierLimit !== null && ` · ${freeTierLimit} max on the Free plan`}
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          disabled={atLimit}
          className="flex items-center gap-1.5 rounded-lg bg-khezwo-ink px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={16} />
          Add item
        </button>
      </div>

      {atLimit && (
        <p className="mb-4 rounded-lg bg-khezwo-gold/15 px-3 py-2 text-sm text-khezwo-ink">
          You&apos;ve reached the Free plan&apos;s {freeTierLimit}-item limit. Upgrade to Pro for
          unlimited menu items.
        </p>
      )}

      {showForm && (
        <form
          action={(formData) => {
            startTransition(async () => {
              await addMenuItem(formData);
              setShowForm(false);
            });
          }}
          className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-4"
        >
          <input
            name="name"
            placeholder="Item name"
            required
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Price (R)"
            required
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-khezwo-green px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <input
            name="description"
            placeholder="Description (optional)"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm sm:col-span-4"
          />
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {items.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-400">
            No menu items yet — add your first one above.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-400">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Available</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-khezwo-ink">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-neutral-400">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatZAR(item.price)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        startTransition(() => toggleAvailability(item.id, !item.is_available))
                      }
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.is_available
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {item.is_available ? "In stock" : "Out of stock"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startTransition(() => deleteMenuItem(item.id))}
                      className="text-neutral-400 hover:text-khezwo-red"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
