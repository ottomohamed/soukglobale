const TOKEN_KEY = "sg_buyer_token";
const BUYER_KEY = "sg_buyer_info";

export type BuyerInfo = { id: number; name: string; email: string };

export function getBuyerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getBuyerInfo(): BuyerInfo | null {
  const raw = localStorage.getItem(BUYER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveBuyerSession(token: string, buyer: BuyerInfo) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(BUYER_KEY, JSON.stringify(buyer));
}

export function clearBuyerSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(BUYER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getBuyerToken() && !!getBuyerInfo();
}
