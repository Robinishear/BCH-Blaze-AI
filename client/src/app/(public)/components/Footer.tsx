'use client';

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUp, ArrowUpRight, Check, Copy, ExternalLink, Heart, Presentation, Timer } from 'lucide-react';

import './css/Footer.css';

const LINKS = {
  github: 'https://github.com/Robinishear/BCH-Blaze-AI',
  presentation: 'https://docs.google.com/presentation/d/your-deck-id',
  hackathon: 'https://dorahacks.io/hackathon/bchblaze2026/detail#contact',
};
const DONATION_ADDRESS = 'bitcoincash:zpfug783apup8mzxmtgtxwhl6h9kjty5mc0trt2spu';

const DEADLINE = new Date('2026-11-22T20:00:00+06:00').getTime();

type FooterLink = { label: string; href: string; external?: boolean };

const PRODUCT: FooterLink[] = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Get started', href: '/register' },
  { label: 'Sign in', href: '/login' },
];

const PROJECT: FooterLink[] = [
  { label: 'GitHub repository', href: LINKS.github, external: true },
  { label: 'Presentation', href: LINKS.presentation, external: true },
  { label: 'BCH BLAZE on DoraHacks', href: LINKS.hackathon, external: true },
];

const WALLETS = [
  { name: 'Electron Cash', color: '#34d399' },
  { name: 'Selene Wallet', color: '#22d3ee' },
  { name: 'Bitcoin.com Wallet', color: '#a78bfa' },
];

const headCls = 'font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80';
const linkCls = 'ft-link group relative inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white';
const iconBtn =
  'ft-social flex size-9 items-center justify-center rounded-xl border border-white/10 text-gray-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 [&>svg]:size-4.5';

const short = (a: string) => `${a.slice(0, 22)}…${a.slice(-8)}`;
const i = (n: number) => ({ '--i': n }) as CSSProperties;
const RING = 2 * Math.PI * 18; 

function GithubIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'GitHub repository', href: LINKS.github, icon: GithubIcon },
  { label: 'Presentation', href: LINKS.presentation, icon: Presentation },
  { label: 'BCH BLAZE on DoraHacks', href: LINKS.hackathon, icon: ExternalLink },
];

function FooterAnchor({ label, href, external }: FooterLink) {
  const Arrow = external ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      {label}
      <Arrow className="size-3 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" strokeWidth={2.4} />
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={linkCls}>
      {content}
    </Link>
  );
}

function Column({ title, links, delay }: { title: string; links: FooterLink[]; delay: number }) {
  return (
    <div className="ft-rise" style={i(delay)}>
      <p className={headCls}>{title}</p>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <FooterAnchor {...link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Countdown() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, DEADLINE - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (left === null) return null;

  const s = Math.floor(left / 1000);
  const text =
    left === 0
      ? 'Submissions closed'
      : `Closes in ${Math.floor(s / 86400)}d ${String(Math.floor((s % 86400) / 3600)).padStart(2, '0')}h ${String(
          Math.floor((s % 3600) / 60),
        ).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;

  return (
    <span className="ft-count inline-flex items-center gap-2 rounded-full border border-amber-400/30 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-300">
      <Timer className="size-3" />
      <span className="tabular-nums">{text}</span>
    </span>
  );
}

const WATERMARK = 'BCH BLAZE'.split('');

export function Footer() {
  const [copied, setCopied] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const topRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  /* clipboard with a fallback for non-secure contexts */
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_ADDRESS);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = DONATION_ADDRESS;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) return;
      } catch {
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  /* reveal animation: armed on mount, fired once when the footer scrolls into view */
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    el.setAttribute('data-anim', 'pre');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute('data-anim', 'in');
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const btn = topRef.current;
      const ring = ringRef.current;
      if (!btn || !ring) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      ring.style.strokeDashoffset = String(RING * (1 - p));
      btn.setAttribute('data-show', String(window.scrollY > 400));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <footer ref={footerRef} className="ft relative mt-10 border-t border-white/10">
      <div aria-hidden className="ft-edge absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-400/60 to-transparent" />

      {/* back to top */}
      <button
        ref={topRef}
        type="button"
        onClick={toTop}
        aria-label="Back to top"
        data-show="false"
        className="ft-top fixed bottom-5 right-4 z-40 flex size-11 items-center justify-center rounded-full text-emerald-300 sm:right-6"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden>
          <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
          <circle
            ref={ringRef}
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={RING}
            strokeDashoffset={RING}
          />
        </svg>
        <ArrowUp className="relative size-4" strokeWidth={2.4} />
      </button>

      <div className="mx-auto max-w-7xl px-3 pt-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="ft-rise" style={i(0)}>
            <Link href="/" aria-label="BCH BLAZE home" className="group inline-flex items-center gap-2.5">
              <span className="ft-chip relative flex size-9 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-lg font-black leading-none text-emerald-300 transition-colors group-hover:border-emerald-300/60">
                <span className="ft-coin">₿</span>
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">BCH BLAZE AI</span>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-relaxed text-gray-400">
              AI crypto insights, paid per request in Bitcoin Cash. No subscription, no credit card.
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={iconBtn}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <Column title="Product" links={PRODUCT} delay={1} />

          {/* Wallets */}
          <div className="ft-rise" style={i(2)}>
            <p className={headCls}>Supported wallets</p>
            <ul className="mt-5 space-y-3">
              {WALLETS.map(({ name, color }, n) => (
                <li key={name} className="ft-wallet flex items-center gap-2.5 text-sm text-gray-400 transition-colors hover:text-white">
                  <span
                    className="ft-wdot size-1.5 rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}`, '--i': n } as CSSProperties}
                  />
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <Column title="Project" links={PROJECT} delay={3} />
        </div>

        {/* Community Choice */}
        <div className="ft-rise ft-donate relative mt-14 flex flex-col gap-4 rounded-2xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5" style={i(4)}>
          <div aria-hidden className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-emerald-300/40 to-transparent" />

          <div className="flex min-w-0 items-center gap-4">
            <span className="ft-heart hidden size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 text-emerald-300 sm:flex">
              <Heart className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Community Choice · EMBER2026</p>
              <p className="mt-1 truncate font-mono text-xs text-gray-500" title={DONATION_ADDRESS}>
                {short(DONATION_ADDRESS)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copyAddress}
            data-copied={copied}
            className="ft-copy inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-medium text-gray-200 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-white"
            aria-live="polite"
          >
            {copied ? <Check className="ft-pop size-4 text-emerald-300" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy address'}
          </button>
        </div>

        {/* Bottom bar */}
        <div className="ft-rise mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-gray-500 md:flex-row" style={i(5)}>
          <div className="space-y-1 text-center md:text-left">
            <p>© {new Date().getFullYear()} BCH BLAZE. Built on Bitcoin Cash.</p>
            <p className="text-gray-600">AI-generated insights are for information only and are not financial advice.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Countdown />
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              Built for BCH BLAZE 2026
            </span>
          </div>
        </div>

        {/* watermark: letters rise in one by one */}
        <div aria-hidden className="pointer-events-none select-none overflow-hidden pt-6">
          <p className="ft-mark flex justify-center text-[22vw] font-bold leading-[0.8] tracking-tighter sm:text-[11rem]">
            {WATERMARK.map((ch, n) => (
              <span key={n} className="ft-letter" style={i(n)}>
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}