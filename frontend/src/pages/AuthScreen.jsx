import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrandMark from "@/components/BrandMark";
import PinDots from "@/components/PinDots";
import NumericPad from "@/components/NumericPad";
import { api } from "@/lib/api";

const PIN_LENGTH = 6;

export default function AuthScreen() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const [step, setStep] = useState("username"); // username | pin | pin_confirm
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const validUsername = /^[a-z0-9_]{3,20}$/.test(username);

  const onContinue = async () => {
    if (!validUsername) {
      toast.error("Username must be 3-20 chars, lowercase letters/numbers/_ only");
      return;
    }
    if (mode === "signup") {
      try {
        setBusy(true);
        const r = await api.get(`/users/check/${username}`);
        if (!r.data.available) {
          toast.error("Username already taken");
          return;
        }
        setStep("pin");
      } catch {
        toast.error("Could not check username");
      } finally {
        setBusy(false);
      }
    } else {
      setStep("pin");
    }
  };

  const onPinKey = (key) => {
    if (step === "pin") {
      if (key === "del") setPin((p) => p.slice(0, -1));
      else if (pin.length < PIN_LENGTH) setPin((p) => p + key);
    } else {
      if (key === "del") setPinConfirm((p) => p.slice(0, -1));
      else if (pinConfirm.length < PIN_LENGTH) setPinConfirm((p) => p + key);
    }
  };

  const submit = async (finalPin) => {
    try {
      setBusy(true);
      if (mode === "signup") {
        await signup(username, finalPin);
        toast.success("Welcome to Satoshi");
      } else {
        await login(username, finalPin);
      }
      navigate("/", { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "Auth failed";
      toast.error(typeof msg === "string" ? msg : "Auth failed");
      setPin("");
      setPinConfirm("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setBusy(false);
    }
  };

  // auto-advance when pin filled
  if (step === "pin" && pin.length === PIN_LENGTH && !busy) {
    if (mode === "login") {
      submit(pin);
    } else {
      // go to confirm
      setTimeout(() => setStep("pin_confirm"), 200);
    }
  }
  if (step === "pin_confirm" && pinConfirm.length === PIN_LENGTH && !busy) {
    if (pinConfirm !== pin) {
      toast.error("PINs don't match");
      setPin("");
      setPinConfirm("");
      setStep("pin");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      submit(pin);
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      <div className="mx-auto w-full max-w-[440px] px-5 pt-6 pb-10">
        <div className="flex items-center justify-center h-12">
          <BrandMark />
        </div>

        <div className="pt-16 pb-6 text-center relative">
          <div className="absolute inset-0 hero-vignette pointer-events-none" aria-hidden />
          <div className="small-caps text-white/55">
            {mode === "signup" ? "create your wallet" : "welcome back"}
          </div>
          <div className="mt-3 font-display text-4xl text-white/95">
            {mode === "signup" ? "start with a username" : "sign in"}
          </div>
          <p className="mt-3 text-white/45 text-sm">
            {mode === "signup"
              ? "Your lightning address will be username@satoshi.app"
              : "Use your username and 6-digit PIN to continue"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "username" && (
            <motion.div
              key="username"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="text-white/35">@</span>
                <Input
                  data-testid="auth-username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="satoshi"
                  className="bg-transparent border-0 px-0 text-white placeholder:text-white/30 focus-visible:ring-0 text-base"
                  maxLength={20}
                  autoFocus
                />
                {username && (
                  <span className="text-white/35 text-xs whitespace-nowrap">@satoshi.app</span>
                )}
              </div>

              <Button
                data-testid="auth-continue-button"
                onClick={onContinue}
                disabled={!validUsername || busy}
                className="w-full h-12 rounded-full bg-[#F7931A] hover:bg-[#FF9F2E] text-black font-medium transition-colors disabled:opacity-40"
              >
                continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <button
                type="button"
                data-testid="auth-toggle-mode"
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                className="w-full text-center small-caps text-white/45 hover:text-white/80 transition-colors py-2"
              >
                {mode === "signup" ? "i already have an account" : "create a new wallet"}
              </button>
            </motion.div>
          )}

          {(step === "pin" || step === "pin_confirm") && (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <div className="text-center small-caps text-white/55">
                {mode === "signup"
                  ? step === "pin"
                    ? "create a 6-digit PIN"
                    : "confirm your PIN"
                  : "enter your PIN"}
              </div>
              <PinDots
                length={PIN_LENGTH}
                value={step === "pin" ? pin : pinConfirm}
                shake={shake}
                testid="auth-pin-dots"
              />
              <NumericPad onKey={onPinKey} testidPrefix="auth-pin" disabled={busy} />
              <button
                type="button"
                onClick={() => {
                  setPin("");
                  setPinConfirm("");
                  setStep("username");
                }}
                className="w-full text-center small-caps text-white/45 hover:text-white/80 transition-colors py-2"
                data-testid="auth-back-button"
              >
                ← change username
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
