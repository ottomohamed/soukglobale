import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Package, User2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/constants";
import { PotteryIcon, JewelryIcon, LeatherIcon, WeavingIcon, WoodworkIcon, CarpetsIcon, CeramicsIcon, MetalworkIcon, EmbroideryIcon } from "@/components/ui/CraftIcons";

interface SearchResult {
  products: {
    id: number;
    title: string;
    priceUsd: number;
    imageUrl?: string | null;
    category?: string | null;
    vendorName?: string | null;
  }[];
  vendors: {
    id: number;
    name: string;
    craftSpecialty?: string | null;
    avatarUrl?: string | null;
    country: string;
    rating?: number | null;
  }[];
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSearch = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
  };

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openSearch(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const goTo = (href: string) => { navigate(href); closeSearch(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { goTo(`/products?search=${encodeURIComponent(query.trim())}`); }
  };

  const hasResults = results && (results.products.length > 0 || results.vendors.length > 0);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={openSearch}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all text-sm group"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
        <span className="hidden lg:inline">Search crafts…</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] bg-background border border-border rounded px-1.5 py-0.5 font-mono opacity-60 group-hover:opacity-100">
          ⌘K
        </kbd>
      </button>

      {/* Overlay + modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
          >
            <motion.div
              ref={overlayRef}
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              {/* Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, artisans, or categories…"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeSearch}
                  className="text-xs text-muted-foreground border border-border rounded px-2 py-1 hover:bg-muted"
                >
                  Esc
                </button>
              </form>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {isLoading && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <div className="animate-spin inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full mb-2" />
                    <p>Searching…</p>
                  </div>
                )}

                {!isLoading && query && !hasResults && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No results for "<span className="text-foreground">{query}</span>"</p>
                    <p className="text-sm mt-1">Try a different keyword or browse categories below</p>
                    <button
                      onClick={() => goTo(`/products?search=${encodeURIComponent(query)}`)}
                      className="mt-4 text-sm text-primary font-semibold flex items-center gap-1 mx-auto hover:underline"
                    >
                      Browse all products <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {!isLoading && hasResults && (
                  <div className="p-2">
                    {/* Products */}
                    {results!.products.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Products</span>
                          <button
                            onClick={() => goTo(`/products?search=${encodeURIComponent(query)}`)}
                            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                          >
                            See all <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        {results!.products.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => goTo(`/products/${p.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                          >
                            <div className="w-11 h-11 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">{p.title}</p>
                              <p className="text-xs text-muted-foreground">{p.vendorName} · {p.category}</p>
                            </div>
                            <span className="text-sm font-bold text-primary flex-shrink-0">{formatCurrency(p.priceUsd)}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Artisans */}
                    {results!.vendors.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-3 py-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Artisans</span>
                          <button
                            onClick={() => goTo(`/vendors`)}
                            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                          >
                            All artisans <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        {results!.vendors.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => goTo(`/vendors/${v.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                          >
                            <div className="w-11 h-11 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 border border-border flex items-center justify-center font-display text-lg text-primary">
                              {v.avatarUrl ? (
                                <img src={v.avatarUrl} alt={v.name} className="w-full h-full object-cover" />
                              ) : v.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground">{v.name}</p>
                              <p className="text-xs text-muted-foreground">{v.craftSpecialty} · {v.country}</p>
                            </div>
                            {v.rating && (
                              <span className="text-xs font-bold text-amber-500 flex-shrink-0">★ {Number(v.rating).toFixed(1)}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick links (when empty) */}
                {!query && (
                  <div className="p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Browse by Category</p>
                    <div className="grid grid-cols-3 gap-2">
                      {QUICK_CATEGORIES.map(({ label, Icon, cat, color }) => (
                        <button
                          key={cat}
                          onClick={() => goTo(`/products?category=${encodeURIComponent(cat)}`)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors border border-border/50 hover:border-primary/30 group"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const QUICK_CATEGORIES = [
  { label: "Pottery",    Icon: PotteryIcon,    cat: "Pottery",    color: "text-amber-700 bg-amber-50"   },
  { label: "Jewelry",    Icon: JewelryIcon,    cat: "Jewelry",    color: "text-blue-700 bg-blue-50"     },
  { label: "Leather",    Icon: LeatherIcon,    cat: "Leather",    color: "text-stone-700 bg-stone-100"  },
  { label: "Weaving",    Icon: WeavingIcon,    cat: "Weaving",    color: "text-rose-700 bg-rose-50"     },
  { label: "Woodwork",   Icon: WoodworkIcon,   cat: "Woodwork",   color: "text-orange-700 bg-orange-50" },
  { label: "Carpets",    Icon: CarpetsIcon,    cat: "Carpets",    color: "text-red-700 bg-red-50"       },
  { label: "Ceramics",   Icon: CeramicsIcon,   cat: "Ceramics",   color: "text-teal-700 bg-teal-50"     },
  { label: "Metalwork",  Icon: MetalworkIcon,  cat: "Metalwork",  color: "text-slate-700 bg-slate-100"  },
  { label: "Embroidery", Icon: EmbroideryIcon, cat: "Embroidery", color: "text-purple-700 bg-purple-50" },
];
