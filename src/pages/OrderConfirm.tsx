import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle, Star, Package, AlertCircle, DollarSign } from "lucide-react";

const BASE = "/api";

export default function OrderConfirm() {
  const [step, setStep] = useState<"lookup" | "confirm" | "done">("lookup");
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [distribution, setDistribution] = useState<any>(null);

  const lookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/orders/${orderId}/track`);
      if (!r.ok) throw new Error("الطلب غير موجود");
      const data = await r.json();
      if (data.buyerConfirmed) {
        setError("تم تأكيد هذا الطلب مسبقًا. شكرًا لك!");
      } else {
        setOrder(data);
        setStep("confirm");
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ ما");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("يرجى تقييم تجربتك أولًا"); return; }
    setError("");
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/orders/${orderId}/confirm-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review, buyerEmail: email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "حدث خطأ ما");
      setDistribution(data.distribution);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "حدث خطأ ما");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Package size={48} className="mx-auto text-amber-600 mb-3" />
          <h1 className="text-2xl font-bold text-stone-900">تأكيد استلام الطلب</h1>
          <p className="text-stone-500 mt-1">أكّد استلامك للمنتج وشارك تجربتك</p>
        </div>

        {step === "lookup" && (
          <form onSubmit={lookupOrder} className="bg-white rounded-2xl shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">رقم الطلب</label>
              <Input
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="مثال: 1234"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">بريدك الإلكتروني</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="البريد الذي استخدمته في الطلب"
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "جارٍ البحث..." : "بحث عن الطلب"}
            </Button>
          </form>
        )}

        {step === "confirm" && order && (
          <form onSubmit={confirmDelivery} className="bg-white rounded-2xl shadow p-6 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-stone-700">تفاصيل الطلب</p>
              <p className="text-lg font-bold text-stone-900 mt-1">{order.productTitle}</p>
              <p className="text-sm text-stone-500">من متجر: {order.vendorName}</p>
              <p className="text-sm text-stone-500">الحالة: <span className="font-medium text-amber-700">{order.status}</span></p>
            </div>

            <div>
              <p className="text-sm font-medium text-stone-700 mb-3">كيف تقيّم تجربتك؟</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={36}
                      className={`transition-colors ${s <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-stone-200"}`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-stone-500 mt-1">
                  {["", "سيئة جدًا", "سيئة", "مقبولة", "جيدة", "ممتازة!"][rating]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">تعليقك (اختياري)</label>
              <textarea
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder="شاركنا رأيك في المنتج والبائع..."
                rows={3}
                className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <Button type="submit" disabled={loading || rating === 0} className="w-full">
              {loading ? "جارٍ التأكيد..." : "أؤكد استلام الطلب وأوزّع الأرباح"}
            </Button>
            <p className="text-xs text-stone-400 text-center">
              بمجرد تأكيدك، تُوزَّع الأرباح تلقائيًا على الحرفي والمشرفين
            </p>
          </form>
        )}

        {step === "done" && (
          <div className="bg-white rounded-2xl shadow p-8 text-center space-y-5">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
              <CheckCircle size={36} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-stone-900">شكرًا جزيلًا!</h2>
            <p className="text-stone-500">تم تأكيد استلام الطلب وتوزيع الأرباح تلقائيًا</p>

            {distribution && (
              <div className="bg-stone-50 rounded-xl p-4 text-right space-y-2">
                <p className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-600" /> تفاصيل توزيع الأرباح
                </p>
                {Object.values(distribution).map((d: any) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{d.name}</span>
                    <span className="font-bold text-green-700">${d.amount}</span>
                  </div>
                ))}
              </div>
            )}

            <a href="/" className="inline-block mt-2">
              <Button variant="outline">العودة للتسوق</Button>
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}
