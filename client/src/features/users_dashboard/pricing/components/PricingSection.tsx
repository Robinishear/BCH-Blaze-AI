import { Coins, Zap } from "lucide-react";

import { FeaturePricing, PricingData } from "../_core/pricing.interface";

const formatFeatureName = (name: string) => {
  const text = name.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const formatNumber = (value: number | string) => Number(value).toLocaleString("en-US");

export default function PricingSection({ data }: { data: PricingData }) {
  const rate = Number(data.bchUsdRate).toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <section className="pr-section relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-7">
      {/* animated top line */}
      <span aria-hidden className="pr-topline absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-emerald-300/60 to-transparent" />

      {/* Header */}
      <div className="pr-in relative flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="flex items-center gap-2.5 text-xl font-semibold text-white sm:text-2xl">
            <span className="pr-bolt flex size-8 items-center justify-center rounded-lg border border-emerald-500/30  text-emerald-300">
              <Zap className="size-4" />
            </span>
            Service{" "}
            <span className="pr-shimmer">pricing</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">Pay per request. Rates follow the live BCH price.</p>
        </div>

        <div className="pr-rate relative flex items-center gap-2.5 overflow-hidden rounded-full border border-emerald-500/30 px-4 py-2 font-mono text-xs text-emerald-200">
          <span aria-hidden className="pr-rate-sheen absolute inset-y-0 -left-1/2 w-1/2" />
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <span className="relative">
            1 BCH = <span className="font-bold text-emerald-300">${rate}</span>
          </span>
        </div>
      </div>

      {data.features.length === 0 ? (
        <div className="pr-in mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
          <span className="pr-float flex size-11 items-center justify-center rounded-xl border border-white/10 text-gray-500">
            <Coins className="size-5" />
          </span>
          <p className="text-sm text-gray-400">No services are available right now.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {data.features.map((item: FeaturePricing, i: number) => (
            <li
              key={item.feature}
              style={{ animationDelay: `${150 + i * 90}ms` }}
              className="pr-card pr-in group relative overflow-hidden rounded-xl border border-white/10  p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_18px_50px_-20px_rgba(16,185,129,0.45)]"
            >
              {/* hover layers */}
              <span aria-hidden className="pr-glow pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22),transparent_70%)]" />
              <span aria-hidden className="pr-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">
                    <span className="text-emerald-400/70">{String(i + 1).padStart(2, "0")}</span>
                    <span className="h-px w-4 bg-white/15 transition-all duration-300 group-hover:w-8 group-hover:bg-emerald-400/50" />
                    Feature
                  </p>
                  <h3 className="mt-1.5 text-lg font-semibold text-white">{formatFeatureName(item.feature)}</h3>
                </div>
                <span className="pr-icon flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 transition-all duration-300 group-hover:border-emerald-400/60 group-hover:bg-emerald-400/20">
                  <Coins className="size-4" />
                </span>
              </div>

              <div className="relative mt-6 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                <div>
                  <p className="bg-linear-to-b from-white to-emerald-200 bg-clip-text text-3xl font-semibold tabular-nums tracking-tight text-transparent">
                    {formatUsd(item.priceUsdCents)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">per request</p>
                </div>
                <p className="pr-sats rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-sm text-emerald-300 transition-all duration-300 group-hover:border-emerald-400/40 group-hover:bg-emerald-400/10">
                  {formatNumber(item.amountSats)} <span className="text-gray-400">sats</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        @property --pr-a { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

        /* entrance */
        .pr-in { opacity: 0; animation: pr-in .7s cubic-bezier(.2,.8,.2,1) forwards; }

        /* header */
        .pr-topline { animation: pr-line 4s ease-in-out infinite; }
        .pr-bolt { animation: pr-pulse 3s ease-in-out infinite; }
        .pr-shimmer {
          background: linear-gradient(100deg, #6ee7b7 15%, #a7f3d0 35%, #67e8f9 50%, #a7f3d0 65%, #6ee7b7 85%);
          background-size: 250% 100%;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: pr-shimmer 5s linear infinite;
        }
        .pr-rate { animation: pr-rate 3.2s ease-in-out infinite; }
        .pr-rate-sheen {
          background: linear-gradient(100deg, transparent, rgba(110,231,183,.28), transparent);
          transform: skewX(-20deg) translateX(-150%);
          animation: pr-sheen 4s ease-in-out infinite 1s;
        }

        /* cards: rotating gradient ring on hover (border only, background untouched) */
        .pr-card::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
          background: conic-gradient(from var(--pr-a), transparent 0 55%, #34d399 78%, #22d3ee 92%, transparent);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0; transition: opacity .4s ease; pointer-events: none;
          animation: pr-angle 4s linear infinite;
        }
        .pr-card:hover::before { opacity: 1; }

        .pr-glow { opacity: .5; transition: opacity .4s ease, transform .6s ease; }
        .pr-card:hover .pr-glow { opacity: 1; transform: scale(1.25); }

        .pr-sheen {
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.07), transparent);
          transform: skewX(-20deg) translateX(-100%);
        }
        .pr-card:hover .pr-sheen { animation: pr-sweep 1s ease-out; }

        .pr-card:hover .pr-icon { transform: rotate(-8deg) scale(1.1); }
        .pr-card:hover .pr-sats { transform: translateY(-2px); }
        .pr-float { animation: pr-float 4s ease-in-out infinite; }

        @keyframes pr-in { from { opacity: 0; transform: translate3d(0,18px,0); filter: blur(5px); } to { opacity: 1; transform: none; filter: blur(0); } }
        @keyframes pr-line { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
        @keyframes pr-pulse { 0%,100% { box-shadow: 0 0 0 rgba(16,185,129,0); } 50% { box-shadow: 0 0 22px rgba(16,185,129,.35); } }
        @keyframes pr-shimmer { to { background-position: -250% 0; } }
        @keyframes pr-rate { 0%,100% { box-shadow: 0 0 0 rgba(16,185,129,0); } 50% { box-shadow: 0 0 24px rgba(16,185,129,.22); } }
        @keyframes pr-sheen { 0% { transform: skewX(-20deg) translateX(-150%); } 40%,100% { transform: skewX(-20deg) translateX(420%); } }
        @keyframes pr-angle { to { --pr-a: 360deg; } }
        @keyframes pr-sweep { from { transform: skewX(-20deg) translateX(-100%); } to { transform: skewX(-20deg) translateX(480%); } }
        @keyframes pr-float { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-6px,0); } }

        @media (prefers-reduced-motion: reduce) {
          .pr-topline, .pr-bolt, .pr-shimmer, .pr-rate, .pr-rate-sheen, .pr-float,
          .pr-card::before, .pr-card:hover .pr-sheen { animation: none !important; }
          .pr-in { animation: none !important; opacity: 1; }
        }
      `}</style>
    </section>
  );
}