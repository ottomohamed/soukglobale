import { Layout } from "@/components/layout/Layout";
import { useListProducts } from "@workspace/api-client-react";
import { Link, useSearch } from "wouter";
import { useState, useEffect } from "react";
import { formatCurrency, DEVELOPING_COUNTRIES } from "@/lib/constants";
import { Search, SlidersHorizontal, X, ShoppingBag, Star, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AllIcon, PotteryIcon, JewelryIcon, LeatherIcon, WeavingIcon, WoodworkIcon, CarpetsIcon, CeramicsIcon, MetalworkIcon, EmbroideryIcon } from "@/components/ui/CraftIcons";

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "All",        Icon: AllIcon,        active: "bg-primary/10 text-primary border-primary/40",           inactive: "border-border text-muted-foreground" },
  { name: "Pottery",    Icon: PotteryIcon,    active: "bg-orange-50 text-orange-700 border-orange-300",         inactive: "border-border text-muted-foreground" },
  { name: "Jewelry",    Icon: JewelryIcon,    active: "bg-blue-50 text-blue-700 border-blue-300",               inactive: "border-border text-muted-foreground" },
  { name: "Leather",    Icon: LeatherIcon,    active: "bg-amber-50 text-amber-800 border-amber-300",            inactive: "border-border text-muted-foreground" },
  { name: "Weaving",    Icon: WeavingIcon,    active: "bg-rose-50 text-rose-700 border-rose-300",               inactive: "border-border text-muted-foreground" },
  { name: "Woodwork",   Icon: WoodworkIcon,   active: "bg-yellow-50 text-yellow-800 border-yellow-300",         inactive: "border-border text-muted-foreground" },
  { name: "Carpets",    Icon: CarpetsIcon,    active: "bg-red-50 text-red-700 border-red-300",                  inactive: "border-border text-muted-foreground" },
  { name: "Ceramics",   Icon: CeramicsIcon,   active: "bg-teal-50 text-teal-700 border-teal-300",               inactive: "border-border text-muted-foreground" },
  { name: "Metalwork",  Icon: MetalworkIcon,  active: "bg-slate-100 text-slate-700 border-slate-300",           inactive: "border-border text-muted-foreground" },
  { name: "Embroidery", Icon: EmbroideryIcon, active: "bg-purple-50 text-purple-700 border-purple-300",         inactive: "border-border text-muted-foreground" },
];

const PRICE_RANGES = [
  { label: "Any Price", min: "", max: "" },
  { label: "Under $25", min: "", max: "25" },
  { label: "$25 – $75", min: "25", max: "75" },
  { label: "$75 – $150", min: "75", max: "150" },
  { label: "$150+", min: "150", max: "" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

// ── Helper: read URL search params ───────────────────────────────────────────
function useSearchParams() {
  const search = useSearch();
  return new URLSearchParams(search);
}

export default function Products() {
  const params = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(params.get("category") ?? "");
  const [selectedCountry, setSelectedCountry] = useState(params.get("country") ?? "");
  const [selectedPrice, setSelectedPrice] = useState(0); // index into PRICE_RANGES
  const [sortBy, setSortBy] = useState("newest");
  const [searchText, setSearchText] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [showFilters, setShowFilters] = useState(false);

  // Pre-populate from URL params on mount
  useEffect(() => {
    const cat = params.get("category");
    if (cat) setSelectedCategory(cat);
    const s = params.get("search");
    if (s) { setSearchText(s); setDebouncedSearch(s); }
  }, []); // eslint-disable-line

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const priceRange = PRICE_RANGES[selectedPrice];

  const { data, isLoading } = useListProducts({
    category: selectedCategory || undefined,
    country: selectedCountry || undefined,
    minPrice: priceRange.min || undefined,
    maxPrice: priceRange.max || undefined,
    search: debouncedSearch || undefined,
    sortBy,
    limit: 30,
  } as any);

  const activeFilters = [
    selectedCategory && { key: "category", label: selectedCategory, clear: () => setSelectedCategory("") },
    selectedCountry && { key: "country", label: selectedCountry, clear: () => setSelectedCountry("") },
    selectedPrice !== 0 && { key: "price", label: priceRange.label, clear: () => setSelectedPrice(0) },
    debouncedSearch && { key: "search", label: `"${debouncedSearch}"`, clear: () => { setSearchText(""); setDebouncedSearch(""); } },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const clearAll = () => {
    setSelectedCategory("");
    setSelectedCountry("");
    setSelectedPrice(0);
    setSortBy("newest");
    setSearchText("");
    setDebouncedSearch("");
  };

  return (
    <Layout>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <h1 className="text-4xl font-display text-foreground mb-1">Marketplace</h1>
          <p className="text-muted-foreground">
            {data?.total !== undefined ? `${data.total} handcrafted items` : "Discover unique, handcrafted items"} from verified artisans.
          </p>
        </div>

        {/* ── Category Tiles ──────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const active = cat.name === "All" ? !selectedCategory : selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name === "All" ? "" : cat.name)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${
                    active
                      ? `${cat.active} border-2 shadow-sm`
                      : `bg-background ${cat.inactive} hover:border-primary/40 hover:text-foreground`
                  }`}
                >
                  <cat.Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search within results…"
                className="w-full h-10 pl-9 pr-4 rounded-full border-2 border-border bg-background text-sm focus:border-primary focus:ring-0 outline-none transition-colors"
              />
              {searchText && (
                <button onClick={() => { setSearchText(""); setDebouncedSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Price range */}
            <div className="relative">
              <select
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(Number(e.target.value))}
                className="appearance-none h-10 pl-4 pr-8 rounded-full border-2 border-border bg-background text-sm font-medium text-foreground focus:border-primary focus:ring-0 outline-none cursor-pointer"
              >
                {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Country */}
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="appearance-none h-10 pl-4 pr-8 rounded-full border-2 border-border bg-background text-sm font-medium text-foreground focus:border-primary focus:ring-0 outline-none cursor-pointer"
              >
                <option value="">All Origins</option>
                {DEVELOPING_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none h-10 pl-4 pr-8 rounded-full border-2 border-border bg-background text-sm font-medium text-foreground focus:border-primary focus:ring-0 outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Active filter chips */}
          <AnimatePresence>
            {activeFilters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-2 mt-3"
              >
                <span className="text-xs text-muted-foreground font-medium">Active:</span>
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={f.clear}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                  >
                    {f.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Product Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-[4/5] rounded-2xl mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : data?.products?.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-border">
            <ShoppingBag className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-2xl font-display text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">Try a different category or clear your filters.</p>
            <button onClick={clearAll} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {data?.products?.map((product, idx) => {
              const stock = product.stockQuantity ?? 10;
              const isLow = stock <= 4;
              const isBest = idx % 7 === 0;
              const isNew = idx % 5 === 1;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                  className="group"
                >
                  <Link href={`/products/${product.id}`}>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/20 mb-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground font-display text-sm">No Image</div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {isBest && <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full shadow">⭐ Bestseller</span>}
                        {isNew && !isBest && <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">✨ New</span>}
                        {isLow && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">🔥 Only {stock} left</span>}
                      </div>

                      {/* Country tag */}
                      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold">
                        {product.vendorCountry}
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-white text-xs font-semibold">View Product →</p>
                      </div>
                    </div>

                    <h3 className="font-display text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mb-1">{product.vendorName}</p>
                    <p className="font-bold text-foreground text-sm">{formatCurrency(product.priceUsd)}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1,2,3,4,5].map((s) => <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                      <span className="text-[10px] text-muted-foreground ml-1">verified</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
