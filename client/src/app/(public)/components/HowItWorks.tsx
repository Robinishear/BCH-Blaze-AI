'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck, Sparkles, UserRound, Wallet } from 'lucide-react';

import { cn } from '@/_core/utils/utils';

import './css/HowItWorks.css';

const STEP_MS = 4600;

function PreviewShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-black/30 p-4 text-left">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-gray-600">Sample</span>
      </div>
      {children}
    </div>
  );
}

const iconBox =
  'flex size-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300';

function AccountPreview() {
  return (
    <PreviewShell label="Account">
      <div className="flex items-center gap-3">
        <span className={cn(iconBox, 'hw-avatar rounded-full')}>
          <UserRound className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">Your account</p>
          <p className="truncate text-xs text-gray-500">you@example.com</p>
        </div>
      </div>

      <div className="hw-signed relative mt-4 flex items-center justify-between overflow-hidden rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
        <span aria-hidden className="hw-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3" />
        <span className="relative text-xs font-medium text-emerald-200">Signed in</span>
        <Check className="hw-check relative size-4 text-emerald-300" />
      </div>
    </PreviewShell>
  );
}

function WalletPreview() {
  return (
    <PreviewShell label="Wallet">
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/3 p-3">
        <span className={cn(iconBox, 'hw-wallet')}>
          <Wallet className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">Electron Cash</p>
          <p className="truncate font-mono text-[11px] text-gray-500">bitcoincash:qz8f…k3m2</p>
        </div>
        <span className="hw-pill inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
          <span className="hw-dot size-1.5 rounded-full bg-emerald-400" />
          Connected
        </span>
      </div>

      <p className="hw-shield mt-3 flex items-center gap-1.5 text-xs text-gray-500">
        <ShieldCheck className="size-3.5" />
        Non-custodial · keys stay in your wallet
      </p>
    </PreviewShell>
  );
}

function PayPreview() {
  return (
    <PreviewShell label="Request">
      <div className="rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-gray-300">
        <span className="hw-type block">What is driving BCH volume this week?</span>
      </div>

      <div className="hw-amount mt-2.5 flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
        <span className="font-mono text-xs text-emerald-100">0.00042 BCH</span>
        <span className="hw-approve rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-black">Approve</span>
      </div>

      <div className="mt-3 space-y-1.5">
        <p className="hw-insight mb-2 flex items-center gap-1.5 text-xs text-emerald-300">
          <Sparkles className="hw-spark size-3.5" />
          Insight ready
        </p>
        <span className="hw-line block h-1.5 w-full rounded bg-white/10" style={{ '--l': 0 } as CSSProperties} />
        <span className="hw-line block h-1.5 w-5/6 rounded bg-white/10" style={{ '--l': 1 } as CSSProperties} />
        <span className="hw-line block h-1.5 w-2/3 rounded bg-white/10" style={{ '--l': 2 } as CSSProperties} />
      </div>
    </PreviewShell>
  );
}

/* ---------- Steps ---------- */

const STEPS = [
  {
    title: 'Sign in',
    text: 'Create your account with a social login in one click. No passwords to remember.',
    preview: <AccountPreview />,
  },
  {
    title: 'Connect your wallet',
    text: 'Link your Bitcoin Cash wallet from your dashboard. Your keys always stay with you.',
    preview: <WalletPreview />,
  },
  {
    title: 'Pay & get your insight',
    text: 'Ask a question, approve a tiny BCH payment, and get your AI insight right away.',
    preview: <PayPreview />,
  },
];

type SegState = 'empty' | 'fill' | 'done';

function StepBadge({
  n,
  index,
  active,
  hold,
  reduce,
  first,
  last,
  onSelect,
}: {
  n: number;
  index: number;
  active: number;
  hold: boolean;
  reduce: boolean;
  first: boolean;
  last: boolean;
  onSelect: () => void;
}) {
  /** State of the line segment that connects step `seg` to step `seg + 1`. */
  const segState = (seg: number): SegState => {
    if (reduce) return 'done';
    if (seg < active) return 'done';
    if (seg === active) return hold ? 'empty' : 'fill';
    return 'empty';
  };

  const half = STEP_MS / 2;
  const isActive = index === active;

  return (
    <div className="relative hidden h-10 items-center justify-center md:flex">
      {/* static rails */}
      {!first && <span aria-hidden className="absolute left-0 right-1/2 top-1/2 h-px bg-emerald-500/30" />}
      {!last && <span aria-hidden className="absolute left-1/2 right-0 top-1/2 h-px bg-emerald-500/30" />}

      {/* progress fills: right half of this badge, left half of the next */}
      {!first && (
        <span
          key={`l-${index}-${active}-${hold}`}
          aria-hidden
          className="hw-seg absolute left-0 right-1/2 top-1/2 h-px"
          data-state={segState(index - 1)}
          style={{ '--dur': `${half}ms`, '--delay': `${half}ms` } as CSSProperties}
        />
      )}
      {!last && (
        <span
          key={`r-${index}-${active}-${hold}`}
          aria-hidden
          className="hw-seg absolute left-1/2 right-0 top-1/2 h-px"
          data-state={segState(index)}
          style={{ '--dur': `${half}ms`, '--delay': '0ms' } as CSSProperties}
        />
      )}

      <button
        type="button"
        onClick={onSelect}
        aria-label={`Show step ${n}`}
        aria-current={isActive ? 'step' : undefined}
        data-active={isActive}
        className="hw-badge relative flex size-10 items-center justify-center rounded-full border border-emerald-500/40 bg-[#04100c] font-mono text-sm font-semibold text-emerald-300 shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
      >
        <span aria-hidden className="hw-ring absolute inset-0 rounded-full border border-emerald-400/60" />
        {n}
      </button>
    </div>
  );
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false); 
  const [inView, setInView] = useState(false); 
  const [tabOn, setTabOn] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [hold, setHold] = useState(false); 
  const [active, setActive] = useState(0);

  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const onVis = () => setTabOn(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* auto demo: 1 → 2 → 3 → 1 … only while visible, awake, not held, and motion is allowed */
  useEffect(() => {
    if (!inView || !tabOn || hold || reduce) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(id);
  }, [inView, tabOn, hold, reduce, active]);

  const select = (i: number) => {
    setActive(i);
    setHold(true);
  };

  return (
    <section id="how-it-works" className="hw-sec mx-auto max-w-7xl scroll-mt-28 px-3 pb-24 sm:px-6" data-visible={visible}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="hw-in inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-400/80" style={{ '--d': '0ms' } as CSSProperties}>
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          How it works
        </p>
        <h2 className="hw-in mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl" style={{ '--d': '90ms' } as CSSProperties}>
          Three steps to your <span className="hw-shimmer">first insight</span>
        </h2>
        <p className="hw-in mt-4 text-gray-400" style={{ '--d': '180ms' } as CSSProperties}>
          No subscription. No credit card. You only pay for what you use.
        </p>
      </div>

      <div
        ref={ref}
        onPointerEnter={() => setHold(true)}
        onPointerLeave={() => setHold(false)}
        onFocus={() => setHold(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHold(false);
        }}
        className="mt-14 grid gap-y-6 md:grid-cols-3"
      >
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col">
            <StepBadge
              n={i + 1}
              index={i}
              active={active}
              hold={hold}
              reduce={reduce}
              first={i === 0}
              last={i === STEPS.length - 1}
              onSelect={() => select(i)}
            />

            <div className="flex-1 md:px-3 md:pt-6">
              <div
                data-active={i === active}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onPointerMove={(e) => {
                  const el = e.currentTarget;
                  const r = el.getBoundingClientRect();
                  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
                  el.style.setProperty('--my', `${e.clientY - r.top}px`);
                }}
                style={{ transitionDelay: `${i * 140}ms` }}
                className={cn(
                  'hw-card group relative h-full overflow-hidden rounded-2xl border border-white/10 p-3 transition-all duration-700 ease-out',
                  'hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_16px_50px_-20px_rgba(16,185,129,0.5)]',
                  'motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
                  visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                )}
              >
                <span aria-hidden className="hw-spot pointer-events-none absolute inset-0 rounded-2xl" />
                <span aria-hidden className="hw-topline pointer-events-none absolute inset-x-6 top-0 h-px" />

                <div className="relative">{step.preview}</div>

                <div className="relative px-2 pb-2 pt-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400/80 md:hidden">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white md:mt-0">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{step.text}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hw-in mt-12 text-center" style={{ '--d': '420ms' } as CSSProperties}>
        <Link
          href="/register"
          className="hw-cta group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-emerald-400"
        >
          <span aria-hidden className="hw-cta-sheen absolute inset-y-0 -left-1/2 w-1/2" />
          <span className="relative">Start your first request</span>
          <ArrowRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}