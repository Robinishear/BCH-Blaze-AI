import {
  binToHex,
  encodeDataPush,
  encodePrivateKeyWif,
  encodeTransaction,
  flattenBinArray,
  generatePrivateKey,
  generateSigningSerializationBch,
  hexToBin,
  lockingBytecodeToCashAddress,
  publicKeyToP2pkhLockingBytecode,
  secp256k1,
  sha256,
} from "@bitauth/libauth";
import { broadcastTransaction, ElectrumClient, fetchUtxos } from "./wizard.electrum";
import { buildPayment, estimateFee, payAddressToLockingBytecode } from "./wizard.payment";
import { scanWallet } from "./wizard.scan";
import { Utxo } from "./wizard.interface";
import { WalletManagerLike } from "./wizard.pay";
import { DUST_SATS } from "./wizard.constants";
import {STORAGE_KEY, CHANGE_EVENT} from "./wizard.constants"


export interface SessionWallet {
  v: 1;
  privateKeyHex: string;
  address: string;
  refundAddress: string;
  createdAt: number;
}

export type QuickStep = "looking" | "confirm" | "waiting" | "paying" | "sent";

export class QuickBalanceError extends Error {
  constructor(
    public readonly availableSats: bigint,
    public readonly requiredSats: bigint,
  ) {
    super("Your quick-pay balance is too low for this payment.");
    this.name = "QuickBalanceError";
  }
}

/* Budget maths                                                        */
export const perRunBudgetSats = (amountSats: bigint) => amountSats + estimateFee(1, 2);

export const totalBudgetSats = (amountSats: bigint, runs: number) =>
  BigInt(runs) * perRunBudgetSats(amountSats);

export const minPayableSats = (amountSats: bigint) => amountSats + estimateFee(1, 2);

/* Storage (localStorage) and change notifications                     */

const isSession = (value: unknown): value is SessionWallet => {
  const v = value as SessionWallet | null;
  return (
    !!v &&
    v.v === 1 &&
    typeof v.privateKeyHex === "string" &&
    v.privateKeyHex.length === 64 &&
    typeof v.address === "string" &&
    typeof v.refundAddress === "string"
  );
};

export const loadSession = (): SessionWallet | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const notify = () => {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // not in a browser
  }
};

const saveSession = (session: SessionWallet) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  notify();
};

/** Calls `listener` whenever the session changes, in this tab or another one. */
export const subscribeSession = (listener: () => void) => {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
};

/* Keys and addresses                                                  */

const addressOf = (lockingBytecode: Uint8Array) => {
  const result = lockingBytecodeToCashAddress({ bytecode: lockingBytecode, prefix: "bitcoincash" });
  if (typeof result === "string") throw new Error(result);
  return result.address;
};

const keysOf = (session: SessionWallet) => {
  const privateKey = hexToBin(session.privateKeyHex);
  const publicKey = secp256k1.derivePublicKeyCompressed(privateKey);
  if (typeof publicKey === "string") throw new Error(publicKey);
  return { privateKey, publicKey, lockingBytecode: publicKeyToP2pkhLockingBytecode({ publicKey }) };
};

const createSession = (refundAddress: string): SessionWallet => {
  const privateKey = generatePrivateKey(() => crypto.getRandomValues(new Uint8Array(32)));
  const publicKey = secp256k1.derivePublicKeyCompressed(privateKey);
  if (typeof publicKey === "string") throw new Error(publicKey);
  return {
    v: 1,
    privateKeyHex: binToHex(privateKey),
    address: addressOf(publicKeyToP2pkhLockingBytecode({ publicKey })),
    refundAddress,
    createdAt: Date.now(),
  };
};

/** The private key in the format wallets (for example Electron Cash) can import. */
export const sessionKeyAsWif = (session: SessionWallet) => {
  const wif = encodePrivateKeyWif(hexToBin(session.privateKeyHex), "mainnet");
  return typeof wif === "string" ? wif : session.privateKeyHex;
};

/* Coins. We remember what we just spent so quick back-to-back runs    */
/* work even before the blockchain server has caught up.               */

const REMEMBER_MS = 10 * 60 * 1000;
const spentLocally = new Map<string, number>();
const changeLocally = new Map<string, { coin: Utxo; at: number }>();
const coinKey = (c: Utxo) => `${c.txHash}:${c.txPos}`;

const getCoins = async (client: ElectrumClient, lockingBytecode: Uint8Array): Promise<Utxo[]> => {
  const now = Date.now();
  for (const [k, at] of spentLocally) if (now - at > REMEMBER_MS) spentLocally.delete(k);
  for (const [k, entry] of changeLocally) if (now - entry.at > REMEMBER_MS) changeLocally.delete(k);

  const fetched = await fetchUtxos(client, lockingBytecode);
  const coins = fetched.filter((c) => !spentLocally.has(coinKey(c)));
  for (const [k, entry] of changeLocally) {
    if (!spentLocally.has(k) && !fetched.some((c) => coinKey(c) === k)) coins.push(entry.coin);
  }
  return coins;
};

const remember = (spent: Utxo[], txid: string, change?: { vout: number; value: bigint }) => {
  const now = Date.now();
  for (const c of spent) spentLocally.set(coinKey(c), now);
  if (change && change.value > BigInt(0)) {
    const coin = { txHash: txid, txPos: change.vout, value: change.value };
    changeLocally.set(coinKey(coin), { coin, at: now });
  }
};

const sum = (coins: Utxo[]) => coins.reduce((total, c) => total + c.value, BigInt(0));

export const getSessionBalance = async (session: SessionWallet, electrumUrl?: string) => {
  const client = await ElectrumClient.connect(electrumUrl);
  try {
    const coins = await getCoins(client, keysOf(session).lockingBytecode);
    return sum(coins);
  } finally {
    client.close();
  }
};

/* Signing with the session key (plain P2PKH, Schnorr)                 */

type TxOutput = { lockingBytecode: Uint8Array; valueSatoshis: bigint };

const signWithSession = (session: SessionWallet, coins: Utxo[], outputs: TxOutput[]) => {
  const { privateKey, publicKey, lockingBytecode } = keysOf(session);
  const hashType = Uint8Array.of(0x41); // all outputs, fork id

  const sourceOutputs = coins.map((c) => ({ lockingBytecode, valueSatoshis: c.value }));
  const unsigned = {
    version: 2,
    locktime: 0,
    inputs: coins.map((c) => ({
      outpointTransactionHash: hexToBin(c.txHash),
      outpointIndex: c.txPos,
      sequenceNumber: 0xffffffff,
      unlockingBytecode: new Uint8Array(),
    })),
    outputs,
  };

  const inputs = unsigned.inputs.map((input, inputIndex) => {
    const serialization = generateSigningSerializationBch(
      { transaction: unsigned, sourceOutputs, inputIndex },
      { coveredBytecode: lockingBytecode, signingSerializationType: hashType },
    );
    const digest = sha256.hash(sha256.hash(serialization));
    const signature = secp256k1.signMessageHashSchnorr(privateKey, digest);
    if (typeof signature === "string") throw new Error(signature);
    const unlockingBytecode = flattenBinArray([
      encodeDataPush(flattenBinArray([signature, hashType])),
      encodeDataPush(publicKey),
    ]);
    return { ...input, unlockingBytecode };
  });

  return binToHex(encodeTransaction({ ...unsigned, inputs }));
};

/* Pay one invoice from the quick-pay balance (no wallet prompt)       */

let queue: Promise<unknown> = Promise.resolve();
const inOrder = <T>(job: () => Promise<T>): Promise<T> => {
  const run = queue.then(() => job());
  queue = run.catch(() => undefined);
  return run;
};

const paidInvoices = new Map<string, string>(); 
const paying = new Map<string, Promise<string>>();

const payOnce = async (payAddress: string, amountSats: bigint, electrumUrl?: string) => {
  const session = loadSession();
  if (!session) throw new Error("Quick pay is not set up yet.");
  const keys = keysOf(session);

  const client = await ElectrumClient.connect(electrumUrl);
  try {
    const coins = (await getCoins(client, keys.lockingBytecode)).sort((a, b) =>
      a.value < b.value ? 1 : a.value > b.value ? -1 : 0,
    );

    const picked: Utxo[] = [];
    let total = BigInt(0);
    for (const coin of coins) {
      picked.push(coin);
      total += coin.value;
      if (total >= amountSats + estimateFee(picked.length, 2)) break;
    }

    const feeNoChange = estimateFee(picked.length, 1);
    if (total < amountSats + feeNoChange) {
      throw new QuickBalanceError(sum(coins), amountSats + estimateFee(Math.max(coins.length, 1), 1));
    }

    const feeWithChange = estimateFee(picked.length, 2);
    const rawChange = total - amountSats - feeWithChange;
    const hasChange = rawChange >= DUST_SATS;

    const outputs: TxOutput[] = [{ lockingBytecode: payAddressToLockingBytecode(payAddress), valueSatoshis: amountSats }];
    if (hasChange) outputs.push({ lockingBytecode: keys.lockingBytecode, valueSatoshis: rawChange });

    const txid = await broadcastTransaction(client, signWithSession(session, picked, outputs));
    remember(picked, txid, hasChange ? { vout: 1, value: rawChange } : undefined);
    return txid;
  } finally {
    client.close();
  }
};

export const paySession = (args: { payAddress: string; amountSats: bigint; electrumUrl?: string }) => {
  const known = paidInvoices.get(args.payAddress);
  if (known) return Promise.resolve(known);
  const running = paying.get(args.payAddress);
  if (running) return running;

  const job = inOrder(() => payOnce(args.payAddress, args.amountSats, args.electrumUrl))
    .then((txid) => {
      paidInvoices.set(args.payAddress, txid);
      notify();
      return txid;
    })
    .finally(() => paying.delete(args.payAddress));
  paying.set(args.payAddress, job);
  return job;
};

/* Fund the quick-pay balance (the ONE wallet approval)*/

export interface FundArgs {
  manager: WalletManagerLike;
  /** Price of one run in sats (the current invoice). */
  amountSatsPerRun: bigint;
  runs: number;
  signal?: AbortSignal;
  onStep?: (step: QuickStep) => void;
  electrumUrl?: string;
}

export const fundSession = async ({ manager, amountSatsPerRun, runs, signal, onStep, electrumUrl }: FundArgs) => {
  onStep?.("looking");
  const getPubkey = (childIndex: number, index: bigint) => manager.getPubkey(childIndex, index);
  if (!getPubkey(0, BigInt(0))) {
    throw new Error("Your wallet did not share its keys. Please reconnect your wallet.");
  }

  const client = await ElectrumClient.connect(electrumUrl);
  try {
    const { coins, lastUsed } = await scanWallet(client, getPubkey);

    const changeKey = getPubkey(1, BigInt(lastUsed.change + 1)) ?? getPubkey(1, BigInt(0));
    const refundKey = getPubkey(0, BigInt(lastUsed.receive + 1)) ?? getPubkey(0, BigInt(0));
    if (!changeKey || !refundKey) {
      throw new Error("Your wallet did not share its keys. Please reconnect your wallet.");
    }

    // The key is saved BEFORE any money moves, so closing the tab can never lose it.
    const refundAddress = addressOf(publicKeyToP2pkhLockingBytecode({ publicKey: refundKey }));
    const session = { ...(loadSession() ?? createSession(refundAddress)), refundAddress };
    saveSession(session);

    const keys = keysOf(session);
    const before = sum(await getCoins(client, keys.lockingBytecode));
    const total = totalBudgetSats(amountSatsPerRun, runs);

    const built = buildPayment({
      coins,
      payAddress: session.address,
      amountSats: total,
      changeLockingBytecode: publicKeyToP2pkhLockingBytecode({ publicKey: changeKey }),
    });

    onStep?.("confirm");
    const bch = (Number(total) / 1e8).toFixed(8);
    const response = await manager.signTransaction(
      {
        transaction: {
          transaction: built.txHex,
          sourceOutputs: built.sourceOutputs,
          userPrompt: `Set aside ${bch} BCH for ${runs} quick AI runs`,
          broadcast: true,
        },
        inputPaths: built.inputPaths,
      },
      { signal },
    );
    if (response.error) throw new Error(response.error);
    if (response.signedTransaction) {
      await broadcastTransaction(client, response.signedTransaction).catch(() => undefined);
    }

    onStep?.("waiting");
    const target = before + total;
    for (let i = 0; i < 24; i++) {
      if (sum(await getCoins(client, keys.lockingBytecode)) >= target) {
        notify();
        return session;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    notify();
    throw new Error(
      "Your wallet sent the funds, but the network has not shown them yet. Your quick-pay balance is saved. Wait a moment and try again.",
    );
  } finally {
    client.close();
  }
};

/* Give the leftover money back to the user's wallet */

export const withdrawSession = async (electrumUrl?: string) => {
  const session = loadSession();
  if (!session) throw new Error("Quick pay is not set up yet.");
  const keys = keysOf(session);

  return inOrder(async () => {
    const client = await ElectrumClient.connect(electrumUrl);
    try {
      const coins = await getCoins(client, keys.lockingBytecode);
      const total = sum(coins);
      const amount = total - estimateFee(coins.length, 1);
      if (coins.length === 0 || amount < DUST_SATS) {
        throw new Error("There is nothing to withdraw yet. The balance is too small to send.");
      }

      const outputs: TxOutput[] = [
        { lockingBytecode: payAddressToLockingBytecode(session.refundAddress), valueSatoshis: amount },
      ];
      const txid = await broadcastTransaction(client, signWithSession(session, coins, outputs));
      remember(coins, txid);
      notify();
      return { txid, sats: amount };
    } finally {
      client.close();
    }
  });
};

/** Used when the user logs out: try to return the money, but never block the logout for long. */
export const sweepSessionQuietly = async (timeoutMs = 8000) => {
  if (!loadSession()) return;
  try {
    await Promise.race([
      withdrawSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
  } catch {
    // Nothing to return, or the network was slow. The key stays saved, so Withdraw still works later.
  }
};

