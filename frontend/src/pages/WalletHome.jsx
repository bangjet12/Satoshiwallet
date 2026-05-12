import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import BrandMark from "@/components/BrandMark";
import BottomActionPill from "@/components/BottomActionPill";
import ReceiveSheet from "@/components/ReceiveSheet";
import SendSheet from "@/components/SendSheet";
import { formatSats, formatUsd } from "@/lib/api";

export default function WalletHome() {
  const navigate = useNavigate();
  const { user, balance, hideBalance, toggleHideBalance, refreshBalance, satsUsdValue, btcUsd } = useAuth();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  useEffect(() => {
    refreshBalance();
    const t = setInterval(refreshBalance, 8000);
    return () => clearInterval(t);
  }, [refreshBalance]);

  const usd = satsUsdValue(balance);

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white relative noise" data-testid="wallet-home">
      <div className="mx-auto w-full max-w-[440px] px-5 pt-6 pb-[calc(140px+env(safe-area-inset-bottom))] relative">
        {/* Top bar */}
        <div className="flex items-center justify-between relative h-12" data-testid="top-brand-bar">
          <div className="text-[11px] tracking-wider text-white/55 small-caps">{user?.lightning_address}</div>
          <div className="absolute left-1/2 -translate-x-1/2">
            <BrandMark />
          </div>
          <button
            onClick={() => navigate("/settings")}
            data-testid="top-brand-bar-profile-button"
            className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="settings"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Balance hero */}
        <div className="relative pt-24 pb-10 text-center">
          <div className="absolute inset-0 hero-vignette pointer-events-none" aria-hidden />
          <div className="flex items-center justify-center gap-2 small-caps text-white/55">
            <span data-testid="wallet-balance-label">total wallet balance</span>
            <button
              data-testid="wallet-balance-eye-toggle"
              onClick={toggleHideBalance}
              className="h-7 w-7 rounded-full flex items-center justify-center text-white/55 hover:text-white/90 transition-colors"
              aria-label="toggle balance visibility"
            >
              {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <motion.div
            key={hideBalance ? "hidden" : "shown"}
            initial={{ opacity: 0, filter: "blur(2px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.22 }}
            className="mt-5 font-display text-[88px] leading-none tabular-nums"
            data-testid="wallet-balance-amount"
          >
            {hideBalance ? (
              <span className="tracking-[0.05em]">••••</span>
            ) : (
              <span>
                <span className="text-white/55 text-[56px] align-top mr-1">$</span>
                <span>{usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(".")[0]}</span>
                <span className="text-white/55">.{usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(".")[1]}</span>
              </span>
            )}
          </motion.div>

          <div
            data-testid="wallet-balance-secondary-amount"
            className="mt-2 text-white/45 text-sm tabular-nums"
          >
            {hideBalance ? "•••• sats" : `${formatSats(balance)} sats`}
          </div>

          <button
            data-testid="wallet-transactions-link"
            onClick={() => navigate("/transactions")}
            className="mt-8 inline-flex items-center gap-2 text-white/55 hover:text-white transition-colors text-sm"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="small-caps">transactions</span>
          </button>
        </div>

        {/* Quick-Glance Cards - extra UX */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setReceiveOpen(true)}
            className="text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors px-4 py-4"
            data-testid="quick-receive"
          >
            <ArrowDownLeft className="h-4 w-4 text-[#F7931A]" />
            <div className="mt-2 small-caps text-white/55">receive</div>
            <div className="text-white/85 text-sm mt-1">via Lightning</div>
          </button>
          <button
            onClick={() => setSendOpen(true)}
            className="text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors px-4 py-4"
            data-testid="quick-send"
          >
            <ArrowUpRight className="h-4 w-4 text-[#F7931A]" />
            <div className="mt-2 small-caps text-white/55">send</div>
            <div className="text-white/85 text-sm mt-1">to anyone</div>
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/45 flex items-center justify-between">
          <span className="small-caps">btc/usd</span>
          <span className="tabular-nums">{formatUsd(btcUsd)}</span>
        </div>
      </div>

      <BottomActionPill onReceive={() => setReceiveOpen(true)} onSend={() => setSendOpen(true)} />

      <ReceiveSheet open={receiveOpen} onOpenChange={setReceiveOpen} />
      <SendSheet open={sendOpen} onOpenChange={setSendOpen} />
    </div>
  );
}
