import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { KeyRound, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    setToken(t);
    if (!t) setInvalidToken(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/vendor/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.error?.includes("expired") || data.error?.includes("Invalid")) {
          setInvalidToken(true);
        } else {
          setError(data.error || "Failed to reset password");
        }
      } else {
        setSuccess(true);
        setTimeout(() => setLocation("/vendor/login"), 3000);
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-card flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display mb-2">Create New Password</h1>
            <p className="text-muted-foreground text-sm">Enter and confirm your new password below.</p>
          </div>

          <div className="bg-background rounded-3xl p-8 shadow-xl shadow-black/5 border border-border">
            {invalidToken ? (
              <div className="text-center space-y-4 py-4">
                <AlertCircle className="w-14 h-14 text-destructive mx-auto" />
                <p className="font-semibold text-lg">Link expired or invalid</p>
                <p className="text-muted-foreground text-sm">
                  This reset link has expired or was already used. Please request a new one.
                </p>
                <Link href="/vendor/login">
                  <Button className="mt-4">Request New Reset Link</Button>
                </Link>
              </div>
            ) : success ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
                <p className="font-semibold text-lg">Password updated!</p>
                <p className="text-muted-foreground text-sm">
                  Your password has been changed successfully. Redirecting to login…
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}
                <Input
                  label="New Password (min 8 characters)"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                  Reset Password
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
