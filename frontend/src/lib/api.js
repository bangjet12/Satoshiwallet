import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 30000,
});

let currentToken = null;

export const setAuthToken = (token) => {
  currentToken = token;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("satoshi_token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("satoshi_token");
  }
};

export const getStoredToken = () => {
  if (currentToken) return currentToken;
  const stored = localStorage.getItem("satoshi_token");
  if (stored) {
    currentToken = stored;
    api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
  }
  return stored;
};

export const formatSats = (sats) => {
  if (sats == null) return "0";
  return Number(sats).toLocaleString("en-US");
};

export const satsToUsd = (sats, rate = 0.0006) => {
  // simple fallback rate (~$60k/BTC). Real rate fetched in AuthContext.
  return Number(sats || 0) * rate;
};

export const formatUsd = (usd) => {
  return `$${Number(usd || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatRelativeTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } finally {
      document.body.removeChild(ta);
    }
  }
};
