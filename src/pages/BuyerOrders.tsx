import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { getBuyerToken, getBuyerInfo, clearBuyerSession } from "@/lib/buyerAuth";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";

import { Package, LogOut, ShoppingBag, ChevronRight, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { motion } from "framer-motion";

type Order = {
  id: number;
  buyerName: string;
  buyerEmail: string;
  buyerCountry: string;
  productId: number;
  vendorId: number;
  quantity: number;
  unitPriceUsd: string;
  shippingCostUsd: string;
  totalUsd: string;
  shippingAddress: string;
  status: string;
  trackingNumber: string | null;
  carrierName: string | null;
  buyerConfirmed: boolean;
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-800",  icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800",     icon: <CheckCircle className="w-4 h-4" /> },
  shipped:   { label: "Shipped",   color: "bg-indigo-100 text-indigo-800", icon: <Truck className="w-4 h-4" /> },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800",   icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800",       icon: <XCircle className="w-4 h-4" /> },
};

export default function BuyerOrders() {
  const [, navigate] = useLocation();
  const token = getBuyerToken();
  const buyer = getBuyerInfo();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { navigate("/buyer/login"); return; }
    fetch(`/api/buyer/orders`, {
      headers: { "x-buyer-token": token },
    }).then(r => r.json()).then(d => {
      if (d.error) throw new Error(d.error);
      setOrders(d.orders);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [token]);

  const handleLogout = async () => {
    if (token) {
      await fetch(`/api/buyer/logout`, { method: "POST", headers: { "x-buyer-token": token } });
    }
    clearBuyerSession();
    navigate("/buyer/login");
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-card py-12">
        <div className="max-w-3xl mx-auto px-4">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display">My Orders</h1>
              <p className="text-muted-foreground mt-1">{buyer?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl">{error}</div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-display mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">When you make a purchase, your orders will appear here.</p>
              <Link href="/products">
                <Button>Browse Crafts</Button>
              </Link>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order, i) => {
                const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-background border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">Order #{order.id}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </div>
                          {order.trackingNumber && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Tracking: <span className="font-mono text-foreground">{order.trackingNumber}</span>
                              {order.carrierName && <span className="ml-1">via {order.carrierName}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-lg">${Number(order.totalUsd).toFixed(2)}</div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${statusCfg.color}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>

                    {order.status === "delivered" && !order.buyerConfirmed && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Link href={`/orders/${order.id}/confirm`}>
                          <Button size="sm" className="flex items-center gap-2">
                            Confirm Delivery & Rate
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    )}

                    {order.buyerConfirmed && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Delivery confirmed — Thank you!
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
