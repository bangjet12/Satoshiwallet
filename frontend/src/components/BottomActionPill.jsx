import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function BottomActionPill({ onReceive, onSend }) {
  return (
    <div
      data-testid="bottom-action-pill"
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(18px+env(safe-area-inset-bottom))] z-30 w-[min(440px,calc(100vw-32px))]"
    >
      <div className="relative">
        <div className="absolute inset-0 btc-glow rounded-full blur-2xl pointer-events-none" aria-hidden />
        <div className="relative grid grid-cols-2 rounded-full bg-[#101010] border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.65)] overflow-hidden">
          <button
            data-testid="bottom-action-receive-button"
            onClick={onReceive}
            className="h-16 px-6 flex items-center justify-center gap-2 text-white/90 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors"
          >
            <ArrowDownLeft className="h-5 w-5 text-[#F7931A]" />
            <span className="small-caps text-[12px] text-white">receive</span>
          </button>
          <div className="absolute left-1/2 top-3 bottom-3 w-px bg-white/10" />
          <button
            data-testid="bottom-action-send-button"
            onClick={onSend}
            className="h-16 px-6 flex items-center justify-center gap-2 text-white/90 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors"
          >
            <span className="small-caps text-[12px] text-white">send</span>
            <ArrowUpRight className="h-5 w-5 text-[#F7931A]" />
          </button>
        </div>
      </div>
    </div>
  );
}
