"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Activity, Coins, Cpu, Receipt, Wallet, type LucideIcon } from "lucide-react";

import { cn } from "@/_core/utils/utils";
import { UsageSummary } from "../_core/usage.interface";

const TONES = {
  sky: "125 211 252",
  violet: "196 181 253",
  amber: "252 211 77",
  rose: "253 164 175",
  emerald: "110 231 183",
  cyan: "103 232 249",
  fuchsia: "240 171 252",
} as const;
type Tone = keyof typeof TONES;

type Stat = {
  label: string;
  value: number | string;
  sub?: { value: number | string; suffix: string };
  prefix?: string;
  icon: LucideIcon;
  tone: Tone;
  featured?: boolean;
};

const COUNT_MS = 1800;
const STAGGER_MS = 130;

function CountUp({
  value,
  prefix = "",
  suffix = "",
  delay = 0,
}: {
  value: number | string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}) {
  const target = Number(value) || 0;
  const decimals = Math.min(8, String(value).split(".")[1]?.length ?? 0);
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }

    let raf = 0;
    let timer = 0;
    let started = false;

    const run = () => {
      started = true;
      timer = window.setTimeout(() => {
        let t0 = 0;
        const step = (t: number) => {
          if (!t0) t0 = t;
          const p = Math.min(1, (t - t0) / COUNT_MS);
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          setN(target * eased);
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, delay);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, delay]);

  const text = n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

export default function StatCards({ summary }: { summary: UsageSummary }) {
  const stats: Stat[] = [
    { label: "Total uses", value: summary.totalUses, icon: Activity, tone: "sky" },
    { label: "Paid invoices", value: summary.paidInvoices, icon: Receipt, tone: "violet" },
    { label: "AI tokens used", value: summary.totalTokens, icon: Cpu, tone: "amber" },
    { label: "Sats spent", value: summary.totalSpentSats, icon: Coins, tone: "rose" },
    {
      label: "Total spent",
      value: summary.totalSpentUsd,
      prefix: "$",
      sub: { value: summary.totalSpentBch, suffix: " BCH" },
      icon: Wallet,
      tone: "emerald",
      featured: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {stats.map(({ label, value, prefix, sub, icon: Icon, tone, featured }, i) => {
        const delay = 200 + i * STAGGER_MS;
        return (
          <div
            key={label}
            style={{ "--tone": TONES[tone], "--d": `${delay}ms` } as CSSProperties}
            className={cn(
              "sc-card sc-in group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1.5 sm:p-5",
              featured ? "sc-featured col-span-2 bg-emerald-500/5 lg:col-span-1" : "bg-white/3",
            )}
          >
            <span aria-hidden className="sc-glow pointer-events-none absolute -right-12 -top-12 size-36 rounded-full" />
            <span aria-hidden className="sc-dots pointer-events-none absolute inset-0" />
            <Icon aria-hidden className="sc-mark pointer-events-none absolute -bottom-5 -right-4 size-24" strokeWidth={1.25} />

            {/* featured extras */}
            {featured && (
              <>
                <span aria-hidden className="sc-wash pointer-events-none absolute inset-0" />
                <span aria-hidden className="sc-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3" />
              </>
            )}

            <span aria-hidden className="sc-accent relative mb-3 block h-0.5 w-6 rounded-full" />

            <div className="relative flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
              <span className="sc-icon flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <Icon className="size-4" />
              </span>
            </div>

            <p className="sc-value relative mt-3 text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
              <CountUp value={value} prefix={prefix} delay={delay} />
            </p>

            {sub && (
              <p className="sc-sub relative mt-1 font-mono text-xs text-gray-400">
                <CountUp value={sub.value} suffix={sub.suffix} delay={delay} />
              </p>
            )}

            {/* fills while the numbers count up */}
            {/* <span aria-hidden className="sc-bar absolute inset-x-0 bottom-0 h-0.5" /> */}
          </div>
        );
      })}







      <style>{`
        .sc-in { opacity: 0; animation: sc-in .7s cubic-bezier(.2,.8,.2,1) forwards; animation-delay: calc(var(--d) - 150ms); }

        .sc-card:hover { box-shadow: 0 22px 50px -22px rgb(var(--tone) / .6), 0 0 0 0 transparent; }

        .sc-glow { background: radial-gradient(circle, rgb(var(--tone) / .22), transparent 70%); opacity: .55; transition: opacity .4s ease, transform .6s ease; }
        .sc-card:hover .sc-glow { opacity: 1; transform: scale(1.3); }

        .sc-icon { color: rgb(var(--tone)); background: rgb(var(--tone) / .14); }
        .sc-card:hover .sc-icon { background: rgb(var(--tone) / .24); box-shadow: 0 0 24px rgb(var(--tone) / .35); }

        .sc-accent { background: rgb(var(--tone)); box-shadow: 0 0 12px rgb(var(--tone) / .7); transition: width .4s cubic-bezier(.2,.8,.2,1); }
        .sc-card:hover .sc-accent { width: 3rem; }

        .sc-mark { color: rgb(var(--tone)); opacity: .07; transition: opacity .4s ease, transform .6s cubic-bezier(.2,.8,.2,1); }
        .sc-card:hover .sc-mark { opacity: .16; transform: rotate(-10deg) scale(1.12) translate3d(-4px,-4px,0); }

        .sc-dots {
          background-image: radial-gradient(rgb(var(--tone) / .22) 1px, transparent 1.2px);
          background-size: 14px 14px;
          -webkit-mask-image: radial-gradient(ellipse at top right, #000 0%, transparent 62%);
          mask-image: radial-gradient(ellipse at top right, #000 0%, transparent 62%);
          opacity: .55; transition: opacity .4s ease;
          animation: sc-dots 8s linear infinite;
        }
        .sc-card:hover .sc-dots { opacity: 1; }

        .sc-wash { background: linear-gradient(160deg, rgb(var(--tone) / .13), transparent 55%); }

        .sc-value {
          background: linear-gradient(180deg, #fff 30%, rgb(var(--tone)));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .sc-featured .sc-value { filter: drop-shadow(0 0 14px rgb(var(--tone) / .35)); }
        .sc-sub { transition: color .3s ease; }
        .sc-card:hover .sc-sub { color: rgb(var(--tone)); }

        .sc-bar {
          background: linear-gradient(90deg, rgb(var(--tone) / 0), rgb(var(--tone)), rgb(var(--tone) / 0));
          transform-origin: left; opacity: .7;
          animation: sc-fill 1.8s cubic-bezier(.16,1,.3,1) var(--d) both;
        }

        .sc-sheen {
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.08), transparent);
          transform: skewX(-20deg) translateX(-150%);
          animation: sc-sheen 5s ease-in-out infinite 2.5s;
        }

        @keyframes sc-in { from { opacity: 0; transform: translate3d(0,20px,0) scale(.97); filter: blur(5px); } to { opacity: 1; transform: none; filter: blur(0); } }
        @keyframes sc-dots { to { background-position: 14px 14px; } }
        @keyframes sc-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes sc-sheen { 0% { transform: skewX(-20deg) translateX(-150%); } 35%,100% { transform: skewX(-20deg) translateX(480%); } }

        @media (prefers-reduced-motion: reduce) {
          .sc-dots, .sc-bar, .sc-sheen { animation: none !important; }
          .sc-in { animation: none !important; opacity: 1; }
        }
      `}</style>
    </div>
  );
}