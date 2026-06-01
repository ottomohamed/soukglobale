import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, X, UserCircle, Package, LogOut, LogIn } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ActivityTicker } from "@/components/ui/ActivityTicker";
import { LiveActivityNotification } from "@/components/ui/LiveActivityNotification";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { getBuyerInfo, clearBuyerSession } from "@/lib/buyerAuth";


export function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [buyerMenuOpen, setBuyerMenuOpen] = useState(false);
  const [canRegisterAsArtisan, setCanRegisterAsArtisan] = useState(false);
  const [location, navigate] = useLocation();
  const { t } = useTranslation();
  const buyer = getBuyerInfo();
  const buyerMenuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/products", label: t("nav.shop") },
    { href: "/vendors", label: t("nav.artisans") },
    { href: "/about", label: t("nav.ourStory") },
  ];

  // Check if visitor's country is allowed for artisan registration
  useEffect(() => {
    const cacheKey = "sg_artisan_eligible";
    const cacheTs = "sg_artisan_eligible_ts";
    const cached = sessionStorage.getItem(cacheKey);
    const cachedTs = Number(sessionStorage.getItem(cacheTs) || 0);
    // Cache for 10 minutes per session
    if (cached !== null && Date.now() - cachedTs < 10 * 60 * 1000) {
      setCanRegisterAsArtisan(cached === "1");
      return;
    }
    fetch("/api/visitor-country")
      .then(r => r.json())
      .then((data: { isAllowed: boolean }) => {
        const allowed = !!data.isAllowed;
        setCanRegisterAsArtisan(allowed);
        sessionStorage.setItem(cacheKey, allowed ? "1" : "0");
        sessionStorage.setItem(cacheTs, String(Date.now()));
      })
      .catch(() => setCanRegisterAsArtisan(false));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (buyerMenuRef.current && !buyerMenuRef.current.contains(e.target as Node)) {
        setBuyerMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleBuyerLogout = async () => {
    const token = localStorage.getItem("sg_buyer_token");
    if (token) {
      await fetch(`/api/buyer/logout`, { method: "POST", headers: { "x-buyer-token": token } }).catch(() => {});
    }
    clearBuyerSession();
    setBuyerMenuOpen(false);
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Top Banner */}
      <div className="bg-primary text-primary-foreground text-xs py-2 px-4 text-center font-medium tracking-wide">
        {t("nav.banner")}
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-2xl text-foreground tracking-tight">
                Souk<span className="text-primary">Globale</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
                    location === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── Global Search ── */}
            <div className="hidden md:flex flex-1 max-w-sm">
              <GlobalSearch />
            </div>

            <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
              <LanguageSwitcher />

              {/* Buyer Account */}
              {buyer ? (
                <div className="relative" ref={buyerMenuRef}>
                  <button
                    onClick={() => setBuyerMenuOpen(!buyerMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
                  >
                    <UserCircle className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{buyer.name}</span>
                  </button>
                  <AnimatePresence>
                    {buyerMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-52 bg-background border border-border rounded-2xl shadow-xl shadow-black/10 py-2 z-50"
                      >
                        <Link
                          href="/my-orders"
                          onClick={() => setBuyerMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
                        >
                          <Package className="w-4 h-4 text-muted-foreground" />
                          My Orders
                        </Link>
                        <button
                          onClick={handleBuyerLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/buyer/login"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}

              {/* Artisan section — shown only if visitor's country is allowed */}
              {canRegisterAsArtisan && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <Link
                    href="/register"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {t("nav.becomeArtisan")}
                  </Link>
                </>
              )}
              <Link
                href="/vendor/dashboard"
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary-foreground hover:bg-secondary hover:text-primary-foreground transition-all duration-300 font-medium text-sm whitespace-nowrap"
              >
                <UserCircle className="w-4 h-4" />
                <span>{t("nav.dashboard")}</span>
              </Link>
            </div>

            {/* Mobile: Search + Language + Menu */}
            <div className="md:hidden flex items-center gap-2">
              <GlobalSearch />
              <LanguageSwitcher />
              <button
                className="p-2 text-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-28 left-0 w-full bg-background border-b border-border z-40 shadow-2xl shadow-black/10"
          >
            <div className="flex flex-col p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-4 text-lg font-display text-foreground border-b border-border/50"
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-b border-border/50 pb-2 pt-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-4 mb-2">My Account</p>
                {buyer ? (
                  <>
                    <Link href="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 p-4 text-foreground font-medium">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    <button onClick={handleBuyerLogout} className="flex items-center gap-2 p-4 text-destructive font-medium w-full text-left">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/buyer/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 p-4 text-primary font-medium">
                    <LogIn className="w-4 h-4" /> Sign In / Create Account
                  </Link>
                )}
              </div>

              <div className="pt-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-4 mb-2">For Artisans</p>
                {canRegisterAsArtisan && (
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="p-4 text-primary font-medium block">
                    {t("nav.becomeArtisan")}
                  </Link>
                )}
                <Link href="/vendor/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="p-4 text-secondary font-medium block">
                  {t("nav.dashboard")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow">
        {children}
      </main>

      <ActivityTicker />
      <LiveActivityNotification />

      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <span className="font-display font-bold text-3xl tracking-tight">
              Souk<span className="text-primary">Globale</span>
            </span>
            <p className="mt-6 text-background/70 leading-relaxed max-w-sm">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-6">{t("footer.explore")}</h4>
            <ul className="space-y-4 text-background/70">
              <li><Link href="/products" className="hover:text-primary transition-colors">{t("footer.allProducts")}</Link></li>
              <li><Link href="/vendors" className="hover:text-primary transition-colors">{t("footer.ourArtisans")}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">{t("footer.mission")}</Link></li>
              <li><Link href="/buyer/login" className="hover:text-primary transition-colors">My Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg mb-6">{t("footer.forArtisans")}</h4>
            <ul className="space-y-4 text-background/70">
              {canRegisterAsArtisan && (
                <li><Link href="/register" className="hover:text-primary transition-colors">{t("footer.applyToSell")}</Link></li>
              )}
              <li><Link href="/vendor/dashboard" className="hover:text-primary transition-colors">{t("footer.vendorPortal")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-background/10 text-center text-background/50 text-sm">
          &copy; {new Date().getFullYear()} SoukGlobale. {t("footer.rights")}
        </div>
      </footer>
    </div>
  );
}
