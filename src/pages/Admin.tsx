import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Lock, CheckCircle, XCircle, AlertTriangle, Users, Box, TrendingUp,
  ShieldAlert, Truck, UserX, Ban, Globe, UserCog, Eye, EyeOff, Plus, Trash2, Pencil, X,
  Landmark, Bot, MapPin, Wallet, Clock
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import { useImageUpload } from "@/hooks/useImageUpload";

function AdminImageUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
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
      <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
        {preview ? <img src={preview} className="h-16 mx-auto object-cover rounded-lg" alt="preview" /> : (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="text-lg"></span>
            <p className="text-sm">{uploadState === "uploading" ? "Uploading..." : uploadState === "done" ? " Uploaded!" : "Click to upload from computer"}</p>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
    </div>
  );
}

type Perms = {
  vendors: boolean; disputes: boolean; shipping: boolean;
  blacklist: boolean; stats: boolean; countries: boolean; subAdmins: boolean;
};

type Session = { token: string; role: 'super' | 'sub'; permissions: Perms };

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [loginMode, setLoginMode] = useState<'super' | 'sub'>('super');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [activeTab, setActiveTab] = useState('approvals');

  const [vendors, setVendors] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [shippingCarriers, setShippingCarriers] = useState<any[]>([]);
  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [regionalSupervisors, setRegionalSupervisors] = useState<any[]>([]);
  const [supervisorPayouts, setSupervisorPayouts] = useState<any[]>([]);
  const [supPayoutNote, setSupPayoutNote] = useState<Record<number, string>>({});
  const [countryAnalytics, setCountryAnalytics] = useState<any[]>([]);
  const [analyticsExpanded, setAnalyticsExpanded] = useState<string | null>(null);
  const [supForm, setSupForm] = useState<any>({ id: null, username: '', email: '', password: '', country: '', city: '', level: 'country' });
  const [zoneForm, setZoneForm] = useState<any>({ id: null, name: '', countries: '', basePriceUsd: '', perKgPriceUsd: '', estimatedDaysMin: '', estimatedDaysMax: '' });
  const [blacklistedBuyers, setBlacklistedBuyers] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productSearch, setProductSearch] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [payoutFilter, setPayoutFilter] = useState('pending');
  const [payoutNote, setPayoutNote] = useState<Record<number, string>>({});

  const [vendorFilter, setVendorFilter] = useState('all');
  const [disputeFilter, setDisputeFilter] = useState('all');

  const [carrierForm, setCarrierForm] = useState<any>({ id: null, name: '', code: '', regions: '', apiEndpoint: '', apiKey: '', trackingUrlTemplate: '', notes: '', isActive: true });
  const [showCarrierKey, setShowCarrierKey] = useState(false);
  const [buyerForm, setBuyerForm] = useState({ email: '', name: '', reason: '' });
  const [countryForm, setCountryForm] = useState<any>({ id: null, countryName: '', phonePrefix: '' });
  const [countryStatus, setCountryStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [countryLoading, setCountryLoading] = useState(false);
  const [subAdminForm, setSubAdminForm] = useState<any>({ id: null, username: '', email: '', password: '', permVendors: true, permDisputes: true, permShipping: false, permBlacklist: false, permStats: false, permCountries: false, isActive: true });
  const [showSubPass, setShowSubPass] = useState(false);
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [createVendorForm, setCreateVendorForm] = useState({ name: '', email: '', password: '', country: 'Morocco', city: '', craftSpecialty: '', phoneNumber: '', bio: '' });
  const [createVendorError, setCreateVendorError] = useState('');
  const [creatingVendor, setCreatingVendor] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingDemo, setDeletingDemo] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('sgAdminSession');
    if (raw) {
      try { setSession(JSON.parse(raw)); } catch (_) {}
    }
  }, []);

  const getHeaders = useCallback((token: string) => ({
    'x-admin-key': token,
    'Content-Type': 'application/json',
  }), []);

  const fetchData = useCallback(async (token: string, perms: Perms, role: string) => {
    const h = { 'x-admin-key': token };
    try {
      if (perms.vendors) {
        const r = await fetch('/api/admin/vendors', { headers: h });
        if (r.ok) { const d = await r.json(); setVendors(Array.isArray(d) ? d : []); }
      }
      if (perms.disputes) {
        const r = await fetch('/api/admin/disputes', { headers: h });
        if (r.ok) { const d = await r.json(); setDisputes(Array.isArray(d) ? d : []); }
      }
      if (perms.stats) {
        const r = await fetch('/api/admin/stats', { headers: h });
        if (r.ok) setStats(await r.json());
      }
      if (perms.shipping) {
        const [rC, rZ] = await Promise.all([
          fetch('/api/admin/shipping/carriers', { headers: h }),
          fetch('/api/admin/shipping/zones', { headers: h }),
        ]);
        if (rC.ok) { const d = await rC.json(); setShippingCarriers(Array.isArray(d) ? d : []); }
        if (rZ.ok) { const d = await rZ.json(); setShippingZones(Array.isArray(d) ? d : []); }
      }
      if (perms.blacklist) {
        const r = await fetch('/api/admin/buyer-blacklist', { headers: h });
        if (r.ok) { const d = await r.json(); setBlacklistedBuyers(Array.isArray(d) ? d : []); }
      }
      if (perms.countries) {
        const r = await fetch('/api/admin/countries', { headers: h });
        if (r.ok) { const d = await r.json(); setCountries(Array.isArray(d) ? d : []); }
      }
      if (perms.subAdmins) {
        const r = await fetch('/api/admin/sub-admins', { headers: h });
        if (r.ok) { const d = await r.json(); setSubAdmins(Array.isArray(d) ? d : []); }
      }
      if (role === 'super') {
        const [supR, supPayR, analyticsR] = await Promise.all([
          fetch('/api/admin/supervisors', { headers: h }),
          fetch('/api/admin/supervisor-payouts', { headers: h }),
          fetch('/api/admin/analytics/countries', { headers: h }),
        ]);
        if (supR.ok) { const d = await supR.json(); setRegionalSupervisors(Array.isArray(d) ? d : []); }
        if (supPayR.ok) { const d = await supPayR.json(); setSupervisorPayouts(Array.isArray(d) ? d : []); }
        if (analyticsR.ok) { const d = await analyticsR.json(); setCountryAnalytics(Array.isArray(d) ? d : []); }
      }
      if (perms.vendors) {
        const r = await fetch('/api/admin/products', { headers: h });
        if (r.ok) { const d = await r.json(); setProducts(Array.isArray(d) ? d : []); }
      }
      // Payouts always fetched for stats or vendor permissioned admins
      if (perms.stats || perms.vendors) {
        const r = await fetch('/api/admin/payout-requests', { headers: h });
        if (r.ok) { const d = await r.json(); setPayoutRequests(Array.isArray(d) ? d : []); }
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (session) {
      fetchData(session.token, session.permissions, session.role);
      const firstPerm = Object.entries(session.permissions).find(([, v]) => v);
      if (firstPerm) {
        const permToTab: Record<string, string> = {
          vendors: 'approvals', disputes: 'disputes', stats: 'stats',
          shipping: 'shipping', blacklist: 'blacklist', countries: 'countries', subAdmins: 'subadmins',
        };
        setActiveTab(permToTab[firstPerm[0]] || 'approvals');
      }
    }
  }, [session, fetchData]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const body = loginMode === 'super'
        ? { password }
        : { username, password };
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Invalid credentials');
        return;
      }
      const sess: Session = { token: data.token, role: data.role, permissions: data.permissions };
      sessionStorage.setItem('sgAdminSession', JSON.stringify(sess));
      setSession(sess);
    } catch {
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('sgAdminSession');
    setSession(null);
    setPassword('');
    setUsername('');
  };

  const apiCall = async (url: string, method: string, body?: any) => {
    if (!session) return null;
    const res = await fetch(url, {
      method,
      headers: getHeaders(session.token),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) { await fetchData(session.token, session.permissions, session.role); return true; }
    return false;
  };

  const handleVendorAction = async (id: number, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const reason = prompt('Enter rejection reason:');
      if (!reason) return;
      await apiCall(`/api/admin/vendors/${id}/reject`, 'POST', { reason });
    } else {
      await apiCall(`/api/admin/vendors/${id}/approve`, 'POST');
    }
  };

  const handleVendorBan = async (id: number) => {
    const reason = prompt('Enter permanent ban reason (cannot be undone):');
    if (!reason) return;
    await apiCall(`/api/admin/vendors/${id}/ban`, 'POST', { reason });
  };

  const handleDisputeAction = async (id: number, accepted: boolean) => {
    await apiCall(`/api/admin/disputes/${id}/resolve`, 'POST', { accepted });
  };

  const handleSaveCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...body } = carrierForm;
    if (id) { await apiCall(`/api/admin/shipping/carriers/${id}`, 'PUT', body); }
    else { await apiCall('/api/admin/shipping/carriers', 'POST', body); }
    setCarrierForm({ id: null, name: '', code: '', regions: '', apiEndpoint: '', apiKey: '', trackingUrlTemplate: '', notes: '', isActive: true });
    const h = { 'x-admin-key': session!.token };
    const rC = await fetch('/api/admin/shipping/carriers', { headers: h });
    if (rC.ok) { const d = await rC.json(); setShippingCarriers(Array.isArray(d) ? d : []); }
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, countries, ...rest } = zoneForm;
    const body = { ...rest, countries: countries ? countries.split(',').map((s: string) => s.trim()).filter(Boolean) : [] };
    if (id) { await apiCall(`/api/admin/shipping/zones/${id}`, 'PUT', body); }
    else { await apiCall('/api/admin/shipping/zones', 'POST', body); }
    setZoneForm({ id: null, name: '', countries: '', basePriceUsd: '', perKgPriceUsd: '', estimatedDaysMin: '', estimatedDaysMax: '' });
    const h = { 'x-admin-key': session!.token };
    const rZ = await fetch('/api/admin/shipping/zones', { headers: h });
    if (rZ.ok) { const d = await rZ.json(); setShippingZones(Array.isArray(d) ? d : []); }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiCall('/api/admin/buyer-blacklist', 'POST', { buyerEmail: buyerForm.email, buyerName: buyerForm.name, reason: buyerForm.reason });
    setBuyerForm({ email: '', name: '', reason: '' });
  };

  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setCountryLoading(true);
    setCountryStatus(null);
    const { id, ...body } = countryForm;
    try {
      const ok = id
        ? await apiCall(`/api/admin/countries/${id}`, 'PUT', { ...body, isActive: true })
        : await apiCall('/api/admin/countries', 'POST', body);
      if (ok) {
        setCountryStatus({ type: 'success', msg: id ? `${body.countryName} updated successfully.` : `${body.countryName} added — artisan registration is now open for this country.` });
        setCountryForm({ id: null, countryName: '', phonePrefix: '' });
      } else {
        setCountryStatus({ type: 'error', msg: 'Failed to save. The country may already exist or there was a server error.' });
      }
    } catch {
      setCountryStatus({ type: 'error', msg: 'Unexpected error. Please try again.' });
    } finally {
      setCountryLoading(false);
    }
  };

  const handleToggleCountry = async (c: any) => {
    setCountryStatus(null);
    const ok = await apiCall(`/api/admin/countries/${c.id}`, 'PUT', { countryName: c.countryName, phonePrefix: c.phonePrefix, isActive: !c.isActive });
    if (ok) {
      setCountryStatus({ type: 'success', msg: c.isActive ? `${c.countryName} disabled — artisan registration is now closed.` : `${c.countryName} enabled — artisan registration is now open.` });
    }
  };

  const handleDeleteCountry = async (c: any) => {
    if (!confirm(`Delete ${c.countryName}? Artisans from this country won't be able to register.`)) return;
    setCountryStatus(null);
    const ok = await apiCall(`/api/admin/countries/${c.id}`, 'DELETE');
    if (ok) setCountryStatus({ type: 'success', msg: `${c.countryName} removed from the allowed list.` });
  };

  const handleSaveSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...body } = subAdminForm;
    if (id) { await apiCall(`/api/admin/sub-admins/${id}`, 'PUT', body); }
    else { await apiCall('/api/admin/sub-admins', 'POST', body); }
    setSubAdminForm({ id: null, username: '', email: '', password: '', permVendors: true, permDisputes: true, permShipping: false, permBlacklist: false, permStats: false, permCountries: false, isActive: true });
  };

  // ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-card">
        <div className="bg-background border border-border p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-2xl font-display text-center mb-2">Secure Access</h1>
          <p className="text-muted-foreground text-sm text-center mb-6">SoukGlobale Administration</p>

          <div className="flex gap-2 mb-6">
            <button onClick={() => setLoginMode('super')} className={`flex-1 py-2 text-sm rounded-xl font-medium transition-all ${loginMode === 'super' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
              Super Admin
            </button>
            <button onClick={() => setLoginMode('sub')} className={`flex-1 py-2 text-sm rounded-xl font-medium transition-all ${loginMode === 'sub' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
              Sub-Admin
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-xl">{loginError}</div>
          )}

          <form onSubmit={login} className="space-y-4">
            {loginMode === 'sub' && (
              <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            )}
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowPass(x => !x)}>
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <Button type="submit" className="w-full" isLoading={loggingIn}>Access Dashboard</Button>
          </form>
        </div>
      </div>
    );
  }

  const p = session.permissions;
  const filteredVendors = vendors.filter(v => vendorFilter === 'all' || v.status === vendorFilter);
  const filteredDisputes = disputes.filter(d => disputeFilter === 'all' || d.status === disputeFilter);

  const handleSeedVendors = async () => {
    if (!confirm('This will create 10 demo vendor stores with products. Continue?')) return;
    setSeeding(true);
    setSeedMsg(null);
    try {
      const r = await fetch('/api/admin/seed/bulk-vendors', { method: 'POST', headers: getHeaders(session!.token) });
      const d = await r.json();
      if (!r.ok) { setSeedMsg({ type: 'error', text: d.error || 'Failed to seed vendors' }); return; }
      const count = d.created?.filter((v: any) => !v.skipped).length ?? 0;
      const skipped = d.created?.filter((v: any) => v.skipped).length ?? 0;
      setSeedMsg({ type: 'success', text: `${count} demo stores created${skipped > 0 ? ` (${skipped} already existed)` : ''}. Password for all: Demo@2026` });
      const r2 = await fetch('/api/admin/vendors', { headers: { 'x-admin-key': session!.token } });
      if (r2.ok) { const d2 = await r2.json(); setVendors(Array.isArray(d2) ? d2 : []); }
    } catch { setSeedMsg({ type: 'error', text: 'Network error' }); }
    finally { setSeeding(false); }
  };

  const handleDeleteDemo = async () => {
    if (!confirm('This will permanently delete ALL demo vendor stores and their products. Continue?')) return;
    setDeletingDemo(true);
    setSeedMsg(null);
    try {
      const r = await fetch('/api/admin/seed/demo-vendors', { method: 'DELETE', headers: getHeaders(session!.token) });
      const d = await r.json();
      if (!r.ok) { setSeedMsg({ type: 'error', text: d.error || 'Failed to delete demo vendors' }); return; }
      setSeedMsg({ type: 'success', text: `Deleted ${d.deletedVendors} demo stores and ${d.deletedProducts} products.` });
      setVendors(prev => prev.filter(v => !v.email?.endsWith('@demo.soukglobale.com')));
    } catch { setSeedMsg({ type: 'error', text: 'Network error' }); }
    finally { setDeletingDemo(false); }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateVendorError('');
    setCreatingVendor(true);
    try {
      const r = await fetch('/api/admin/vendors/create', {
        method: 'POST',
        headers: getHeaders(session.token),
        body: JSON.stringify(createVendorForm),
      });
      const d = await r.json();
      if (!r.ok) { setCreateVendorError(d.error || 'Failed to create vendor'); return; }
      setVendors(prev => [d.vendor, ...prev]);
      setShowCreateVendor(false);
      setCreateVendorForm({ name: '', email: '', password: '', country: 'Morocco', city: '', craftSpecialty: '', phoneNumber: '', bio: '' });
    } catch {
      setCreateVendorError('Network error');
    } finally {
      setCreatingVendor(false);
    }
  };

  const tabs = [
    p.vendors && { id: 'approvals', label: 'Vendors', icon: <Users className="w-4 h-4 mr-1.5" /> },
    p.vendors && { id: 'products', label: 'Products', icon: <Box className="w-4 h-4 mr-1.5" /> },
    p.disputes && { id: 'disputes', label: 'Disputes', icon: <ShieldAlert className="w-4 h-4 mr-1.5" /> },
    p.stats && { id: 'stats', label: 'Financials', icon: <TrendingUp className="w-4 h-4 mr-1.5" /> },
    p.shipping && { id: 'shipping', label: 'Shipping', icon: <Truck className="w-4 h-4 mr-1.5" /> },
    p.blacklist && { id: 'blacklist', label: 'Blacklist', icon: <UserX className="w-4 h-4 mr-1.5" /> },
    p.countries && { id: 'countries', label: 'Countries', icon: <Globe className="w-4 h-4 mr-1.5" /> },
    p.subAdmins && { id: 'subadmins', label: 'Sub-Admins', icon: <UserCog className="w-4 h-4 mr-1.5" /> },
    session?.role === 'super' && { id: 'country-analytics', label: 'تحليلات الدول', icon: <Globe className="w-4 h-4 mr-1.5" /> },
    session?.role === 'super' && { id: 'supervisors', label: 'المشرفون الإقليميون', icon: <MapPin className="w-4 h-4 mr-1.5" /> },
    session?.role === 'super' && { id: 'sup-payouts', label: 'سحوبات المشرفين', icon: <Wallet className="w-4 h-4 mr-1.5" /> },
    (p.stats || p.vendors) && { id: 'payouts', label: 'Payouts', icon: <Landmark className="w-4 h-4 mr-1.5" /> },
  ].filter(Boolean) as { id: string; label: string; icon: React.ReactNode }[];

  return (
    <Layout>
      <div className="bg-card min-h-screen pb-20">
        <div className="bg-foreground text-background py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display">SoukGlobale Control Panel</h1>
              <p className="text-background/60 text-sm mt-0.5">
                {session.role === 'super' ? 'Super Administrator' : 'Sub-Administrator'}
              </p>
            </div>
            <Button variant="outline" className="border-background/20 text-background hover:bg-background/10 text-sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex flex-wrap gap-1.5 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === tab.id ? 'bg-foreground text-background shadow' : 'bg-background border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* ─── CREATE VENDOR MODAL ─── */}
          {showCreateVendor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-lg">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-display font-semibold">Create New Vendor</h3>
                  <button onClick={() => { setShowCreateVendor(false); setCreateVendorError(''); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateVendor} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Shop Name *</label>
                      <Input placeholder="e.g. Artisanat Fès" value={createVendorForm.name} onChange={e => setCreateVendorForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <Input type="email" placeholder="vendor@example.com" value={createVendorForm.email} onChange={e => setCreateVendorForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password *</label>
                      <Input type="password" placeholder="Min 8 characters" value={createVendorForm.password} onChange={e => setCreateVendorForm(f => ({ ...f, password: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Country *</label>
                      <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={createVendorForm.country} onChange={e => setCreateVendorForm(f => ({ ...f, country: e.target.value }))}>
                        <option value="Morocco">Morocco</option>
                        <option value="Egypt">Egypt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <Input placeholder="e.g. Marrakech" value={createVendorForm.city} onChange={e => setCreateVendorForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Craft Specialty *</label>
                      <Input placeholder="e.g. Leather goods, Ceramics, Textiles" value={createVendorForm.craftSpecialty} onChange={e => setCreateVendorForm(f => ({ ...f, craftSpecialty: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                      <Input placeholder="+212..." value={createVendorForm.phoneNumber} onChange={e => setCreateVendorForm(f => ({ ...f, phoneNumber: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Bio (optional)</label>
                      <Input placeholder="Short description" value={createVendorForm.bio} onChange={e => setCreateVendorForm(f => ({ ...f, bio: e.target.value }))} />
                    </div>
                  </div>
                  {createVendorError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{createVendorError}</p>}
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCreateVendor(false); setCreateVendorError(''); }}>Cancel</Button>
                    <Button type="submit" className="flex-1" isLoading={creatingVendor}>Create & Approve</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── VENDOR APPROVALS ─── */}
          {activeTab === 'approvals' && (
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <h2 className="text-xl font-display">Vendor Applications</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="banned">Banned</option>
                    </select>
                    <Button onClick={() => setShowCreateVendor(true)} className="flex items-center gap-1.5 text-sm"><Plus className="w-4 h-4" />Create Vendor</Button>
                    <Button onClick={handleSeedVendors} isLoading={seeding} className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"><Bot className="w-4 h-4" />Seed 10 Demo Stores</Button>
                    <button onClick={handleDeleteDemo} disabled={deletingDemo} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"><Trash2 className="w-4 h-4" />{deletingDemo ? 'Deleting…' : 'Delete Demo Stores'}</button>
                  </div>
                </div>
                {seedMsg && (
                  <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${seedMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {seedMsg.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                    <span>{seedMsg.text}</span>
                    <button onClick={() => setSeedMsg(null)} className="ml-auto shrink-0 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">Vendor</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Craft & Channel</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredVendors.map(v => (
                      <tr key={v.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold">{v.name}</div>
                          <div className="text-sm text-muted-foreground">{v.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">{v.city ? `${v.city}, ` : ''}{v.country}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium">{v.craftSpecialty}</div>
                          {v.youtubeUrl && <a href={v.youtubeUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">▶ Watch Video</a>}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{v.phoneNumber || '—'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase
                            ${v.status === 'approved' ? 'bg-green-100 text-green-800' :
                              v.status === 'rejected' ? 'bg-orange-100 text-orange-800' :
                              v.status === 'banned' ? 'bg-red-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}>
                            {v.status}
                          </span>
                          {v.banReason && <div className="text-xs text-red-600 mt-1 max-w-[150px] truncate">{v.banReason}</div>}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1">
                          {v.status === 'pending' && (
                            <>
                              <button onClick={() => handleVendorAction(v.id, 'approve')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><CheckCircle className="w-5 h-5" /></button>
                              <button onClick={() => handleVendorAction(v.id, 'reject')} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="Reject"><XCircle className="w-5 h-5" /></button>
                            </>
                          )}
                          {v.status !== 'banned' && (
                            <button onClick={() => handleVendorBan(v.id)} className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg" title="Permanent Ban"><Ban className="w-5 h-5" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredVendors.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No vendors found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── DISPUTES ─── */}
          {activeTab === 'disputes' && (
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-display">Buyer Disputes</h2>
                <select className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm" value={disputeFilter} onChange={e => setDisputeFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">ID / Date</th>
                      <th className="px-6 py-4">Buyer</th>
                      <th className="px-6 py-4">Vendor</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDisputes.map(d => (
                      <tr key={d.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-6 py-4"><div className="font-semibold">#{d.id}</div><div className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</div></td>
                        <td className="px-6 py-4 text-sm"><div>{d.buyerName}</div><div className="text-muted-foreground text-xs">{d.buyerEmail}</div></td>
                        <td className="px-6 py-4 text-sm"><div>{d.vendorName || '—'}</div><div className="text-xs text-destructive">Warnings: {d.vendorWarningCount || 0}</div></td>
                        <td className="px-6 py-4 text-sm max-w-[200px] truncate">{d.reason}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase
                            ${d.status === 'accepted' ? 'bg-red-100 text-red-800' : d.status === 'rejected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {d.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleDisputeAction(d.id, true)}>Accept</Button>
                              <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" onClick={() => handleDisputeAction(d.id, false)}>Reject</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredDisputes.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No disputes found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── FINANCIALS ─── */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              {!stats ? (
                <div className="text-center py-20 text-muted-foreground">Loading financial data...</div>
              ) : (<>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Platform Overview</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Vendors', value: stats.totalVendors, color: '' },
                      { label: 'Approved Vendors', value: stats.approvedVendors, color: 'border-l-4 border-l-green-500' },
                      { label: 'Pending', value: stats.pendingVendors, color: 'border-l-4 border-l-yellow-500' },
                      { label: 'Banned', value: stats.bannedVendors, color: 'border-l-4 border-l-red-500' },
                      { label: 'Total Products', value: stats.totalProducts, color: '' },
                      { label: 'Total Orders', value: stats.totalOrders, color: '' },
                      { label: 'Pending Disputes', value: stats.pendingDisputes, color: 'border-l-4 border-l-orange-500' },
                      { label: 'Active Carriers', value: stats.activeCarriers, color: '' },
                    ].map((item, i) => (
                      <div key={i} className={`bg-background rounded-2xl p-5 border border-border shadow-sm ${item.color}`}>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-3xl font-display">{item.value ?? 0}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-primary flex items-center"><TrendingUp className="w-5 h-5 mr-2" /> Financial Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20 col-span-1 md:col-span-2 lg:col-span-1">
                      <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Total Platform Revenue</p>
                      <p className="text-4xl font-display text-primary">{formatCurrency(stats.totalRevenue || 0)}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-900">
                      <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-1">Commission (8%)</p>
                      <p className="text-3xl font-display text-amber-600">{formatCurrency(stats.commissionBalance || 0)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-900">
                      <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider mb-1">Insurance Fund ($2.50/order)</p>
                      <p className="text-3xl font-display text-blue-600">{formatCurrency(stats.insuranceFund || 0)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mb-1">Escrow Held</p>
                      <p className="text-3xl font-display text-slate-700">{formatCurrency(stats.escrowHeld || 0)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-violet-600 flex items-center"><Bot className="w-5 h-5 mr-2" /> AI Tools</h3>
                  <div className="bg-violet-50 dark:bg-violet-950/20 rounded-2xl p-6 border border-violet-200 dark:border-violet-800">
                    <p className="font-semibold text-sm mb-1">Auto-Translate All Products</p>
                    <p className="text-sm text-muted-foreground mb-4">Translate every untranslated product listing into English, Arabic, French, and Spanish using AI. Products uploaded by vendors are translated automatically going forward — this backfill covers existing products.</p>
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={async () => {
                          setBackfilling(true);
                          setBackfillMsg(null);
                          try {
                            const r = await fetch('/api/admin/translate-backfill', {
                              method: 'POST',
                              headers: { 'x-admin-key': session!.token, 'Content-Type': 'application/json' },
                            });
                            const data = await r.json();
                            setBackfillMsg(data.message || 'Translation queued!');
                          } catch {
                            setBackfillMsg('Error starting translation. Check server logs.');
                          } finally {
                            setBackfilling(false);
                          }
                        }}
                        isLoading={backfilling}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        {backfilling ? 'Translating…' : 'Run Backfill'}
                      </Button>
                      {backfillMsg && <p className="text-sm text-violet-700 dark:text-violet-300">{backfillMsg}</p>}
                    </div>
                  </div>
                </div>
              </>)}
            </div>
          )}

          {/* ─── SHIPPING CARRIERS ─── */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              {/* ── Carriers ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border"><h2 className="text-xl font-display">Shipping Carriers</h2></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead><tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-4">Name / Code</th>
                        <th className="px-6 py-4">Tracking URL</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border">
                        {shippingCarriers.map(c => (
                          <tr key={c.id} className="hover:bg-muted/5">
                            <td className="px-6 py-4"><div className="font-semibold">{c.name}</div><div className="text-xs text-muted-foreground font-mono">{c.code}</div></td>
                            <td className="px-6 py-4 text-xs text-muted-foreground max-w-[200px] truncate">{c.trackingUrlTemplate || '—'}</td>
                            <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td className="px-6 py-4 text-right space-x-1">
                              <button onClick={() => setCarrierForm({ id: c.id, name: c.name, code: c.code, regions: c.regions || '', apiEndpoint: c.apiEndpoint || '', apiKey: c.apiKey || '', trackingUrlTemplate: c.trackingUrlTemplate || '', notes: c.notes || '', isActive: c.isActive })} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => { if(confirm('Delete carrier?')) apiCall(`/api/admin/shipping/carriers/${c.id}`, 'DELETE'); }} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                        {shippingCarriers.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No carriers added.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-background rounded-2xl border border-border shadow-sm p-6">
                  <h3 className="font-display text-lg mb-4">{carrierForm.id ? 'Edit Carrier' : 'Add Carrier'}</h3>
                  <form onSubmit={handleSaveCarrier} className="space-y-3">
                    <Input placeholder="Carrier Name" value={carrierForm.name} onChange={e => setCarrierForm((f: any) => ({...f, name: e.target.value}))} required />
                    <Input placeholder="Code (e.g. DHL)" value={carrierForm.code} onChange={e => setCarrierForm((f: any) => ({...f, code: e.target.value}))} required />
                    <Input placeholder="Tracking URL (use {tracking})" value={carrierForm.trackingUrlTemplate} onChange={e => setCarrierForm((f: any) => ({...f, trackingUrlTemplate: e.target.value}))} />
                    <div className="relative">
                      <Input type={showCarrierKey ? 'text' : 'password'} placeholder="API Key (optional)" value={carrierForm.apiKey} onChange={e => setCarrierForm((f: any) => ({...f, apiKey: e.target.value}))} />
                      <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowCarrierKey(x => !x)}>{showCarrierKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={carrierForm.isActive} onChange={e => setCarrierForm((f: any) => ({...f, isActive: e.target.checked}))} className="rounded" />
                      Active
                    </label>
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" className="flex-1">{carrierForm.id ? 'Update' : 'Add Carrier'}</Button>
                      {carrierForm.id && <Button type="button" variant="outline" onClick={() => setCarrierForm({ id: null, name: '', code: '', regions: '', apiEndpoint: '', apiKey: '', trackingUrlTemplate: '', notes: '', isActive: true })}><X className="w-4 h-4" /></Button>}
                    </div>
                  </form>
                </div>
              </div>

              {/* ── Shipping Zones ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border"><h2 className="text-xl font-display">Shipping Zones</h2></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead><tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-4">Zone Name</th>
                        <th className="px-6 py-4">Base Price</th>
                        <th className="px-6 py-4">Per kg</th>
                        <th className="px-6 py-4">Days</th>
                        <th className="px-6 py-4">Countries</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border">
                        {shippingZones.map(z => (
                          <tr key={z.id} className="hover:bg-muted/5">
                            <td className="px-6 py-4 font-semibold">{z.name}</td>
                            <td className="px-6 py-4 text-sm">${Number(z.basePriceUsd).toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm">${Number(z.perKgPriceUsd).toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{z.estimatedDaysMin}–{z.estimatedDaysMax}d</td>
                            <td className="px-6 py-4 text-xs text-muted-foreground max-w-[180px]">
                              {Array.isArray(z.countries) && z.countries.length > 0
                                ? z.countries.slice(0, 4).join(', ') + (z.countries.length > 4 ? ` +${z.countries.length - 4}` : '')
                                : <span className="italic">All others</span>}
                            </td>
                            <td className="px-6 py-4 text-right space-x-1">
                              <button onClick={() => setZoneForm({ id: z.id, name: z.name, countries: Array.isArray(z.countries) ? z.countries.join(', ') : '', basePriceUsd: z.basePriceUsd, perKgPriceUsd: z.perKgPriceUsd, estimatedDaysMin: z.estimatedDaysMin, estimatedDaysMax: z.estimatedDaysMax })} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => { if(confirm('Delete zone?')) apiCall(`/api/admin/shipping/zones/${z.id}`, 'DELETE').then(() => setShippingZones(prev => prev.filter(x => x.id !== z.id))); }} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                        {shippingZones.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No zones configured.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-background rounded-2xl border border-border shadow-sm p-6">
                  <h3 className="font-display text-lg mb-4">{zoneForm.id ? 'Edit Zone' : 'Add Zone'}</h3>
                  <form onSubmit={handleSaveZone} className="space-y-3">
                    <Input placeholder="Zone name (e.g. Europe)" value={zoneForm.name} onChange={e => setZoneForm((f: any) => ({...f, name: e.target.value}))} required />
                    <Input placeholder="Base price (USD)" type="number" step="0.01" value={zoneForm.basePriceUsd} onChange={e => setZoneForm((f: any) => ({...f, basePriceUsd: e.target.value}))} required />
                    <Input placeholder="Per kg price (USD)" type="number" step="0.01" value={zoneForm.perKgPriceUsd} onChange={e => setZoneForm((f: any) => ({...f, perKgPriceUsd: e.target.value}))} required />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Days min" type="number" value={zoneForm.estimatedDaysMin} onChange={e => setZoneForm((f: any) => ({...f, estimatedDaysMin: e.target.value}))} required />
                      <Input placeholder="Days max" type="number" value={zoneForm.estimatedDaysMax} onChange={e => setZoneForm((f: any) => ({...f, estimatedDaysMax: e.target.value}))} required />
                    </div>
                    <div>
                      <textarea
                        placeholder="Countries (comma-separated codes or names, empty = catch-all)"
                        value={zoneForm.countries}
                        onChange={e => setZoneForm((f: any) => ({...f, countries: e.target.value}))}
                        rows={3}
                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary outline-none resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave empty for "Rest of World" catch-all</p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" className="flex-1">{zoneForm.id ? 'Update' : 'Add Zone'}</Button>
                      {zoneForm.id && <Button type="button" variant="outline" onClick={() => setZoneForm({ id: null, name: '', countries: '', basePriceUsd: '', perKgPriceUsd: '', estimatedDaysMin: '', estimatedDaysMax: '' })}><X className="w-4 h-4" /></Button>}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ─── BUYER BLACKLIST ─── */}
          {activeTab === 'blacklist' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border"><h2 className="text-xl font-display">Buyer Blacklist</h2></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Added</th>
                      <th className="px-6 py-4 text-right">Remove</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {blacklistedBuyers.map(b => (
                        <tr key={b.id} className="hover:bg-muted/5">
                          <td className="px-6 py-4 text-sm font-mono">{b.buyerEmail}</td>
                          <td className="px-6 py-4 text-sm">{b.buyerName || '—'}</td>
                          <td className="px-6 py-4 text-sm max-w-[200px] truncate">{b.reason}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => { if(confirm('Remove from blacklist?')) apiCall(`/api/admin/buyer-blacklist/${b.id}`, 'DELETE'); }} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                      {blacklistedBuyers.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No blacklisted buyers.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-background rounded-2xl border border-border shadow-sm p-6">
                <h3 className="font-display text-lg mb-4">Block a Buyer</h3>
                <form onSubmit={handleAddBlacklist} className="space-y-3">
                  <Input type="email" placeholder="Buyer Email" value={buyerForm.email} onChange={e => setBuyerForm(f => ({...f, email: e.target.value}))} required />
                  <Input placeholder="Buyer Name (optional)" value={buyerForm.name} onChange={e => setBuyerForm(f => ({...f, name: e.target.value}))} />
                  <Input placeholder="Reason for blocking" value={buyerForm.reason} onChange={e => setBuyerForm(f => ({...f, reason: e.target.value}))} required />
                  <Button type="submit" className="w-full">Add to Blacklist</Button>
                </form>
              </div>
            </div>
          )}

          {/* ─── COUNTRIES ─── */}
          {activeTab === 'countries' && (
            <div className="space-y-4">
              {countryStatus && (
                <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium ${countryStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                  {countryStatus.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" /> : <XCircle className="w-5 h-5 flex-shrink-0 text-red-600" />}
                  <span>{countryStatus.msg}</span>
                  <button onClick={() => setCountryStatus(null)} className="ml-auto text-current opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-display">Artisan Registration Countries</h2>
                    <p className="text-sm text-muted-foreground mt-1">Control which countries can register as artisan vendors. Changes take effect immediately.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead><tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-4">Country</th>
                        <th className="px-6 py-4">Phone Prefix</th>
                        <th className="px-6 py-4">Registration</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border">
                        {countries.map(c => (
                          <tr key={c.id} className="hover:bg-muted/5">
                            <td className="px-6 py-4 font-semibold">{c.countryName}</td>
                            <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{c.phonePrefix}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                {c.isActive ? 'Open' : 'Closed'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-1">
                              <button onClick={() => { setCountryForm({ id: c.id, countryName: c.countryName, phonePrefix: c.phonePrefix }); setCountryStatus(null); }} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => handleToggleCountry(c)} className={`p-1.5 rounded-lg ${c.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`} title={c.isActive ? 'Close registration' : 'Open registration'}>
                                {c.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleDeleteCountry(c)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                        {countries.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No countries configured. Add a country to open artisan registration.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-background rounded-2xl border border-border shadow-sm p-6">
                  <h3 className="font-display text-lg mb-4">{countryForm.id ? 'Edit Country' : 'Add Country'}</h3>
                  <form onSubmit={handleSaveCountry} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Country Name</label>
                      <Input placeholder="e.g. Tunisia" value={countryForm.countryName} onChange={e => setCountryForm((f: any) => ({...f, countryName: e.target.value}))} required />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Phone Prefix</label>
                      <Input placeholder="e.g. +216" value={countryForm.phonePrefix} onChange={e => setCountryForm((f: any) => ({...f, phonePrefix: e.target.value}))} required />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" className="flex-1" disabled={countryLoading}>
                        {countryLoading ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{countryForm.id ? 'Updating…' : 'Adding…'}</span> : countryForm.id ? 'Update Country' : 'Add Country'}
                      </Button>
                      {countryForm.id && <Button type="button" variant="outline" onClick={() => { setCountryForm({ id: null, countryName: '', phonePrefix: '' }); setCountryStatus(null); }}><X className="w-4 h-4" /></Button>}
                    </div>
                  </form>
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 space-y-2">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">How it works</p>
                    <ul className="text-sm text-amber-700 dark:text-amber-500 space-y-1 list-disc list-inside">
                      <li>Adding a country → opens artisan registration <strong>immediately</strong></li>
                      <li>Disabling (orange button) → pauses registrations without deleting</li>
                      <li>Deleting → removes the country from the allowed list</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SUB-ADMINS ─── */}
          {activeTab === 'subadmins' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-display">Sub-Administrators</h2>
                  <p className="text-sm text-muted-foreground mt-1">Create team members with restricted access.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">Admin</th>
                      <th className="px-6 py-4">Permissions</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {subAdmins.map(a => (
                        <tr key={a.id} className="hover:bg-muted/5">
                          <td className="px-6 py-4">
                            <div className="font-semibold">{a.username}</div>
                            <div className="text-xs text-muted-foreground">{a.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {a.permVendors && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Vendors</span>}
                              {a.permDisputes && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Disputes</span>}
                              {a.permShipping && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Shipping</span>}
                              {a.permBlacklist && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Blacklist</span>}
                              {a.permStats && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Stats</span>}
                              {a.permCountries && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Countries</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${a.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>{a.isActive ? 'Active' : 'Suspended'}</span></td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right space-x-1">
                            <button onClick={() => setSubAdminForm({ id: a.id, username: a.username, email: a.email, password: '', permVendors: a.permVendors, permDisputes: a.permDisputes, permShipping: a.permShipping, permBlacklist: a.permBlacklist, permStats: a.permStats, permCountries: a.permCountries, isActive: a.isActive })} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => { if(confirm('Delete this admin?')) apiCall(`/api/admin/sub-admins/${a.id}`, 'DELETE'); }} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                      {subAdmins.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No sub-admins created yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-background rounded-2xl border border-border shadow-sm p-6">
                <h3 className="font-display text-lg mb-4">{subAdminForm.id ? 'Edit Admin' : 'New Sub-Admin'}</h3>
                <form onSubmit={handleSaveSubAdmin} className="space-y-3">
                  {!subAdminForm.id && <Input placeholder="Username" value={subAdminForm.username} onChange={e => setSubAdminForm((f: any) => ({...f, username: e.target.value}))} required />}
                  {!subAdminForm.id && <Input type="email" placeholder="Email" value={subAdminForm.email} onChange={e => setSubAdminForm((f: any) => ({...f, email: e.target.value}))} required />}
                  <div className="relative">
                    <Input type={showSubPass ? 'text' : 'password'} placeholder={subAdminForm.id ? "New Password (leave blank to keep)" : "Password"} value={subAdminForm.password} onChange={e => setSubAdminForm((f: any) => ({...f, password: e.target.value}))} required={!subAdminForm.id} />
                    <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowSubPass(x => !x)}>{showSubPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                  <div className="border border-border rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Permissions</p>
                    {([
                      ['permVendors', 'Vendor Approvals'],
                      ['permDisputes', 'Handle Disputes'],
                      ['permShipping', 'Shipping Partners'],
                      ['permBlacklist', 'Buyer Blacklist'],
                      ['permStats', 'Financial Stats'],
                      ['permCountries', 'Country Management'],
                    ] as [keyof typeof subAdminForm, string][]).map(([key, label]) => (
                      <label key={key as React.Key} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={!!subAdminForm[key]} onChange={e => setSubAdminForm((f: any) => ({...f, [key]: e.target.checked}))} className="w-4 h-4 rounded accent-primary" />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                    {subAdminForm.id && (
                      <label className="flex items-center gap-3 cursor-pointer border-t border-border pt-2 mt-1">
                        <input type="checkbox" checked={!!subAdminForm.isActive} onChange={e => setSubAdminForm((f: any) => ({...f, isActive: e.target.checked}))} className="w-4 h-4 rounded accent-primary" />
                        <span className="text-sm text-green-700 font-medium">Account Active</span>
                      </label>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">{subAdminForm.id ? 'Update' : 'Create Admin'}</Button>
                    {subAdminForm.id && <Button type="button" variant="outline" onClick={() => setSubAdminForm({ id: null, username: '', email: '', password: '', permVendors: true, permDisputes: true, permShipping: false, permBlacklist: false, permStats: false, permCountries: false, isActive: true })}><X className="w-4 h-4" /></Button>}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── REGIONAL SUPERVISORS ─── */}
          {activeTab === 'supervisors' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-display">المشرفون الإقليميون</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    مشرفو الدول يحصلون على 25% من العمولة (2% من البيعة) · مشرفو المدن يحصلون على 25% أيضًا · أنت وحدك تملك صلاحية الإغلاق
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">المشرف</th>
                      <th className="px-6 py-4">المستوى</th>
                      <th className="px-6 py-4">الدولة / المدينة</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4 text-right">إجراءات</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {regionalSupervisors.map(s => (
                        <tr key={s.id} className="hover:bg-muted/5">
                          <td className="px-6 py-4">
                            <div className="font-semibold">{s.username}</div>
                            <div className="text-xs text-muted-foreground">{s.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.level === 'country' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                              {s.level === 'country' ? 'مشرف دولة' : 'مشرف مدينة'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" />{s.country}{s.city ? ` · ${s.city}` : ''}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                              {s.isActive ? 'نشط' : 'معطل'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1">
                            <button onClick={() => setSupForm({ id: s.id, username: s.username, email: s.email, password: '', country: s.country, city: s.city || '', level: s.level })} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Pencil className="w-4 h-4" /></button>
                            <button onClick={async () => {
                              if (!confirm('حذف هذا المشرف؟')) return;
                              const h = { 'x-admin-key': session!.token };
                              await fetch(`/api/admin/supervisors/${s.id}`, { method: 'DELETE', headers: h });
                              setRegionalSupervisors(prev => prev.filter(x => x.id !== s.id));
                            }} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            <button onClick={async () => {
                              const h = { 'x-admin-key': session!.token, 'Content-Type': 'application/json' };
                              await fetch(`/api/admin/supervisors/${s.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ isActive: !s.isActive }) });
                              setRegionalSupervisors(prev => prev.map(x => x.id === s.id ? { ...x, isActive: !x.isActive } : x));
                            }} className={`p-1.5 rounded-lg ${s.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                              {s.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {regionalSupervisors.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">لم تضف مشرفين إقليميين بعد</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-background rounded-2xl border border-border shadow-sm p-6">
                <h3 className="font-display text-lg mb-4">{supForm.id ? 'تعديل المشرف' : 'إضافة مشرف'}</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const h = { 'x-admin-key': session!.token, 'Content-Type': 'application/json' };
                  const { id, ...body } = supForm;
                  if (!body.password && !id) return;
                  if (id) {
                    const r = await fetch(`/api/admin/supervisors/${id}`, { method: 'PUT', headers: h, body: JSON.stringify(body) });
                    if (r.ok) { const d = await r.json(); setRegionalSupervisors(prev => prev.map(s => s.id === id ? d : s)); }
                  } else {
                    const r = await fetch('/api/admin/supervisors', { method: 'POST', headers: h, body: JSON.stringify(body) });
                    if (r.ok) { const d = await r.json(); setRegionalSupervisors(prev => [...prev, d]); }
                  }
                  setSupForm({ id: null, username: '', email: '', password: '', country: '', city: '', level: 'country' });
                }} className="space-y-3">
                  <Input placeholder="اسم المستخدم" value={supForm.username} onChange={e => setSupForm((f: any) => ({ ...f, username: e.target.value }))} required />
                  <Input placeholder="البريد الإلكتروني" type="email" value={supForm.email} onChange={e => setSupForm((f: any) => ({ ...f, email: e.target.value }))} required />
                  <Input placeholder={supForm.id ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'} type="password" value={supForm.password} onChange={e => setSupForm((f: any) => ({ ...f, password: e.target.value }))} required={!supForm.id} />
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase">المستوى</label>
                    <select value={supForm.level} onChange={e => setSupForm((f: any) => ({ ...f, level: e.target.value, city: e.target.value === 'country' ? '' : f.city }))} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary outline-none">
                      <option value="country">مشرف دولة</option>
                      <option value="city">مشرف مدينة</option>
                    </select>
                  </div>
                  <Input placeholder="الدولة (مثال: Egypt)" value={supForm.country} onChange={e => setSupForm((f: any) => ({ ...f, country: e.target.value }))} required />
                  {supForm.level === 'city' && <Input placeholder="المدينة (مثال: Cairo)" value={supForm.city} onChange={e => setSupForm((f: any) => ({ ...f, city: e.target.value }))} required />}
                  <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 p-2 rounded-lg">
                    ⚠️ المشرفون لا يملكون صلاحية إغلاق المتاجر — هذه الصلاحية لك وحدك
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" className="flex-1">{supForm.id ? 'تحديث' : 'إضافة مشرف'}</Button>
                    {supForm.id && <Button type="button" variant="outline" onClick={() => setSupForm({ id: null, username: '', email: '', password: '', country: '', city: '', level: 'country' })}><X className="w-4 h-4" /></Button>}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── PRODUCTS MANAGEMENT ─── */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="text-xl font-display">Product Catalog</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{products.length} products — click a row to edit image, title, price or description</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or vendor…"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3">Image</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products
                        .filter(pr =>
                          !productSearch ||
                          pr.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
                          pr.vendorName?.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map(pr => (
                          <tr key={pr.id} className="border-b border-border hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setEditingProduct({ ...pr })}>
                            <td className="px-4 py-3">
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted border border-border">
                                {pr.imageUrl
                                  ? <img src={pr.imageUrl} alt={pr.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56?text=?'; }} />
                                  : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                                }
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-sm leading-tight max-w-[180px] truncate">{pr.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{pr.originCity}</p>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span>{pr.vendorName}</span>
                              <span className="block text-xs text-muted-foreground">{pr.vendorCountry}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{pr.category}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold">${pr.priceUsd}</td>
                            <td className="px-4 py-3 text-sm">{pr.stockQuantity}</td>
                            <td className="px-4 py-3">
                              <button
                                className="text-primary hover:text-primary/70 transition-colors"
                                onClick={e => { e.stopPropagation(); setEditingProduct({ ...pr }); }}
                                title="Edit product"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit modal */}
              {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                      <h3 className="font-display text-lg">Edit Product #{editingProduct.id}</h3>
                      <button onClick={() => setEditingProduct(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form
                      className="p-6 space-y-4"
                      onSubmit={async e => {
                        e.preventDefault();
                        setSavingProduct(true);
                        try {
                          const r = await fetch(`/api/admin/products/${editingProduct.id}`, {
                            method: 'PUT',
                            headers: getHeaders(session!.token),
                            body: JSON.stringify({
                              title: editingProduct.title,
                              description: editingProduct.description,
                              priceUsd: Number(editingProduct.priceUsd),
                              shippingCostUsd: Number(editingProduct.shippingCostUsd),
                              category: editingProduct.category,
                              imageUrl: editingProduct.imageUrl,
                              originCity: editingProduct.originCity,
                              stockQuantity: Number(editingProduct.stockQuantity),
                              isAvailable: editingProduct.isAvailable,
                            }),
                          });
                          if (r.ok) {
                            const updated = await r.json();
                            setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
                            setEditingProduct(null);
                          }
                        } catch (err) { console.error(err); }
                        finally { setSavingProduct(false); }
                      }}
                    >
                      {/* Image preview + URL */}
                      {/* Image upload + URL */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Product Image</label>
                        <div className="mb-2 rounded-xl overflow-hidden border border-border bg-muted h-48">
                          {editingProduct.imageUrl
                            ? <img src={editingProduct.imageUrl} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Invalid+URL"; }} />
                            : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image set</div>
                          }
                        </div>
                        <AdminImageUploader onUploaded={(url) => setEditingProduct((p: any) => ({ ...p, imageUrl: url }))} />
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Or paste image URL:</p>
                          <input
                            type="url"
                            value={editingProduct.imageUrl || ""}
                            onChange={e => setEditingProduct((p: any) => ({ ...p, imageUrl: e.target.value }))}
                            placeholder="https://example.com/image.jpg"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Title</label>
                        <input
                          type="text"
                          value={editingProduct.title || ""}
                          onChange={e => setEditingProduct((p: any) => ({ ...p, title: e.target.value }))}
                          required
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Price (USD)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingProduct.priceUsd || ''}
                            onChange={e => setEditingProduct((p: any) => ({ ...p, priceUsd: e.target.value }))}
                            required
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Shipping (USD)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingProduct.shippingCostUsd || ''}
                            onChange={e => setEditingProduct((p: any) => ({ ...p, shippingCostUsd: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Origin City</label>
                          <input
                            type="text"
                            value={editingProduct.originCity || ''}
                            onChange={e => setEditingProduct((p: any) => ({ ...p, originCity: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={editingProduct.stockQuantity || ''}
                            onChange={e => setEditingProduct((p: any) => ({ ...p, stockQuantity: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                        <textarea
                          rows={3}
                          value={editingProduct.description || ''}
                          onChange={e => setEditingProduct((p: any) => ({ ...p, description: e.target.value }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!editingProduct.isAvailable}
                          onChange={e => setEditingProduct((p: any) => ({ ...p, isAvailable: e.target.checked }))}
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <span className="text-sm font-medium">Available for sale</span>
                      </label>

                      <div className="flex gap-2 pt-2">
                        <Button type="submit" className="flex-1" disabled={savingProduct}>
                          {savingProduct ? 'Saving…' : 'Save Changes'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── COUNTRY ANALYTICS ─── */}
          {activeTab === 'country-analytics' && (
            <div className="space-y-4" dir="rtl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-display">تحليلات الدول</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    نظرة إجمالية على كل سوق — النشاط، الإيرادات، ومستوى التزام المشرفين
                  </p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {countryAnalytics.length} دولة نشطة
                </span>
              </div>

              {countryAnalytics.length === 0 && (
                <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl">
                  لا توجد بيانات بعد — ستظهر هنا فور تسجيل أول بائع
                </div>
              )}

              {countryAnalytics.map(c => {
                const score = c.engagementScore;
                const scoreColor = score >= 70 ? 'bg-green-100 text-green-800' :
                                   score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                   score >= 20 ? 'bg-orange-100 text-orange-800' :
                                   'bg-red-100 text-red-800';
                const isExpanded = analyticsExpanded === c.country;

                return (
                  <div key={c.country} className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
                    {/* Country Header Row */}
                    <button
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/5 transition-colors"
                      onClick={() => setAnalyticsExpanded(isExpanded ? null : c.country)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">{c.country}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.vendors.active} متجر نشط · {c.orders.total} طلب · {formatCurrency(c.orders.revenue)} إيرادات
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Engagement Score Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${scoreColor}`}>
                          <span>نشاط {score}%</span>
                        </div>
                        {/* Supervisor badge */}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${c.countrySupervisor?.isActive ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground'}`}>
                          {c.countrySupervisor ? (c.countrySupervisor.isActive ? 'مُشرَف' : 'مشرف معطل') : 'بدون مشرف'}
                        </span>
                        <span className="text-muted-foreground text-sm">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-t border-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-x-reverse divide-border">
                          <div className="p-5 text-right">
                            <p className="text-xs text-muted-foreground mb-1">المتاجر</p>
                            <p className="text-2xl font-bold">{c.vendors.total}</p>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <p>✓ نشط: {c.vendors.active}</p>
                              <p>⏳ معلق: {c.vendors.pending}</p>
                              {c.vendors.banned > 0 && <p className="text-red-600">⛔ محظور: {c.vendors.banned}</p>}
                              <p className="mt-1 font-semibold text-stone-700">نسبة القبول: {c.vendors.approvalRate}%</p>
                            </div>
                          </div>
                          <div className="p-5 text-right">
                            <p className="text-xs text-muted-foreground mb-1">الطلبات والإيرادات</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(c.orders.revenue)}</p>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <p>{c.orders.total} طلب إجمالي</p>
                              <p>✓ مؤكد: {c.orders.confirmed}</p>
                              <p>عمولة المنصة: {formatCurrency(c.orders.commission)}</p>
                              <p className="mt-1 font-semibold text-stone-700">{c.orders.ordersPerVendor} طلب/متجر</p>
                            </div>
                          </div>
                          <div className="p-5 text-right">
                            <p className="text-xs text-muted-foreground mb-1">مشرف الدولة</p>
                            {c.countrySupervisor ? (
                              <>
                                <p className="text-lg font-bold">{c.countrySupervisor.name}</p>
                                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                  <p>الحالة: <span className={c.countrySupervisor.isActive ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>{c.countrySupervisor.isActive ? 'نشط' : 'معطل'}</span></p>
                                  <p>عمولاته: {formatCurrency(c.countrySupervisor.totalCommissions)}</p>
                                  <p>معدل التأكيد: {c.countrySupervisor.confirmationRate}%</p>
                                  <p className="mt-1 font-semibold text-stone-700">مشرفو مدن: {c.countrySupervisor.citySupervisors}</p>
                                </div>
                              </>
                            ) : (
                              <div className="mt-2">
                                <p className="text-sm text-orange-600 font-semibold">⚠ لا يوجد مشرف</p>
                                <p className="text-xs text-muted-foreground mt-1">يمكن تعيين مشرف من تبويب المشرفين</p>
                              </div>
                            )}
                          </div>
                          <div className="p-5 text-right">
                            <p className="text-xs text-muted-foreground mb-1">شبكة المدن</p>
                            <p className="text-2xl font-bold">{c.cityNetwork.count}</p>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <p>مشرف مدينة نشط</p>
                              <p>عمولاتهم: {formatCurrency(c.cityNetwork.totalCommissions)}</p>
                              {c.cityNetwork.count > 0 && (
                                <p className="mt-1 font-semibold text-stone-700">
                                  معدل التأكيد: {c.cityNetwork.confirmationRate}%
                                </p>
                              )}
                              {c.orders.avgRating > 0 && (
                                <p className="mt-1">⭐ متوسط التقييم: {c.orders.avgRating}/5</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* City Supervisors Drilldown */}
                        {c.citySupervisors && c.citySupervisors.length > 0 && (
                          <div className="border-t border-border">
                            <div className="px-6 py-3 bg-muted/10 flex items-center justify-between">
                              <p className="text-sm font-semibold flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                مشرفو المدن — مرتبون حسب الأداء
                              </p>
                              <span className="text-xs text-muted-foreground">{c.citySupervisors.length} مشرف</span>
                            </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/5">
                                  <th className="px-5 py-2 text-right">المدينة / الاسم</th>
                                  <th className="px-5 py-2 text-right">المتاجر</th>
                                  <th className="px-5 py-2 text-right">الطلبات</th>
                                  <th className="px-5 py-2 text-right">العمولات</th>
                                  <th className="px-5 py-2 text-right">معدل التأكيد</th>
                                  <th className="px-5 py-2 text-right">المستوى</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {c.citySupervisors.map((cs: any, idx: number) => (
                                  <tr key={cs.id} className={`hover:bg-muted/5 ${idx === 0 ? 'bg-amber-50/50' : ''}`}>
                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-2">
                                        {idx === 0 && <span title="الأفضل أداءً" className="text-amber-500 text-base">★</span>}
                                        <div>
                                          <p className="font-semibold">{cs.city}</p>
                                          <p className="text-xs text-muted-foreground">{cs.name}</p>
                                          <p className="text-xs text-muted-foreground/70">{cs.email}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3 font-semibold">{cs.vendorsInCity}</td>
                                    <td className="px-5 py-3">
                                      <span className="font-semibold">{cs.totalOrders}</span>
                                      {cs.confirmedOrders > 0 && <span className="text-xs text-green-600 mr-1">(✓{cs.confirmedOrders})</span>}
                                    </td>
                                    <td className="px-5 py-3 font-bold text-green-700">{formatCurrency(cs.totalCommissions)}</td>
                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-muted rounded-full h-1.5 w-16">
                                          <div
                                            className={`h-1.5 rounded-full ${cs.confirmationRate >= 70 ? 'bg-green-500' : cs.confirmationRate >= 40 ? 'bg-yellow-500' : 'bg-stone-300'}`}
                                            style={{ width: `${Math.min(cs.confirmationRate, 100)}%` }}
                                          />
                                        </div>
                                        <span className="text-xs">{cs.confirmationRate}%</span>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3">
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                        cs.performanceTier === 'top' ? 'bg-amber-100 text-amber-800' :
                                        cs.performanceTier === 'mid' ? 'bg-blue-100 text-blue-800' :
                                        'bg-stone-100 text-stone-600'}`}>
                                        {cs.performanceTier === 'top' ? '🏆 متميز' : cs.performanceTier === 'mid' ? '📈 واعد' : '🌱 جديد'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Performance note */}
                        <div className={`px-6 py-3 text-xs border-t border-border ${
                          score >= 70 ? 'bg-green-50 text-green-800' :
                          score >= 40 ? 'bg-yellow-50 text-yellow-800' :
                          'bg-orange-50 text-orange-800'
                        }`}>
                          {score >= 70 && '✅ سوق نشط ومتطور — الأداء ممتاز'}
                          {score >= 40 && score < 70 && '📈 سوق في نمو — تحتاج دعمًا إضافيًا لتسريع التوسع'}
                          {score < 40 && c.vendors.total > 0 && '⚠ سوق محدود الحركة — يُنصح بمراجعة المشرف المسؤول أو تعيين مشرف جديد'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── SUPERVISOR PAYOUTS ─── */}
          {activeTab === 'sup-payouts' && (
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-display flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-700" /> طلبات سحب المشرفين
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {supervisorPayouts.filter(r => r.status === 'pending').length} طلب قيد المراجعة
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 text-right">المشرف</th>
                    <th className="px-5 py-3 text-right">المنطقة</th>
                    <th className="px-5 py-3 text-right">المبلغ</th>
                    <th className="px-5 py-3 text-right">البنك</th>
                    <th className="px-5 py-3 text-right">الحالة</th>
                    <th className="px-5 py-3 text-right">التاريخ</th>
                    <th className="px-5 py-3 text-right">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {supervisorPayouts.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">لا توجد طلبات سحب</td></tr>
                  )}
                  {supervisorPayouts.map((r: any) => (
                    <tr key={r.id} className="hover:bg-muted/5">
                      <td className="px-5 py-3">
                        <p className="font-semibold">{r.username}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{r.level === 'country' ? 'مشرف دولة' : 'مشرف مدينة'}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.city || r.country}</p>
                      </td>
                      <td className="px-5 py-3 font-bold text-green-700">{formatCurrency(r.amount_usd)}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {r.bank_name && <p>{r.bank_name}</p>}
                        {r.account_name && <p>{r.account_name}</p>}
                        {r.account_number && <p className="font-mono">{r.account_number}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === 'paid' ? 'bg-green-100 text-green-800' :
                          r.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          r.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                          {r.status === 'paid' ? 'مدفوع' : r.status === 'approved' ? 'موافق عليه' :
                           r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{new Date(r.created_at).toLocaleDateString('ar')}
                      </td>
                      <td className="px-5 py-3">
                        {r.status === 'pending' && (
                          <div className="flex flex-col gap-1">
                            <input value={supPayoutNote[r.id] ?? ''} onChange={e => setSupPayoutNote(p => ({ ...p, [r.id]: e.target.value }))}
                              placeholder="ملاحظة (اختياري)" className="border border-border rounded px-2 py-1 text-xs w-32" />
                            <div className="flex gap-1">
                              <button onClick={async () => {
                                const h = { 'x-admin-key': session?.token || '', 'Content-Type': 'application/json' };
                                const res = await fetch(`/api/admin/supervisor-payouts/${r.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ status: 'approved', adminNotes: supPayoutNote[r.id] }) });
                                if (res.ok) setSupervisorPayouts(prev => prev.map(x => x.id === r.id ? { ...x, status: 'approved' } : x));
                              }} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">موافقة</button>
                              <button onClick={async () => {
                                const h = { 'x-admin-key': session?.token || '', 'Content-Type': 'application/json' };
                                const res = await fetch(`/api/admin/supervisor-payouts/${r.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ status: 'paid', adminNotes: supPayoutNote[r.id] }) });
                                if (res.ok) setSupervisorPayouts(prev => prev.map(x => x.id === r.id ? { ...x, status: 'paid' } : x));
                              }} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">مدفوع</button>
                              <button onClick={async () => {
                                const h = { 'x-admin-key': session?.token || '', 'Content-Type': 'application/json' };
                                const res = await fetch(`/api/admin/supervisor-payouts/${r.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ status: 'rejected', adminNotes: supPayoutNote[r.id] }) });
                                if (res.ok) setSupervisorPayouts(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected' } : x));
                              }} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">رفض</button>
                            </div>
                          </div>
                        )}
                        {r.status !== 'pending' && r.admin_notes && (
                          <p className="text-xs text-muted-foreground">{r.admin_notes}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── PAYOUT REQUESTS ─── */}
          {activeTab === 'payouts' && (
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-xl font-display">Withdrawal Requests</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {payoutRequests.filter(r => r.status === 'pending').length} pending · Process via bank wire transfer
                  </p>
                </div>
                <select
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                  value={payoutFilter}
                  onChange={e => setPayoutFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="divide-y divide-border">
                {payoutRequests
                  .filter(r => payoutFilter === 'all' || r.status === payoutFilter)
                  .map(r => (
                    <div key={r.id} className="p-6">
                      {/* Header row */}
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl font-display font-bold">{formatCurrency(Number(r.amountUsd))}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                              r.status === 'paid' ? 'bg-green-100 text-green-800' :
                              r.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              r.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>{r.status}</span>
                          </div>
                          <p className="text-sm font-semibold">{r.vendorName}</p>
                          <p className="text-xs text-muted-foreground">{r.vendorEmail} · {r.vendorCountry}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Requested: {new Date(r.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {r.processedAt && ` · Processed: ${new Date(r.processedAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div className="bg-muted/40 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Bank</p>
                          <p className="font-medium">{r.bankName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Account Holder</p>
                          <p className="font-medium">{r.bankAccountHolder}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Account Number / RIB</p>
                          <p className="font-mono text-xs bg-background rounded px-2 py-1 border border-border">{r.bankAccountNumber}</p>
                        </div>
                        {r.bankIban && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">IBAN</p>
                            <p className="font-mono text-xs bg-background rounded px-2 py-1 border border-border">{r.bankIban}</p>
                          </div>
                        )}
                        {r.bankSwift && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">SWIFT / BIC</p>
                            <p className="font-mono text-xs bg-background rounded px-2 py-1 border border-border uppercase">{r.bankSwift}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Country</p>
                          <p>{r.bankCountry}</p>
                        </div>
                      </div>

                      {r.vendorNotes && (
                        <p className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4 text-blue-800">
                          <span className="font-semibold">Vendor note:</span> {r.vendorNotes}
                        </p>
                      )}

                      {r.adminNotes && r.status !== 'pending' && (
                        <p className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4 text-gray-700">
                          <span className="font-semibold">Admin note:</span> {r.adminNotes}
                        </p>
                      )}

                      {/* Action area for pending requests */}
                      {r.status === 'pending' && (
                        <div className="space-y-3">
                          <textarea
                            rows={2}
                            value={payoutNote[r.id] ?? ''}
                            onChange={e => setPayoutNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                            placeholder="Admin note (optional — reason for rejection, etc.)"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={async () => {
                                const res = await fetch(`/api/admin/payout-requests/${r.id}`, {
                                  method: 'PATCH',
                                  headers: { 'x-admin-key': session!.token, 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'approved', adminNotes: payoutNote[r.id] || undefined }),
                                });
                                if (res.ok) {
                                  setPayoutRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: 'approved', adminNotes: payoutNote[r.id] || x.adminNotes, processedAt: new Date().toISOString() } : x));
                                }
                              }}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={async () => {
                                const res = await fetch(`/api/admin/payout-requests/${r.id}`, {
                                  method: 'PATCH',
                                  headers: { 'x-admin-key': session!.token, 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'paid', adminNotes: payoutNote[r.id] || undefined }),
                                });
                                if (res.ok) {
                                  setPayoutRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: 'paid', adminNotes: payoutNote[r.id] || x.adminNotes, processedAt: new Date().toISOString() } : x));
                                }
                              }}
                            >
                              <Landmark className="w-3.5 h-3.5 mr-1" /> Mark as Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={async () => {
                                const res = await fetch(`/api/admin/payout-requests/${r.id}`, {
                                  method: 'PATCH',
                                  headers: { 'x-admin-key': session!.token, 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'rejected', adminNotes: payoutNote[r.id] || undefined }),
                                });
                                if (res.ok) {
                                  setPayoutRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected', adminNotes: payoutNote[r.id] || x.adminNotes } : x));
                                }
                              }}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* For approved requests: add mark as paid button */}
                      {r.status === 'approved' && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={async () => {
                            const res = await fetch(`/api/admin/payout-requests/${r.id}`, {
                              method: 'PATCH',
                              headers: { 'x-admin-key': session!.token, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'paid' }),
                            });
                            if (res.ok) {
                              setPayoutRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: 'paid', processedAt: new Date().toISOString() } : x));
                            }
                          }}
                        >
                          <Landmark className="w-3.5 h-3.5 mr-1" /> Mark as Paid (Transfer Sent)
                        </Button>
                      )}
                    </div>
                  ))}

                {payoutRequests.filter(r => payoutFilter === 'all' || r.status === payoutFilter).length === 0 && (
                  <div className="p-16 text-center text-muted-foreground">
                    <Landmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No {payoutFilter === 'all' ? '' : payoutFilter} withdrawal requests.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
