import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/constants";
import { CheckCircle, Users, DollarSign, LogOut, Plus, Trash2, MapPin, Store, AlertCircle, Wallet, Clock, ShieldCheck, TrendingUp, Ban, ThumbsDown, Globe, Eye, AlertTriangle, Timer, BadgeCheck } from "lucide-react";

const BASE = "/api";

export default function SupervisorPortal() {
  const [token, setToken] = useState(() => localStorage.getItem("supToken") || "");
  const [supervisor, setSupervisor] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [vendors, setVendors] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any>({ total: 0, pending: 0, commissions: [] });
  const [citySups, setCitySups] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"vendors" | "commissions" | "withdraw" | "team">("vendors");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveMsg, setApproveMsg] = useState<Record<number, string>>({});

  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", bankName: "", accountName: "", accountNumber: "", notes: "" });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");

  const [newCitySup, setNewCitySup] = useState({ username: "", email: "", password: "", city: "" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  // Terms agreement state
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDone, setTermsDone] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  const termsKey = supervisor ? `sup_terms_v1_${supervisor.id}` : null;
  // Check localStorage once when supervisor loads
  const [checkedLocalStorage, setCheckedLocalStorage] = useState(false);
  useEffect(() => {
    if (supervisor && termsKey && !checkedLocalStorage) {
      setCheckedLocalStorage(true);
      if (localStorage.getItem(termsKey) === "1") setTermsDone(true);
    }
  }, [supervisor, termsKey, checkedLocalStorage]);

  const handleTermsScroll = () => {
    const el = termsRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setTermsScrolled(true);
  };

  const handleAcceptTerms = () => {
    if (!termsAccepted || !termsKey) return;
    localStorage.setItem(termsKey, "1");
    setTermsDone(true);
  };

  const headers = () => ({ "Authorization": `Bearer ${token}`, "Content-Type": "application/json" });

  const fetchAll = async (tok: string) => {
    const h = { "Authorization": `Bearer ${tok}`, "Content-Type": "application/json" };
    const [meR, vendR, commR, payR] = await Promise.all([
      fetch(`${BASE}/supervisor/me`, { headers: h }),
      fetch(`${BASE}/supervisor/vendors`, { headers: h }),
      fetch(`${BASE}/supervisor/commissions`, { headers: h }),
      fetch(`${BASE}/supervisor/payout-requests`, { headers: h }),
    ]);
    if (!meR.ok) { localStorage.removeItem("supToken"); setToken(""); return; }
    const me = await meR.json();
    setSupervisor(me);
    if (vendR.ok) setVendors(await vendR.json());
    if (commR.ok) setCommissions(await commR.json());
    if (payR.ok) setPayoutRequests(await payR.json());
    if (me.level === "country") {
      const cityR = await fetch(`${BASE}/supervisor/city-supervisors`, { headers: h });
      if (cityR.ok) setCitySups(await cityR.json());
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setWithdrawMsg("");
    try {
      const r = await fetch(`${BASE}/supervisor/payout-request`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ ...withdrawForm, amount: parseFloat(withdrawForm.amount) }),
      });
      const d = await r.json();
      if (r.ok) {
        setWithdrawMsg("✓ تم إرسال طلب السحب بنجاح");
        setWithdrawForm({ amount: "", bankName: "", accountName: "", accountNumber: "", notes: "" });
        setPayoutRequests(prev => [d.request, ...prev]);
      } else { setWithdrawMsg(d.error || "خطأ في الطلب"); }
    } finally { setWithdrawing(false); }
  };

  useEffect(() => { if (token) fetchAll(token); }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const r = await fetch(`${BASE}/supervisor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const d = await r.json();
      if (!r.ok) { setLoginError(d.error || "فشل تسجيل الدخول"); return; }
      localStorage.setItem("supToken", d.token);
      setToken(d.token);
    } catch { setLoginError("خطأ في الاتصال"); }
    finally { setLoginLoading(false); }
  };

  const handleApprove = async (vendorId: number) => {
    setApprovingId(vendorId);
    try {
      const r = await fetch(`${BASE}/supervisor/vendors/${vendorId}/approve`, { method: "PUT", headers: headers() });
      const d = await r.json();
      if (r.ok) {
        setApproveMsg(p => ({ ...p, [vendorId]: "✓ تم القبول" }));
        setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, status: "approved", isApproved: true } : v));
      } else {
        setApproveMsg(p => ({ ...p, [vendorId]: d.error || "خطأ" }));
      }
    } finally { setApprovingId(null); }
  };

  const handleCreateCitySup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    try {
      const r = await fetch(`${BASE}/supervisor/city-supervisors`, {
        method: "POST", headers: headers(), body: JSON.stringify(newCitySup),
      });
      const d = await r.json();
      if (r.ok) {
        setCitySups(prev => [...prev, d]);
        setNewCitySup({ username: "", email: "", password: "", city: "" });
        setCreateMsg("✓ تم إضافة المشرف");
      } else { setCreateMsg(d.error || "خطأ"); }
    } finally { setCreating(false); }
  };

  const handleDeleteCitySup = async (id: number) => {
    if (!confirm("هل تريد حذف هذا المشرف؟")) return;
    const r = await fetch(`${BASE}/supervisor/city-supervisors/${id}`, { method: "DELETE", headers: headers() });
    if (r.ok) setCitySups(prev => prev.filter(s => s.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem("supToken");
    setToken("");
    setSupervisor(null);
  };

  const pendingVendors = vendors.filter(v => !v.isApproved && !v.isBanned);
  const approvedVendors = vendors.filter(v => v.isApproved);

  // ── Login Screen ──────────────────────────────────────────────────────────
  if (!token || !supervisor) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display text-primary">بوابة المشرفين</h1>
              <p className="text-muted-foreground mt-2">Supervisor Portal</p>
            </div>
            <div className="bg-background rounded-2xl border border-border shadow-lg p-8">
              <form onSubmit={handleLogin} className="space-y-4">
                <Input label="البريد الإلكتروني" type="email" value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} required />
                <Input label="كلمة المرور" type="password" value={loginForm.password}
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} required />
                {loginError && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {loginError}
                  </div>
                )}
                <Button type="submit" className="w-full" isLoading={loginLoading}>تسجيل الدخول</Button>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Terms Agreement Screen ────────────────────────────────────────────────
  if (supervisor && !termsDone) {
    const commPct = (parseFloat(supervisor.commissionRate ?? "0.02") * 100).toFixed(1);
    return (
      <Layout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display">اتفاقية المشرف الإقليمي</h1>
              <p className="text-muted-foreground mt-2">
                مرحباً <strong>{supervisor.username}</strong> — قبل الوصول إلى لوحة التحكم، يرجى قراءة والموافقة على سياسات منصة SoukGlobale للمشرفين.
              </p>
            </div>

            <div className="bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
              {/* Scrollable terms */}
              <div
                ref={termsRef}
                onScroll={handleTermsScroll}
                className="h-[420px] overflow-y-auto p-6 space-y-6 text-sm"
              >
                {/* 1 — Commission */}
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground mb-1.5">١. العمولة على المبيعات</p>
                    <p className="text-muted-foreground leading-relaxed">
                      يحق لك الحصول على عمولة قدرها <strong className="text-foreground">{commPct}% من إجمالي قيمة كل عملية بيع</strong> تتم من خلال المتاجر الموجودة في منطقتك الجغرافية المحددة (دولة أو مدينة). تُحسب العمولة تلقائياً عند كل عملية بيع ناجحة وتُضاف إلى رصيدك لطلب السحب لاحقاً.
                    </p>
                  </div>
                </div>

                {/* 2 — Approval authority */}
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BadgeCheck className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground mb-1.5">٢. صلاحية قبول المتاجر</p>
                    <p className="text-muted-foreground leading-relaxed">
                      أنت المسؤول الأول عن <strong className="text-foreground">مراجعة وقبول طلبات الحرفيين في منطقتك</strong>. يجب قبول متجر جديد فقط بعد التحقق من:
                    </p>
                    <ul className="mt-2 space-y-1 text-muted-foreground list-none">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> استيفاء الحرفي لجميع شروط التسجيل</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> التأكد من صحة قناة اليوتيوب وأنها تعرض حقاً صنع الحرفة يدوياً</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> التأكد من أن المنتجات مصنوعة يدوياً وليست مصنّعة آلياً</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">قبولك لمتجر لا يستوفي الشروط يُعدّ إخلالاً بمسؤوليتك ويؤثر سلباً على تقييمك.</p>
                  </div>
                </div>

                {/* 3 — Growth = more earnings */}
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Store className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground mb-1.5">٣. كلما نما سوقك، زاد دخلك</p>
                    <p className="text-muted-foreground leading-relaxed">
                      لا يوجد سقف لأرباحك. <strong className="text-foreground">كلما زاد عدد المتاجر النشطة والمبيعات في منطقتك، زادت عمولاتك الشهرية</strong>. نشجعك على دعم الحرفيين في منطقتك لمساعدتهم على النجاح، لأن نجاحهم هو نجاحك مباشرةً.
                    </p>
                  </div>
                </div>

                {/* 4 — Negative points */}
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ThumbsDown className="w-5 h-5 text-orange-700" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground mb-1.5">٤. النقاط السلبية وتقييم الأداء</p>
                    <p className="text-muted-foreground leading-relaxed">
                      في حال أغلقت الإدارة أي متجر تم قبوله في منطقتك بسبب الغش أو المخالفات، <strong className="text-foreground">تُسجَّل نقطة سلبية في ملفك كمشرف</strong>. تراكم النقاط السلبية يؤدي إلى:
                    </p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" /> مراجعة تقييمك ربع سنوياً</li>
                      <li className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" /> خفض نسبة عمولتك في حال التراخي المتكرر</li>
                      <li className="flex items-center gap-2"><Ban className="w-3.5 h-3.5 text-red-600 flex-shrink-0" /> إلغاء صلاحيات الإشراف في حال التكرار الجسيم</li>
                    </ul>
                  </div>
                </div>

                {/* 5 — Response time */}
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Timer className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground mb-1.5">٥. الاستجابة في الوقت المناسب</p>
                    <p className="text-muted-foreground leading-relaxed">
                      يجب مراجعة طلبات التسجيل الجديدة <strong className="text-foreground">خلال 72 ساعة</strong> من استلامها. التأخر المتكرر في المراجعة قد يؤدي إلى نقل صلاحية القبول لمشرف آخر في المنطقة نفسها.
                    </p>
                  </div>
                </div>

                {/* 6 — Verification duty */}
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Eye className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground mb-1.5">٦. مسؤولية التحقق ومنع التواطؤ</p>
                    <p className="text-muted-foreground leading-relaxed">
                      يُمنع منعاً باتاً قبول متاجر لأشخاص من العائلة أو الأصدقاء دون الإفصاح للإدارة. <strong className="text-foreground">التواطؤ يؤدي إلى الإيقاف الفوري</strong> وفقدان جميع العمولات المتراكمة غير المدفوعة.
                    </p>
                  </div>
                </div>

                {/* 7 — Buying forbidden in Morocco */}
                <div className="flex gap-4 rounded-xl bg-red-50 border border-red-200 p-4 -mx-1">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe className="w-5 h-5 text-red-700" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-red-800 mb-1.5">٧. ⚠️ تنبيه هام — الشراء من المغرب محظور</p>
                    <p className="text-red-700 leading-relaxed">
                      منصة SoukGlobale مخصصة <strong>للمشترين الأجانب من خارج المغرب فقط</strong>. الشراء من داخل المغرب محظور تماماً على المنصة. بصفتك مشرفاً، أنت ملزم بعدم تسهيل أي عملية شراء محلية، والإبلاغ عن أي محاولة للتحايل على هذا القيد.
                    </p>
                  </div>
                </div>

                {/* 8 — Confidentiality */}
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground mb-1.5">٨. السرية والأمان</p>
                    <p className="text-muted-foreground leading-relaxed">
                      لا يجوز مشاركة بيانات الدخول أو أي معلومات داخلية عن المنصة مع أطراف خارجية. أنت مسؤول عن حماية حساب المشرف الخاص بك. أي اختراق أو تسريب معلومات يُفضي إلى الإيقاف الفوري والملاحقة القانونية إذا اقتضى الأمر.
                    </p>
                  </div>
                </div>

                {!termsScrolled && (
                  <p className="text-center text-xs text-muted-foreground animate-pulse py-2">↓ مرر للأسفل لقراءة جميع البنود</p>
                )}
              </div>

              {/* Bottom acceptance area */}
              <div className="border-t border-border p-6 bg-muted/20 space-y-4">
                {!termsScrolled && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    يجب قراءة جميع البنود حتى النهاية قبل الموافقة.
                  </div>
                )}

                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${termsScrolled ? 'cursor-pointer hover:border-primary/40' : 'opacity-40 pointer-events-none'} ${termsAccepted ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${termsAccepted ? 'bg-primary border-primary' : 'border-border bg-background'}`}>
                    {termsAccepted && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" className="sr-only" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} disabled={!termsScrolled} />
                  <span className="text-sm font-medium leading-relaxed">
                    لقد قرأت وفهمت وأوافق على جميع سياسات SoukGlobale للمشرفين الإقليميين، بما فيها نظام العمولة، مسؤولية التحقق، النقاط السلبية، وحظر الشراء من المغرب.
                  </span>
                </label>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAcceptTerms}
                  disabled={!termsAccepted || termsSubmitting}
                >
                  {termsSubmitting ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري التأكيد...</span>
                  ) : termsAccepted ? "أوافق وأدخل إلى لوحة التحكم" : "يرجى الموافقة على الشروط أولاً"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display text-primary">لوحة المشرف</h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4" />
              <span>
                {supervisor.level === "country" ? `مشرف الدولة — ${supervisor.country}` : `مشرف المدينة — ${supervisor.city}، ${supervisor.country}`}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> خروج
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-background border border-border rounded-2xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">إجمالي العمولات</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(commissions.total || 0)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="text-xs text-green-700 uppercase tracking-wide mb-1">متاح للسحب</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(commissions.available || 0)}</p>
            <p className="text-xs text-green-600 mt-1">عمولات مؤكدة</p>
          </div>
          <div className="bg-background border border-border rounded-2xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">في الانتظار</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(commissions.pending || 0)}</p>
            <p className="text-xs text-stone-400 mt-1">بانتظار تأكيد المشتري</p>
          </div>
          <div className="bg-background border border-border rounded-2xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">المتاجر في نطاقك</p>
            <p className="text-2xl font-bold">{vendors.length}</p>
            {pendingVendors.length > 0 && (
              <p className="text-xs text-orange-600 mt-1">{pendingVendors.length} بانتظار القبول</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {[
            { key: "vendors", label: "المتاجر", icon: <Store className="w-4 h-4" /> },
            { key: "commissions", label: "العمولات", icon: <DollarSign className="w-4 h-4" /> },
            { key: "withdraw", label: "السحب", icon: <Wallet className="w-4 h-4" /> },
            ...(supervisor.level === "country" ? [{ key: "team", label: "مشرفو المدن", icon: <Users className="w-4 h-4" /> }] : []),
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Vendors Tab */}
        {activeTab === "vendors" && (
          <div className="space-y-4">
            {pendingVendors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-orange-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> بانتظار القبول ({pendingVendors.length})
                </h3>
                <div className="space-y-3">
                  {pendingVendors.map(v => (
                    <div key={v.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{v.storeName}</p>
                        <p className="text-sm text-muted-foreground">{v.email} · {v.city || "—"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString("ar")}</p>
                      </div>
                      <div className="text-right">
                        <Button size="sm" onClick={() => handleApprove(v.id)} isLoading={approvingId === v.id}>
                          <CheckCircle className="w-4 h-4 mr-1" /> قبول المتجر
                        </Button>
                        {approveMsg[v.id] && <p className="text-xs text-green-700 mt-1">{approveMsg[v.id]}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-semibold mb-3">المتاجر النشطة ({approvedVendors.length})</h3>
            {approvedVendors.map(v => (
              <div key={v.id} className="bg-background border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{v.storeName}</p>
                  <p className="text-sm text-muted-foreground">{v.email} · {v.city || v.country}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-semibold">نشط</span>
                  {approveMsg[v.id] && <p className="text-xs text-green-700">{approveMsg[v.id]}</p>}
                </div>
              </div>
            ))}
            {vendors.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                لا توجد متاجر في نطاقك بعد
              </div>
            )}
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === "commissions" && (
          <div>
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">رقم الطلب</th>
                    <th className="px-6 py-4">قيمة البيعة</th>
                    <th className="px-6 py-4">عمولتك</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.commissions.map((c: any) => (
                    <tr key={c.id} className="hover:bg-muted/5">
                      <td className="px-6 py-4 font-mono text-sm">#{c.orderId}</td>
                      <td className="px-6 py-4">{formatCurrency(c.saleAmountUsd)}</td>
                      <td className="px-6 py-4 font-semibold text-green-700">{formatCurrency(c.commissionUsd)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === "paid" ? "bg-green-100 text-green-800" :
                          c.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"}`}>
                          {c.status === "paid" ? "مدفوع" : c.status === "confirmed" ? "متاح للسحب" : "في الانتظار"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("ar")}</td>
                    </tr>
                  ))}
                  {commissions.commissions.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">لا توجد عمولات بعد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === "withdraw" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Withdraw Form */}
            <div className="bg-background border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-700" /> طلب سحب جديد
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                الرصيد المتاح: <span className="font-bold text-green-700">{formatCurrency(commissions.available || 0)}</span>
              </p>
              <form onSubmit={handleWithdraw} className="space-y-3">
                <Input label="المبلغ المطلوب ($)" type="number" step="0.01" min="1" max={commissions.available || 0}
                  value={withdrawForm.amount} onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} required />
                <Input label="اسم البنك" value={withdrawForm.bankName}
                  onChange={e => setWithdrawForm(p => ({ ...p, bankName: e.target.value }))} />
                <Input label="اسم صاحب الحساب" value={withdrawForm.accountName}
                  onChange={e => setWithdrawForm(p => ({ ...p, accountName: e.target.value }))} />
                <Input label="رقم الحساب / IBAN" value={withdrawForm.accountNumber}
                  onChange={e => setWithdrawForm(p => ({ ...p, accountNumber: e.target.value }))} />
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">ملاحظات (اختياري)</label>
                  <textarea value={withdrawForm.notes} onChange={e => setWithdrawForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2} className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                </div>
                {withdrawMsg && (
                  <p className={`text-sm p-3 rounded-lg ${withdrawMsg.startsWith("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {withdrawMsg}
                  </p>
                )}
                <Button type="submit" className="w-full" isLoading={withdrawing}
                  disabled={!commissions.available || commissions.available <= 0}>
                  طلب السحب الآن
                </Button>
                {(!commissions.available || commissions.available <= 0) && (
                  <p className="text-xs text-center text-muted-foreground">لا يوجد رصيد متاح للسحب حاليًا</p>
                )}
              </form>
            </div>

            {/* Payout Requests History */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" /> سجل طلبات السحب
                </h3>
              </div>
              <div className="divide-y divide-border">
                {payoutRequests.length === 0 && (
                  <p className="text-center py-10 text-muted-foreground text-sm">لا توجد طلبات سحب بعد</p>
                )}
                {payoutRequests.map((r: any) => (
                  <div key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-700">{formatCurrency(r.amount_usd)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ar")}</p>
                      {r.bank_name && <p className="text-xs text-muted-foreground">{r.bank_name}</p>}
                      {r.admin_notes && <p className="text-xs text-stone-500 mt-1">{r.admin_notes}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      r.status === "paid" ? "bg-green-100 text-green-800" :
                      r.status === "approved" ? "bg-blue-100 text-blue-800" :
                      r.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"}`}>
                      {r.status === "paid" ? "مدفوع" : r.status === "approved" ? "موافق عليه" :
                       r.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Team Tab (country supervisors only) */}
        {activeTab === "team" && supervisor.level === "country" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-background border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold">مشرفو المدن في {supervisor.country}</h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">الاسم</th>
                    <th className="px-5 py-3">المدينة</th>
                    <th className="px-5 py-3">البريد</th>
                    <th className="px-5 py-3">الحالة</th>
                    <th className="px-5 py-3 text-right">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {citySups.map(s => (
                    <tr key={s.id} className="hover:bg-muted/5">
                      <td className="px-5 py-3 font-medium">{s.username}</td>
                      <td className="px-5 py-3 text-sm">{s.city}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{s.email}</td>
                      <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.isActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>{s.isActive ? "نشط" : "معطل"}</span></td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleDeleteCitySup(s.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {citySups.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">لم تضف مشرفي مدن بعد</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="bg-background border border-border rounded-2xl p-5">
              <h3 className="font-semibold mb-4">إضافة مشرف مدينة</h3>
              <form onSubmit={handleCreateCitySup} className="space-y-3">
                <Input label="اسم المستخدم" value={newCitySup.username} onChange={e => setNewCitySup(p => ({ ...p, username: e.target.value }))} required />
                <Input label="البريد الإلكتروني" type="email" value={newCitySup.email} onChange={e => setNewCitySup(p => ({ ...p, email: e.target.value }))} required />
                <Input label="كلمة المرور" type="password" value={newCitySup.password} onChange={e => setNewCitySup(p => ({ ...p, password: e.target.value }))} required />
                <Input label="المدينة" value={newCitySup.city} onChange={e => setNewCitySup(p => ({ ...p, city: e.target.value }))} required />
                {createMsg && <p className={`text-sm ${createMsg.startsWith("✓") ? "text-green-700" : "text-destructive"}`}>{createMsg}</p>}
                <Button type="submit" className="w-full" isLoading={creating}>
                  <Plus className="w-4 h-4 mr-1" /> إضافة مشرف
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
