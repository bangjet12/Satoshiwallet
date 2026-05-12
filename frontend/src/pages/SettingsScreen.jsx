import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Copy, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/api";

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { user, hideBalance, toggleHideBalance, logout } = useAuth();
  const [copyOk, setCopyOk] = useState(false);

  const copyAddress = async () => {
    const ok = await copyToClipboard(user?.lightning_address || "");
    if (ok) {
      setCopyOk(true);
      toast.success("Lightning address copied");
      setTimeout(() => setCopyOk(false), 1200);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white" data-testid="settings-screen">
      <div className="mx-auto w-full max-w-[440px] px-5 pt-6 pb-16">
        <div className="flex items-center justify-between h-12">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
            data-testid="settings-back"
            aria-label="back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="small-caps text-white/70">settings</div>
          <div className="w-9" />
        </div>

        <div className="mt-10 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/80 text-2xl font-display">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="mt-3 small-caps text-white/55">signed in as</div>
          <div className="font-display text-3xl mt-1">@{user?.username}</div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="small-caps text-white/45">lightning address</div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-white/90 text-sm truncate" data-testid="settings-lightning-address">
                {user?.lightning_address}
              </span>
              <button
                onClick={copyAddress}
                className="h-8 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs text-white/85 flex items-center gap-1 transition-colors"
                data-testid="settings-copy-lnaddress"
              >
                <Copy className="h-3.5 w-3.5" />
                {copyOk ? "copied" : "copy"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-white/90 text-sm flex items-center gap-2">
                {hideBalance ? <EyeOff className="h-4 w-4 text-white/60" /> : <Eye className="h-4 w-4 text-white/60" />}
                hide balance
              </div>
              <div className="text-white/45 text-xs mt-0.5">Show •••• instead of your USD amount</div>
            </div>
            <Switch
              checked={hideBalance}
              onCheckedChange={toggleHideBalance}
              data-testid="settings-hide-balance-toggle"
            />
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/auth", { replace: true });
            }}
            className="w-full mt-4 h-12 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white/85 transition-colors flex items-center justify-center gap-2"
            data-testid="settings-logout-button"
          >
            <LogOut className="h-4 w-4" />
            log out
          </button>
        </div>
      </div>
    </div>
  );
}
