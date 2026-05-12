import { useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

export default function QrScannerModal({ open, onOpenChange, onResult }) {
  const elemId = "qr-scanner-region";
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const start = async () => {
      try {
        const scanner = new Html5Qrcode(elemId, { verbose: false });
        scannerRef.current = scanner;
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          toast.error("No camera available");
          onOpenChange(false);
          return;
        }
        // prefer back camera
        const cam = cameras.find((c) => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1];
        if (cancelled) return;
        await scanner.start(
          cam.id,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            onResult?.(decodedText);
            stop();
          },
          () => {} // ignore per-frame errors
        );
      } catch (e) {
        toast.error("Could not start camera");
        onOpenChange(false);
      }
    };
    const stop = async () => {
      try {
        if (scannerRef.current) {
          await scannerRef.current.stop().catch(() => {});
          await scannerRef.current.clear().catch(() => {});
          scannerRef.current = null;
        }
      } catch {}
    };
    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, onOpenChange, onResult]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[440px] p-0 bg-black border-white/10 text-white overflow-hidden"
        data-testid="qr-scanner-modal"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="small-caps text-white/70">scan QR</div>
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            data-testid="qr-scanner-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <div id={elemId} className="w-full aspect-square bg-black" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="h-60 w-60 border-2 border-[#F7931A] rounded-2xl" />
          </div>
        </div>
        <div className="p-4 text-center small-caps text-white/45">
          align QR code within the orange frame
        </div>
      </DialogContent>
    </Dialog>
  );
}
