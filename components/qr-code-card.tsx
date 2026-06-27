"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function QrCodeCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/order/${slug}`
      : `/order/${slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h3 className="font-display font-semibold text-khezwo-ink">
        Your table QR code
      </h3>
      <p className="mt-1 text-sm text-neutral-500">
        Print this and place it on tables, counters, or a poster. Customers
        scan it to order — no app required.
      </p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <QRCodeSVG value={url} size={160} />
        </div>
        <div className="flex-1">
          <p className="break-all rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
            {url}
          </p>
          <button
            onClick={handleCopy}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-khezwo-ink px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
