import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Share2, Zap, AtSign, CheckCircle2 } from "lucide-react";
import NumericPad from "@/components/NumericPad";
import { api, copyToClipboard, formatSats } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ReceiveSheet({ open, onOpenChange }) {
  const { user, refreshBalance, satsUsdValue } = useAuth();
  const [tab, setTab] = useState("invoice");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setAmount("");
        setMemo("");
        setInvoice(null);
        setPaid(false);
        setTab("invoice");
      }, 220);
    }
  }, [open]);

  // poll status
  useEffect(() => {
    if (!invoice || paid) return;
    const id = setInterval(async () => {
      try {
        const r = await api.get(`/receive/status/${invoice.payment_hash}`);
        if (r.data.paid) {
          setPaid(true);
          refreshBalance();
          toast.success(`Received ${formatSats(invoice.amount_sats)} sats`);
          clearInterval(id);
        }
      } catch {}
    }, 2500);
    return () => clearInterval(id);
  }, [invoice, paid, refreshBalance]);

  const onPad = (k) => {
    if (k === "del") return setAmount((s) => s.slice(0, -1));
    if (k === ".") return;
    if (amount === "" && k === "0") return;
    if (amount.length >= 10) return;
    setAmount((s) => s + k);
  };

  const generate = async () => {
    const sats = parseInt(amount, 10);
    if (!sats || sats <= 0) {
      toast.error("Enter an amount");
      return;
    }
    try {
      setBusy(true);
      const r = await api.post("/receive/invoice", { amount_sats: sats, memo });
      setInvoice(r.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not create invoice");
    } finally {
      setBusy(false);
    }
  };

  const usd = satsUsdValue(parseInt(amount || "0", 10));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[#0a0a0a] border-t border-white/10 text-white rounded-t-3xl p-0 max-w-[440px] mx-auto h-[92vh] sm:h-[88vh]"
        data-testid="receive-sheet"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <button
            onClick={() => (invoice ? setInvoice(null) : onOpenChange(false))}
            className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            data-testid="receive-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="small-caps text-white/70">receive</div>
          <div className="w-9" />
        </div>

        <div className="px-5 pt-3 pb-6 h-[calc(100%-56px)] overflow-y-auto no-scrollbar">
          {!invoice && (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full bg-white/[0.04] border border-white/10 rounded-full p-1 h-10">
                <TabsTrigger
                  value="invoice"
                  className="flex-1 rounded-full data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55 small-caps text-[10px]"
                  data-testid="receive-invoice-tab"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  invoice
                </TabsTrigger>
                <TabsTrigger
                  value="address"
                  className="flex-1 rounded-full data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55 small-caps text-[10px]"
                  data-testid="receive-lightning-address-tab"
                >
                  <AtSign className="h-3 w-3 mr-1" />
                  lightning address
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invoice" className="mt-6 space-y-5">
                <div className="text-center">
                  <div className="small-caps text-white/45">enter amount (sats)</div>
                  <div
                    className="mt-3 font-display text-[64px] leading-none tabular-nums"
                    data-testid="receive-amount-display"
                  >
                    {amount || "0"}
                  </div>
                  <div className="mt-1 text-white/45 text-sm tabular-nums">
                    ≈ ${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <Input
                  data-testid="receive-memo-input"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value.slice(0, 100))}
                  placeholder="memo (optional)"
                  className="bg-white/[0.04] border-white/10 rounded-2xl h-12 text-white placeholder:text-white/30"
                />

                <NumericPad onKey={onPad} testidPrefix="receive-pad" />

                <Button
                  onClick={generate}
                  disabled={!amount || busy}
                  className="w-full h-12 rounded-full bg-[#F7931A] hover:bg-[#FF9F2E] text-black font-medium disabled:opacity-40"
                  data-testid="receive-generate-invoice-button"
                >
                  {busy ? "generating..." : "generate invoice"}
                </Button>
              </TabsContent>

              <TabsContent value="address" className="mt-6 space-y-5">
                <div className="text-center">
                  <div className="small-caps text-white/45">your lightning address</div>
                  <div className="mt-3 font-display text-3xl break-all" data-testid="receive-address-display">
                    {user?.lightning_address}
                  </div>
                </div>

                <div
                  className="mx-auto p-5 bg-white rounded-2xl flex items-center justify-center w-fit"
                  data-testid="receive-address-qr"
                >
                  <QRCodeCanvas value={user?.lightning_address || ""} size={220} bgColor="#ffffff" fgColor="#000000" />
                </div>

                <p className="text-center text-white/45 text-sm">
                  Share with anyone to receive Bitcoin via Lightning. Works with most wallets and exchanges that support Lightning Addresses.
                </p>

                <Button
                  onClick={async () => {
                    const ok = await copyToClipboard(user?.lightning_address || "");
                    if (ok) toast.success("Address copied");
                  }}
                  className="w-full h-12 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white"
                  data-testid="receive-copy-address-button"
                >
                  <Copy className="h-4 w-4 mr-2" /> copy address
                </Button>
              </TabsContent>
            </Tabs>
          )}

          <AnimatePresence>
            {invoice && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-5"
                data-testid="invoice-card"
              >
                <div className="text-center">
                  <div className="small-caps text-white/45">scan or copy to receive</div>
                  <div className="mt-2 font-display text-5xl tabular-nums">{formatSats(invoice.amount_sats)}</div>
                  <div className="mt-1 text-white/45 text-sm small-caps">sats</div>
                  {invoice.memo && <div className="mt-1 text-white/50 text-xs">{invoice.memo}</div>}
                </div>

                <div className="mx-auto p-4 bg-white rounded-2xl w-fit relative">
                  <QRCodeCanvas
                    value={invoice.bolt11}
                    size={240}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    data-testid="invoice-qr"
                  />
                  {paid && (
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white"
                      data-testid="invoice-paid-state"
                    >
                      <CheckCircle2 className="h-14 w-14 text-[#F7931A]" />
                      <div className="mt-3 small-caps text-white">paid</div>
                    </motion.div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="small-caps text-white/45 mb-1">bolt11 invoice</div>
                  <div
                    className="font-mono text-[11px] leading-5 text-white/70 break-all"
                    data-testid="invoice-string"
                  >
                    {invoice.bolt11}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={async () => {
                      const ok = await copyToClipboard(invoice.bolt11);
                      if (ok) toast.success("Invoice copied");
                    }}
                    className="h-12 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white"
                    data-testid="invoice-copy-button"
                  >
                    <Copy className="h-4 w-4 mr-2" /> copy
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        if (navigator.share) {
                          await navigator.share({ title: "Lightning Invoice", text: invoice.bolt11 });
                        } else {
                          await copyToClipboard(invoice.bolt11);
                          toast.success("Copied to clipboard");
                        }
                      } catch {}
                    }}
                    className="h-12 rounded-full bg-[#F7931A] hover:bg-[#FF9F2E] text-black"
                    data-testid="invoice-share-button"
                  >
                    <Share2 className="h-4 w-4 mr-2" /> share
                  </Button>
                </div>

                <div className="text-center small-caps text-white/40">
                  {paid ? "payment received" : "waiting for payment..."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
