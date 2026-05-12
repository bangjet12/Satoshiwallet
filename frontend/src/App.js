import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import AuthScreen from "@/pages/AuthScreen";
import WalletHome from "@/pages/WalletHome";
import TransactionsScreen from "@/pages/TransactionsScreen";
import SettingsScreen from "@/pages/SettingsScreen";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0a0a] text-white/40 text-xs small-caps">
        loading
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <div className="App min-h-dvh bg-[#0a0a0a] text-white">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/auth"
              element={
                <PublicOnly>
                  <AuthScreen />
                </PublicOnly>
              }
            />
            <Route
              path="/"
              element={
                <Protected>
                  <WalletHome />
                </Protected>
              }
            />
            <Route
              path="/transactions"
              element={
                <Protected>
                  <TransactionsScreen />
                </Protected>
              }
            />
            <Route
              path="/settings"
              element={
                <Protected>
                  <SettingsScreen />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: "#161616",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
