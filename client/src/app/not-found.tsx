"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Blocks,
  CircleDot,
  Home,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";

/*  Helpers                                                            */

const HEX = "0123456789abcdef";
const randHash = (len = 16) =>
  Array.from({ length: len }, () => HEX[(Math.random() * 16) | 0]).join("");

/*  Canvas: interactive blockchain network (GPU-friendly, paused when  */
/*  tab hidden, DPR capped, respects reduced motion)                   */

function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    const mouse = { x: -9999, y: -9999 };

    type Node = { x: number; y: number; vx: number; vy: number; r: number; c: number };
    type Packet = { a: number; b: number; t: number; speed: number };
    let nodes: Node[] = [];
    const packets: Packet[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(80, Math.floor((w * h) / 21000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8,
        c: Math.random() < 0.25 ? 1 : 0, // 1 = cyan, 0 = emerald
      }));
    };

    const LINK = 135;

    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -10) n.x = w + 10;
          if (n.x > w + 10) n.x = -10;
          if (n.y < -10) n.y = h + 10;
          if (n.y > h + 10) n.y = -10;

          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 22000) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / 148) * 0.9;
            n.x += (dx / d) * f;
            n.y += (dy / d) * f;
          }
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const a = (1 - Math.sqrt(d2) / LINK) * 0.22;
            ctx.strokeStyle = `rgba(52,211,153,${a})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
            if (!reduce && packets.length < 14 && Math.random() < 0.0009) {
              packets.push({ a: i, b: j, t: 0, speed: 0.012 + Math.random() * 0.012 });
            }
          }
        }

        ctx.fillStyle = n.c ? "rgba(34,211,238,0.75)" : "rgba(110,231,183,0.7)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // data packets travelling along links
      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k];
        p.t += p.speed;
        const A = nodes[p.a];
        const B = nodes[p.b];
        if (p.t >= 1 || !A || !B) {
          packets.splice(k, 1);
          continue;
        }
        const x = A.x + (B.x - A.x) * p.t;
        const y = A.y + (B.y - A.y) * p.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, "rgba(167,243,208,0.95)");
        g.addColorStop(1, "rgba(16,185,129,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    const onVis = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

/*  Page                                                               */

export default function NotFound() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);
  const rafRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [height, setHeight] = useState(912_408);
  const [hashes, setHashes] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    setHashes(Array.from({ length: 14 }, () => randHash(20)));
  }, []);

  // live block height + mining progress (cheap state, 1 update / 120ms max)
  useEffect(() => {
    const t1 = setInterval(() => setHeight((h) => h + 1), 2600);
    const t2 = setInterval(
      () => setProgress((p) => (p >= 100 ? 0 : p + Math.random() * 6 + 1)),
      220
    );
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  // pointer parallax via CSS variables (rAF throttled, transform-only)
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const nx = clientX / window.innerWidth - 0.5;
      const ny = clientY / window.innerHeight - 0.5;
      el.style.setProperty("--mx", nx.toFixed(3));
      el.style.setProperty("--my", ny.toFixed(3));
      el.style.setProperty("--sx", `${clientX}px`);
      el.style.setProperty("--sy", `${clientY}px`);
    });
  }, []);

  const shownPath = (pathname || "/unknown").slice(0, 42);
  const pct = Math.min(100, Math.floor(progress));

  const logs = [
    { t: "$ bch-cli getblock", v: shownPath, c: "text-emerald-300" },
    { t: "> querying 8,412 peers…", v: "ok", c: "text-emerald-400" },
    { t: "> verifying merkle root…", v: "ok", c: "text-emerald-400" },
    { t: "> block lookup", v: "NOT FOUND", c: "text-amber-300" },
    { t: "> suggestion: return to genesis", v: "/", c: "text-cyan-300" },
  ];

  return (
    <main
      ref={rootRef}
      onPointerMove={onPointerMove}
      className="bch-404 relative min-h-screen overflow-hidden bg-[#020807] text-white selection:bg-emerald-500/30"
      style={
        {
          "--mx": 0,
          "--my": 0,
          "--sx": "50%",
          "--sy": "50%",
        } as React.CSSProperties
      }
    >
      {/* ============ BACKGROUND ============ */}
      <div className="pointer-events-none absolute inset-0">
        {/* moving grid */}
        <div className="grid-layer absolute -inset-13.75 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-size-[55px_55px]" />

        {/* aurora blobs */}
        <div className="blob blob-a absolute left-1/2 top-1/2 h-162.5 w-162.5 rounded-full bg-emerald-500/9 blur-[130px]" />
        <div className="blob blob-b absolute -left-40 top-0 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="blob blob-c absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

        {/* interactive network */}
        {mounted && <NetworkCanvas />}

        {/* cursor spotlight */}
        <div className="spotlight absolute inset-0" />

        {/* vignette + scanlines */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,8,7,0.85)_100%)]" />
        <div className="scanlines absolute inset-0 opacity-[0.08]" />
        <div className="scan-beam absolute inset-x-0 h-40" />
      </div>

      {/* ============ NAVBAR ============ */}
      <header className="reveal relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <Link href="/" className="group flex items-center gap-3">
          <div className="logo-chip relative flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/8 text-xl font-black text-emerald-300 transition group-hover:border-emerald-300/60">
            <span className="logo-spin">₿</span>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-[0.22em] text-white">
              BCH <span className="text-emerald-400">BLAZE</span>
            </h1>
            <p className="mt-1 text-[9px] font-medium tracking-[0.25em] text-emerald-100/35">
              BLOCKCHAIN ECOSYSTEM
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 sm:flex">
            <span className="text-[9px] font-bold tracking-[0.16em] text-cyan-300/80">
              HEIGHT
            </span>
            <span className="tabular-nums text-[10px] font-black tracking-widest text-cyan-200">
              #{height.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-bold tracking-[0.16em] text-emerald-300 sm:text-[10px]">
              NETWORK ONLINE
            </span>
          </div>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-190px)] w-full max-w-7xl flex-col items-center justify-center px-5 pb-10 pt-4 sm:px-8">
        {/* top label */}
        <div className="reveal d1 mb-4 flex items-center gap-3">
          <span className="line-grow h-px w-8 bg-emerald-500/40" />
          <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-emerald-300/70 sm:text-[10px]">
            Blockchain Navigation Error
          </span>
          <span className="line-grow h-px w-8 bg-emerald-500/40" />
        </div>

        {/* ----- 404 VISUAL ----- */}
        <div
          className="parallax relative mb-4 flex items-center justify-center"
          style={{ ["--depth" as string]: 14 }}
        >
          {/* rotating rings */}
          <div className=" ring-1 absolute h-64 w-64 rounded-full border border-emerald-400/10 sm:h-96 sm:w-96" />
          <div className=" ring-2 absolute h-52 w-52 rounded-full border border-dashed border-emerald-400/20 sm:h-80 sm:w-80" />
          <div className=" ring-3 absolute h-40 w-40 rounded-full border border-cyan-400/10 sm:h-64 sm:w-64">
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
          </div>
          <div className="absolute h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

          {/* the glitchy number */}
          <h2 className="relative flex select-none items-center text-[clamp(100px,24vw,230px)] font-black leading-none tracking-[-0.07em]">
            <span className="digit digit-l glitch" data-text="4">4</span>

            {/* the "0" is a spinning BCH coin */}
            <span className="coin-wrap relative mx-[0.02em] inline-flex items-center justify-center">
              <span className="digit digit-o glitch text-emerald-400" data-text="0">0</span>
              <span className="coin absolute inset-0 flex items-center justify-center">
                <span className="coin-face flex h-[0.34em] w-[0.34em] items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/10 text-[0.2em] font-black text-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                  ₿
                </span>
              </span>
            </span>

            <span className="digit digit-r glitch" data-text="4">4</span>
          </h2>

          {/* floating icon badges */}
          <div className="float-a absolute -right-3 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-[#071b17]/90 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur sm:right-0 sm:top-8 sm:h-12 sm:w-12">
            <Blocks size={22} />
          </div>
          <div className="float-b absolute -left-5 bottom-5 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/25 bg-[#071b17]/90 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur sm:-left-8 sm:h-11 sm:w-11">
            <Zap size={18} />
          </div>
        </div>

        {/* ----- TITLE ----- */}
        <div className="text-center">
          <div className="reveal d2 mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/6 px-3 py-1.5">
            <CircleDot size={11} className="blink text-amber-400" />
            <span className="text-[9px] font-bold tracking-[0.2em] text-amber-300">
              ERROR CODE · BCH-404
            </span>
          </div>

          <h3 className="reveal d3 text-2xl font-black tracking-[0.08em] text-white sm:text-4xl">
            BLOCK <span className="shimmer-text text-emerald-400">NOT FOUND</span>
          </h3>

          <p className="reveal d4 mx-auto mt-4 max-w-lg text-sm leading-7 text-gray-400 sm:text-base">
            Looks like this block went off-chain. The page you&apos;re searching
            for doesn&apos;t exist, has been moved, or is no longer available on
            this network.
          </p>
        </div>

        {/* ----- BLOCKCHAIN STRIP with missing block ----- */}
        <div className="reveal d4 mt-9 flex w-full max-w-2xl items-center justify-center">
          {[
            { n: height - 2, ok: true },
            { n: height - 1, ok: true },
            { n: 404, ok: false },
            { n: height + 1, ok: true },
          ].map((b, i, arr) => (
            <div key={i} className="flex items-center">
              <div
                className={`chain-block relative flex h-14 w-16 flex-col items-center justify-center rounded-lg border text-center sm:h-16 sm:w-24 ${
                  b.ok
                    ? "border-emerald-400/20 bg-emerald-400/5"
                    : "missing border-dashed border-amber-400/50 bg-amber-400/5"
                }`}
                style={{ animationDelay: `${i * 0.35}s` }}
              >
                <span
                  className={`text-[7px] font-bold tracking-[0.2em] sm:text-[8px] ${
                    b.ok ? "text-emerald-200/40" : "text-amber-300/70"
                  }`}
                >
                  {b.ok ? "BLOCK" : "MISSING"}
                </span>
                <span
                  className={`tabular-nums text-[10px] font-black sm:text-xs ${
                    b.ok ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {b.ok ? `#${b.n.toLocaleString()}` : "???"}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="link-flow relative h-px w-4 sm:w-9">
                  <span className="absolute inset-0 bg-emerald-400/30" />
                  <span className="flow-dot absolute -top-0.5 h-1.25 w-1.25 rounded-full bg-emerald-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ----- STATUS CARDS ----- */}
        <div className="mt-8 grid w-full max-w-xl grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: Radio, label: "NETWORK", val: "ONLINE", c: "emerald" },
            { icon: Blocks, label: "BLOCK", val: "MISSING", c: "amber" },
            { icon: ShieldCheck, label: "SECURITY", val: "SECURE", c: "cyan" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="status-card reveal rounded-xl border border-white/[0.07] bg-white/2.5 p-3 text-center sm:p-4"
              style={{ animationDelay: `${0.7 + i * 0.12}s` }}
            >
              <s.icon
                className={`mx-auto mb-2 ${
                  s.c === "emerald"
                    ? "text-emerald-400"
                    : s.c === "amber"
                    ? "text-amber-400"
                    : "text-cyan-400"
                }`}
                size={17}
              />
              <p className="text-[8px] font-semibold tracking-[0.16em] text-gray-500 sm:text-[9px]">
                {s.label}
              </p>
              <p
                className={`mt-1 text-[10px] font-bold sm:text-xs ${
                  s.c === "emerald"
                    ? "text-emerald-300"
                    : s.c === "amber"
                    ? "text-amber-300"
                    : "text-cyan-300"
                }`}
              >
                {s.val}
              </p>
            </div>
          ))}
        </div>

        {/* ----- TERMINAL ----- */}
        <div className="terminal reveal d5 mt-6 w-full max-w-xl overflow-hidden rounded-xl border border-emerald-400/15 bg-black/40 backdrop-blur">
          <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
            <span className="ml-2 text-[9px] tracking-[0.2em] text-white/30">
              blaze-node — bash
            </span>
          </div>
          <div className="space-y-1 px-4 py-3 font-mono text-[10px] leading-5 sm:text-xs">
            {logs.map((l, i) => (
              <div
                key={i}
                className="log-line flex justify-between gap-3"
                style={{ animationDelay: `${1 + i * 0.55}s` }}
              >
                <span className="truncate text-gray-400">{l.t}</span>
                <span className={`shrink-0 font-bold ${l.c}`}>{l.v}</span>
              </div>
            ))}
            <div className="log-line flex items-center gap-2 pt-1" style={{ animationDelay: "3.8s" }}>
              <span className="text-emerald-400">$</span>
              <span className="caret inline-block h-3.5 w-1.5 bg-emerald-300" />
            </div>

            {/* mining progress */}
            <div className="pt-2">
              <div className="mb-1 flex justify-between text-[9px] tracking-[0.18em] text-white/30">
                <span>RE-SYNCING CHAIN</span>
                <span className="tabular-nums text-emerald-300/80">{pct}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="progress-bar h-full rounded-full bg-linear-to-r from-emerald-500 via-emerald-300 to-cyan-300"
                  style={{ transform: `scaleX(${pct / 100})` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ----- ACTIONS ----- */}
        <div className="reveal d6 mt-8 flex w-full max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="btn-primary group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-emerald-400 px-7 py-4 text-xs font-black tracking-[0.15em] text-[#022c22] transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-300 sm:w-auto"
          >
            <span className="btn-sheen absolute inset-y-0 -left-1/2 w-1/2" />
            <Home size={16} className="relative" />
            <span className="relative">RETURN TO HOMEPAGE</span>
            <ArrowUpRight
              size={15}
              className="relative transition group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </Link>

          <button
            onClick={() => window.history.back()}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-7 py-4 text-xs font-bold tracking-[0.15em] text-gray-300 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-emerald-400/[0.07] hover:text-emerald-300 sm:w-auto"
          >
            <ArrowLeft size={15} className="transition group-hover:-translate-x-1" />
            GO BACK
          </button>
        </div>

        {/* footer */}
        <div className="reveal d6 mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">
            <span className="h-px w-6 bg-emerald-500/30" />
            SECURE · DECENTRALIZED · RELIABLE
            <span className="h-px w-6 bg-emerald-500/30" />
          </div>
          <p className="text-[9px] tracking-wider text-white/20">
            © 2026 BCH BLAZE. ALL RIGHTS RESERVED.
          </p>
        </div>
      </section>

      {/* ============ HASH TICKER ============ */}
      <div className="absolute inset-x-0 bottom-0 z-10 overflow-hidden border-t border-emerald-400/10 bg-black/30 py-2 backdrop-blur-sm">
        <div className="ticker flex w-max gap-10 whitespace-nowrap font-mono text-[9px] tracking-[0.18em] text-emerald-300/35">
          {[...hashes, ...hashes].map((h, i) => (
            <span key={i}>
              <span className="text-cyan-300/40">0x</span>
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* ============ STYLES ============ */}
      <style jsx>{`
        .bch-404 {
          isolation: isolate;
        }

        /* ---------- background ---------- */
        .grid-layer {
          animation: gridMove 12s linear infinite;
          will-change: transform;
          mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
        }
        .blob {
          will-change: transform;
          transform: translate(-50%, -50%);
        }
        .blob-a {
          animation: blobA 14s ease-in-out infinite;
        }
        .blob-b {
          animation: blobB 18s ease-in-out infinite;
        }
        .blob-c {
          animation: blobB 22s ease-in-out infinite reverse;
        }
        .spotlight {
          background: radial-gradient(
            420px circle at var(--sx) var(--sy),
            rgba(16, 185, 129, 0.11),
            transparent 65%
          );
        }
        .scanlines {
          background: repeating-linear-gradient(
            0deg,
            #fff 0,
            #fff 1px,
            transparent 1px,
            transparent 3px
          );
        }
        .scan-beam {
          top: -10rem;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(52, 211, 153, 0.06),
            transparent
          );
          animation: beam 7s linear infinite;
          will-change: transform;
        }

        /* ---------- logo ---------- */
        .logo-chip {
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.12);
          animation: chipPulse 3s ease-in-out infinite;
        }
        .logo-spin {
          display: inline-block;
          animation: coinY 5s ease-in-out infinite;
        }

        /* ---------- parallax ---------- */
        .parallax {
          transform: translate3d(
            calc(var(--mx) * var(--depth) * 1px),
            calc(var(--my) * var(--depth) * 1px),
            0
          );
          transition: transform 0.25s ease-out;
        }

        /* ---------- rings ---------- */
        .ring {
          will-change: transform;
        }
        .ring-1 {
          animation: spin 40s linear infinite;
        }
        .ring-2 {
          animation: spin 26s linear infinite reverse;
        }
        .ring-3 {
          animation: spin 12s linear infinite;
        }

        /* ---------- 404 digits ---------- */
        .digit {
          position: relative;
          display: inline-block;
          color: transparent;
          background: linear-gradient(180deg, #ecfdf5 5%, #6ee7b7 45%, #047857 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-stroke: 1.5px rgba(110, 231, 183, 0.65);
          filter: drop-shadow(0 0 35px rgba(16, 185, 129, 0.15));
          animation: digitIn 1s cubic-bezier(0.2, 0.9, 0.2, 1) both,
            digitBob 6s ease-in-out 1.2s infinite;
        }
        .digit-l {
          animation-delay: 0s, 1.2s;
        }
        .digit-o {
          animation-delay: 0.15s, 2s;
          -webkit-text-stroke: 0;
          background: none;
          color: #10b981;
          text-shadow: 0 0 55px rgba(16, 185, 129, 0.45);
          opacity: 0.35;
        }
        .digit-r {
          animation-delay: 0.3s, 2.8s;
        }

        /* glitch layers */
        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          opacity: 0;
          -webkit-text-stroke: 0;
          background: none;
          pointer-events: none;
        }
        .glitch::before {
          color: #22d3ee;
          animation: glitchA 5s steps(1) infinite;
        }
        .glitch::after {
          color: #fbbf24;
          animation: glitchB 5s steps(1) infinite 0.08s;
        }
        .digit-o.glitch::before,
        .digit-o.glitch::after {
          animation-delay: 1.4s;
        }
        .digit-r.glitch::before {
          animation-delay: 2.6s;
        }
        .digit-r.glitch::after {
          animation-delay: 2.7s;
        }

        /* coin inside the zero */
        .coin {
          perspective: 600px;
        }
        .coin-face {
          animation: coinY 4s ease-in-out infinite;
          will-change: transform;
        }

        /* floating badges */
        .float-a {
          animation: floatA 5s ease-in-out infinite;
        }
        .float-b {
          animation: floatA 6s ease-in-out infinite reverse;
        }

        /* ---------- reveal ---------- */
        .reveal {
          opacity: 0;
          animation: reveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .d1 {
          animation-delay: 0.15s;
        }
        .d2 {
          animation-delay: 0.35s;
        }
        .d3 {
          animation-delay: 0.5s;
        }
        .d4 {
          animation-delay: 0.65s;
        }
        .d5 {
          animation-delay: 0.9s;
        }
        .d6 {
          animation-delay: 1.1s;
        }
        .line-grow {
          transform-origin: center;
          animation: lineGrow 1.2s ease-out 0.4s both;
        }
        .blink {
          animation: blink 1.4s ease-in-out infinite;
        }

        /* ---------- shimmer title ---------- */
        .shimmer-text {
          background: linear-gradient(
            100deg,
            #10b981 20%,
            #a7f3d0 40%,
            #67e8f9 50%,
            #a7f3d0 60%,
            #10b981 80%
          );
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer 4s linear infinite;
        }

        /* ---------- chain strip ---------- */
        .chain-block {
          animation: blockBob 4s ease-in-out infinite;
          will-change: transform;
        }
        .chain-block.missing {
          animation: missingPulse 2s ease-in-out infinite;
        }
        .flow-dot {
          left: 0;
          animation: flow 1.6s linear infinite;
          box-shadow: 0 0 8px rgba(110, 231, 183, 0.9);
        }

        /* ---------- status cards ---------- */
        .status-card {
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
          backdrop-filter: blur(12px);
        }
        .status-card:hover {
          border-color: rgba(52, 211, 153, 0.3);
          background: rgba(16, 185, 129, 0.055);
          transform: translateY(-4px);
        }

        /* ---------- terminal ---------- */
        .terminal {
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.05);
        }
        .log-line {
          opacity: 0;
          transform: translateX(-8px);
          animation: logIn 0.5s ease-out forwards;
        }
        .caret {
          animation: caret 1s steps(1) infinite;
        }
        .progress-bar {
          transform-origin: left;
          transition: transform 0.22s linear;
          will-change: transform;
        }

        /* ---------- buttons ---------- */
        .btn-primary {
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.2);
          animation: btnGlow 3s ease-in-out infinite;
        }
        .btn-primary:hover {
          box-shadow: 0 0 45px rgba(16, 185, 129, 0.4);
        }
        .btn-sheen {
          background: linear-gradient(
            100deg,
            transparent,
            rgba(255, 255, 255, 0.55),
            transparent
          );
          transform: skewX(-20deg) translateX(-150%);
          animation: sheen 3.6s ease-in-out infinite 1.5s;
        }

        /* ---------- ticker ---------- */
        .ticker {
          animation: ticker 40s linear infinite;
          will-change: transform;
        }

        /* ---------- keyframes ---------- */
        @keyframes gridMove {
          to {
            transform: translate3d(55px, 55px, 0);
          }
        }
        @keyframes blobA {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-46%, -54%) scale(1.15);
          }
        }
        @keyframes blobB {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(60px, 40px, 0) scale(1.2);
          }
        }
        @keyframes beam {
          to {
            transform: translate3d(0, 130vh, 0);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes chipPulse {
          0%,
          100% {
            box-shadow: 0 0 25px rgba(16, 185, 129, 0.1);
          }
          50% {
            box-shadow: 0 0 38px rgba(16, 185, 129, 0.3);
          }
        }
        @keyframes coinY {
          0% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(180deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        @keyframes digitIn {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.9) rotateX(40deg);
            filter: blur(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0);
            filter: blur(0);
          }
        }
        @keyframes digitBob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes glitchA {
          0%,
          91%,
          100% {
            opacity: 0;
            transform: none;
            clip-path: inset(0 0 0 0);
          }
          92% {
            opacity: 0.9;
            transform: translate3d(-6px, 0, 0);
            clip-path: inset(15% 0 55% 0);
          }
          94% {
            opacity: 0.9;
            transform: translate3d(5px, 0, 0);
            clip-path: inset(60% 0 8% 0);
          }
          96% {
            opacity: 0.9;
            transform: translate3d(-3px, 0, 0);
            clip-path: inset(35% 0 35% 0);
          }
        }
        @keyframes glitchB {
          0%,
          91%,
          100% {
            opacity: 0;
            transform: none;
            clip-path: inset(0 0 0 0);
          }
          92% {
            opacity: 0.8;
            transform: translate3d(6px, 0, 0);
            clip-path: inset(50% 0 20% 0);
          }
          94% {
            opacity: 0.8;
            transform: translate3d(-5px, 0, 0);
            clip-path: inset(5% 0 70% 0);
          }
          96% {
            opacity: 0.8;
            transform: translate3d(3px, 0, 0);
            clip-path: inset(70% 0 5% 0);
          }
        }
        @keyframes floatA {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(0, -12px, 0) rotate(6deg);
          }
        }
        @keyframes reveal {
          from {
            opacity: 0;
            transform: translate3d(0, 22px, 0);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            filter: blur(0);
          }
        }
        @keyframes lineGrow {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }
        @keyframes shimmer {
          to {
            background-position: -250% 0;
          }
        }
        @keyframes blockBob {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -5px, 0);
          }
        }
        @keyframes missingPulse {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            box-shadow: 0 0 0 rgba(251, 191, 36, 0);
          }
          50% {
            transform: translate3d(0, -4px, 0) scale(1.07);
            box-shadow: 0 0 28px rgba(251, 191, 36, 0.28);
          }
        }
        @keyframes flow {
          from {
            transform: translateX(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          to {
            transform: translateX(36px);
            opacity: 0;
          }
        }
        @keyframes logIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes caret {
          0%,
          50% {
            opacity: 1;
          }
          50.01%,
          100% {
            opacity: 0;
          }
        }
        @keyframes btnGlow {
          0%,
          100% {
            box-shadow: 0 0 26px rgba(16, 185, 129, 0.18);
          }
          50% {
            box-shadow: 0 0 44px rgba(16, 185, 129, 0.38);
          }
        }
        @keyframes sheen {
          0% {
            transform: skewX(-20deg) translateX(-150%);
          }
          40%,
          100% {
            transform: skewX(-20deg) translateX(420%);
          }
        }
        @keyframes ticker {
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        /* ---------- reduced motion ---------- */
        @media (prefers-reduced-motion: reduce) {
          .grid-layer,
          .blob,
          .scan-beam,
          .ring,
          .digit,
          .glitch::before,
          .glitch::after,
          .coin-face,
          .logo-spin,
          .logo-chip,
          .float-a,
          .float-b,
          .chain-block,
          .flow-dot,
          .shimmer-text,
          .btn-primary,
          .btn-sheen,
          .ticker,
          .blink,
          .caret {
            animation: none !important;
          }
          .reveal,
          .log-line {
            animation: none !important;
            opacity: 1;
            transform: none;
            filter: none;
          }
          .digit-o {
            opacity: 1;
          }
          .parallax {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}