"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Bot, ChevronLeft, ChevronRight, Monitor, Network, Pause, Play, RotateCcw, Server, Sparkles, Wallet } from "lucide-react";

type IconType = ComponentType<{ x?: number; y?: number; size?: number; className?: string }>;

type NodeDef = { id: string; label: string; sub: string; x: number; y: number; Icon: IconType };
type Packet = { from: string; to: string; label: string; money?: boolean };
type Frame = { title: string; text: string; packets: Packet[] };
type Scenario = {
  id: string;
  tab: string;
  intro: string;
  nodes: NodeDef[];
  edges: [string, string][];
  frames: Frame[];
};


const PERSON: Scenario = {
  id: "person",
  tab: "You, with a wallet",
  intro: "A person uses the website and pays from a phone wallet.",
  nodes: [
    { id: "browser", label: "Your browser", sub: "this website", x: 130, y: 190, Icon: Monitor },
    { id: "wallet", label: "Your wallet", sub: "WizardConnect", x: 130, y: 400, Icon: Wallet },
    { id: "server", label: "Our server", sub: "invoices, watcher", x: 500, y: 100, Icon: Server },
    { id: "chain", label: "BCH network", sub: "Bitcoin Cash", x: 500, y: 400, Icon: Network },
    { id: "gemini", label: "Gemini", sub: "AI model", x: 870, y: 100, Icon: Sparkles },
  ],
  edges: [
    ["browser", "server"],
    ["browser", "wallet"],
    ["browser", "chain"],
    ["wallet", "chain"],
    ["server", "chain"],
    ["server", "gemini"],
  ],
  frames: [
    {
      title: "Sign in",
      text: "You sign in with email, Google or GitHub. The server answers with secure cookies and the dashboard opens.",
      packets: [
        { from: "browser", to: "server", label: "email, Google or GitHub" },
        { from: "server", to: "browser", label: "secure session" },
      ],
    },
    {
      title: "Connect your wallet",
      text: "Your browser shows a QR code and your wallet scans it. The wallet shares public keys only, so private keys never leave it.",
      packets: [
        { from: "browser", to: "wallet", label: "QR code" },
        { from: "wallet", to: "browser", label: "public keys only" },
      ],
    },
    {
      title: "Create the invoice",
      text: "The server turns the price (for example $0.03) into sats at the live rate and creates a fresh address for this invoice. It is valid for 15 minutes.",
      packets: [
        { from: "browser", to: "server", label: "Pay & Run" },
        { from: "server", to: "browser", label: "amount + new address" },
      ],
    },
    {
      title: "Pay with one tap",
      text: "Your browser finds your coins and builds the payment. Your wallet asks you to approve it, and after you confirm, the signed transaction goes out to the network.",
      packets: [
        { from: "browser", to: "chain", label: "find my coins" },
        { from: "chain", to: "browser", label: "your coins" },
        { from: "browser", to: "wallet", label: "approve this payment?" },
        { from: "wallet", to: "chain", label: "signed transaction", money: true },
      ],
    },
    {
      title: "Payment detected",
      text: "The server keeps watching the invoice address. When the full amount arrives, the invoice becomes PAID and your page updates by itself.",
      packets: [
        { from: "server", to: "chain", label: "watch the address" },
        { from: "chain", to: "server", label: "payment seen", money: true },
        { from: "server", to: "browser", label: "PAID" },
      ],
    },
    {
      title: "Get the AI answer",
      text: "The server sends your prompt to Gemini, saves the answer in your history and returns it. One payment gives one answer.",
      packets: [
        { from: "browser", to: "server", label: "run this invoice" },
        { from: "server", to: "gemini", label: "your prompt" },
        { from: "gemini", to: "server", label: "answer" },
        { from: "server", to: "browser", label: "result" },
      ],
    },
  ],
};

const AGENT: Scenario = {
  id: "agent",
  tab: "An AI agent",
  intro: "Software pays over plain HTTP. No account, no website.",
  nodes: [
    { id: "agent", label: "AI agent", sub: "script or software", x: 130, y: 250, Icon: Bot },
    { id: "server", label: "Our server", sub: "invoices, watcher", x: 500, y: 100, Icon: Server },
    { id: "chain", label: "BCH network", sub: "Bitcoin Cash", x: 500, y: 400, Icon: Network },
    { id: "gemini", label: "Gemini", sub: "AI model", x: 870, y: 100, Icon: Sparkles },
  ],
  edges: [
    ["agent", "server"],
    ["agent", "chain"],
    ["server", "chain"],
    ["server", "gemini"],
  ],
  frames: [
    {
      title: "Ask",
      text: "The agent sends a question with no account. The server replies 402 Payment Required, with an amount and an address to pay.",
      packets: [
        { from: "agent", to: "server", label: "POST /insight" },
        { from: "server", to: "agent", label: "402 + invoice" },
      ],
    },
    {
      title: "Pay",
      text: "The agent sends the exact amount from its own Bitcoin Cash wallet.",
      packets: [{ from: "agent", to: "chain", label: "send BCH to payTo", money: true }],
    },
    {
      title: "Payment detected",
      text: "The server sees the payment on the network and marks the invoice PAID.",
      packets: [
        { from: "server", to: "chain", label: "watch the address" },
        { from: "chain", to: "server", label: "payment seen", money: true },
      ],
    },
    {
      title: "Ask again",
      text: "The agent repeats the call with the invoice id. The server asks Gemini and sends the answer back.",
      packets: [
        { from: "agent", to: "server", label: "X-Invoice-Id" },
        { from: "server", to: "gemini", label: "prompt" },
        { from: "gemini", to: "server", label: "answer" },
        { from: "server", to: "agent", label: "answer" },
      ],
    },
  ],
};

const SCENARIOS = [PERSON, AGENT];

/* Geometry and timing                                                 */

const VIEW_W = 1000;
const VIEW_H = 500;
const NODE_W = 190;
const NODE_H = 84;

const TRAVEL = 1.6; 
const STAGGER = 1.9; 
const HOLD = 1.4;
type Pt = { x: number; y: number };

/** Point on the border of a node, towards another node, plus a small gap. */
function borderPoint(from: NodeDef, to: NodeDef, gap = 8): Pt {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.min(
    dx === 0 ? Infinity : NODE_W / 2 / Math.abs(dx),
    dy === 0 ? Infinity : NODE_H / 2 / Math.abs(dy),
  );
  return { x: from.x + dx * t + (dx / len) * gap, y: from.y + dy * t + (dy / len) * gap };
}

const pillWidth = (label: string) => Math.round(label.length * 8.4 + 26);

const btn =
  "inline-flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-gray-200 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-40";

/* Component                                                           */

export default function SystemFlow() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  const scenario = SCENARIOS[scenarioIndex];
  const frame = scenario.frames[frameIndex];
  const nodeById = (id: string) => scenario.nodes.find((n) => n.id === id)!;

  // Respect "reduce motion": no autoplay, packets are shown as still labels.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = (matches: boolean) => {
      setReduced(matches);
      if (matches) setPlaying(false);
    };
    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Move to the next step after the current one has finished playing.
  const stepSeconds = (frame.packets.length - 1) * STAGGER + TRAVEL + HOLD;
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = setTimeout(
      () => setFrameIndex((i) => (i + 1) % scenario.frames.length),
      stepSeconds * 1000,
    );
    return () => clearTimeout(timer);
  }, [playing, reduced, frameIndex, run, scenarioIndex, stepSeconds, scenario.frames.length]);

  const goTo = (i: number) => {
    if (i === frameIndex) setRun((r) => r + 1); // clicking the current step replays it
    setFrameIndex(i);
  };
  const prev = () => setFrameIndex((i) => (i - 1 + scenario.frames.length) % scenario.frames.length);
  const next = () => setFrameIndex((i) => (i + 1) % scenario.frames.length);

  const switchScenario = (i: number) => {
    setScenarioIndex(i);
    setFrameIndex(0);
    setRun((r) => r + 1);
  };

  const activeNodes = new Set(frame.packets.flatMap((p) => [p.from, p.to]));
  const edgeKey = (a: string, b: string) => [a, b].sort().join("|");
  const activeEdges = new Set(frame.packets.map((p) => edgeKey(p.from, p.to)));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-4 sm:p-6">
      {/* Scenario tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Choose a scenario" className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={i === scenarioIndex}
              onClick={() => switchScenario(i)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${
                i === scenarioIndex ? "bg-emerald-500 text-black" : "text-gray-300 hover:text-white"
              }`}
            >
              {s.tab}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-400">{scenario.intro}</p>
      </div>

      {/* Diagram */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/30">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="mx-auto block h-auto min-w-170 w-full"
          role="img"
          aria-label={`System diagram: ${scenario.tab}. Step ${frameIndex + 1}: ${frame.title}.`}
        >
          {/* Lines between nodes */}
          {scenario.edges.map(([a, b]) => {
            const na = nodeById(a);
            const nb = nodeById(b);
            const s = borderPoint(na, nb, 0);
            const e = borderPoint(nb, na, 0);
            const active = activeEdges.has(edgeKey(a, b));
            return (
              <line
                key={`${a}-${b}`}
                x1={s.x}
                y1={s.y}
                x2={e.x}
                y2={e.y}
                strokeWidth={active ? 2 : 1.5}
                strokeDasharray={active ? "7 9" : undefined}
                className={active ? "stroke-emerald-400/80" : "stroke-white/12"}
              >
                {active && !reduced && (
                  <animate attributeName="stroke-dashoffset" from="32" to="0" dur="1.2s" repeatCount="indefinite" />
                )}
              </line>
            );
          })}

          {/* Nodes */}
          {scenario.nodes.map((n) => {
            const active = activeNodes.has(n.id);
            const x = n.x - NODE_W / 2;
            const y = n.y - NODE_H / 2;
            return (
              <g key={n.id}>
                <rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={16}
                  strokeWidth={active ? 2 : 1.5}
                  className={`transition-colors duration-300 ${
                    active ? "fill-[#08261c] stroke-emerald-400" : "fill-[#04100c] stroke-white/20"
                  }`}
                />
                <n.Icon
                  x={x + 18}
                  y={n.y - 13}
                  size={26}
                  className={active ? "text-emerald-300" : "text-gray-400"}
                />
                <text x={x + 56} y={n.y - 3} className="fill-white text-[17px] font-semibold">
                  {n.label}
                </text>
                <text x={x + 56} y={n.y + 18} className="fill-gray-400 text-[13px]">
                  {n.sub}
                </text>
              </g>
            );
          })}

          {/* Moving messages. The key restarts the animation for each step. */}
          <g key={`${scenario.id}-${frameIndex}-${run}`}>
            {frame.packets.map((p, i) => {
              const from = nodeById(p.from);
              const to = nodeById(p.to);
              const s = borderPoint(from, to);
              const e = borderPoint(to, from);
              const w = pillWidth(p.label);
              const delay = `${(i * STAGGER).toFixed(2)}s`;
              const dur = `${TRAVEL}s`;
              const pill = (
                <>
                  <rect
                    x={-w / 2}
                    y={-15}
                    width={w}
                    height={30}
                    rx={15}
                    strokeWidth={1.5}
                    className={
                      p.money ? "fill-[#2a1606] stroke-orange-400" : "fill-[#062018] stroke-emerald-400"
                    }
                  />
                  <text
                    y={5}
                    textAnchor="middle"
                    className={`text-[14px] font-medium ${p.money ? "fill-orange-100" : "fill-emerald-100"}`}
                  >
                    {p.label}
                  </text>
                </>
              );

              if (reduced) {
                const mx = (s.x + e.x) / 2;
                const my = (s.y + e.y) / 2 + (i % 2 === 0 ? -20 : 20);
                return (
                  <g key={i} transform={`translate(${mx} ${my})`}>
                    {pill}
                  </g>
                );
              }

              return (
                <g key={i} opacity="0">
                  <animateMotion
                    path={`M ${s.x} ${s.y} L ${e.x} ${e.y}`}
                    dur={dur}
                    begin={delay}
                    fill="freeze"
                    calcMode="spline"
                    keyTimes="0;1"
                    keySplines="0.4 0 0.2 1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.12;0.85;1"
                    dur={dur}
                    begin={delay}
                    fill="freeze"
                  />
                  {pill}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Controls and caption */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={prev} className={btn} aria-label="Previous step">
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className={btn}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button type="button" onClick={next} className={btn} aria-label="Next step">
            <ChevronRight className="size-4" />
          </button>
          <button type="button" onClick={() => setRun((r) => r + 1)} className={btn} aria-label="Replay this step">
            <RotateCcw className="size-4" />
          </button>

          <div className="ml-1 flex items-center gap-1.5" role="group" aria-label="Steps">
            {scenario.frames.map((f, i) => (
              <button
                key={f.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Step ${i + 1}: ${f.title}`}
                aria-current={i === frameIndex ? "step" : undefined}
                className={`flex size-7 items-center justify-center rounded-full border font-mono text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${
                  i === frameIndex
                    ? "border-emerald-400 bg-emerald-500 text-black"
                    : i < frameIndex
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-white/15 text-gray-400 hover:text-white"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div aria-live="polite" className="min-h-22">
          <p className="text-base font-semibold text-white">
            {frameIndex + 1}. {frame.title}
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-400">{frame.text}</p>
        </div>
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400" /> message
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-orange-400" /> Bitcoin Cash moving
        </span>
      </p>
    </div>
  );
}