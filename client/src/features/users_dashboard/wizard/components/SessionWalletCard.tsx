"use client";

import { useState } from "react";
import { estimateFee } from "../_core/wizard.payment";
import { sessionKeyAsWif, withdrawSession } from "../_core/session.wallet";
import { toMessage } from "../_core/pay_fun";
import { useSessionWallet } from "../_core/useSessionWallet";

const formatSats = (sats: bigint) => Number(sats).toLocaleString("en-US");

/**
 * Shows the quick-pay balance saved in this browser.
 * `runSats` is the price of one run in sats, used to estimate how many runs are left.
 */
export default function SessionWalletCard({ runSats }: { runSats?: number }) {
  const { session, balance, loading, refresh } = useSessionWallet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!session) return null;

  const runsLeft =
    balance !== null && runSats
      ? Number(balance / (BigInt(Math.ceil(runSats)) + estimateFee(1, 2)))
      : null;

  const withdraw = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { sats } = await withdrawSession();
      setMessage({ kind: "ok", text: `Sent ${formatSats(sats)} sats back to your wallet.` });
    } catch (e) {
      setMessage({ kind: "error", text: toMessage(e) });
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(sessionKeyAsWif(session));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const small = "text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300";

  return (
    <div className="w-full max-w-xs space-y-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400">Quick-pay balance</p>
          <p className="mt-0.5 font-semibold tabular-nums text-white">
            {balance === null ? (loading ? "Checking…" : "Unavailable") : `${formatSats(balance)} sats`}
          </p>
          {runsLeft !== null && (
            <p className="text-xs text-gray-400">
              {runsLeft > 0 ? `About ${runsLeft} run${runsLeft === 1 ? "" : "s"} left, no wallet prompts` : "Not enough for another run"}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={withdraw}
            disabled={busy || balance === null}
            className="rounded-lg border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-300"
          >
            {busy ? "Withdrawing…" : "Withdraw"}
          </button>
          <button type="button" onClick={() => setShowKey((v) => !v)} className={`${small} text-gray-400 hover:text-white`}>
            {showKey ? "Hide key" : "Back up key"}
          </button>
        </div>
      </div>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-xs ${message.kind === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {message.text}
        </p>
      )}

      {showKey && (
        <div className="space-y-1.5 rounded-lg border border-white/10 bg-black/40 p-2.5">
          <p className="text-xs text-amber-200/90">
            Anyone with this key can spend the balance. Save it somewhere private, and never share it.
          </p>
          <code className="block break-all font-mono text-[11px] text-gray-300">{sessionKeyAsWif(session)}</code>
          <button type="button" onClick={copyKey} className={`${small} text-emerald-300`}>
            {copied ? "Copied!" : "Copy key"}
          </button>
        </div>
      )}

      <p className="text-[11px] leading-snug text-gray-500">
        Saved in this browser. Leftover money returns to your wallet when you log out.
      </p>
    </div>
  );
}
