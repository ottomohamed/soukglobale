import { Layout } from "@/components/layout/Layout";
import { useGetProduct } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, CreditCard, Lock, ChevronRight, Truck, Clock, BadgeCheck } from "lucide-react";
import { useState, useEffect } from "react";

const WORLD_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina","Brazil","Bulgaria","Cambodia",
  "Cameroon","Canada","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Finland","France",
  "Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hungary","Iceland","India","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kosovo",
  "Kuwait","Kyrgyzstan","Latvia","Lebanon","Libya","Lithuania","Luxembourg","Madagascar","Malaysia","Mali",
  "Malta","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Macedonia","Norway","Oman","Pakistan",
  "Palestine","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Rwanda","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","Slovenia","Somalia","South Africa",
  "South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania",
  "Thailand","Tunisia","Turkey","Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const schema = z.object({
  buyerName: z.string().min(2, "Full name is required"),
  buyerEmail: z.string().email("Valid email required"),
  buyerCountry: z.string().min(1, "Please select your country"),
  shippingAddress: z.string().min(10, "Full shipping address required"),
});

type FormData = z.infer<typeof schema>;

type ShippingRate = {
  zone: { name: string; estimatedDaysMin: number; estimatedDaysMax: number };
  shippingCostUsd: number;
};

export default function Checkout() {
  const searchParams = new URLSearchParams(window.location.search);
  const productId = Number(searchParams.get("productId"));
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId } as any,
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedCountry = watch("buyerCountry");

  useEffect(() => {
    if (!selectedCountry || !productId) return;
    setLoadingRate(true);
    fetch(`/api/shipping/rates?country=${encodeURIComponent(selectedCountry)}&productId=${productId}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setShippingRate(data); })
      .catch(() => {})
      .finally(() => setLoadingRate(false));
  }, [selectedCountry, productId]);

  if (!productId) return <Layout><div className="py-20 text-center text-xl">No product selected.</div></Layout>;
  if (isLoading) return <Layout><div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div></Layout>;
  if (!product) return <Layout><div className="py-20 text-center">Product not found.</div></Layout>;

  // Determine effective shipping cost
  const isFreeShipping = (product as any).freeShipping === true;
  const shippingCost = isFreeShipping ? 0 : (shippingRate ? shippingRate.shippingCostUsd : product.shippingCostUsd);

  // Buyer pays: product price + shipping only
  // Platform commission (8%) + insurance (2%) are deducted internally from artisan payout
  const total = product.priceUsd + shippingCost;

  // Kept for internal API accounting — NOT shown to buyer
  const commissionUsd = product.priceUsd * 0.08;
  const insuranceUsd = product.priceUsd * 0.02;

  const onSubmit = async (data: FormData) => {
    setIsRedirecting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          vendorId: (product as any).vendorId ?? (product as any).vendor?.id,
          productTitle: product.title,
          imageUrl: product.imageUrl,
          quantity: 1,
          unitPriceUsd: product.priceUsd,
          shippingCostUsd: shippingCost,
          commissionUsd,
          insuranceUsd,
          totalUsd: total,
          ...data,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");
      window.location.href = json.url;
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsRedirecting(false);
    }
  };

  return (
    <Layout>
      <div className="bg-card min-h-screen py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-display mb-2">Secure Checkout</h1>
          <p className="text-muted-foreground mb-10 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Your payment is processed securely by Stripe
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* ── Shipping Form ── */}
            <div className="lg:col-span-7">
              <div className="bg-background rounded-3xl p-8 border border-border shadow-sm">
                <h2 className="text-xl font-display mb-6">Shipping Information</h2>
                <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Full Name" {...register("buyerName")} error={errors.buyerName?.message} />
                    <Input label="Email Address" type="email" {...register("buyerEmail")} error={errors.buyerEmail?.message} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Destination Country</label>
                    {isFreeShipping ? (
                      <div className="mb-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <Truck className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm font-semibold text-green-700">Free Shipping — included by the artisan</span>
                      </div>
                    ) : null}
                    <select
                      {...register("buyerCountry")}
                      className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                    >
                      <option value="">Select your country</option>
                      {WORLD_COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.buyerCountry && (
                      <p className="mt-2 text-sm text-destructive font-medium">{errors.buyerCountry.message}</p>
                    )}

                    {/* Shipping rate info — only when not free shipping */}
                    {!isFreeShipping && (
                      <>
                        {loadingRate && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Calculating shipping…
                          </div>
                        )}
                        {!loadingRate && shippingRate && (
                          <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                            <Truck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div className="text-sm">
                              <span className="font-semibold text-foreground">{formatCurrency(shippingRate.shippingCostUsd)}</span>
                              <span className="text-muted-foreground"> · {shippingRate.zone.name}</span>
                              <div className="flex items-center gap-1 mt-0.5 text-muted-foreground text-xs">
                                <Clock className="w-3 h-3" />
                                {shippingRate.zone.estimatedDaysMin}–{shippingRate.zone.estimatedDaysMax} business days
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Full Shipping Address</label>
                    <textarea
                      {...register("shippingAddress")}
                      rows={3}
                      placeholder="Street, City, ZIP / Postal Code"
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary resize-none outline-none focus:ring-4 focus:ring-primary/10"
                    />
                    {errors.shippingAddress && (
                      <p className="mt-2 text-sm text-destructive">{errors.shippingAddress.message}</p>
                    )}
                  </div>

                  <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Stripe Secure Payment</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You'll be redirected to Stripe's secure page to enter your card details.
                        We accept Visa, Mastercard, American Express, Apple Pay & Google Pay.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                      ⚠️ {error}
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:col-span-5">
              <div className="bg-foreground text-background rounded-3xl p-8 sticky top-28 shadow-2xl">
                <h2 className="text-2xl font-display mb-8">Order Summary</h2>

                <div className="flex items-start gap-4 mb-8">
                  <div className="w-20 h-20 bg-background/10 rounded-xl overflow-hidden shrink-0">
                    {product.imageUrl && <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base leading-snug">{product.title}</h3>
                    <p className="text-background/60 text-sm">By {product.vendorName}</p>
                    <p className="text-primary font-bold mt-1">{formatCurrency(product.priceUsd)}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm mb-8 pb-8 border-b border-background/20">
                  <div className="flex justify-between text-background/80">
                    <span>Product Price</span>
                    <span>{formatCurrency(product.priceUsd)}</span>
                  </div>
                  <div className="flex justify-between text-background/80">
                    <div>
                      <span>Shipping</span>
                      {!isFreeShipping && shippingRate && (
                        <span className="ml-1 text-xs text-background/50">({shippingRate.zone.name})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!isFreeShipping && loadingRate && (
                        <div className="w-3 h-3 border border-background/40 border-t-transparent rounded-full animate-spin" />
                      )}
                      {isFreeShipping ? (
                        <span className="text-green-400 font-semibold">Free</span>
                      ) : (
                        <span>{formatCurrency(shippingCost)}</span>
                      )}
                    </div>
                  </div>
                  {!isFreeShipping && shippingRate && (
                    <div className="flex items-center gap-1 text-xs text-background/40 -mt-1 pl-0">
                      <Clock className="w-3 h-3" />
                      {shippingRate.zone.estimatedDaysMin}–{shippingRate.zone.estimatedDaysMax} business days
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xl font-bold mb-6">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>

                {/* Buyer protection badge */}
                <div className="mb-6 p-3 rounded-xl bg-background/5 border border-background/10 flex items-center gap-2 text-xs text-background/50">
                  <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Buyer protection included · No hidden fees</span>
                </div>

                <Button type="submit" form="checkout-form" size="lg" className="w-full" isLoading={isRedirecting}>
                  {isRedirecting ? "Redirecting to Stripe…" : (
                    <span className="flex items-center gap-2">
                      Pay {formatCurrency(total)} <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-background/50">
                  <ShieldCheck className="w-4 h-4" />
                  Powered by Stripe · SSL Encrypted
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  {["VISA", "MC", "AMEX"].map((card) => (
                    <span key={card} className="text-[10px] font-bold bg-background/10 px-2 py-1 rounded text-background/60">{card}</span>
                  ))}
                  <span className="text-[10px] font-bold bg-background/10 px-2 py-1 rounded text-background/60">Apple Pay</span>
                  <span className="text-[10px] font-bold bg-background/10 px-2 py-1 rounded text-background/60">G Pay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
