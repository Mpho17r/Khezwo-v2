"use client";

import { useState } from "react";
import { submitServiceEnquiry } from "./actions";

export function ServiceEnquiryForm({
  vendorId,
  itemId,
  primaryColor,
}: {
  vendorId: string;
  itemId: string;
  primaryColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await submitServiceEnquiry({ vendorId, itemId, customerName, contactValue, message });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your enquiry.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return <p className="mt-3 text-sm font-medium text-green-700" role="status">Enquiry sent. The business can now follow up with you.</p>;
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full px-3 py-1.5 text-sm font-semibold text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {open ? "Close enquiry" : "Enquire"}
      </button>
      {open && (
        <div className="mt-3 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <label className="block text-xs font-medium text-neutral-600">
            Your name
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={120} required className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-medium text-neutral-600">
            Email or phone number
            <input value={contactValue} onChange={(e) => setContactValue(e.target.value)} maxLength={254} required className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-medium text-neutral-600">
            What do you need? (optional)
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={3} className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm" />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={submit} disabled={busy || !customerName.trim() || !contactValue.trim()} className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
            {busy ? "Sending…" : "Send enquiry"}
          </button>
          <p className="text-xs text-neutral-400">Your contact details will be shared with this business so they can respond.</p>
        </div>
      )}
    </div>
  );
}
