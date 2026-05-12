import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ScanLine, Zap, CheckCircle2, XCircle, Clipboard } from "lucide-react";
import NumericPad from "@/components/NumericPad";
import PinDots from "@/components/PinDots";
import QrScannerModal from "@/components/QrScannerModal";
import { api, formatSats } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const PIN_LENGTH = 6;

export default function SendSheet({ open, onOpenChange }) {
  const { refreshBalance, satsUsdValue, balance } = useAuth();
  // steps: input -> decoded (amount entry if needed) -> pin -> result
  const [step, setStep] = useState("input");
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [result, setResult] = useState(null); // { ok, message, kind }
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("input");
        setInput("");
        setDecoded(null);
        setAmount("");
        setMemo("");
        setPin("");
        setResult(null);
      }, 220);
    }
  }, [open]);

  const doDecode = async (rawInput) => {
    const data = (rawInput || input || "").trim();
    if (!data) {
      toast.error("Paste an invoice, lightning address, or username");
      return;
    }
    try {
      setBusy(true);
      const r = await api.post("/send/decode", { data });
      setDecoded(r.data);
      if (r.data.amount_sats && r.data.fixed_amount) {
        setAmount(String(r.data.amount_sats));
      }
      setStep("decoded");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not decode");
    } finally {
      setBusy(false);
    }
  };

  const onPad = (k) => {
    if (k === "del") return setAmount((s) => s.slice(0, -1));
    if (k === ".") return;
    if (amount === "" && k === "0") return;
    if (amount.length >= 10) return;
    setAmount((s) => s + k);
  };

  const onPinKey = (k) => {
    if (k === "del") return setPin((p) => p.slice(0, -1));
    if (pin.length < PIN_LENGTH) setPin((p) => p + k);
  };

  const proceedToPin = () => {
    const sats = parseInt(amount, 10);
    if (!sats || sats <= 0) {
      toast.error("Enter an amount");
      return;
    }
    if (sats > balance) {
      toast.error("Insufficient balance");
      return;
    }
    setStep("pin");
  };

  // auto submit when pin filled
  useEffect(() => {
    if (step !== "pin" || pin.length !== PIN_LENGTH || busy) return;
    (async () => {
      try {
        setBusy(true);
        const sats = parseInt(amount, 10);
        const r = await api.post("/send/pay", {
          data: (decoded?.bolt11 || decoded?.destination || input).trim(),
          amount_sats: sats,
          pin,
          memo,
        });
        setResult({ ok: true, message: "Payment sent", kind: r.data.kind });
        refreshBalance();
        toast.success("Sent!");
        setStep("result");
      } catch (e) {
        const msg = e?.response?.data?.detail || "Payment failed";
        if (e?.response?.status === 401) {
          setPin("");
          setShake(true);
          setTimeout(() => setShake(false), 500);
          toast.error("Incorrect PIN");
        } else {
          setResult({ ok: false, message: msg });
          setStep("result");
        }
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInput(text.trim());
      }
    } catch {
      toast.error("Clipboard not accessible");
    }
  };

  const onScanResult = (text) => {
    setScannerOpen(false);
    if (!text) return;
    setInput(text);
    // auto-decode
    setTimeout(() => doDecode(text), 50);
  };

  const usd = satsUsdValue(parseInt(amount || "0", 10));

  const recipientLabel = decoded?.kind === "internal_username"
    ? `@${decoded?.internal_recipient?.username} · internal`
    : decoded?.kind === "lightning_address"
      ? decoded?.destination
      : "Lightning Invoice";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="bg-[#0a0a0a] border-t border-white/10 text-white rounded-t-3xl p-0 max-w-[440px] mx-auto h-[92vh] sm:h-[88vh]"
          data-testid="send-sheet"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <button
              onClick={() => {
                if (step === "input" || step === "result") onOpenChange(false);
                else if (step === "decoded") setStep("input");
                else if (step === "pin") { setPin(""); setStep("decoded"); }
              }}
              className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
              data-testid="send-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="small-caps text-white/70">send</div>
            <div className="w-9" />
          </div>

          <div className="px-5 pt-3 pb-6 h-[calc(100%-56px)] overflow-y-auto no-scrollbar">
            <AnimatePresence mode="wait">
              {step === "input" && (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="text-center small-caps text-white/45 mt-4">paste invoice, lightning address, or @username</div>
                  <textarea
                    data-testid="send-invoice-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="lnbc... or alice@satoshi.app or @alice"
                    rows={5}
                    className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white font-mono text-xs placeholder:text-white/30 focus:outline-none focus:border-white/20"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={pasteFromClipboard}
                      className="h-12 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white"
                      data-testid="send-paste-button"
                    >
                      <Clipboard className="h-4 w-4 mr-2" /> paste
                    </Button>
                    <Button
                      onClick={() => setScannerOpen(true)}
                      className="h-12 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white"
                      data-testid="send-scan-qr-button"
                    >
                      <ScanLine className="h-4 w-4 mr-2" /> scan QR
                    </Button>
                  </div>
                  <Button
                    onClick={() => doDecode()}
                    disabled={!input.trim() || busy}
                    className="w-full h-12 rounded-full bg-[#F7931A] hover:bg-[#FF9F2E] text-black font-medium disabled:opacity-40"
                    data-testid="send-continue-button"
                  >
                    {busy ? "decoding..." : "continue"}
                  </Button>
                </motion.div>
              )}

              {step === "decoded" && decoded && (
                <motion.div key="decoded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5" data-testid="send-decode-summary">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                    <div className="small-caps text-white/45">to</div>
                    <div className="mt-1 text-white/90 break-all" data-testid="send-recipient">{recipientLabel}</div>
                    {decoded.description && (
                      <div className="mt-2 text-white/50 text-xs italic">“{decoded.description}”</div>
                    )}
                  </div>

                  {decoded.fixed_amount ? (
                    <div className="text-center">
                      <div className="small-caps text-white/45">amount</div>
                      <div className="mt-2 font-display text-[64px] leading-none tabular-nums">{formatSats(decoded.amount_sats)}</div>
                      <div className="mt-1 text-white/45 text-sm small-caps">sats</div>
                      <div className="mt-1 text-white/40 text-xs tabular-nums">
                        ≈ ${satsUsdValue(decoded.amount_sats).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="small-caps text-white/45">enter amount (sats)</div>
                        <div className="mt-2 font-display text-[64px] leading-none tabular-nums" data-testid="send-amount-display">{amount || "0"}</div>
                        <div className="mt-1 text-white/40 text-xs tabular-nums">
                          ≈ ${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <Input
                        value={memo}
                        onChange={(e) => setMemo(e.target.value.slice(0, 100))}
                        placeholder="memo (optional)"
                        className="bg-white/[0.04] border-white/10 rounded-2xl h-12 text-white placeholder:text-white/30"
                        data-testid="send-memo-input"
                      />
                      <NumericPad onKey={onPad} testidPrefix="send-pad" />
                    </>
                  )}

                  <div className="text-xs text-white/40 text-center">
                    your balance: <span className="text-white/70 tabular-nums">{formatSats(balance)} sats</span>
                  </div>

                  <Button
                    onClick={proceedToPin}
                    disabled={busy || !(decoded.fixed_amount ? decoded.amount_sats : parseInt(amount || "0", 10) > 0)}
                    className="w-full h-12 rounded-full bg-[#F7931A] hover:bg-[#FF9F2E] text-black font-medium disabled:opacity-40"
                    data-testid="send-confirm-button"
                  >
                    review &amp; pay
                  </Button>
                </motion.div>
              )}

              {step === "pin" && (
                <motion.div key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6" data-testid="pin-entry-sheet">
                  <div className="text-center small-caps text-white/55 mt-4">enter PIN to confirm</div>
                  <div className="text-center">
                    <div className="font-display text-4xl tabular-nums">{formatSats(decoded?.fixed_amount ? decoded.amount_sats : parseInt(amount, 10))}</div>
                    <div className="small-caps text-white/45 mt-1">sats → {recipientLabel}</div>
                  </div>
                  <PinDots length={PIN_LENGTH} value={pin} shake={shake} testid="pin-entry-otp" />
                  <NumericPad onKey={onPinKey} testidPrefix="send-pin" disabled={busy} />
                </motion.div>
              )}

              {step === "result" && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 mt-10 text-center" data-testid="send-result-state">
                  {result?.ok ? (
                    <>
                      <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-full bg-[#F7931A]/15 flex items-center justify-center">
                          <CheckCircle2 className="h-12 w-12 text-[#F7931A]" />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl">payment sent</div>
                        <div className="mt-2 text-white/50 text-sm">
                          {formatSats(decoded?.fixed_amount ? decoded.amount_sats : parseInt(amount, 10))} sats to {recipientLabel}
                        </div>
                        {result?.kind === "internal_transfer" && (
                          <div className="mt-2 inline-block rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 text-[10px] small-caps text-white/65">
                            <Zap className="h-3 w-3 inline mr-1 text-[#F7931A]" /> instant internal transfer
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-full bg-red-500/15 flex items-center justify-center">
                          <XCircle className="h-12 w-12 text-red-400" />
                        </div>
                      </div>
                      <div>
                        <div className="font-display text-3xl">payment failed</div>
                        <div className="mt-2 text-white/50 text-sm break-words">{result?.message}</div>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={() => onOpenChange(false)}
                    className="w-full h-12 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white"
                    data-testid="send-result-close"
                  >
                    done
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>

      <QrScannerModal open={scannerOpen} onOpenChange={setScannerOpen} onResult={onScanResult} />
    </>
  );
}
