import { QuickStep } from "../_core/session.wallet";

export const PRESETS = [1, 2, 5, 10];
export const PROGRESS: Record<QuickStep, string> = {
  looking: "Looking up your coins…",
  confirm: "Approve it in your wallet…",
  waiting: "Waiting for the network to show your balance…",
  paying: "Paying this invoice…",
  sent: "Done ✓",
};