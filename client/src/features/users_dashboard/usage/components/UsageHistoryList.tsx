import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Coins, Cpu, ExternalLink, History, Receipt, Zap } from "lucide-react";

import { cn } from "@/_core/utils/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UsageHistoryItem } from "../_core/usage.interface";
import CountUp from "./CountUp";

const EXPLORER_TX_URL = "https://blockchair.com/bitcoin-cash/transaction/";

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
const TONE_KEYS = Object.keys(TONES) as Tone[];

const toneFor = (feature: string): Tone => {
  let h = 0;
  for (let i = 0; i < feature.length; i++) h = (h * 31 + feature.charCodeAt(i)) >>> 0;
  return TONE_KEYS[h % TONE_KEYS.length];
};
const toneStyle = (tone: Tone, extra?: CSSProperties) => ({ "--tone": TONES[tone], ...extra }) as CSSProperties;

const formatFeature = (feature: string) => {
  const text = feature.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const formatUsd = (cents: number) => `$${(Number(cents) / 100).toFixed(2)}`;
const formatNumber = (value: number | string) => Number(value).toLocaleString("en-US");
const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const formatDay = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso),
  );

const txUrl = (txid: string) => (txid.startsWith("http") ? txid : `${EXPLORER_TX_URL}${txid}`);
const txHash = (txid: string) => txid.split("/").filter(Boolean).pop() ?? txid;
const shortTx = (txid: string) => {
  const hash = txHash(txid);
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
};

const groupByDay = (items: UsageHistoryItem[]) => {
  const groups: { day: string; items: UsageHistoryItem[] }[] = [];
  for (const item of items) {
    const day = formatDay(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
};

const renderInline = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );

function ResultText({ text }: { text: string }) {
  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-gray-300">
      {text
        .split("\n")
        .filter(Boolean)
        .map((line, i) => {
          if (/^\*\*[^*]+\*\*$/.test(line)) {
            return (
              <p key={i} className="pt-3 text-sm font-semibold text-emerald-300 first:pt-0">
                {line.slice(2, -2).replace(/:$/, "")}
              </p>
            );
          }
          if (line.startsWith("* ")) {
            return (
              <p key={i} className="flex gap-2.5 pl-1">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-emerald-400" />
                <span>{renderInline(line.slice(2))}</span>
              </p>
            );
          }
          if (/^\*[^*\s].*[^*]\*$/.test(line)) {
            return (
              <p key={i} className="pt-1 text-xs italic text-gray-500">
                {line.slice(1, -1)}
              </p>
            );
          }
          return <p key={i}>{renderInline(line)}</p>;
        })}
    </div>
  );
}

const cardBase = "gap-0 rounded-xl border border-white/10 bg-transparent py-0 shadow-none ring-0";

/*  Summary stats (borderless, count-up)                               */

function Stat({
  icon: Icon,
  label,
  value,
  prefix,
  tone,
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  prefix?: string;
  tone: Tone;
  index: number;
}) {
  const delay = 200 + index * 130;
  return (
    <div
      style={toneStyle(tone, { "--d": `${delay}ms` } as CSSProperties)}
      className="ul-stat ul-in group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5"
    >
      <span aria-hidden className="ul-glow pointer-events-none absolute -right-12 -top-12 size-36 rounded-full" />
      <span aria-hidden className="ul-dots pointer-events-none absolute inset-0" />
      <Icon aria-hidden className="ul-mark pointer-events-none absolute -bottom-5 -right-4 size-24" strokeWidth={1.25} />

      <span aria-hidden className="ul-accent relative mb-3 block h-0.5 w-6 rounded-full" />

      <div className="relative flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
        <span className="ul-chip flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
          <Icon className="size-4" />
        </span>
      </div>

      <p className="ul-grad relative mt-3 truncate font-mono text-2xl font-semibold tracking-tight">
        <CountUp value={value} prefix={prefix} delay={delay} />
      </p>

      {/* <span aria-hidden className="ul-bar absolute inset-x-0 bottom-0 h-0.5" /> */}
    </div>
  );
}

function Summary({ items }: { items: UsageHistoryItem[] }) {
  const totalCents = items.reduce((sum, i) => sum + Number(i.priceUsdCents), 0);
  const totalSats = items.reduce((sum, i) => sum + Number(i.amountSats), 0);
  const totalTokens = items.reduce((sum, i) => sum + Number(i.tokens), 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat index={0} tone="sky" icon={Receipt} label="Requests" value={items.length} />
      <Stat index={1} tone="emerald" icon={Coins} label="Total paid" value={(totalCents / 100).toFixed(2)} prefix="$" />
      <Stat index={2} tone="amber" icon={Zap} label="Total sats" value={totalSats} />
      <Stat index={3} tone="violet" icon={Cpu} label="Total tokens" value={totalTokens} />
    </div>
  );
}

/*  One history item                                                   */
function UsageItem({ item, index }: { item: UsageHistoryItem; index: number }) {
  const tone = toneFor(item.feature);

  return (
    <li
      className="ul-item ul-in relative pl-8"
      style={toneStyle(tone, { "--d": `${Math.min(index, 8) * 80 + 150}ms` } as CSSProperties)}
    >
      {/* timeline dot */}
      <span className="ul-dot absolute left-0 top-7 flex size-4 -translate-x-1/2 items-center justify-center rounded-full">
        <span className="ul-dot-core size-1.5 rounded-full" />
      </span>

      <Card
        className={cn(
          cardBase,
          "ul-card relative overflow-hidden border-white/8 transition-all duration-300 hover:-translate-y-0.5",
        )}
      >
        <span aria-hidden className="ul-glow pointer-events-none absolute -right-14 -top-14 size-40 rounded-full" />
        <span aria-hidden className="ul-dots pointer-events-none absolute inset-0" />

        <CardContent className="relative flex items-start justify-between gap-6 p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="outline" className="ul-badge rounded-full px-2.5">
                {formatFeature(item.feature)}
              </Badge>
              <time dateTime={item.createdAt} className="font-mono text-xs text-gray-500">
                {formatTime(item.createdAt)}
              </time>
            </div>
            <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-snug text-white sm:text-lg" title={item.prompt}>
              {item.prompt}
            </h3>
          </div>

          <div className="shrink-0 text-right">
            <p className="ul-grad font-mono text-2xl font-semibold tabular-nums tracking-tight">
              {formatUsd(item.priceUsdCents)}
            </p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-gray-500">{formatNumber(item.amountSats)} sats</p>
          </div>
        </CardContent>

        <Separator className="relative bg-white/8" />

        <details className="ul-details group relative">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/3 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">View result</span>
            <span className="hidden group-open:inline">Hide result</span>
            <ChevronDown className="size-4 text-gray-500 transition-transform duration-300 group-open:rotate-180 group-open:text-emerald-300" />
          </summary>
          <Separator className="bg-white/8" />
          <div className="ul-result px-5 py-5">
            <ResultText text={item.result} />
          </div>
        </details>

        <Separator className="relative bg-white/8" />

        <CardFooter className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-0 bg-transparent px-5 py-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="size-3.5" />
            <span className="font-mono tabular-nums text-gray-300">{formatNumber(item.tokens)}</span> tokens
          </span>

          <a
            href={txUrl(item.txid)}
            target="_blank"
            rel="noopener noreferrer"
            className="ul-tx group/tx inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-gray-400 transition-colors hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
          >
            Tx {shortTx(item.txid)}
            <ExternalLink className="size-3.5 transition-transform duration-300 group-hover/tx:-translate-y-0.5 group-hover/tx:translate-x-0.5" />
          </a>
        </CardFooter>
      </Card>
    </li>
  );
}

/*  Page                                                               */

export default function UsageHistoryList({ items }: { items: UsageHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <>
        <Card className={cn(cardBase, "ul-in border-dashed border-white/15")}>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <span className="ul-float flex size-12 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
              <History className="size-5" />
            </span>
            <p className="mt-4 text-base font-semibold text-white">No requests yet</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Use any AI feature and it will appear here with its price and transaction.
            </p>
          </CardContent>
        </Card>
        <Styles />
      </>
    );
  }

  const groups = groupByDay(items);
  let counter = 0;

  return (
    <div className="space-y-8">
      <Summary items={items} />

      {groups.map((group) => (
        <section key={group.day} aria-label={group.day}>
          <h2 className="mb-5 flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-gray-400">
            <span className="ul-day inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-emerald-200/90">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              {group.day}
            </span>
            <span className="ul-dayline h-px flex-1 bg-linear-to-r from-white/15 to-transparent" />
          </h2>

          <ul className="ul-line relative space-y-4">
            {group.items.map((item) => (
              <UsageItem key={item.id} item={item} index={counter++} />
            ))}
          </ul>
        </section>
      ))}

      <Styles />
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .ul-in { opacity: 0; animation: ul-in .7s cubic-bezier(.2,.8,.2,1) forwards; animation-delay: calc(var(--d, 0ms) - 150ms); }

      /* summary stats (no border) */
      .ul-stat { box-shadow: 0 12px 30px -20px rgba(0,0,0,.7); }
      .ul-stat:hover { box-shadow: 0 22px 50px -22px rgb(var(--tone) / .6); }
      .ul-glow { background: radial-gradient(circle, rgb(var(--tone) / .22), transparent 70%); opacity: .5; transition: opacity .4s ease, transform .6s ease; }
      .ul-stat:hover .ul-glow, .ul-card:hover .ul-glow { opacity: 1; transform: scale(1.3); }
      .ul-dots {
        background-image: radial-gradient(rgb(var(--tone) / .22) 1px, transparent 1.2px);
        background-size: 14px 14px;
        -webkit-mask-image: radial-gradient(ellipse at top right, #000 0%, transparent 62%);
        mask-image: radial-gradient(ellipse at top right, #000 0%, transparent 62%);
        opacity: .5; transition: opacity .4s ease; animation: ul-dots 8s linear infinite;
      }
      .ul-stat:hover .ul-dots, .ul-card:hover .ul-dots { opacity: 1; }
      .ul-mark { color: rgb(var(--tone)); opacity: .07; transition: opacity .4s ease, transform .6s cubic-bezier(.2,.8,.2,1); }
      .ul-stat:hover .ul-mark { opacity: .16; transform: rotate(-10deg) scale(1.12) translate3d(-4px,-4px,0); }
      .ul-accent { background: rgb(var(--tone)); box-shadow: 0 0 12px rgb(var(--tone) / .7); transition: width .4s cubic-bezier(.2,.8,.2,1); }
      .ul-stat:hover .ul-accent { width: 3rem; }
      .ul-chip { color: rgb(var(--tone)); background: rgb(var(--tone) / .14); }
      .ul-stat:hover .ul-chip { background: rgb(var(--tone) / .24); box-shadow: 0 0 24px rgb(var(--tone) / .35); }
      .ul-grad {
        background: linear-gradient(180deg, #fff 30%, rgb(var(--tone)));
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .ul-bar {
        background: linear-gradient(90deg, rgb(var(--tone) / 0), rgb(var(--tone)), rgb(var(--tone) / 0));
        transform-origin: left; opacity: .7;
        animation: ul-fill 1.8s cubic-bezier(.16,1,.3,1) var(--d) both;
      }

      /* timeline */
      .ul-line::before {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 1px;
        background: linear-gradient(to bottom, rgba(255,255,255,.14), rgba(255,255,255,.04));
      }
      .ul-line::after {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 1px;
        background: linear-gradient(to bottom, transparent 0 42%, rgba(52,211,153,.95) 50%, transparent 58% 100%);
        background-size: 100% 300%;
        animation: ul-travel 6s linear infinite;
      }
      .ul-dot { border: 1px solid rgb(var(--tone) / .65); background: transparent; box-shadow: 0 0 0 4px rgb(var(--tone) / .08); }
      .ul-dot-core { background: rgb(var(--tone)); box-shadow: 0 0 8px rgb(var(--tone)); animation: ul-pulse 2.6s ease-in-out infinite; }

      /* day header */
      .ul-day { background: rgba(16,185,129,.08); }
      .ul-dayline { transform-origin: left; animation: ul-fill 1.2s cubic-bezier(.2,.8,.2,1) .2s both; }

      /* item card */
      .ul-card { box-shadow: 0 10px 30px -22px rgba(0,0,0,.8); }
      .ul-card:hover { border-color: rgb(var(--tone) / .4); box-shadow: 0 20px 48px -24px rgb(var(--tone) / .5); }
      .ul-badge { color: rgb(var(--tone)); background: rgb(var(--tone) / .1); border-color: rgb(var(--tone) / .3); }
      .ul-tx:hover { background: rgb(var(--tone) / .08); }
      .ul-details[open] .ul-result { animation: ul-open .45s cubic-bezier(.2,.8,.2,1); }
      .ul-float { animation: ul-float 4s ease-in-out infinite; }

      @keyframes ul-in { from { opacity: 0; transform: translate3d(0,20px,0) scale(.98); filter: blur(5px); } to { opacity: 1; transform: none; filter: blur(0); } }
      @keyframes ul-dots { to { background-position: 14px 14px; } }
      @keyframes ul-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes ul-travel { from { background-position: 0 100%; } to { background-position: 0 0%; } }
      @keyframes ul-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: .6; } }
      @keyframes ul-open { from { opacity: 0; transform: translate3d(0,-8px,0); } to { opacity: 1; transform: none; } }
      @keyframes ul-float { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-6px,0); } }

      @media (prefers-reduced-motion: reduce) {
        .ul-dots, .ul-bar, .ul-dayline, .ul-line::after, .ul-dot-core, .ul-float, .ul-details[open] .ul-result { animation: none !important; }
        .ul-in { animation: none !important; opacity: 1; }
      }
    `}</style>
  );
}