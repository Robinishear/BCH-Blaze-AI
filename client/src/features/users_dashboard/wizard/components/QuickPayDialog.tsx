"use client";

import { useState } from "react";
import {QuickStep, totalBudgetSats } from "../_core/session.wallet";
import { MAX_RUNS } from "../_core/wizard.constants";

interface Props {
  amountSats: bigint;
  priceUsdCents: number;
  walletName?: string;
  step: QuickStep | "idle";
  error: string;
  onConfirm: (runs: number) => void;
  onCancel: () => void;
}

const PRESETS = [1, 2, 5, 10];

const PROGRESS: Record<QuickStep, string> = {
  looking: "Looking up your coins…",
  confirm: "Approve it in your wallet…",
  waiting: "Waiting for the network to show your balance…",
  paying: "Paying this invoice…",
  sent: "Done ✓",
};

const clampRuns = (value: number) => Math.min(MAX_RUNS, Math.max(1, Math.floor(value) || 1));
const formatSats = (sats: bigint) => Number(sats).toLocaleString("en-US");

export default function QuickPayDialog({
  amountSats,
  priceUsdCents,
  walletName,
  step,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const [page, setPage] = useState<1 | 2>(1);
  const [runs, setRuns] = useState(10);

  const busy = step !== "idle";
  const single = runs === 1;
  const totalSats = totalBudgetSats(amountSats, runs);
  const usdPerSat = priceUsdCents / 100 / Math.max(Number(amountSats), 1);
  const totalUsd = Number(totalSats) * usdPerSat;
  const wallet = walletName ?? "your wallet";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickpay-title"
        className="w-full max-w-md space-y-5 rounded-xl border border-white/10 bg-[#0c0710] p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="quickpay-title" className="text-lg font-bold text-white">
              {page === 1 ? "Approve once, run many times" : "Review and approve"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">Step {page} of 2</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-gray-400 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
          >
            ✕
          </button>
        </div>

        {page === 1 && (
          <>
            <p className="text-sm leading-relaxed text-gray-400">
              Pick how many AI runs to set aside. {wallet} asks you once. After that, these runs are paid
              from your browser with no more wallet prompts.
            </p>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-white">Number of runs</legend>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRuns(n)}
                    aria-pressed={runs === n}
                    className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-emerald-300 ${
                      runs === n
                        ? "border-emerald-400 bg-emerald-500 text-black"
                        : "border-white/15 text-gray-300 hover:border-emerald-500/40"
                    }`}
                  >
                    {n === 1 ? "Just this one" : n}
                  </button>
                ))}
                <label className="ml-1 flex items-center gap-2 text-sm text-gray-400">
                  or
                  <input
                    type="number"
                    min={1}
                    max={MAX_RUNS}
                    value={runs}
                    onChange={(e) => setRuns(clampRuns(Number(e.target.value)))}
                    className="w-16 rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-center text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
                    aria-label="Custom number of runs"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">Up to {MAX_RUNS} runs.</p>
            </fieldset>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <p className="text-xs text-gray-400">{single ? "You pay now" : "Set aside now"}</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-white">
                about ${totalUsd.toFixed(2)}{" "}
                <span className="text-sm font-normal text-gray-400">({formatSats(totalSats)} sats)</span>
              </p>
              {!single && (
                <p className="mt-1 text-xs text-gray-500">
Each run costs its price plus a tiny network fee. Unused money can be withdrawn.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onCancel} className="px-3 py-2 text-sm text-gray-400 hover:text-white">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setPage(2)}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              >
                Next
              </button>
            </div>
          </>
        )}

        {page === 2 && (
          <>
            {single ? (
              <ul className="space-y-2.5 text-sm leading-relaxed text-gray-300">
                <li>{wallet} will ask you to approve this one payment.</li>
                <li>Next time you will be asked again.</li>
              </ul>
            ) : (
              <ul className="space-y-2.5 text-sm leading-relaxed text-gray-300">
                <li>
                  {wallet} will ask you <strong className="font-medium text-white">once</strong> to send about $
                  {totalUsd.toFixed(2)} to a small quick-pay balance saved in this browser.
                </li>
                <li>
                  This run and the next {runs - 1} are paid from it automatically. No more wallet prompts.
                </li>
                <li>
                  Leftover money goes back to your wallet when you press Withdraw or log out.
                </li>
                <li className="text-amber-200/90">
                  Keep it small: the balance lives in this browser. Clearing browser data can lose it, so use Back up
                  key if you set aside more than you would like to risk.
                </li>
              </ul>
            )}

            {busy && (
              <p role="status" className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-gray-200">
                {PROGRESS[step]}
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
                {error}
              </p>
            )}

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={busy}
                className="px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-40"
              >
                Back
              </button>
              <div className="flex gap-3">
                {step === "confirm" && (
                  <button type="button" onClick={onCancel} className="px-3 py-2 text-sm text-gray-400 hover:text-white">
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onConfirm(runs)}
                  disabled={busy}
                  className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50"
                >
                  {single ? `Pay with ${walletName ?? "wallet"}` : `Approve in ${walletName ?? "wallet"}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
