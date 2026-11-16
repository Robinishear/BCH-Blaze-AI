'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';

import { cn } from '@/_core/utils/utils';
import { Badge } from '@/components/ui/badge';

import './css/Hero.css';

const SAMPLE = {
  prompt: 'What is driving BCH trading activity this week?',
  points: [
    { k: 'Momentum', v: 'Trading volume is running above its recent average.', dot: 'bg-emerald-400' },
    { k: 'Sentiment', v: 'Social mentions are trending up alongside price.', dot: 'bg-cyan-400' },
    { k: 'Watch', v: 'Price is testing the recent weekly high.', dot: 'bg-amber-400' },
  ],
  cost: '0.00003 BCH',
};

const COST = Number.parseFloat(SAMPLE.cost); // 0.00003
const TRUST = ['No subscription', 'No credit card', 'You approve every payment'];

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

const cta = 'inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm transition';

type Phase = 'idle' | 'typing' | 'thinking' | 'answer' | 'paid';

export function Hero() {
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [shown, setShown] = useState(0);
  const [cost, setCost] = useState(0);
  const [runId, setRunId] = useState(0);

  const [inView, setInView] = useState(false);
  const [tabOn, setTabOn] = useState(true);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const onVis = () => setTabOn(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) {
      // static, fully-resolved state
      setTyped(SAMPLE.prompt.length);
      setPhase('paid');
      setShown(SAMPLE.points.length);
      setCost(COST);
      return;
    }
    if (!inView || !tabOn) return;

    let cancelled = false;
    let raf = 0;
    const CANCEL = Symbol('cancel');

    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) =>
        setTimeout(() => (cancelled ? reject(CANCEL) : resolve()), ms),
      );

    const countCost = () =>
      new Promise<void>((resolve) => {
        const t0 = performance.now();
        const step = (t: number) => {
          if (cancelled) return resolve();
          const p = Math.min(1, (t - t0) / 900);
          setCost(COST * (1 - Math.pow(1 - p, 3))); // easeOutCubic
          if (p < 1) raf = requestAnimationFrame(step);
          else resolve();
        };
        raf = requestAnimationFrame(step);
      });

    (async () => {
      try {
        while (!cancelled) {
          setTyped(0);
          setShown(0);
          setCost(0);
          setPhase('typing');
          await wait(700);

          for (let i = 1; i <= SAMPLE.prompt.length; i++) {
            setTyped(i);
            await wait(26);
          }
          await wait(380);

          setPhase('thinking');
          await wait(1150);

          setPhase('answer');
          for (let k = 1; k <= SAMPLE.points.length; k++) {
            setShown(k);
            await wait(700);
          }
          await wait(350);

          setPhase('paid');
          await countCost();
          await wait(4200);
        }
      } catch {
        /* cancelled */
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [inView, tabOn, reduce, runId]);

  /* ---------- 3D tilt + glare (imperative: no re-renders) ---------- */
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || reduce) return;
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${(px * 9).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(-py * 9).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
    });
  };
  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const showCaret = phase === 'typing' || phase === 'idle';

  return (
    <section className="hr-sec mx-auto max-w-7xl px-3 pb-20 pt-16 sm:px-6 lg:pb-28 lg:pt-24">
      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/*  Left  */}
        <div className="text-center lg:text-left">
          <Badge
            variant="outline"
            className="hr-in gap-2.5 rounded-full border-white/15 bg-transparent py-1 pl-1 pr-4 text-xs font-medium text-gray-300"
            style={d(0)}
          >
            <span className="hr-chip rounded-full border border-emerald-500/40 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              BCH
            </span>
            Pay-per-use AI, powered by Bitcoin Cash
          </Badge>

          <h1
            className="hr-in mt-7 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-6xl lg:text-[4.1rem]"
            style={d(100)}
          >
            AI crypto insights,
            <br />
            <span className="hr-shimmer">paid per request in BCH.</span>
          </h1>

          <p
            className="hr-in mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg lg:mx-0"
            style={d(200)}
          >
            Ask the market a question and get an AI-generated insight in seconds. Pay only a{' '}
            <span className="text-gray-200">tiny BCH amount</span> for each request, straight from{' '}
            <span className="text-gray-200">your own wallet</span>.
          </p>

          <div className="hr-in mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start" style={d(300)}>
            <Link
              href="/register"
              className={cn(
                cta,
                'hr-cta group relative overflow-hidden bg-emerald-500 font-semibold text-black hover:-translate-y-0.5 hover:bg-emerald-400',
              )}
            >
              <span aria-hidden className="hr-sheen absolute inset-y-0 -left-1/2 w-1/2" />
              <span className="relative">Get Started</span>
              <ArrowRight className="relative size-4 transition group-hover:translate-x-1" strokeWidth={2.4} />
            </Link>

            <a
              href="#how-it-works"
              className={cn(
                cta,
                'hr-ghost border border-white/20 font-medium text-gray-200 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:text-white',
              )}
            >
              See how it works
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 lg:justify-start">
            {TRUST.map((item, i) => (
              <li key={item} className="hr-in flex items-center gap-2 text-[13px] text-gray-400" style={d(400 + i * 110)}>
                <span className="hr-tick flex size-4 items-center justify-center rounded-full border border-emerald-500/40 text-emerald-300">
                  <Check className="size-2.5" strokeWidth={3.5} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/*  Right: live demo card  */}
        <div ref={cardRef} className="hr-in mx-auto w-full max-w-md lg:max-w-none" style={d(250)}>
          <div className="hr-float relative">
            {/* floating coin */}
            <span aria-hidden className="hr-coin absolute -right-3 -top-5 z-10 flex size-11 items-center justify-center rounded-full border border-emerald-400/40 text-lg font-black text-emerald-300 sm:-right-5">
              <span className="hr-coin-face">₿</span>
            </span>

            <div ref={tiltRef} onPointerMove={onMove} onPointerLeave={onLeave} className="hr-tilt">
              <div className="hr-card relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-emerald-500/10">
                <span aria-hidden className="hr-glare pointer-events-none absolute inset-0" />
                <span aria-hidden className="hr-topline absolute inset-x-8 top-0 h-px" />

                {/* header */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="hr-win size-2.5 rounded-full border border-white/25" style={{ '--i': i } as CSSProperties} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/15 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-gray-400">
                      Sample output
                    </span>
                    <button
                      type="button"
                      aria-label="Replay demo"
                      onClick={() => setRunId((n) => n + 1)}
                      className="hr-replay flex size-6 items-center justify-center rounded-full border border-white/15 text-gray-400"
                    >
                      <RotateCcw className="size-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  {/* Prompt (typed) — full text reserved invisibly so the bubble never resizes */}
                  <div className="relative ml-auto w-fit max-w-[88%] rounded-2xl rounded-tr-md border border-emerald-500/30 px-4 py-2.5 text-sm leading-relaxed text-emerald-50">
                    <span aria-hidden className="invisible">{SAMPLE.prompt}</span>
                    <span className="absolute inset-x-4 top-2.5" aria-label={SAMPLE.prompt}>
                      {SAMPLE.prompt.slice(0, typed)}
                      {showCaret && <span className="hr-caret ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-emerald-300" />}
                    </span>
                  </div>

                  {/* Answer */}
                  <div className="rounded-2xl rounded-tl-md border border-white/10 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="hr-live size-1.5 rounded-full bg-emerald-400" />
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/90">
                          Market insight
                        </p>
                      </div>
                      <span className="hr-think flex items-center gap-1" data-on={phase === 'thinking'} aria-hidden>
                        <i /><i /><i />
                      </span>
                    </div>

                    <ul className="space-y-4">
                      {SAMPLE.points.map(({ k, v, dot }, i) => (
                        <li
                          key={k}
                          data-on={shown > i}
                          className="hr-point relative pl-6 before:absolute before:-bottom-6 before:left-[2.5px] before:top-4 before:w-px before:bg-white/10 last:before:hidden"
                        >
                          <span className={cn('hr-pdot absolute left-0 top-2 size-1.5 rounded-full', dot)} />
                          <p className="text-sm leading-relaxed text-gray-400">
                            <span className="font-medium text-white">{k}</span>
                            <span className="mx-1.5 text-white/20">/</span>
                            {v}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Payment */}
                  <div
                    data-on={phase === 'paid'}
                    className="hr-pay flex items-center justify-between rounded-2xl border border-emerald-500/30 px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="hr-paycheck relative flex size-7 items-center justify-center rounded-full bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                        <span aria-hidden className="hr-payring absolute inset-0 rounded-full border border-emerald-400" />
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <div className="leading-tight">
                        <p className="text-[13px] font-medium text-emerald-100">Payment confirmed</p>
                        <p className="mt-0.5 text-[11px] text-emerald-200/50">Paid from your wallet</p>
                      </div>
                    </div>
                    <span className="min-w-[6.6rem] rounded-lg border border-emerald-500/25 px-2.5 py-1 text-center font-mono text-xs tabular-nums text-emerald-100">
                      {cost.toFixed(5)} BCH
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}