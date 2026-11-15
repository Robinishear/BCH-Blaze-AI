// import CodeBlock from "@/features/docs/components/CodeBlock";

// const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// const STEP1_REQUEST = `curl -i -X POST ${BASE}/insight \\
//   -H "Content-Type: application/json" \\
//   -d '{"input":"What is the BCH market outlook this week?"}'`;

// const STEP1_RESPONSE = `HTTP/1.1 402 Payment Required

// {
//   "error": "payment_required",
//   "message": "Send the exact amount to payTo, then call again with the X-Invoice-Id header.",
//   "invoiceId": "cmabc123xyz456",
//   "payTo": "bitcoincash:qq...",
//   "amountSats": "12231",
//   "amountBch": "0.00012231",
//   "expiresAt": "2026-11-20T10:15:00.000Z"
// }`;

// const STEP3_REQUEST = `curl -X POST ${BASE}/insight \\
//   -H "X-Invoice-Id: cmabc123xyz456"`;

// const STEP3_RESPONSE = `HTTP/1.1 200 OK

// {
//   "invoiceId": "cmabc123xyz456",
//   "feature": "market-insight",
//   "result": "…the AI answer…",
//   "tokens": 512,
//   "txid": "…",
//   "createdAt": "2026-11-20T10:03:41.000Z"
// }`;

// const AGENT_EXAMPLE = `const BASE = "${BASE}";
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// async function askInsight(input, payWithMyWallet) {
//   // 1. ask — the server answers 402 with a payment request
//   const first = await fetch(\`\${BASE}/insight\`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ input }),
//   });
//   if (first.status !== 402) throw new Error(\`Unexpected status \${first.status}\`);
//   const invoice = await first.json();

//   // 2. pay the exact amount (your own wallet code)
//   await payWithMyWallet(invoice.payTo, invoice.amountSats);

//   // 3. retry with the invoice id until the payment is seen
//   while (true) {
//     const res = await fetch(\`\${BASE}/insight\`, {
//       method: "POST",
//       headers: { "X-Invoice-Id": invoice.invoiceId },
//     });
//     if (res.status === 200) return res.json();

//     const body = await res.json();
//     if (res.status !== 402 || body.error !== "payment_required") {
//       throw new Error(body.message ?? "Request failed");
//     }
//     await sleep(3000); // still waiting for the payment
//   }
// }`;

// const STATUS_ROWS: { status: string; meaning: string }[] = [
//   { status: "200", meaning: "Paid. The body contains the AI result." },
//   { status: "402 payment_required", meaning: "Payment is still needed (or not yet seen). Pay the amount in the body, then call again." },
//   { status: "402 invoice_expired", meaning: "The 15 minutes are over. Start again without the X-Invoice-Id header." },
//   { status: "402 underpaid", meaning: "Less than the required amount was received. A new invoice is needed." },
//   { status: "400", meaning: "Bad request: missing or empty input, input over 500 characters, or an invalid X-Invoice-Id." },
//   { status: "429", meaning: "Too many requests. See the limits below." },
//   { status: "503", meaning: "The service is busy. Try again shortly." },
// ];

// function statusTone(status: string) {
//   if (status.startsWith("200")) {
//     return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
//   }
//   if (status.startsWith("402")) {
//     return "border-amber-400/30 bg-amber-400/10 text-amber-300";
//   }
//   if (status.startsWith("400")) {
//     return "border-orange-400/30 bg-orange-400/10 text-orange-300";
//   }
//   return "border-rose-400/30 bg-rose-400/10 text-rose-300";
// }

// function Section({ title, children }: { title: string; children: React.ReactNode }) {
//   return (
//     <section
//       className={[
//         "space-y-4 rounded-2xl border border-white/10 bg-white/3 p-6 shadow-lg shadow-black/20 backdrop-blur-sm",
//         "transition-colors hover:border-white/20",
//         "[&_code]:rounded-md [&_code]:border [&_code]:border-white/10 [&_code]:bg-white/[0.07]",
//         "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-emerald-200",
//       ].join(" ")}
//     >
//       <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight text-white">
//         <span className="h-6 w-1 rounded-full bg-linear-to-b from-emerald-300 to-cyan-300" />
//         {title}
//       </h2>
//       {children}
//     </section>
//   );
// }

// export default function DocsPage() {
//   return (
//     <div className="mx-auto max-w-3xl space-y-8 px-6 py-14">
//       <header className="relative space-y-4 overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-emerald-400/8 via-white/3 to-cyan-400/8 p-8 [&_code]:rounded-md [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5">
//         <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
//         <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
//         <h1 className="relative text-4xl font-bold tracking-tight text-white sm:text-5xl">
//           Public{" "}
//           <span className="bg-linear-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">API</span>
//         </h1>
//         <p className="relative text-base leading-relaxed text-gray-300">
//           Pay per request with Bitcoin Cash. No account, no API key. An AI agent (or a curl command) asks,
//           gets an HTTP 402 payment request, pays on the BCH mainnet, and then receives the answer.
//         </p>
//         <p className="relative border-l-2 border-emerald-300/40 pl-3 text-sm leading-relaxed text-gray-500">
//           This follows the idea of HTTP 402 Payment Required (x402-style). The response format below is
//           specific to this service.
//         </p>
//       </header>

//       <Section title="How it works">
//         <ol className="space-y-3 [counter-reset:step]">
//           <li className="relative rounded-xl border border-white/10 bg-white/3 py-4 pl-16 pr-4 leading-relaxed text-gray-300 [counter-increment:step] before:absolute before:left-4 before:top-4 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-linear-to-br before:from-emerald-300 before:to-cyan-300 before:text-sm before:font-bold before:text-gray-950 before:content-[counter(step)]">
//             <strong className="text-white">Ask.</strong> Send your text to <code>POST /insight</code>. The server
//             replies <code>402</code> with an address and an exact amount.
//           </li>
//           <li className="relative rounded-xl border border-white/10 bg-white/3 py-4 pl-16 pr-4 leading-relaxed text-gray-300 [counter-increment:step] before:absolute before:left-4 before:top-4 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-linear-to-br before:from-emerald-300 before:to-cyan-300 before:text-sm before:font-bold before:text-gray-950 before:content-[counter(step)]">
//             <strong className="text-white">Pay.</strong> Send exactly that amount in BCH to the address within 15
//             minutes, from any wallet.
//           </li>
//           <li className="relative rounded-xl border border-white/10 bg-white/3 py-4 pl-16 pr-4 leading-relaxed text-gray-300 [counter-increment:step] before:absolute before:left-4 before:top-4 before:flex before:h-8 before:w-8 before:items-center before:justify-center before:rounded-full before:bg-linear-to-br before:from-emerald-300 before:to-cyan-300 before:text-sm before:font-bold before:text-gray-950 before:content-[counter(step)]">
//             <strong className="text-white">Collect.</strong> Call <code>POST /insight</code> again with the{" "}
//             <code>X-Invoice-Id</code> header. When the payment is seen (usually within seconds, 0-confirmation is
//             accepted) you get <code>200</code> and the result.
//           </li>
//         </ol>
//       </Section>

//       <Section title="1. Ask for an answer">
//         <p className="leading-relaxed text-gray-400">
//           Only the <code>market-insight</code> feature is available on the public API. The input must be 1 to 500
//           characters.
//         </p>
//         <CodeBlock language="bash" code={STEP1_REQUEST} />
//         <CodeBlock language="http" code={STEP1_RESPONSE} />
//       </Section>

//       <Section title="2. Pay">
//         <p className="leading-relaxed text-gray-400">
//           Send exactly <code>amountSats</code> (the same value as <code>amountBch</code>) to <code>payTo</code>
//           before <code>expiresAt</code>. The price is fixed when the invoice is created, so the rate cannot change
//           while you pay. Paying less cannot be topped up; the invoice becomes <code>underpaid</code>.
//         </p>
//       </Section>

//       <Section title="3. Collect the result">
//         <p className="leading-relaxed text-gray-400">
//           Call the same endpoint with the <code>invoiceId</code> from step 1 in the <code>X-Invoice-Id</code>{" "}
//           header. No body is needed. Asking again after a successful call returns the same saved result and is
//           never charged twice.
//         </p>
//         <CodeBlock language="bash" code={STEP3_REQUEST} />
//         <CodeBlock language="http" code={STEP3_RESPONSE} />
//       </Section>

//       <Section title="Responses">
//         <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
//           <table className="w-full text-left text-sm">
//             <thead className="border-b border-white/10 bg-white/4 text-xs uppercase tracking-wider text-gray-400">
//               <tr>
//                 <th className="px-4 py-3">Status</th>
//                 <th className="px-4 py-3">Meaning</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-white/5">
//               {STATUS_ROWS.map((row) => (
//                 <tr key={row.status} className="transition-colors hover:bg-white/3">
//                   <td className="whitespace-nowrap px-4 py-3 align-top">
//                     <span
//                       className={`inline-block rounded-md border px-2 py-1 font-mono text-xs ${statusTone(row.status)}`}
//                     >
//                       {row.status}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3 leading-relaxed text-gray-300">{row.meaning}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Section>

//       <Section title="Limits">
//         <ul className="grid gap-3 sm:grid-cols-2">
//           {[
//             "Creating a new invoice: 5 per 10 minutes per IP address.",
//             "Checking an invoice (with X-Invoice-Id): 60 per minute per IP address.",
//             "An invoice is valid for 15 minutes.",
//             "Input: at most 500 characters.",
//           ].map((item) => (
//             <li
//               key={item}
//               className="flex gap-3 rounded-xl border border-white/10 bg-white/3 p-4 text-sm leading-relaxed text-gray-300"
//             >
//               <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-linear-to-br from-emerald-300 to-cyan-300" />
//               <span>{item}</span>
//             </li>
//           ))}
//         </ul>
//       </Section>

//       <Section title="Example: a small agent">
//         <p className="leading-relaxed text-gray-400">
//           The whole flow in JavaScript. <code>payWithMyWallet</code> is your own code that sends the BCH.
//         </p>
//         <CodeBlock language="javascript" code={AGENT_EXAMPLE} />
//       </Section>

//       <Section title="Prefer a website?">
//         <p className="leading-relaxed text-gray-400">
//           Use the Playground after logging in. It does the same thing with a QR code or one-click wallet payment.
//         </p>
//       </Section>
//     </div>
//   );
// }