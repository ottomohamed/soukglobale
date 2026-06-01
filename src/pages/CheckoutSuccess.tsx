import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { ShieldCheck, Package, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("orderId");
  const [, setLocation] = useLocation();

  const [status, setStatus] = useState<"loading" | "paid" | "failed">("loading");

  useEffect(() => {
    if (!sessionId) { setStatus("failed"); return; }

    fetch(`/api/checkout/verify?sessionId=${sessionId}&orderId=${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.paid ? "paid" : "failed");
      })
      .catch(() => setStatus("failed"));
  }, [sessionId, orderId]);

  if (status === "loading") {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium">Confirming your payment…</p>
        </div>
      </Layout>
    );
  }

  if (status === "failed") {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-display mb-3">Payment Not Confirmed</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            We couldn't confirm your payment. If you were charged, please contact us with your order reference.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setLocation("/products")}>Browse Products</Button>
            <Button variant="outline" onClick={() => setLocation("/dispute")}>Get Help</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full text-center"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100"
          >
            <CheckCircle2 className="w-14 h-14" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-display mb-4">Payment Successful!</h1>
          <p className="text-lg text-muted-foreground mb-4 max-w-lg mx-auto">
            Your order has been confirmed and the artisan has been notified.
            The funds are held securely in escrow until you receive your item.
          </p>

          {orderId && (
            <div className="inline-block bg-card border border-border rounded-2xl px-6 py-3 mb-10">
              <p className="text-sm text-muted-foreground">Order Reference</p>
              <p className="font-bold text-foreground text-xl">#{orderId}</p>
            </div>
          )}

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            {[
              {
                icon: ShieldCheck,
                title: "Funds in Escrow",
                desc: "Your payment is securely held until you receive and confirm the item.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: Package,
                title: "Artisan Notified",
                desc: "The artisan is preparing your handcrafted item for shipment.",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: MessageSquare,
                title: "Need Help?",
                desc: "If anything goes wrong, open a dispute and we'll mediate.",
                color: "bg-green-50 text-green-600",
              },
            ].map((step) => (
              <div key={step.title} className="bg-card border border-border rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center mb-3`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {orderId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-right" dir="rtl">
              <p className="font-semibold text-amber-800 mb-1">عند استلام المنتج</p>
              <p className="text-sm text-amber-700 mb-3">
                بعد وصول طلبك، أكّد استلامك وقيّم تجربتك حتى تُوزَّع الأرباح تلقائيًا على الحرفي والمشرفين.
              </p>
              <Button size="sm" variant="outline"
                onClick={() => setLocation(`/orders/${orderId}/confirm`)}
                className="border-amber-400 text-amber-800 hover:bg-amber-100">
                تأكيد الاستلام وتقييم التجربة
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/products")}>
              Continue Shopping
            </Button>
            {orderId && (
              <Button size="lg" variant="outline" onClick={() => setLocation(`/dispute?orderId=${orderId}`)}>
                Open a Dispute
              </Button>
            )}
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            A confirmation email has been sent to your inbox. Keep your order reference safe.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
