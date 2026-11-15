import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, KeyRound, LifeBuoy, Terminal } from "lucide-react";
import SystemFlow from "@/features/Blaze/components/Systemflow";

export const metadata = {
  title: "How it works · BCH BLAZE 2026",
  description:
    "How BCH Blaze turns a Bitcoin Cash payment into an AI answer: sign in, connect a wallet, pay, and get the result.",
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type Place = "Browser" | "Your wallet" | "Our server" | "BCH network" | "Gemini";

const PLACE_STYLE: Record<Place, string> = {
  Browser: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  "Your wallet": "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "Our server": "border-white/20 bg-white/8 text-gray-200",
  "BCH network": "border-orange-400/30 bg-orange-400/10 text-orange-200",
  Gemini: "border-violet-400/30 bg-violet-400/10 text-violet-200",
};

type Step = {
  title: string;
  where: Place[];
  body: ReactNode;
};

const STEPS: Step[] = [
  {
    title: "Sign in",
    where: ["Browser", "Our server"],
    body: (
      <>
        Create an account with email and password, or continue with Google or GitHub. After sign-in the server sets
        secure, HTTP-only cookies, and the dashboard pages open only with them.
      </>
    ),
  },
  {
    title: "Connect your wallet",
    where: ["Browser", "Your wallet"],
    body: (
      <>
        On the Market insight page, press <strong className="font-medium text-white">Connect Wallet</strong>. A
        WizardConnect QR code appears; scan it with a compatible wallet. The wallet shares only public keys, so it can
        find your coins and nothing else. Private keys never leave the wallet.
      </>
    ),
  },
  {
    title: "Pick a feature and write a prompt",
    where: ["Browser"],
    body: (
      <>
        <strong className="font-medium text-white">Market insight</strong> costs $0.03 and{" "}
        <strong className="font-medium text-white">Prompt suggest</strong> costs $0.02. The prompt can be up to 500
        characters. The order summary shows the price in dollars and in sats, using the live BCH rate.
      </>
    ),
  },
  {
    title: "Create the invoice",
    where: ["Our server"],
    body: (
      <>
        When you press <strong className="font-medium text-white">Pay &amp; Run</strong>, the server reads the current
        BCH/USD rate, converts the price to sats (rounded up), and derives a fresh Bitcoin Cash address for this one
        invoice. The invoice is valid for 15 minutes.
      </>
    ),
  },
  {
    title: "Pay with one tap",
    where: ["Browser", "Your wallet", "BCH network"],
    body: (
      <>
        <strong className="font-medium text-white">Pay with wallet</strong> looks up your coins, builds the transaction,
        and asks your wallet to approve it. You confirm on your phone, then the signed transaction is broadcast. No
        wallet connected? Scan the QR code or copy the address and send the exact amount from any BCH wallet.
      </>
    ),
  },
  {
    title: "Detect the payment",
    where: ["Our server", "BCH network"],
    body: (
      <>
        A background watcher checks the invoice address on the Bitcoin Cash network every few seconds. If the amount
        received covers the invoice, it is marked <Code>PAID</Code>. If it is lower, it is marked <Code>UNDERPAID</Code>.
        The payment window in your browser checks the status every 3 seconds, so you see it change on its own.
      </>
    ),
  },
  {
    title: "Run the AI",
    where: ["Our server", "Gemini"],
    body: (
      <>
        As soon as the invoice is <Code>PAID</Code>, your browser asks the server to run it. The server sends your
        prompt to Gemini, saves the prompt and the answer in your history, and marks the invoice{" "}
        <Code>COMPLETED</Code>. One payment gives one answer: running the same invoice again returns the saved result.
      </>
    ),
  },
  {
    title: "Read the result",
    where: ["Browser"],
    body: (
      <>
        The answer appears under the form. Every past request, with its prompt, answer and cost, is listed on the
        History page.
      </>
    ),
  },
];

const QUICK_TEST = [
  "Sign in (Google, GitHub, or email).",
  "Open Market insight from the dashboard menu.",
  "Press Connect Wallet and scan the QR code with a WizardConnect wallet.",
  "Type a coin name, then press Pay & Run.",
  "Approve the payment in your wallet. The answer shows up in a few seconds.",
];

const CURL = `# 1. Ask. The server answers 402 with an invoice.
curl -X POST ${API_BASE}/insight \\
  -H "Content-Type: application/json" \\
  -d '{"input":"Bitcoin Cash outlook"}'

# {"error":"payment_required","invoiceId":"...","payTo":"bitcoincash:q...","amountSats":"...","expiresAt":"..."}

# 2. Send exactly amountSats to payTo from any BCH wallet.

# 3. Ask again with the invoice id. Once paid, you get the answer.
curl -X POST ${API_BASE}/insight \\
  -H "X-Invoice-Id: <invoiceId>"`;


function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.8em] text-emerald-200">{children}</code>
  );
}

function PlaceTag({ place }: { place: Place }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${PLACE_STYLE[place]}`}>{place}</span>
  );
}

function SectionTitle({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{children}</h2>
      {note && <p className="mt-1.5 max-w-2xl text-sm text-gray-400">{note}</p>}
    </div>
  );
}

const primaryBtn =
  "inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300";
const ghostBtn =
  "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-emerald-500/40 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300";

export default function BlazePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      {/* Header */}
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Pay in Bitcoin Cash.
          <br />
          Get your AI answer.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-400">
          BCH Blaze sells AI answers one request at a time. There is no subscription and no card. You pay a few cents
          in BCH, the server confirms the payment on the blockchain, and the answer is released. This page walks
          through exactly what happens, step by step.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/dashboard/market_insight_invoices" className={primaryBtn}>
            Try it now
            <ArrowUpRight className="size-4" />
          </Link>
          <Link href="/docs" className={ghostBtn}>
            <Terminal className="size-4" />
            API docs
          </Link>
        </div>
      </header>

      <section className="mt-14 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Test it in two minutes</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              This is a real Bitcoin Cash mainnet payment. One request costs $0.02 to $0.03, a few thousand sats.
            </p>
          </div>
          <ol className="space-y-3">
            {QUICK_TEST.map((item, i) => (
              <li key={item} className="flex gap-3 text-sm text-gray-200">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono text-xs text-emerald-200">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Live system diagram */}
      <section className="mt-16">
        <SectionTitle note="Press play, or click a step number. Green messages are data, orange is Bitcoin Cash moving.">
          See it move
        </SectionTitle>
        <SystemFlow />
      </section>

      <section className="mt-16">
        <SectionTitle note="Each step shows where the work happens: in your browser, in your wallet, on our server, on the Bitcoin Cash network, or at Gemini.">
          What happens, step by step
        </SectionTitle>

        <ol className="relative space-y-5 border-l border-white/10 pl-6 sm:pl-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <span
                aria-hidden
                className="absolute -left-9.25 top-4 flex size-6.5 items-center justify-center rounded-full border border-emerald-500/40 bg-[#04100c] font-mono text-xs text-emerald-300 sm:-left-11.25"
              >
                {i + 1}
              </span>
              <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {step.where.map((p) => (
                      <PlaceTag key={p} place={p} />
                    ))}
                  </div>
                </div>
                <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-gray-400">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Keys and money */}
      <section className="mt-16">
        <SectionTitle>Where your money and keys go</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
            <KeyRound className="size-5 text-emerald-300" />
            <h3 className="mt-3 text-base font-semibold text-white">The server holds no spending keys</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Addresses come from a public key (xpub) of the receiving wallet. A public key can create new addresses
              and watch them, but it cannot spend. Payments land straight in the owner’s wallet.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
            <LifeBuoy className="size-5 text-emerald-300" />
            <h3 className="mt-3 text-base font-semibold text-white">Paid means safe to retry</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              If the AI call fails after you paid, the page shows <strong className="font-medium text-white">Retry
              (already paid)</strong>. It runs the same invoice again without charging you twice.
            </p>
          </div>
        </div>
      </section>

      {/* Agents */}
      <section className="mt-16">
        <SectionTitle note="No account needed. Software can pay over plain HTTP: ask, receive a 402 Payment Required with an invoice, pay it, and ask again.">
          For AI agents and scripts
        </SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <Terminal className="size-4 text-gray-500" />
            <span className="font-mono text-xs text-gray-500">POST /insight</span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-gray-300 sm:text-[13px]">
            <code>{CURL}</code>
          </pre>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mt-16">
        <SectionTitle>If something looks stuck</SectionTitle>
        <dl className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/3">
          {[
            ["The invoice expired", "Invoices last 15 minutes. Close the window and press Pay & Run again for a new one."],
            [
              "Payment received, but the amount was too low",
              "Create a new invoice and send the exact amount shown. Do not top up an old one.",
            ],
            [
              "Paid, but the answer did not appear",
              "Press Retry (already paid). You will not be charged again.",
            ],
            [
              "Wallet will not connect",
              "Keep the wallet app open on screen while the QR dialog is showing, or cancel and connect again.",
            ],
          ].map(([q, a]) => (
            <div key={q} className="grid gap-1 px-5 py-4 sm:grid-cols-[17rem_1fr] sm:gap-6">
              <dt className="text-sm font-medium text-white">{q}</dt>
              <dd className="text-sm leading-relaxed text-gray-400">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Closing */}
      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/3 p-6">
        <p className="max-w-md text-sm text-gray-300">Ready to see it work? One request takes about a minute.</p>
        <Link href="/dashboard/market_insight_invoices" className={primaryBtn}>
          Open Market insight
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}