"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;
const MAX_INPUT = 500;

interface PublicInvoice {
  invoiceId: string;
  payTo: string;
  amountSats: string;
  amountBch: string;
  expiresAt: string;
}

export default function TryForm() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);

  const createInvoice = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json().catch(() => null);

      // A new invoice comes back as 402 Payment Required. That is the success case here.
      if (res.status === 402 && data?.invoiceId) {
        setInvoice(data as PublicInvoice);
      } else {
        setError(data?.message ?? "Could not create the invoice. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-5">
      <div>
        <label htmlFor="try-input" className="mb-2 block text-sm font-medium text-white">
          Your question
        </label>
        <textarea
          id="try-input"
          value={input}
          maxLength={MAX_INPUT}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          placeholder="For example: Bitcoin Cash outlook this week"
          className="w-full rounded-xl border border-white/15 bg-black/40 p-3.5 text-sm text-white placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-emerald-300"
        />
        <p className="mt-1 text-right text-xs text-gray-500">
          {input.length}/{MAX_INPUT}
        </p>
      </div>

      <button
        type="button"
        onClick={createInvoice}
        disabled={loading || !input.trim()}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50"
      >
        {loading ? "Creating invoice…" : "Pay & Run"}
      </button>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
          {error}
        </p>
      )}

      {invoice && (
        <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="text-sm text-gray-400">Invoice created</p>
          <p className="text-2xl font-semibold tabular-nums text-white">
            {Number(invoice.amountSats).toLocaleString("en-US")} sats
          </p>
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-gray-500">Pay to</dt>
              <dd className="break-all font-mono text-gray-300">{invoice.payTo}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Valid until</dt>
              <dd className="text-gray-300">{new Date(invoice.expiresAt).toLocaleTimeString()}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}