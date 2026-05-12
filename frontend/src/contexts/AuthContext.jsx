import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAuthToken, getStoredToken } from "@/lib/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [hideBalance, setHideBalance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [btcUsd, setBtcUsd] = useState(60000); // fallback

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.get("/auth/me");
      setUser(me.data);
      setBalance(me.data.balance_sats || 0);
      setHideBalance(!!me.data.hide_balance);
      return me.data;
    } catch (e) {
      setAuthToken(null);
      setUser(null);
      return null;
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const r = await api.get("/wallet/balance");
      setBalance(r.data.balance_sats || 0);
      // Do NOT overwrite hide_balance during polling — local state is the source of truth
      // until the user explicitly toggles or logs in.
      return r.data;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  // try fetch BTC price (best-effort)
  useEffect(() => {
    const f = async () => {
      try {
        const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
        const d = await r.json();
        if (d?.bitcoin?.usd) setBtcUsd(d.bitcoin.usd);
      } catch {}
    };
    f();
    const id = setInterval(f, 120000);
    return () => clearInterval(id);
  }, []);

  const login = async (username, pin) => {
    const r = await api.post("/auth/login", { username, pin });
    setAuthToken(r.data.token);
    setUser(r.data.user);
    setBalance(r.data.user.balance_sats || 0);
    setHideBalance(!!r.data.user.hide_balance);
    return r.data.user;
  };

  const signup = async (username, pin) => {
    const r = await api.post("/auth/signup", { username, pin });
    setAuthToken(r.data.token);
    setUser(r.data.user);
    setBalance(r.data.user.balance_sats || 0);
    setHideBalance(!!r.data.user.hide_balance);
    return r.data.user;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setBalance(0);
  };

  const toggleHideBalance = async () => {
    setHideBalance((prev) => !prev);
    try {
      // Get current value via state setter (cannot read state synchronously after setter call)
      const next = !hideBalance;
      await api.patch("/settings", { hide_balance: next });
    } catch {
      setHideBalance((prev) => !prev);
    }
  };

  const satsUsdValue = (sats) => (Number(sats || 0) * btcUsd) / 100_000_000;

  return (
    <AuthContext.Provider
      value={{
        user,
        balance,
        hideBalance,
        loading,
        btcUsd,
        login,
        signup,
        logout,
        refreshUser,
        refreshBalance,
        toggleHideBalance,
        satsUsdValue,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
