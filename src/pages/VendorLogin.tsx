import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Eye, EyeOff, LogIn, ArrowRight, Mail, KeyRound, CheckCircle } from "lucide-react";

type Mode = "login" | "set-password" | "forgot-password";

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: any;
    handleGoogleCredential?: (response: { credential: string }) => void;
  }
}

export default function VendorLogin() {
  const { login, vendor } = useVendorAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPassSuccess, setSetPassSuccess] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await login(email, password, rememberMe);
    if (result.success) {
      setLocation("/vendor/dashboard");
    } else {
      setError(result.error || "Login failed");
    }
    setLoading(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/vendor/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Failed to set password"); }
      else { setSetPassSuccess(true); setTimeout(() => { setMode("login"); setSetPassSuccess(false); }, 2000); }
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await fetch("/api/vendor/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch { setError("Connection error"); }
    finally { setLoading(false); }
  };

  const handleGoogleResponse = async (response: { credential: string }) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/vendor/google-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Google login failed"); setLoading(false); return; }
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("vendorToken", data.token);
      window.location.href = "/vendor/dashboard";
    } catch { setError("Google login failed"); setLoading(false); }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    window.handleGoogleCredential = handleGoogleResponse;
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  if (vendor) {
    setLocation("/vendor/dashboard");
    return null;
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-card flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
              {mode === "forgot-password"
                ? <Mail className="w-8 h-8" />
                : mode === "set-password"
                ? <KeyRound className="w-8 h-8" />
                : <LogIn className="w-8 h-8" />}
            </div>
            <h1 className="text-3xl font-display mb-2">
              {mode === "login" ? "Artisan Portal"
                : mode === "set-password" ? "Set Your Password"
                : "Reset Password"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "login" ? "Sign in to manage your products and orders"
                : mode === "set-password" ? "Create a password to access your account"
                : "Enter your email to receive a reset link"}
            </p>
          </div>

          <div className="bg-background rounded-3xl p-8 shadow-xl shadow-black/5 border border-border">
            {error && (
              <div className="mb-5 p-3 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            {setPassSuccess && (
              <div className="mb-5 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
                Password set! Redirecting…
              </div>
            )}

            {mode === "login" && (
              <>
                <form onSubmit={handleLogin} className="space-y-5">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPass(x => !x)}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="rounded border-border w-4 h-4 accent-primary"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => { setMode("forgot-password"); setForgotEmail(email); setError(""); }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                    Sign In <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>

                {GOOGLE_CLIENT_ID && (
                  <>
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground font-medium">or continue with</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div id="g_id_onload" data-client_id={GOOGLE_CLIENT_ID} data-callback="handleGoogleCredential" data-auto_prompt="false" />
                    <div className="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline" data-text="continue_with" data-size="large" data-width="368" />
                  </>
                )}

                <div className="mt-5 pt-4 border-t border-border text-center space-y-2">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline block w-full"
                    onClick={() => { setMode("set-password"); setError(""); }}
                  >
                    First time? Set your password
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Not an artisan yet?{" "}
                    <Link href="/register" className="text-primary font-medium hover:underline">
                      Apply to sell
                    </Link>
                  </p>
                </div>
              </>
            )}

            {mode === "set-password" && (
              <form onSubmit={handleSetPassword} className="space-y-5">
                <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input label="New Password (min 8 characters)" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                <Input label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                  Set Password
                </Button>
                <div className="text-center">
                  <button type="button" className="text-sm text-primary hover:underline" onClick={() => { setMode("login"); setError(""); }}>
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {mode === "forgot-password" && (
              forgotSent ? (
                <div className="text-center space-y-4 py-4">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
                  <p className="font-semibold text-lg">Check your inbox</p>
                  <p className="text-muted-foreground text-sm">
                    If <strong>{forgotEmail}</strong> is registered, you'll receive a reset link shortly.
                    <br />
                    <span className="text-xs">Don't forget to check your spam folder.</span>
                  </p>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline mt-4 block mx-auto"
                    onClick={() => { setMode("login"); setForgotSent(false); setForgotEmail(""); }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <Input
                    label="Your Email Address"
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    placeholder="The email you registered with"
                  />
                  <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                    Send Reset Link
                  </Button>
                  <div className="text-center">
                    <button type="button" className="text-sm text-primary hover:underline" onClick={() => { setMode("login"); setError(""); }}>
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
