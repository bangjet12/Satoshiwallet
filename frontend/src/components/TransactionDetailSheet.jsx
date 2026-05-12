import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard, formatSats } from "@/lib/api";
import { toast } from "sonner";

export default function TransactionDetailSheet({ tx, onOpenChange }) {
  const open = !!tx;
  if (!tx) return null;
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onOpenChange()}>
      <SheetContent
        side="bottom"
        className="bg-[#0a0a0a] border-t border-white/10 text-white rounded-t-3xl p-0 max-w-[440px] mx-auto"
        data-testid="transaction-detail-sheet"
      >
        <div className="px-5 pt-6 pb-8 space-y-4">
          <div className="text-center">
            <div className="small-caps text-white/45">
              {tx.direction === "in" ? "received" : "sent"}
              {tx.kind === "internal_transfer" ? " · internal" : ""}
            </div>
            <div className={`mt-2 font-display text-5xl tabular-nums ${tx.direction === "in" ? "text-[#F7931A]" : "text-white"}`}>
              {tx.direction === "in" ? "+" : "−"}
              {formatSats(tx.amount_sats)}
            </div>
            <div className="small-caps text-white/45 mt-1">sats</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
            <Row label="status" value={tx.status} />
            <Row label="counterparty" value={tx.counterparty || "—"} mono />
            <Row label="memo" value={tx.memo || "—"} />
            <Row label="date" value={new Date(tx.created_at).toLocaleString()} />
            {tx.payment_hash && <Row label="payment hash" value={tx.payment_hash} mono tiny />}
          </div>

          {tx.bolt11 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="small-caps text-white/45 mb-1">invoice</div>
              <div className="font-mono text-[10px] leading-4 text-white/65 break-all">{tx.bolt11}</div>
              <Button
                onClick={async () => {
                  const ok = await copyToClipboard(tx.bolt11);
                  if (ok) toast.success("Invoice copied");
                }}
                className="mt-3 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white text-xs"
                data-testid="transaction-detail-copy-invoice"
              >
                <Copy className="h-3.5 w-3.5 mr-2" /> copy invoice
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, mono = false, tiny = false }) {
  return (
    <div className="px-4 py-3 flex items-start justify-between gap-4">
      <div className="small-caps text-white/45 pt-0.5">{label}</div>
      <div className={`text-right text-white/85 break-all ${mono ? "font-mono" : ""} ${tiny ? "text-[10px] leading-4" : "text-sm"}`}>
        {value}
      </div>
    </div>
  );
}
