import { Layout } from "@/components/layout/Layout";
import { useCreateVendor } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CRAFT_CATEGORIES } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useRef } from "react";
import { Globe, Lock, CheckCircle2, AlertTriangle, ShieldCheck, PackageCheck, Clock, Users, Ban, HandCoins, Video } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  country: z.string().min(2, "Country is required"),
  phoneNumber: z.string().regex(/^\+\d{7,15}$/, "Enter a valid international number (e.g. +34612345678)"),
  city: z.string().optional(),
  craftSpecialty: z.string().min(2, "Please select or enter your specialty"),
  youtubeUrl: z.string().url("Must be a valid URL").includes("youtube.com", { message: "Must be a YouTube link" }).or(z.literal("")).optional(),
  bio: z.string().min(20, "Please tell us a bit about yourself (min 20 characters)"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const { mutate, isPending, error } = useCreateVendor();
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [countryCheck, setCountryCheck] = useState<{ isAllowed: boolean; countryName: string } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cacheKey = "sg_artisan_eligible";
    const cacheTs = "sg_artisan_eligible_ts";
    const cached = sessionStorage.getItem(cacheKey);
    const cachedTs = Number(sessionStorage.getItem(cacheTs) || 0);
    if (cached !== null && Date.now() - cachedTs < 10 * 60 * 1000) {
      setCountryCheck({ isAllowed: cached === "1", countryName: "your region" });
      return;
    }
    fetch("/api/visitor-country")
      .then(r => r.json())
      .then((data: { isAllowed: boolean; countryName: string }) => {
        setCountryCheck(data);
        sessionStorage.setItem(cacheKey, data.isAllowed ? "1" : "0");
        sessionStorage.setItem(cacheTs, String(Date.now()));
      })
      .catch(() => setCountryCheck({ isAllowed: false, countryName: "your region" }));
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // While checking — show nothing (avoids flash)
  if (countryCheck === null) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // Country not allowed — show friendly message
  if (!countryCheck.isAllowed) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-20">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-display mb-4">Not Available in Your Region</h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Artisan registration is currently available in select countries only.
              We're expanding our platform gradually to ensure the best experience for artisans and buyers alike.
            </p>
            <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3 text-sm text-muted-foreground">
              <Lock className="w-5 h-5 flex-shrink-0" />
              <span>We detected your location as <strong>{countryCheck.countryName}</strong>. If you believe this is an error, please contact us.</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleTermsScroll = () => {
    const el = termsRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setTermsScrolled(true);
  };

  const onSubmit = (data: FormData) => {
    if (!termsAccepted) return;
    const { confirmPassword, ...vendorData } = data;
    mutate({ data: vendorData as any }, {
      onSuccess: () => setSubmittedData(data),
    });
  };

  if (submittedData) {
    return (
      <Layout>
        <div className="bg-card min-h-[calc(100vh-80px)] py-20 relative">
          <div className="max-w-2xl mx-auto px-4 relative z-10 text-center">
            <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-display mb-6">Application Submitted!</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Our team will review your application within 2–3 business days. You'll receive an email once a decision is made.
            </p>
            <div className="bg-background rounded-3xl p-8 shadow-xl shadow-black/5 border border-border text-left">
              <h2 className="text-2xl font-display mb-6 border-b border-border pb-4">Application Details</h2>
              <div className="space-y-4">
                <div><span className="font-semibold text-muted-foreground">Name:</span> <span className="ml-2">{submittedData.name}</span></div>
                <div><span className="font-semibold text-muted-foreground">Email:</span> <span className="ml-2">{submittedData.email}</span></div>
                <div><span className="font-semibold text-muted-foreground">Location:</span> <span className="ml-2">{submittedData.city ? `${submittedData.city}, ` : ''}{submittedData.country}</span></div>
                <div><span className="font-semibold text-muted-foreground">Craft Specialty:</span> <span className="ml-2">{submittedData.craftSpecialty}</span></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-card min-h-[calc(100vh-80px)] py-20 relative">
        <div className="max-w-2xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display mb-4">Join as an Artisan</h1>
            <p className="text-muted-foreground text-lg">
              Artisans from all over the world are welcome to apply and sell on SoukGlobale.
            </p>
          </div>

          <div className="bg-background rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/5 border border-border">
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-xl font-medium">
                {error.message || "An error occurred"}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Full Name" {...register('name')} error={errors.name?.message} />
                <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Country"
                    placeholder="e.g. Morocco, Spain, France..."
                    {...register('country')}
                    error={errors.country?.message}
                  />
                </div>
                <div>
                  <Input
                    label="Phone Number"
                    placeholder="+34 612 345 678"
                    {...register('phoneNumber')}
                    error={errors.phoneNumber?.message}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">Include country code (e.g. +34, +212, +33)</p>
                </div>
                <Input label="City / Region" placeholder="Your city" {...register('city')} error={errors.city?.message} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Primary Craft Specialty</label>
                <select
                  {...register('craftSpecialty')}
                  className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">Select Craft</option>
                  {CRAFT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.craftSpecialty && <p className="mt-2 text-sm text-destructive">{errors.craftSpecialty.message}</p>}
              </div>

              <div>
                <Input
                  label="YouTube Channel / Process Video URL (optional)"
                  placeholder="https://youtube.com/watch?v=..."
                  {...register('youtubeUrl')}
                  error={errors.youtubeUrl?.message}
                />
                <p className="text-xs text-muted-foreground mt-1.5">Adding a video greatly increases your chances of approval.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Your Story / Bio</label>
                <textarea
                  {...register('bio')}
                  rows={5}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
                  placeholder="Tell buyers about your background, how you learned your craft..."
                />
                {errors.bio && <p className="mt-2 text-sm text-destructive">{errors.bio.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Password (min 8 characters)"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                />
              </div>

              {/* ── Artisan Policy Agreement ─────────────────────────────── */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <h3 className="font-display text-lg">Artisan Platform Agreement</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  Please read the following policies carefully. By joining SoukGlobale you confirm you have read, understood, and agreed to every point below.
                </p>

                {/* Scrollable terms box */}
                <div
                  ref={termsRef}
                  onScroll={handleTermsScroll}
                  className="h-64 overflow-y-auto rounded-xl border-2 border-border bg-muted/30 p-5 space-y-5 text-sm scrollbar-thin scrollbar-thumb-border"
                >
                  {/* 1 — Commission */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <PackageCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Commission & Fees — 10% deducted from your payout</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Listing and maintaining your shop is <strong>completely free</strong>. On each successful sale, SoukGlobale deducts <strong>10%</strong> from your payout: <strong>8%</strong> platform commission + <strong>2%</strong> buyer protection insurance. <strong>Buyers are never charged these fees</strong> — they pay only the product price and shipping you set. No hidden charges, ever.
                      </p>
                    </div>
                  </div>

                  {/* 2 — Escrow / Payment hold */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Payment Hold Until Delivery Confirmed</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Your sale revenue is <strong>held in escrow</strong> until the buyer confirms they received the item. Once delivery is confirmed, the buyer has <strong>48 hours</strong> to raise any issue. If no dispute is raised within 48 hours, the funds are <strong>released to you automatically</strong>.
                      </p>
                    </div>
                  </div>

                  {/* 3 — Fraud / Misrepresentation */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Ban className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Zero Tolerance for Fraud</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Sending an item that does not match your listing photos or description is considered fraud. A <strong>first violation results in immediate account suspension</strong>. A second violation results in a <strong>permanent ban</strong> and any pending earnings are forfeited. We take buyer trust very seriously.
                      </p>
                    </div>
                  </div>

                  {/* 4 — Handmade only */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HandCoins className="w-4 h-4 text-green-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Handmade Items Only</p>
                      <p className="text-muted-foreground leading-relaxed">
                        SoukGlobale is exclusively for <strong>handcrafted items made by you personally</strong>. Mass-produced, factory-made, or resold goods are strictly prohibited and will lead to immediate removal of your shop without warning.
                      </p>
                    </div>
                  </div>

                  {/* 5 — No bulk / wholesale */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-orange-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">No Wholesale or Bulk Selling</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Each product listing may offer a maximum of <strong>3 units per order</strong>. Selling more than 3 identical units to a single buyer is considered wholesale trade, which is incompatible with our platform's mission. We actively fight against middlemen and intermediaries.
                      </p>
                    </div>
                  </div>

                  {/* 6 — Buyer experience */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Buyer Experience is Our Priority</p>
                      <p className="text-muted-foreground leading-relaxed">
                        The most important principle of SoukGlobale is that <strong>every buyer has a flawless experience</strong>. You are responsible for accurate photos, honest descriptions, proper packaging, and timely shipping. Repeat complaints from buyers will lead to account review and possible suspension.
                      </p>
                    </div>
                  </div>

                  {/* 7 — Video content license */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Video className="w-4 h-4 text-purple-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Video Content — Non-Exclusive License</p>
                      <p className="text-muted-foreground leading-relaxed">
                        By providing a YouTube video link, you grant SoukGlobale a <strong>non-exclusive, royalty-free license</strong> to re-publish that video on the platform's official YouTube channel and social media pages for promotional purposes. <strong>You retain full copyright ownership</strong> of your video at all times. Every re-publication will include your artisan name and a direct link back to your original channel — giving your craft global visibility at no cost to you. You may request removal of your video from our channel at any time by contacting support.
                      </p>
                    </div>
                  </div>

                  {/* Scroll indicator */}
                  {!termsScrolled && (
                    <div className="text-center text-xs text-muted-foreground pt-2 animate-pulse">
                      ↓ Scroll down to read all policies
                    </div>
                  )}
                </div>

                {/* Warning if not scrolled */}
                {!termsScrolled && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    You must read all the policies before you can accept them.
                  </div>
                )}

                {/* Acceptance checkbox */}
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${termsScrolled ? 'hover:bg-primary/5 hover:border-primary/40 border-border' : 'opacity-50 pointer-events-none border-border'} ${termsAccepted ? 'border-primary bg-primary/5' : ''}`}>
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${termsAccepted ? 'bg-primary border-primary' : 'border-border'}`}>
                    {termsAccepted && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    disabled={!termsScrolled}
                  />
                  <span className="text-sm font-medium leading-relaxed">
                    I have read and fully agree to all of SoukGlobale's Artisan Platform Policies, including the 10% commission structure, escrow payment hold, zero-tolerance fraud policy, handmade-only rule, no-wholesale policy, and the non-exclusive video content license granting SoukGlobale the right to re-publish my videos with full attribution.
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-lg mt-4"
                isLoading={isPending}
                disabled={!termsAccepted || isPending}
              >
                {termsAccepted ? "Submit My Application" : "Please Accept the Terms to Continue"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
