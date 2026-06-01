import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Link } from "wouter";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useGetStats, useListProducts, useListVendors } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/constants";
import { Globe, Users, ShoppingBag, Shield, Truck, Star, Award, ArrowRight, Flame, Clock, MapPin } from "lucide-react";
import { PotteryIcon, JewelryIcon, LeatherIcon, CarpetsIcon, WoodworkIcon, EmbroideryIcon, MetalworkIcon, PapyrusIcon } from "@/components/ui/CraftIcons";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString() + suffix);
  const ref = useRef<HTMLHeadingElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) { setStarted(true); animate(count, target, { duration: 2, ease: "easeOut" }); } },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, started, count]);

  return <motion.h3 ref={ref} className="text-5xl font-display mb-2">{rounded}</motion.h3>;
}

const categoryData = [
  { name: "Pottery",    Icon: PotteryIcon,   accent: "#b45309", bg: "from-amber-50 to-amber-100/60",   border: "border-amber-200/80",  text: "text-amber-800" },
  { name: "Leather",   Icon: LeatherIcon,   accent: "#78350f", bg: "from-stone-50 to-stone-100/60",   border: "border-stone-300/80",  text: "text-stone-800" },
  { name: "Jewelry",   Icon: JewelryIcon,   accent: "#1d4ed8", bg: "from-blue-50 to-blue-100/60",     border: "border-blue-200/80",   text: "text-blue-800"  },
  { name: "Carpets",   Icon: CarpetsIcon,   accent: "#9f1239", bg: "from-rose-50 to-rose-100/60",     border: "border-rose-200/80",   text: "text-rose-800"  },
  { name: "Woodwork",  Icon: WoodworkIcon,  accent: "#92400e", bg: "from-orange-50 to-orange-100/60", border: "border-orange-200/80", text: "text-orange-800"},
  { name: "Embroidery",Icon: EmbroideryIcon,accent: "#6b21a8", bg: "from-purple-50 to-purple-100/60", border: "border-purple-200/80", text: "text-purple-800"},
  { name: "Metalwork", Icon: MetalworkIcon, accent: "#374151", bg: "from-slate-50 to-slate-100/60",   border: "border-slate-200/80",  text: "text-slate-700" },
  { name: "Papyrus Art",Icon: PapyrusIcon,  accent: "#3d6b21", bg: "from-lime-50 to-lime-100/60",     border: "border-lime-200/80",   text: "text-lime-800"  },
];

const trustFeatures = [
  { icon: <Shield className="w-6 h-6 text-primary" />, title: "Verified Artisans", desc: "Every seller is personally vetted and approved by our team before listing." },
  { icon: <Truck className="w-6 h-6 text-primary" />, title: "Worldwide Shipping", desc: "We ship to 120+ countries via DHL, Aramex, FedEx and local carriers." },
  { icon: <Star className="w-6 h-6 text-primary" />, title: "5-Star Reviews", desc: "Over 95% of our orders receive 5-star ratings from happy buyers." },
  { icon: <Award className="w-6 h-6 text-primary" />, title: "Fair Trade Promise", desc: "Artisans keep 85% of every sale. No middlemen, no exploitation." },
];

const testimonials = [
  { name: "Sophie M.", country: "Paris, France 🇫🇷", text: "The zellige bowl arrived perfectly packed and looks stunning on my dining table. The artisan even included a handwritten note. 10/10!", stars: 5, product: "Zellige Ceramic Bowl" },
  { name: "James K.", country: "New York, USA 🇺🇸", text: "Bought the thuya wood jewelry box for my wife's birthday. She was speechless. The craftsmanship is unlike anything you find in regular stores.", stars: 5, product: "Thuya Jewelry Box" },
  { name: "Yuki T.", country: "Tokyo, Japan 🇯🇵", text: "The Siwa embroidered cushion is a masterpiece. Shipping was fast and the packaging was beautiful. Will definitely order again!", stars: 5, product: "Siwa Embroidered Cushion" },
];

export default function Home() {
  const { data: stats } = useGetStats();
  const { data: productsData, isLoading: productsLoading } = useListProducts({ limit: 8 });
  const { data: vendorsData } = useListVendors({ limit: 4 });

  const products = productsData?.products ?? [];
  const vendors = vendorsData?.vendors ?? [];

  return (
    <Layout>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-36 lg:pt-32 lg:pb-52 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-morocco.png`}
            alt="Moroccan artisan crafts"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-900/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <span className="text-amber-400 font-bold tracking-widest uppercase text-sm mb-4 block">
              Fair Trade & Direct
            </span>
            <h1 className="text-5xl md:text-7xl font-display text-white leading-[1.1] mb-6">
              Authentic crafts,<br /> directly from the{" "}
              <span className="text-amber-400 italic">source</span>.
            </h1>
            <p className="text-lg md:text-xl text-stone-300 mb-10 leading-relaxed max-w-xl">
              We connect skilled artisans in Morocco & Egypt directly with
              buyers worldwide. Watch how they create, hear their stories, and
              support true craftsmanship.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products">
                <Button size="lg">Explore Collection</Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-white/40 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20">
                  Our Mission
                </Button>
              </Link>
            </div>

            {/* Live pulse */}
            <div className="flex items-center gap-2 mt-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm text-stone-300 font-medium">
                <strong className="text-white">3 items</strong> sold in the last hour
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Animated Stats ─────────────────────────────────────────────── */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
            {[
              { icon: <Users className="w-8 h-8" />, value: stats?.totalVendors ?? 14, suffix: "+", label: "Verified Artisans" },
              { icon: <Globe className="w-8 h-8" />, value: 120, suffix: "+", label: "Countries Served" },
              { icon: <ShoppingBag className="w-8 h-8" />, value: stats?.totalProducts ?? 30, suffix: "+", label: "Unique Items" },
              { icon: <Star className="w-8 h-8" />, value: 98, suffix: "%", label: "5-Star Satisfaction" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
                  {s.icon}
                </div>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
                <p className="text-primary-foreground/80 uppercase tracking-widest text-sm font-semibold">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display text-foreground mb-4">Shop by Craft</h2>
            <p className="text-muted-foreground">Centuries-old traditions, delivered to your door.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categoryData.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, ease: "easeOut" }}
                className="cursor-pointer group"
              >
                <Link href={`/products?category=${encodeURIComponent(cat.name)}`}>
                  <div className={`bg-gradient-to-b ${cat.bg} ${cat.border} border rounded-xl p-4 flex flex-col items-center gap-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-opacity-100`}>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center transition-colors duration-200" style={{ backgroundColor: `${cat.accent}12`, color: cat.accent }}>
                      <cat.Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight tracking-wide uppercase ${cat.text}`}>{cat.name}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ───────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Trending Now</span>
              </div>
              <h2 className="text-4xl font-display text-foreground mb-4">Featured Discoveries</h2>
              <p className="text-muted-foreground max-w-xl">
                Handpicked items representing the finest skills and traditions from Morocco & Egypt.
              </p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-1 text-primary font-semibold hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-square rounded-2xl mb-4" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.slice(0, 8).map((product, idx) => {
                const isNew = idx < 3;
                const isBest = idx === 0 || idx === 4;
                const stock = product.stockQuantity ?? 10;
                const isLow = stock <= 4;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (idx % 4) * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <Link href={`/products/${product.id}`}>
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/20 mb-4">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground font-display">
                            No Image
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {isBest && (
                            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                              ⭐ Bestseller
                            </span>
                          )}
                          {isNew && !isBest && (
                            <span className="bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                              ✨ New
                            </span>
                          )}
                          {isLow && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                              🔥 Only {stock} left
                            </span>
                          )}
                        </div>

                        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-foreground">
                          {product.vendorCountry}
                        </div>
                      </div>
                      <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors truncate">
                        {product.title}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-muted-foreground truncate max-w-[60%]">
                          By {product.vendorName}
                        </p>
                        <p className="font-semibold text-foreground">{formatCurrency(product.priceUsd)}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">(verified)</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" variant="outline">View All Products <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Meet the Artisans ───────────────────────────────────────────── */}
      {vendors.length > 0 && (
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-display text-foreground mb-4">Meet the Artisans</h2>
                <p className="text-muted-foreground">Real people, real crafts, real stories.</p>
              </div>
              <Link href="/vendors" className="hidden md:flex items-center gap-1 text-primary font-semibold hover:underline">
                All artisans <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {vendors.map((vendor, i) => {
                const rating = vendor.rating ? Number(vendor.rating) : 0;
                const reviewsCount = (vendor as any).reviewsCount ?? 0;
                return (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/vendors/${vendor.id}`}>
                    <div className="group bg-card border border-border/50 rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all text-center cursor-pointer">
                      <div className="relative inline-block mb-4">
                        <img
                          src={vendor.avatarUrl ?? `https://api.dicebear.com/7.x/personas/svg?seed=${vendor.name}`}
                          alt={vendor.name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-md mx-auto"
                        />
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">✓</span>
                        </span>
                      </div>
                      <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors">{vendor.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" />{vendor.city}, {vendor.country}
                      </p>
                      {/* ── Stars ── */}
                      <div className="flex items-center justify-center gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= Math.round(rating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-300"
                            }`}
                          />
                        ))}
                        {rating > 0 ? (
                          <span className="text-xs font-bold text-foreground ml-1">{rating.toFixed(1)}</span>
                        ) : null}
                        {reviewsCount > 0 ? (
                          <span className="text-xs text-muted-foreground">({reviewsCount})</span>
                        ) : (
                          <span className="text-xs text-muted-foreground ml-1">No reviews</span>
                        )}
                      </div>
                      <p className="text-xs text-primary font-semibold mt-2">{vendor.craftSpecialty}</p>
                    </div>
                  </Link>
                </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display text-foreground mb-4">What Buyers Say</h2>
            <p className="text-muted-foreground">Real reviews from real buyers around the world.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background border border-border/50 rounded-2xl p-8 shadow-sm"
              >
                <div className="flex mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground/80 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.country}</p>
                    <p className="text-xs text-primary mt-0.5">Bought: {t.product}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why SoukGlobale ─────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display text-foreground mb-4">Why SoukGlobale?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We built SoukGlobale because the world's most talented artisans deserve a global stage —
              and buyers deserve authentic, traceable craftsmanship.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustFeatures.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  {f.icon}
                </div>
                <h3 className="font-display text-xl mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display mb-6 leading-tight">
              Are you an artisan from<br />
              <span className="text-primary">Morocco or Egypt?</span>
            </h2>
            <p className="text-background/70 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of buyers waiting for authentic handcrafts.
              Apply today — approval takes less than 48 hours and listing is free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Apply to Sell <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10">
                  Learn How It Works
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-10 text-background/50 text-sm">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 48h approval</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Free to list</span>
              <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Global reach</span>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
