"use client";

import { useEffect, useRef, useState } from "react";
import { Props } from "../_core/wizard.interface";
import { payWithWallet } from "../_core/wizard.pay";
import { fundSession, minPayableSats, paySession, QuickStep } from "../_core/session.wallet";
import { useWalletOptional } from "./WalletProvider";
import QuickPayDialog from "./QuickPayDialog";
import { toMessage } from "../_core/pay_fun";
import { useSessionWallet } from "../_core/useSessionWallet";

type Status = "idle" | "paying" | "sent";

export default function PayWithWalletButton({ payAddress, amountSats, amountBch, feature, priceUsdCents }: Props) {
  const wallet = useWalletOptional();
  const quick = useSessionWallet();

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<QuickStep | "idle">("idle");
  const [dialogError, setDialogError] = useState("");

  const controller = useRef<AbortController | null>(null);
  const autoTried = useRef("");

  const need = BigInt(amountSats);
  const canQuick = quick.balance !== null && quick.balance >= minPayableSats(need);

  useEffect(() => () => controller.current?.abort("closed"), []);

  // With a quick-pay balance, the invoice is paid right away with no wallet prompt.
  useEffect(() => {
    if (!canQuick || autoTried.current === payAddress) return;
    autoTried.current = payAddress;
    setStatus("paying");
    setError("");
    paySession({ payAddress, amountSats: need })
      .then(() => setStatus("sent"))
      .catch((e) => {
        setStatus("idle");
        setError(toMessage(e));
      })
      .finally(() => quick.refresh());
  }, [canQuick, payAddress, need, quick.refresh]);

  if (!wallet && !quick.session) return null;

  const manager = wallet?.state === "connected" ? wallet.manager : null;

  const confirm = async (runs: number) => {
    if (!manager) return;
    setDialogError("");
    controller.current = new AbortController();
    const signal = controller.current.signal;
    try {
      if (runs === 1) {
        await payWithWallet({
          manager,
          payAddress,
          amountSats,
          amountBch,
          feature,
          signal,
          onStep: setDialogStep,
        });
      } else {
        await fundSession({ manager, amountSatsPerRun: need, runs, signal, onStep: setDialogStep });
        setDialogStep("paying");
        autoTried.current = payAddress;
        await paySession({ payAddress, amountSats: need });
      }
      setStatus("sent");
      setDialogOpen(false);
    } catch (e) {
      setDialogError(toMessage(e));
    } finally {
      setDialogStep("idle");
      quick.refresh();
    }
  };

  const closeDialog = () => {
    controller.current?.abort("Cancelled");
    setDialogOpen(false);
    setDialogStep("idle");
    setDialogError("");
  };

  return (
    <div className="space-y-2">
      {status === "paying" && (
        <p className="text-sm text-gray-300">Paying from your quick-pay balance…</p>
      )}

      {status === "sent" && (
        <p className="text-sm text-emerald-300">Sent ✓ Waiting for the network to confirm...</p>
      )}

      {status === "idle" && quick.session && quick.balance === null && (
        <p className="text-sm text-gray-400">Checking your quick-pay balance…</p>
      )}

      {status === "idle" && !(quick.session && quick.balance === null) && (
        <>
          {manager ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-black"
            >
              Pay with {wallet?.walletName ?? "wallet"}
            </button>
          ) : (
            <p className="text-xs text-gray-400">
              Connect a wallet (top right) to pay with one click, or scan the QR code below.
            </p>
          )}
          {quick.session && quick.balance !== null && !canQuick && (
            <p className="text-xs text-gray-400">
              Your quick-pay balance is too low for this run. Pay again to top it up.
            </p>
          )}
        </>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {dialogOpen && manager && (
        <QuickPayDialog
          amountSats={need}
          priceUsdCents={priceUsdCents ?? 3}
          walletName={wallet?.walletName ?? undefined}
          step={dialogStep}
          error={dialogError}
          onConfirm={confirm}
          onCancel={closeDialog}
        />
      )}
    </div>
  );
}



// "use client";

// import { useEffect, useRef, useState } from "react";
// import {PayStep, Props } from "../_core/wizard.interface";
// import { payWithWallet } from "../_core/wizard.pay";
// import { useWalletOptional } from "./WalletProvider";
// import { toMessage } from "../_core/pay_fun";

// export default function PayWithWalletButton({ payAddress, amountSats, amountBch, feature }: Props) {
//   const wallet = useWalletOptional();
//   const [step, setStep] = useState<PayStep | "idle">("idle");
//   const [error, setError] = useState("");
//   const controller = useRef<AbortController | null>(null);


//   useEffect(() => () => controller.current?.abort("closed"), []);

//     if (!wallet) return null;


//   if (wallet.state !== "connected" || !wallet.manager) {
//     return (
//       <p className="text-xs text-gray-400">
//         Connect a wallet (top right) to pay with one click, or scan the QR code below.
//       </p>
//     );
//   }

//   const manager = wallet.manager;

//   const pay = async () => {
//     setError("");
//     controller.current = new AbortController();
//     try {
//       await payWithWallet({
//         manager,
//         payAddress,
//         amountSats,
//         amountBch,
//         feature,
//         signal: controller.current.signal,
//         onStep: setStep,
//       });
//     } catch (e) {
//       setError(toMessage(e));
//       setStep("idle");
//     }
//   };
  

//   return (
//     <div className="space-y-2">
//       {step === "idle" && (
//         <button
//           type="button"
//           onClick={pay}
//           className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-black"
//         >
//           Pay with {wallet.walletName ?? "wallet"}
//         </button>
//       )}

//       {step === "looking" && <p className="text-sm text-gray-300">Looking up your coins...</p>}

//       {step === "confirm" && (
//         <div className="flex items-center justify-between gap-3">
//           <p className="text-sm text-gray-300">Confirm the payment in your wallet...</p>
//           <button
//             type="button"
//             onClick={() => controller.current?.abort("Cancelled")}
//             className="text-sm text-gray-400 hover:text-white"
//           >
//             Cancel
//           </button>
//         </div>
//       )}

//       {step === "sent" && (
//         <p className="text-sm text-emerald-300">Sent ✓ Waiting for the network to confirm...</p>
//       )}

//       {error && <p className="text-xs text-red-400">{error}</p>}
//     </div>
//   );
// }