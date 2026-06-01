import { useState, useEffect, useCallback } from "react";

export type VendorUser = {
  id: number;
  name: string;
  email: string;
  country: string;
  city?: string | null;
  bio?: string | null;
  status: string;
  isApproved: boolean;
  craftSpecialty: string;
  avatarUrl?: string | null;
  rating?: number | null;
  youtubeUrl?: string | null;
};

const TOKEN_KEY = "vendorToken";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function storeToken(token: string, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function useVendorAuth() {
  const [vendor, setVendor] = useState<VendorUser | null>(null);
  const [loading, setLoading] = useState(true);

  const token = getStoredToken();

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { "x-vendor-token": token } : {}),
  }), [token]);

  const fetchMe = useCallback(async () => {
    const t = getStoredToken();
    if (!t) { setLoading(false); return; }
    try {
      const r = await fetch("/api/vendor/me", { headers: { "x-vendor-token": t } });
      if (r.ok) {
        setVendor(await r.json());
      } else {
        clearToken();
        setVendor(null);
      }
    } catch {
      setVendor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  async function login(email: string, password: string, rememberMe = true): Promise<{ success: boolean; error?: string }> {
    try {
      const r = await fetch("/api/vendor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) return { success: false, error: data.error || "Login failed" };
      storeToken(data.token, rememberMe);
      setVendor(data.vendor);
      return { success: true };
    } catch {
      return { success: false, error: "Connection error" };
    }
  }

  async function logout() {
    const t = getStoredToken();
    if (t) {
      await fetch("/api/vendor/logout", { method: "POST", headers: { "x-vendor-token": t } }).catch(() => {});
    }
    clearToken();
    setVendor(null);
  }

  return { vendor, loading, login, logout, getHeaders, refetch: fetchMe };
}
