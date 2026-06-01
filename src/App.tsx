import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import i18n, { SUPPORTED_LANGUAGES } from "@/i18n";
import { setApiLang } from "@workspace/api-client-react";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Vendors from "@/pages/Vendors";
import VendorDetail from "@/pages/VendorDetail";
import Register from "@/pages/Register";
import Checkout from "@/pages/Checkout";
import Dashboard from "@/pages/Dashboard";
import VendorLogin from "@/pages/VendorLogin";
import About from "@/pages/About";
import Dispute from "@/pages/Dispute";
import Admin from "@/pages/Admin";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import ResetPassword from "@/pages/ResetPassword";
import SupervisorPortal from "@/pages/SupervisorPortal";
import OrderConfirm from "@/pages/OrderConfirm";
import BuyerAuth from "@/pages/BuyerAuth";
import BuyerOrders from "@/pages/BuyerOrders";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function syncDirection(lang: string) {
  const langDef = SUPPORTED_LANGUAGES.find(l => l.code === lang);
  document.documentElement.dir = langDef?.dir ?? "ltr";
  document.documentElement.lang = lang;
  setApiLang(lang);
}

function DirectionSync() {
  useEffect(() => {
    syncDirection(i18n.language);
    i18n.on("languageChanged", syncDirection);
    return () => { i18n.off("languageChanged", syncDirection); };
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/vendors/:id" component={VendorDetail} />
      <Route path="/register" component={Register} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/vendor/login" component={VendorLogin} />
      <Route path="/vendor/dashboard" component={Dashboard} />
      <Route path="/about" component={About} />
      <Route path="/dispute" component={Dispute} />
      <Route path="/sgcontrol" component={Admin} />
      <Route path="/vendor/reset-password" component={ResetPassword} />
      <Route path="/supervisor" component={SupervisorPortal} />
      <Route path="/orders/:id/confirm" component={OrderConfirm} />
      <Route path="/buyer/login" component={BuyerAuth} />
      <Route path="/my-orders" component={BuyerOrders} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DirectionSync />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
