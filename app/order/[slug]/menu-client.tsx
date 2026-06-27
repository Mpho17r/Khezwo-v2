"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CartLine, MenuItem, PaymentMethod, Vendor } from "@/lib/types";
import { formatZAR } from "@/lib/utils";
import { placeOrder } from "./actions";
import { ShoppingCart, Plus, Minus, X } from "lucide-react";

export function MenuClient({ vendor, items }: { vendor: Vendor; items: MenuItem[] }) {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const router = useRouter();

  const lines = Object.values(cart);
  const cartCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines]
  );

  function addItem(item: MenuItem) {
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: (existing?.quantity ?? 0) + 1,
        },
      };
    });
  }

  function changeQty(itemId: string, delta: number) {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const quantity = existing.quantity + delta;
      if (quantity <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { ...existing, quantity } };
    });
  }

  async function checkout() {
    setError(null);
    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await placeOrder({
        vendorId: vendor.id,
        customerName,
        paymentMethod,
        cart: lines,
      });
      router.push(`/order/${vendor.slug}/confirmation/${result.orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-24">
      <div className="space-y-3 px-4 py-4 sm:px-6">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-400">
            This menu is empty right now — check back soon.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-white p-3"
            >
              <div className="flex-1">
                <p className="font-medium text-neutral-800">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-neutral-500">{item.description}</p>
                )}
                <p className="mt-1 text-sm font-semibold" style={{ color: vendor.primary_color }}>
                  {formatZAR(item.price)}
                </p>
              </div>
              {item.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photo_url}
                  alt={item.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              {item.is_available ? (
                cart[item.id] ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(item.id, -1)} className="rounded-full border p-1">
                      <Minus size={14} />
                    </button>
                    <span className="w-4 text-center text-sm font-semibold">
                      {cart[item.id].quantity}
                    </span>
                    <button onClick={() => changeQty(item.id, 1)} className="rounded-full border p-1">
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addItem(item)}
                    className="rounded-full px-3 py-1.5 text-sm font-semibold text-white"
                    style={{ backgroundColor: vendor.primary_color }}
                  >
                    Add
                  </button>
                )
              ) : (
                <span className="text-xs font-medium text-neutral-400">Out of stock</span>
              )}
            </div>
          ))
        )}
      </div>

      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 flex items-center justify-between rounded-full px-5 py-3 text-white shadow-lg sm:inset-x-auto sm:right-6"
          style={{ backgroundColor: vendor.primary_color }}
        >
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingCart size={18} />
            {cartCount} item{cartCount === 1 ? "" : "s"}
          </span>
          <span className="ml-4 font-semibold">{formatZAR(subtotal)}</span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-neutral-800">Your order</h2>
              <button onClick={() => setCartOpen(false)}>
                <X size={20} className="text-neutral-400" />
              </button>
            </div>

            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {lines.map((line) => (
                <li key={line.menuItemId} className="flex justify-between text-sm">
                  <span>
                    {line.quantity}× {line.name}
                  </span>
                  <span>{formatZAR(line.price * line.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3 font-semibold">
              <span>Total</span>
              <span>{formatZAR(subtotal)}</span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-700">Your name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sipho"
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Payment method</label>
                <div className="mt-1 flex gap-2">
                  {(["cash", "card"] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                        paymentMethod === method
                          ? "border-transparent text-white"
                          : "border-neutral-200 text-neutral-600"
                      }`}
                      style={
                        paymentMethod === method
                          ? { backgroundColor: vendor.primary_color }
                          : undefined
                      }
                    >
                      {method}
                    </button>
                  ))}
                </div>
                {paymentMethod === "card" && (
                  <p className="mt-1 text-xs text-neutral-400">
                    Card payment is collected at pickup for now.
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={checkout}
                disabled={submitting}
                className="w-full rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: vendor.primary_color }}
              >
                {submitting ? "Placing order…" : `Place order · ${formatZAR(subtotal)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
