import { Layout } from "@/components/layout/Layout";
import { useListProducts, useListOrders, useCreateProduct } from "@workspace/api-client-react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, CRAFT_CATEGORIES } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Package, Plus, DollarSign, LogOut, Upload, X, CheckCircle, Clock,
  AlertTriangle, Image, Landmark, ArrowDownToLine, CreditCard,
  TrendingUp, ChevronRight, History, Truck, ExternalLink, Weight, BadgeCheck
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { useImageUpload } from "@/hooks/useImageUpload";

const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(80, "الوصف يجب أن يكون 80 حرفاً على الأقل — اذكر المواد، تقنية الصنع، الألوان والاستخدام"),
  priceUsd: z.coerce.number().min(1),
  shippingCostUsd: z.coerce.number().min(0),
  freeShipping: z.boolean().default(false),
  weightKg: z.coerce.number().min(0.01).max(200).optional().or(z.literal("")),
  widthCm: z.coerce.number().min(0.1).max(999).optional().or(z.literal("")),
  heightCm: z.coerce.number().min(0.1).max(999).optional().or(z.literal("")),
  depthCm: z.coerce.number().min(0.1).max(999).optional().or(z.literal("")),
  category: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  stockQuantity: z.coerce.number().min(1)
});

type ProductForm = z.infer<typeof productSchema>;

const MOROCCAN_BANKS = [
  "Attijariwafa Bank","BMCE Bank (Bank of Africa)","Banque Populaire","BMCI",
  "CIH Bank","Crédit Agricole du Maroc","Société Générale Maroc",
  "CFG Bank","Al Barid Bank","Autre banque"
];

const EGYPTIAN_BANKS = [
  "National Bank of Egypt (NBE)","Banque Misr","Commercial International Bank (CIB)",
  "QNB Al Ahli","Arab African International Bank (AAIB)","Banque du Caire",
  "Abu Dhabi Commercial Bank Egypt","HSBC Egypt","Faisal Islamic Bank",
  "Egyptian Gulf Bank","Autre banque"
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending:  { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3.5 h-3.5 mr-1" />, label: "Pending Review" },
    approved: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3.5 h-3.5 mr-1" />, label: "Approved" },
    rejected: { color: "bg-red-100 text-red-800", icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />, label: "Rejected" },
    banned:   { color: "bg-gray-100 text-gray-800", icon: <X className="w-3.5 h-3.5 mr-1" />, label: "Banned" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      {s.icon}{s.label}
    </span>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    paid:     "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

function ImageUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const { uploadImage, uploadState } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    const url = await uploadImage(file);
    if (url) onUploaded(url);
  };

  return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
      >
        {preview ? (
          <img src={preview} className="h-24 mx-auto object-cover rounded-lg" alt="preview" />
        ) : (
          <>
            <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload image</p>
            <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WEBP up to 10MB</p>
          </>
        )}
        {uploadState === "uploading" && <p className="text-xs text-primary mt-2 animate-pulse">Uploading...</p>}
        {uploadState === "done" && <p className="text-xs text-green-600 mt-2 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Uploaded</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
    </div>
  );
}

// ─── Earnings & Payouts Tab ──────────────────────────────────────────────────
function EarningsTab({ vendor }: { vendor: any }) {
  const [balance, setBalance] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const vendorToken = typeof window !== "undefined" ? localStorage.getItem("vendorToken") : null;
  const headers = { "x-vendor-token": vendorToken ?? "", "Content-Type": "application/json" };

  const country = vendor.country?.toLowerCase();
  const isMaroc = country?.includes("maroc") || country?.includes("morocco") || country === "ma";
  const isEgypt = country?.includes("egypt") || country?.includes("egypte") || country === "eg";
  const bankList = isMaroc ? MOROCCAN_BANKS : isEgypt ? EGYPTIAN_BANKS : [];

  // Bank details form
  const [bankName, setBankName] = useState(vendor.bankName ?? "");
  const [bankHolder, setBankHolder] = useState(vendor.bankAccountHolder ?? "");
  const [bankAccount, setBankAccount] = useState(vendor.bankAccountNumber ?? "");
  const [bankIban, setBankIban] = useState(vendor.bankIban ?? "");
  const [bankSwift, setBankSwift] = useState(vendor.bankSwift ?? "");
  const [requestAmount, setRequestAmount] = useState("");
  const [vendorNotes, setVendorNotes] = useState("");

  useEffect(() => {
    setLoadingBalance(true);
    Promise.all([
      fetch("/api/vendor/balance", { headers }).then(r => r.json()),
      fetch("/api/vendor/payout-requests", { headers }).then(r => r.json()),
    ]).then(([b, r]) => {
      setBalance(b);
      setRequests(Array.isArray(r) ? r : []);
    }).catch(() => {}).finally(() => setLoadingBalance(false));
  }, []);

  const handleSubmitRequest = async () => {
    setSubmitMsg(null);
    if (!bankName || !bankHolder || !bankAccount) {
      setSubmitMsg({ type: "err", text: "Please fill in all required bank details." });
      return;
    }
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      setSubmitMsg({ type: "err", text: "Enter a valid amount." });
      return;
    }
    if (balance && amount > balance.available + 0.01) {
      setSubmitMsg({ type: "err", text: `Amount exceeds available balance ($${balance.available.toFixed(2)}).` });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/payout-requests", {
        method: "POST",
        headers,
        body: JSON.stringify({
          amountUsd: amount,
          bankName, bankAccountHolder: bankHolder, bankAccountNumber: bankAccount,
          bankIban, bankSwift,
          bankCountry: vendor.country,
          vendorNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRequests(prev => [data, ...prev]);
      setRequestAmount("");
      setVendorNotes("");
      setShowRequestForm(false);
      setSubmitMsg({ type: "ok", text: "Withdrawal request submitted! The admin will process it within 3-5 business days." });
      // Refresh balance
      fetch("/api/vendor/balance", { headers }).then(r => r.json()).then(setBalance).catch(() => {});
    } catch (err: any) {
      setSubmitMsg({ type: "err", text: err.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBalance) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const available = balance?.available ?? 0;
  const netEarned = balance?.netEarned ?? 0;
  const alreadyRequested = balance?.alreadyRequested ?? 0;

  return (
    <div className="space-y-8">

      {/* ── Balance Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background border border-border rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Net Earned</p>
            <p className="text-2xl font-display">{formatCurrency(netEarned)}</p>
          </div>
        </div>
        <div className="bg-background border border-border rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Requested</p>
            <p className="text-2xl font-display">{formatCurrency(alreadyRequested)}</p>
          </div>
        </div>
        <div className="bg-foreground text-background rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-background/10 text-background flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-background/60 font-semibold uppercase tracking-wider mb-1">Available</p>
            <p className="text-2xl font-display text-primary">{formatCurrency(available)}</p>
          </div>
        </div>
      </div>

      {balance?.confirmedOrdersCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 text-sm">
          No confirmed orders yet. Your balance will appear here once buyers complete their purchases.
        </div>
      )}

      {/* ── Success / Error message ── */}
      {submitMsg && (
        <div className={`p-4 rounded-2xl text-sm font-medium ${submitMsg.type === "ok" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
          {submitMsg.text}
        </div>
      )}

      {/* ── Bank Details ── */}
      <div className="bg-background border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Landmark className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-display">Bank Account Details</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Enter your bank account information to receive wire transfers.
          {isMaroc && " (تحويل بنكي — Morocco)"}
          {isEgypt && " (تحويل بنكي — Egypt)"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bank Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Bank Name <span className="text-destructive">*</span>
            </label>
            {bankList.length > 0 ? (
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm focus:border-primary outline-none"
              >
                <option value="">Select bank</option>
                {bankList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : (
              <input
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm focus:border-primary outline-none"
                placeholder="Bank name"
              />
            )}
          </div>

          {/* Account Holder */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Account Holder Name <span className="text-destructive">*</span>
            </label>
            <input
              value={bankHolder}
              onChange={e => setBankHolder(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm focus:border-primary outline-none"
              placeholder="Full name as on bank account"
            />
          </div>

          {/* Account Number / RIB */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              {isMaroc ? "RIB (Account Number)" : "Account Number"} <span className="text-destructive">*</span>
            </label>
            <input
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm font-mono focus:border-primary outline-none"
              placeholder={isMaroc ? "e.g. 123456789012345678901234" : "Account number"}
            />
          </div>

          {/* IBAN */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              IBAN <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              value={bankIban}
              onChange={e => setBankIban(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm font-mono focus:border-primary outline-none"
              placeholder={isMaroc ? "MA76..." : isEgypt ? "EG38..." : "IBAN"}
            />
          </div>

          {/* SWIFT/BIC */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              SWIFT / BIC Code <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              value={bankSwift}
              onChange={e => setBankSwift(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm font-mono uppercase focus:border-primary outline-none"
              placeholder="e.g. ATBAMAMAMXXX"
            />
          </div>
        </div>
      </div>

      {/* ── Withdrawal Request ── */}
      <div className="bg-background border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display">Request Withdrawal</h3>
          </div>
          {!showRequestForm && (
            <Button
              size="sm"
              onClick={() => setShowRequestForm(true)}
              disabled={available <= 0}
            >
              <Plus className="w-4 h-4 mr-1" /> New Request
            </Button>
          )}
        </div>

        {available <= 0 && !showRequestForm && (
          <p className="text-sm text-muted-foreground">
            No available balance to withdraw. Balance becomes available once your orders are confirmed.
          </p>
        )}

        {showRequestForm && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
              <span className="font-semibold">Available balance:</span>{" "}
              <span className="text-primary font-bold">{formatCurrency(available)}</span>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Amount to Withdraw (USD) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={e => setRequestAmount(e.target.value)}
                  max={available}
                  min="1"
                  step="0.01"
                  className="w-full h-12 rounded-xl border-2 border-border bg-background pl-8 pr-4 text-sm focus:border-primary outline-none"
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                className="mt-1 text-xs text-primary hover:underline"
                onClick={() => setRequestAmount(available.toFixed(2))}
              >
                Withdraw max ({formatCurrency(available)})
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Notes for Admin (optional)</label>
              <textarea
                value={vendorNotes}
                onChange={e => setVendorNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none resize-none"
                placeholder="Any additional information..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSubmitRequest} isLoading={submitting} className="flex-1">
                <ArrowDownToLine className="w-4 h-4 mr-2" /> Submit Withdrawal Request
              </Button>
              <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Request History ── */}
      {requests.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-display">Withdrawal History</h3>
          </div>
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="bg-background border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-lg">{formatCurrency(Number(r.amountUsd))}</span>
                    <PayoutStatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.bankName} · {r.bankAccountHolder}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {r.adminNotes && (
                    <p className="text-xs mt-2 text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                      <span className="font-semibold">Admin:</span> {r.adminNotes}
                    </p>
                  )}
                </div>
                {r.processedAt && (
                  <p className="text-xs text-muted-foreground shrink-0">
                    Processed: {new Date(r.processedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders Tab with Tracking ────────────────────────────────────────────────
function OrdersTab({ orders, getHeaders }: { orders: any[] | undefined; getHeaders: () => Record<string, string> }) {
  const [trackingForms, setTrackingForms] = useState<Record<number, { carrier: string; trackingNumber: string; open: boolean }>>({});
  const [carriers, setCarriers] = useState<{ id: number; name: string; code: string }[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saveMsg, setSaveMsg] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/api/shipping/carriers").then(r => r.json()).then(d => { if (Array.isArray(d)) setCarriers(d); }).catch(() => {});
  }, []);

  const toggleForm = (orderId: number, currentCarrier: string, currentTracking: string) => {
    setTrackingForms(prev => ({
      ...prev,
      [orderId]: prev[orderId]?.open
        ? { ...prev[orderId], open: false }
        : { carrier: currentCarrier || "", trackingNumber: currentTracking || "", open: true }
    }));
  };

  const saveTracking = async (orderId: number) => {
    const form = trackingForms[orderId];
    if (!form?.trackingNumber || !form?.carrier) return;
    setSavingId(orderId);
    try {
      const r = await fetch(`/api/vendor/orders/${orderId}/tracking`, {
        method: "PUT",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: form.trackingNumber, carrierName: form.carrier, status: "shipped" }),
      });
      const data = await r.json();
      if (r.ok) {
        setSaveMsg(prev => ({ ...prev, [orderId]: "✓ Saved! Order marked as shipped." }));
        setTrackingForms(prev => ({ ...prev, [orderId]: { ...prev[orderId], open: false } }));
      } else {
        setSaveMsg(prev => ({ ...prev, [orderId]: data.error || "Save failed" }));
      }
    } catch {
      setSaveMsg(prev => ({ ...prev, [orderId]: "Connection error" }));
    } finally {
      setSavingId(null);
    }
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h2 className="text-2xl font-display mb-6">Your Orders</h2>
      <div className="space-y-4">
        {orders?.map(order => {
          const form = trackingForms[order.id];
          return (
            <div key={order.id} className="bg-background rounded-xl p-6 border border-border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold">Order #{order.id}</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor[order.status] ?? "bg-muted text-muted-foreground"}`}>
                  {order.status}
                </span>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-sm mb-4">
                <p><span className="font-medium">Item:</span> {order.productTitle}</p>
                <p><span className="font-medium">Qty:</span> {order.quantity}</p>
                <p><span className="font-medium">Total:</span> {formatCurrency(order.totalUsd)}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold">Ship to:</p>
                <p className="text-sm text-muted-foreground">{order.buyerName}</p>
                <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                <p className="text-sm text-muted-foreground">{order.buyerCountry}</p>
              </div>

              {/* Tracking info if exists */}
              {order.trackingNumber && !form?.open && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-sm">
                  <Truck className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-green-800">{order.carrierName}</span>
                    <span className="text-green-700"> · {order.trackingNumber}</span>
                  </div>
                </div>
              )}

              {saveMsg[order.id] && !form?.open && (
                <p className="text-xs text-green-700 mb-2">{saveMsg[order.id]}</p>
              )}

              {/* Tracking form */}
              <button
                type="button"
                onClick={() => toggleForm(order.id, order.carrierName ?? "", order.trackingNumber ?? "")}
                className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
              >
                <Truck className="w-4 h-4" />
                {order.trackingNumber ? "Update Tracking" : "Add Tracking Number"}
              </button>

              {form?.open && (
                <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Carrier</label>
                    <select
                      value={form.carrier}
                      onChange={e => setTrackingForms(prev => ({ ...prev, [order.id]: { ...prev[order.id], carrier: e.target.value } }))}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary outline-none"
                    >
                      <option value="">Select carrier</option>
                      {carriers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Tracking Number</label>
                    <input
                      type="text"
                      value={form.trackingNumber}
                      onChange={e => setTrackingForms(prev => ({ ...prev, [order.id]: { ...prev[order.id], trackingNumber: e.target.value } }))}
                      placeholder="e.g. 1Z999AA10123456784"
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono focus:border-primary outline-none"
                    />
                  </div>
                  {saveMsg[order.id] && <p className="text-xs text-destructive">{saveMsg[order.id]}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveTracking(order.id)} isLoading={savingId === order.id} disabled={!form.carrier || !form.trackingNumber}>
                      Save & Mark Shipped
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTrackingForms(prev => ({ ...prev, [order.id]: { ...prev[order.id], open: false } }))}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {(!orders || orders.length === 0) && (
          <div className="bg-background border border-border border-dashed rounded-xl p-12 text-center text-muted-foreground">
            No orders yet. Keep creating!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Description Field with Character Counter ────────────────────────────────
function DescriptionField({ register, errors }: { register: any; errors: any }) {
  const [len, setLen] = useState(0);
  const MIN = 80;
  const reg = register("description");
  return (
    <div>
      <textarea
        {...reg}
        onChange={(e) => { setLen(e.target.value.length); reg.onChange(e); }}
        rows={6}
        className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary resize-none"
        placeholder={`Describe your product in detail — mention:\n• Materials used (e.g. hand-spun wool, natural indigo dye)\n• Craft technique (e.g. hand-knotted on vertical loom)\n• Colors, patterns and their cultural meaning\n• Dimensions and recommended use\n• Time taken to make this piece`}
      />
      <div className="flex items-center justify-between mt-1">
        {errors.description
          ? <p className="text-destructive text-xs">{errors.description.message}</p>
          : <p className="text-xs text-muted-foreground">Be descriptive — international buyers can't touch or see the product in person</p>
        }
        <span className={`text-xs font-mono ml-2 shrink-0 ${len < MIN ? "text-orange-500" : "text-green-600"}`}>
          {len}/{MIN}+
        </span>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { vendor, loading: authLoading, logout, getHeaders } = useVendorAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "earnings">("products");

  const { data: productsData } = useListProducts(
    { vendorId: vendor?.id ?? 0 },
    { query: { enabled: !!vendor?.id } as any }
  );
  const { data: orders } = useListOrders(
    { vendorId: vendor?.id ?? 0 },
    { query: { enabled: !!vendor?.id } as any }
  );

  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { freeShipping: false }
  });

  const isFreeShipping = watch("freeShipping");

  const onSubmit = (data: ProductForm) => {
    if (!vendor?.id) return;
    const submittedShipping = data.freeShipping ? 0 : data.shippingCostUsd;
    createProduct({
      data: {
        ...data,
        shippingCostUsd: submittedShipping,
        vendorId: vendor.id,
        imageUrl: uploadedImageUrl || data.imageUrl || undefined
      }
    }, {
      onSuccess: () => {
        setIsAdding(false);
        setUploadedImageUrl("");
        reset({ freeShipping: false });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }
    });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/vendor/login");
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout>
        <div className="py-32 text-center max-w-md mx-auto px-4">
          <h2 className="text-3xl font-display mb-6">Artisan Portal</h2>
          <p className="text-muted-foreground mb-8">Sign in to manage your products and orders.</p>
          <div className="flex flex-col gap-4">
            <Link href="/vendor/login"><Button className="w-full" size="lg">Sign In</Button></Link>
            <Link href="/register"><Button variant="outline" className="w-full">Register as Artisan</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  const statusMessages: Record<string, string> = {
    pending: "Your application is under review. You can set up your products now — they will go live once approved.",
    rejected: `Your application was not approved. Reason: ${(vendor as any).rejectionReason || "See admin email"}. You may re-apply.`,
    banned: "Your account has been suspended. Please contact support.",
  };

  const totalSales = orders?.reduce((sum, o) => sum + o.totalUsd, 0) || 0;

  const TABS = [
    { id: "products", label: "Products", icon: Package },
    { id: "orders",   label: "Orders",   icon: CreditCard },
    { id: "earnings", label: "Earnings & Payouts", icon: Landmark },
  ] as const;

  return (
    <Layout>
      <div className="bg-card min-h-screen">
        {/* Header */}
        <div className="bg-foreground text-background py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-display mb-1">Welcome back, {vendor.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={vendor.status} />
                <span className="text-background/60 text-sm">{vendor.craftSpecialty} · {vendor.city || vendor.country}</span>
              </div>
            </div>
            <Button variant="outline" className="mt-6 md:mt-0 border-background/20 text-background hover:bg-background/10" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Status warning */}
          {vendor.status !== "approved" && statusMessages[vendor.status] && (
            <div className={`mb-8 p-4 rounded-2xl border text-sm font-medium ${
              vendor.status === "pending" ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
              vendor.status === "rejected" ? "bg-red-50 border-red-200 text-red-800" :
              "bg-gray-50 border-gray-200 text-gray-800"
            }`}>
              {statusMessages[vendor.status]}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-background rounded-2xl p-6 border border-border shadow-sm flex items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Listings</p>
                <p className="text-3xl font-display mt-1">{productsData?.total || 0}</p>
              </div>
            </div>
            <div className="bg-background rounded-2xl p-6 border border-border shadow-sm flex items-center">
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mr-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Gross Sales</p>
                <p className="text-3xl font-display mt-1">{formatCurrency(totalSales)}</p>
              </div>
            </div>
            <div
              className="bg-background rounded-2xl p-6 border border-border shadow-sm flex items-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setActiveTab("earnings")}
            >
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-4">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Earnings</p>
                <p className="text-3xl font-display mt-1">{orders?.length || 0} orders</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl mb-8 w-fit">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Products Tab ── */}
          {activeTab === "products" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display">Your Products</h2>
                <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
                  {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-1" /> Add Product</>}
                </Button>
              </div>

              {isAdding && (
                <div className="bg-background rounded-2xl p-6 border border-primary/20 shadow-lg mb-8 animate-in fade-in slide-in-from-top-4">
                  <h3 className="font-semibold mb-5 text-primary text-lg">New Product Listing</h3>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <Input label="Product Title" {...register("title")} error={errors.title?.message} placeholder="e.g. Handwoven Berber Rug — Blue & Ivory" />

                    {/* Pricing & Shipping */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Price (USD)" type="number" step="0.01" {...register("priceUsd")} error={errors.priceUsd?.message} />
                        <Input
                          label="Shipping Cost (USD)"
                          type="number"
                          step="0.01"
                          {...register("shippingCostUsd")}
                          error={errors.shippingCostUsd?.message}
                          disabled={isFreeShipping}
                          className={isFreeShipping ? "opacity-40 cursor-not-allowed" : ""}
                        />
                      </div>
                      {/* Free Shipping Toggle */}
                      <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border-2 border-border hover:border-primary/30 transition-colors bg-background">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            {...register("freeShipping")}
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${isFreeShipping ? "bg-green-500" : "bg-border"}`} />
                          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isFreeShipping ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-green-600" />
                            Offer Free Shipping
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Buyers see $0 shipping — build the cost into your product price to stay competitive
                          </p>
                        </div>
                        {isFreeShipping && (
                          <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">ON</span>
                        )}
                      </label>
                    </div>

                    {/* Shipping Dimensions & Weight */}
                    <div className="rounded-xl border-2 border-border p-4 space-y-3">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Weight className="w-4 h-4 text-primary" />
                        Shipping Dimensions — Used by carriers to calculate cost
                      </p>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Input label="Width (cm)" type="number" step="0.1" placeholder="e.g. 40" {...register("widthCm")} error={errors.widthCm?.message} />
                        </div>
                        <div>
                          <Input label="Height (cm)" type="number" step="0.1" placeholder="e.g. 40" {...register("heightCm")} error={errors.heightCm?.message} />
                        </div>
                        <div>
                          <Input label="Depth (cm)" type="number" step="0.1" placeholder="e.g. 5" {...register("depthCm")} error={errors.depthCm?.message} />
                        </div>
                        <div>
                          <Input label="Weight (kg)" type="number" step="0.01" placeholder="e.g. 1.5" {...register("weightKg")} error={errors.weightKg?.message} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">A rug is not a vase — dimensions affect packaging and shipping rates</p>
                    </div>

                    {/* Category & Stock */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Category</label>
                        <select {...register("category")} className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm focus:border-primary">
                          <option value="">Select a category</option>
                          {CRAFT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.category && <p className="text-destructive text-xs mt-1">{errors.category.message}</p>}
                      </div>
                      <Input label="Stock Qty" type="number" {...register("stockQuantity")} error={errors.stockQuantity?.message} />
                    </div>

                    {/* Image */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Product Image</label>
                      <ImageUploader onUploaded={(url) => { setUploadedImageUrl(url); setValue("imageUrl", url); }} />
                      {!uploadedImageUrl && (
                        <div className="mt-2">
                          <Input label="Or paste image URL" placeholder="https://..." {...register("imageUrl")} error={errors.imageUrl?.message} />
                        </div>
                      )}
                      {uploadedImageUrl && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Image uploaded</p>}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Product Description <span className="text-destructive">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Write a detailed description — mention materials, craft technique, colors, origin, and how it was made. Buyers worldwide need context to trust your work.
                      </p>
                      <DescriptionField register={register} errors={errors} />
                    </div>

                    <Button type="submit" isLoading={isCreating} className="w-full" size="lg">
                      <Upload className="w-4 h-4 mr-2" /> Publish Product
                    </Button>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {productsData?.products?.map(p => (
                  <div key={p.id} className="bg-background rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary/30 transition-colors">
                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Image className="w-6 h-6" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{p.title}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm text-muted-foreground">{formatCurrency(p.priceUsd)} · {p.stockQuantity} in stock</span>
                        <span className="text-xs text-muted-foreground">→ net {formatCurrency(p.priceUsd * 0.90)}</span>
                        {(p as any).freeShipping && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <Truck className="w-3 h-3" /> Free Shipping
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!productsData?.products?.length && (
                  <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                    <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No products yet. Add your first listing!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Orders Tab ── */}
          {activeTab === "orders" && (
            <OrdersTab orders={orders} getHeaders={getHeaders} />
          )}

          {/* ── Earnings Tab ── */}
          {activeTab === "earnings" && <EarningsTab vendor={vendor} />}

        </div>
      </div>
    </Layout>
  );
}
