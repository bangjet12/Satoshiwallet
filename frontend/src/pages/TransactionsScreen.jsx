import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { api, formatSats, formatRelativeTime } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionDetailSheet from "@/components/TransactionDetailSheet";
import { motion, AnimatePresence } from "framer-motion";

export default function TransactionsScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const r = await api.get("/transactions", { params: { limit: 100, status_filter: filter } });
      setTxns(r.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white" data-testid="transactions-screen">
      <div className="mx-auto w-full max-w-[440px] px-5 pt-6 pb-20">
        <div className="flex items-center justify-between h-12">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
            data-testid="transactions-back"
            aria-label="back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="small-caps text-white/70">transactions</div>
          <button
            onClick={load}
            className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
            data-testid="transactions-refresh"
            aria-label="refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mt-6" data-testid="transactions-filter-tabs">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="w-full bg-white/[0.04] border border-white/10 rounded-full p-1 h-10">
              <TabsTrigger value="all" className="flex-1 rounded-full data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55 small-caps text-[10px]">all</TabsTrigger>
              <TabsTrigger value="pending" className="flex-1 rounded-full data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55 small-caps text-[10px]">pending</TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 rounded-full data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55 small-caps text-[10px]">completed</TabsTrigger>
              <TabsTrigger value="failed" className="flex-1 rounded-full data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55 small-caps text-[10px]">failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-5 space-y-2">
          <AnimatePresence>
            {txns.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 text-white/35 small-caps"
                data-testid="transactions-empty"
              >
                no transactions yet
              </motion.div>
            )}
            {txns.map((tx) => (
              <motion.button
                key={tx.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                onClick={() => setSelected(tx)}
                className="w-full text-left flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors px-4 py-3"
                data-testid="transaction-row"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${tx.direction === "in" ? "bg-[#F7931A]/10 text-[#F7931A]" : "bg-white/[0.06] text-white/80"}`}>
                    {tx.direction === "in" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="text-white/90 text-sm">
                      {tx.direction === "in" ? "Received" : "Sent"}
                      {tx.kind === "internal_transfer" ? " (internal)" : ""}
                    </div>
                    <div className="text-white/40 text-[11px] truncate max-w-[180px]">
                      {tx.counterparty || "\u2014"} · {formatRelativeTime(tx.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm tabular-nums ${tx.direction === "in" ? "text-[#F7931A]" : "text-white/90"}`}
                    data-testid="transaction-row-amount"
                  >
                    {tx.direction === "in" ? "+" : "−"}
                    {formatSats(tx.amount_sats)}
                  </div>
                  <div className="text-[10px] small-caps text-white/40 mt-0.5" data-testid="transaction-row-status">
                    {tx.status}
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <TransactionDetailSheet tx={selected} onOpenChange={() => setSelected(null)} />
    </div>
  );
}
