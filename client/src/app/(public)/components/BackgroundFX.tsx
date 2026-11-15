"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Interactive blockchain network canvas (from the 404 page)          */
/*  GPU-friendly, DPR capped, paused when tab hidden, reduced-motion   */
/* ------------------------------------------------------------------ */

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

  return (
    <canvas
      ref={ref}
      className="fx-canvas"
      aria-hidden
    />
  );
}

export function BackgroundFX() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  // cursor spotlight (CSS vars, rAF throttled)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const { clientX, clientY } = e;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.setProperty("--sx", `${clientX}px`);
        el.style.setProperty("--sy", `${clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div aria-hidden className="fx-root" ref={rootRef}>
      {/* Moving flat grid */}
      <div className="fx-flat-grid" />

      {/* Drifting aurora blobs */}
      <div className="fx-blob fx-blob-a" />
      <div className="fx-blob fx-blob-b" />
      <div className="fx-blob fx-blob-c" />

      {/* Interactive blockchain network */}
      <NetworkCanvas />

      {/* Cursor spotlight, scanlines, scan beam */}
      <div className="fx-spot" />
      <div className="fx-scanlines" />
      <div className="fx-scan-beam" />

      {/* Vignette */}
      <div className="fx-vignette" />

      <style>{`
        .fx-root {
          position: fixed; inset: 0; z-index: 0; overflow: hidden;
          pointer-events: none; background: #020807;
          --sx: 50%; --sy: 50%;
        }

        /* --- 404: moving flat grid --- */
        .fx-flat-grid {
          position: absolute; inset: -55px; will-change: transform;
          background-image:
            linear-gradient(rgba(16,185,129,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,.05) 1px, transparent 1px);
          background-size: 55px 55px;
          -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
          mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
          animation: fx-flat-move 12s linear infinite;
        }

        /* --- 404: aurora blobs --- */
        .fx-blob { position: absolute; border-radius: 9999px; will-change: transform; }
        .fx-blob-a {
          left: 50%; top: 50%; width: 650px; height: 650px;
          background: rgba(16,185,129,.08); filter: blur(130px);
          transform: translate(-50%, -50%);
          animation: fx-blob-a 14s ease-in-out infinite;
        }
        .fx-blob-b {
          left: -10rem; top: 0; width: 384px; height: 384px;
          background: rgba(20,184,166,.10); filter: blur(120px);
          animation: fx-blob-b 18s ease-in-out infinite;
        }
        .fx-blob-c {
          right: -5rem; bottom: -10rem; width: 384px; height: 384px;
          background: rgba(6,182,212,.10); filter: blur(120px);
          animation: fx-blob-b 22s ease-in-out infinite reverse;
        }

        /* --- 404: canvas network --- */
        .fx-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

        /* --- 404: spotlight / scanlines / scan beam --- */
        .fx-spot {
          position: absolute; inset: 0;
          background: radial-gradient(420px circle at var(--sx) var(--sy),
            rgba(16,185,129,.11), transparent 65%);
        }
        .fx-scanlines {
          position: absolute; inset: 0; opacity: .08;
          background: repeating-linear-gradient(0deg,
            #fff 0, #fff 1px, transparent 1px, transparent 3px);
        }
        .fx-scan-beam {
          position: absolute; left: 0; right: 0; top: -10rem; height: 10rem;
          will-change: transform;
          background: linear-gradient(180deg, transparent,
            rgba(52,211,153,.06), transparent);
          animation: fx-scan 7s linear infinite;
        }

        .fx-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(2,8,7,.85) 100%);
        }

        /* --- Keyframes --- */
        @keyframes fx-flat-move {
          to { transform: translate3d(55px, 55px, 0); }
        }
        @keyframes fx-blob-a {
          0%,100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-46%, -54%) scale(1.15); }
        }
        @keyframes fx-blob-b {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(60px,40px,0) scale(1.2); }
        }
        @keyframes fx-scan {
          to { transform: translate3d(0, 130vh, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .fx-flat-grid, .fx-blob, .fx-scan-beam { animation: none; }
        }
      `}</style>
    </div>
  );
}