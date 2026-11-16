'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/_core/utils/utils';

import './css/Navbar.css';

const LINKS = [
  { href: '/', label: 'Home' },
  // { href: '/docs', label: 'Docs' },
  { href: '/blaze', label: 'BLAZE 2026' },
];

const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

function MenuIcon({ open }: { open: boolean }) {
  const bar = 'absolute left-0 h-0.5 w-5 rounded bg-current transition-all duration-300';
  return (
    <span className="relative block h-3.5 w-5">
      <span className={cn(bar, open ? 'top-1.5 rotate-45' : 'top-0')} />
      <span className={cn(bar, 'top-1.5', open && 'opacity-0 -translate-x-2')} />
      <span className={cn(bar, open ? 'top-1.5 -rotate-45' : 'top-3')} />
    </span>
  );
}

function NavLink({
  href,
  label,
  active,
  variant = 'desktop',
  index = 0,
  onEnter,
  className,
}: {
  href: string;
  label: string;
  active: boolean;
  variant?: 'desktop' | 'mobile';
  index?: number;
  onEnter?: (el: HTMLElement) => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      data-active={active}
      aria-current={active ? 'page' : undefined}
      style={{ '--i': index } as React.CSSProperties}
      onPointerEnter={(e) => onEnter?.(e.currentTarget)}
      onFocus={(e) => onEnter?.(e.currentTarget)}
      className={cn(
        'nv-link relative rounded-lg px-3.5 py-2 text-sm font-medium',
        variant === 'mobile' && 'nv-item',
        active
          ? variant === 'mobile'
            ? 'bg-emerald-500/10 text-emerald-300'
            : 'text-emerald-300'
          : variant === 'mobile'
            ? 'text-gray-400 hover:bg-white/5 hover:text-white'
            : 'text-gray-400 hover:text-white',
        className,
      )}
    >
      {label}
    </Link>
  );
}

// Hide on scroll down, show on scroll up
function useScrollState() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastY;

      setScrolled(y > 16);

      if (y < 80) {
        setHidden(false);
        lastY = y;
      } else if (Math.abs(delta) > 8) {
        setHidden(delta > 0);
        lastY = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { hidden, scrolled, show: () => setHidden(false) };
}

export const Navbar = ({ authButtons }: { authButtons: React.ReactNode }) => {
  const pathname = usePathname();
  const { hidden, scrolled, show } = useScrollState();
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* ---------- sliding hover pill (imperative: no re-renders) ---------- */
  const movePill = useCallback((el: HTMLElement | null) => {
    const wrap = linksRef.current;
    if (!wrap) return;
    if (!el) {
      wrap.style.setProperty('--o', '0');
      return;
    }
    wrap.style.setProperty('--x', `${el.offsetLeft}px`);
    wrap.style.setProperty('--w', `${el.offsetWidth}px`);
    wrap.style.setProperty('--o', '1');
  }, []);

  const resetPill = useCallback(() => {
    const active = linksRef.current?.querySelector<HTMLElement>('[data-active="true"]') ?? null;
    movePill(active);
  }, [movePill]);

  useEffect(() => {
    resetPill();
    window.addEventListener('resize', resetPill);
    return () => window.removeEventListener('resize', resetPill);
  }, [pathname, resetPill]);

  /* ---------- reading progress bar (transform only, rAF throttled) ---------- */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const bar = barRef.current;
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${p})`;
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
  }, [pathname]);

  /* ---------- mobile menu: close on outside click / Escape ---------- */
  useEffect(() => {
    if (!mobileOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMobileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      onFocusCapture={show}
      className={cn(
        'sticky top-0 z-50 px-3 pt-3 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6',
        hidden && !mobileOpen ? 'translate-y-[-130%] opacity-0' : 'translate-y-0 opacity-100',
      )}
    >
      <nav
        data-scrolled={scrolled}
        data-open={mobileOpen}
        className={cn(
          'nv-nav nv-enter relative mx-auto max-w-7xl overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500',
          scrolled
            ? 'border-emerald-500/20 bg-emerald-950 shadow-[0_8px_40px_-12px_rgba(16,185,129,0.35)]'
            : 'border-white/5 bg-white/10',
        )}
      >
        {/* edge light (visible once scrolled) */}
        <span aria-hidden className="nv-topline pointer-events-none absolute inset-x-8 top-0 h-px" />

        <div className="flex h-14 items-center justify-between px-4 sm:px-5">
          {/* ---------- brand ---------- */}
          <Link href="/" className="group flex items-center gap-3">
            <span className="nv-chip relative flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/8 text-xl font-black text-emerald-300 transition-colors group-hover:border-emerald-300/60">
              <span className="nv-coin">₿</span>
            </span>

            <span className="block">
              <span className="block text-sm font-black tracking-[0.22em] text-white">
                BCH <span className="nv-shimmer">BLAZE AI</span>
              </span>
              <span className="mt-1 block text-[9px] font-medium tracking-[0.25em] text-emerald-100/35">
                BLOCKCHAIN ECOSYSTEM
              </span>
            </span>
          </Link>

          {/* ---------- desktop links ---------- */}
          <div
            ref={linksRef}
            onPointerLeave={resetPill}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resetPill();
            }}
            className="nv-links relative hidden items-center gap-1 md:flex"
          >
            <span aria-hidden className="nv-pill pointer-events-none absolute inset-y-0 left-0 rounded-lg" />
            {LINKS.map((l) => (
              <NavLink key={l.href} {...l} active={isActive(l.href, pathname)} onEnter={movePill} />
            ))}
          </div>

          <div className="hidden md:block">{authButtons}</div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/5 hover:text-white md:hidden"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>

        {/* ---------- mobile menu ---------- */}
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-out md:hidden',
            mobileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-1 border-t border-white/5 px-3 pb-4 pt-3">
              {LINKS.map((l, i) => (
                <NavLink
                  key={l.href}
                  {...l}
                  active={isActive(l.href, pathname)}
                  variant="mobile"
                  index={i}
                  className="block"
                />
              ))}
              <div className="nv-item pt-3" style={{ '--i': LINKS.length } as React.CSSProperties}>
                {authButtons}
              </div>
            </div>
          </div>
        </div>

        {/* reading progress */}
        <span
          ref={barRef}
          aria-hidden
          className="nv-progress pointer-events-none absolute inset-x-0 bottom-0 h-0.5"
          style={{ transform: 'scaleX(0)' }}
        />
      </nav>
    </header>
  );
};