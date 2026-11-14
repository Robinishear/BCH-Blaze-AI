"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSessionBalance, loadSession, SessionWallet, subscribeSession } from "./session.wallet";

export function useSessionWallet() {
  const [session, setSession] = useState<SessionWallet | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    const current = loadSession();
    setSession(current);
    if (!current) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      const sats = await getSessionBalance(current);
      if (alive.current) setBalance(sats);
    } catch {
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    refresh();
    const unsubscribe = subscribeSession(refresh);
    return () => {
      alive.current = false;
      unsubscribe();
    };
  }, [refresh]);

  return { session, balance, loading, refresh };
}
