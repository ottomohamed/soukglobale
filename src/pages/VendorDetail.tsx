import { Layout } from "@/components/layout/Layout";
import { useGetVendor } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { getYoutubeVideoId, formatCurrency, DEVELOPED_COUNTRIES } from "@/lib/constants";
import { MapPin, Medal, Store, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StarRatingDisplay, StarRatingInput } from "@/components/ui/StarRating";
import { motion } from "framer-motion";

export default function VendorDetail() {
  const [, params] = useRoute("/vendors/:id");
  const id = params?.id ? Number(params.id) : 0;

  const { data: vendor, isLoading, isError, refetch } = useGetVendor(id);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ buyerName: "", buyerCountry: "", rating: 0, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/reviews?vendorId=${id}`)
        .then((res) => res.json())
        .then((data) => setReviews(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.rating) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reviewForm, vendorId: id }),
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews([newReview, ...reviews]);
        setReviewForm({ buyerName: "", buyerCountry: "", rating: 0, comment: "" });
        setSubmitSuccess(true);
        refetch();
        setTimeout(() => setSubmitSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading)
    return (
      <Layout>
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  if (isError || !vendor)
    return (
      <Layout>
        <div className="text-center py-32">
          <h2 className="text-2xl font-display">Vendor not found.</h2>
        </div>
      </Layout>
    );

  const youtubeId = getYoutubeVideoId(vendor.youtubeUrl);
  const avgRating = vendor.rating ? Number(vendor.rating) : 0;
  const reviewCount = reviews.length;

  // Rating distribution for the bar chart
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <Layout>
      {/* ── Vendor Header ─────────────────────────────────────────────── */}
      <div className="bg-foreground text-background py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src={`${import.meta.env.BASE_URL}images/pattern-bg.png`}
            className="w-full h-full object-cover invert"
            alt="pattern"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

            {/* Avatar with rating badge */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-background/20 overflow-hidden bg-background text-foreground flex items-center justify-center font-display text-5xl shadow-2xl">
                {vendor.avatarUrl ? (
                  <img src={vendor.avatarUrl} alt={vendor.name} className="w-full h-full object-cover" />
                ) : (
                  vendor.name.charAt(0)
                )}
              </div>
              {/* Rating badge over avatar */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 rounded-full px-3 py-1 flex items-center gap-1 shadow-lg whitespace-nowrap">
                <Star className="w-3.5 h-3.5 fill-amber-900" />
                <span className="text-xs font-bold">
                  {avgRating > 0 ? avgRating.toFixed(1) : "New"}
                </span>
                {reviewCount > 0 && (
                  <span className="text-xs opacity-75">· {reviewCount}</span>
                )}
              </div>
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-display mb-3">{vendor.name}</h1>

              {/* Stars row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-500 text-gray-500"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-background/70 text-sm">
                  {avgRating > 0
                    ? `${avgRating.toFixed(1)} / 5 · ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`
                    : "Be the first to review"}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-background/70 mb-6">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {vendor.city}, {vendor.country}</span>
                <span className="flex items-center gap-1"><Medal className="w-4 h-4" /> {vendor.craftSpecialty}</span>
                <span className="flex items-center gap-1"><Store className="w-4 h-4" /> {vendor.products?.length || 0} Items</span>
              </div>
              <p className="max-w-3xl text-lg leading-relaxed text-background/90">{vendor.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Products */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-display mb-8">Crafts by {vendor.name}</h2>
            {!vendor.products || vendor.products.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <p className="text-muted-foreground">This artisan hasn't listed any products yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {vendor.products.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`} className="group">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-card border border-border shadow-sm group-hover:shadow-xl transition-all duration-300 mb-4">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-muted/30" />
                      )}
                    </div>
                    <h3 className="font-display text-lg text-foreground truncate">{product.title}</h3>
                    <p className="font-semibold text-primary">{formatCurrency(product.priceUsd)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-card border border-border rounded-3xl p-6 shadow-xl shadow-black/5">
              <h3 className="text-xl font-display mb-4">The Process</h3>
              {youtubeId ? (
                <div className="aspect-video rounded-xl overflow-hidden mb-4">
                  <iframe
                    width="100%" height="100%"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube video" frameBorder="0" allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground text-sm text-center p-4">
                  No process video available for this artisan.
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                We require artisans to share their process to guarantee authenticity and preserve traditional techniques.
              </p>
            </div>
          </div>
        </div>

        {/* ── Reviews Section ──────────────────────────────────────────── */}
        <div className="mt-20 border-t border-border pt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display mb-2">Buyer Reviews</h2>
            {avgRating > 0 && (
              <div className="flex flex-col items-center gap-2 mt-4">
                <span className="text-6xl font-display text-foreground">{avgRating.toFixed(1)}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-7 h-7 ${star <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</span>

                {/* Distribution bars */}
                <div className="mt-4 w-full max-w-xs space-y-1.5">
                  {distribution.map(({ star, count: c }) => (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-right text-muted-foreground">{star}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-700"
                          style={{ width: reviewCount > 0 ? `${(c / reviewCount) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="w-4 text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Reviews list */}
            <div>
              <h3 className="text-xl font-display mb-6">Recent Reviews</h3>
              {reviews.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <div className="flex justify-center gap-1 mb-3">
                    {[1,2,3,4,5].map((s) => <Star key={s} className="w-8 h-8 fill-gray-200 text-gray-300" />)}
                  </div>
                  <p className="text-muted-foreground font-medium">No reviews yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {reviews.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {review.buyerName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{review.buyerName}</p>
                            <p className="text-xs text-muted-foreground">{review.buyerCountry}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-foreground/90 text-sm leading-relaxed">{review.comment}</p>}
                      <p className="text-xs text-muted-foreground mt-3">{new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Review form */}
            <div>
              <div className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-black/5">
                <h3 className="text-xl font-display mb-2">Leave a Review</h3>
                <p className="text-sm text-muted-foreground mb-6">Your feedback helps this artisan grow.</p>

                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium mb-6"
                  >
                    ✅ Thank you! Your review has been submitted.
                  </motion.div>
                )}

                <form onSubmit={submitReview} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Your Name"
                      value={reviewForm.buyerName}
                      onChange={(e) => setReviewForm((f) => ({ ...f, buyerName: e.target.value }))}
                      required
                    />
                    <div>
                      <label className="block text-sm font-semibold mb-2">Your Country</label>
                      <select
                        required
                        value={reviewForm.buyerCountry}
                        onChange={(e) => setReviewForm((f) => ({ ...f, buyerCountry: e.target.value }))}
                        className="w-full h-12 rounded-xl border-2 border-border bg-background px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                      >
                        <option value="">Select Country</option>
                        {DEVELOPED_COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Interactive Star Input */}
                  <div>
                    <label className="block text-sm font-semibold mb-3">Your Rating</label>
                    <StarRatingInput
                      value={reviewForm.rating}
                      onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))}
                    />
                    {reviewForm.rating === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Click a star to rate</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Comment</label>
                    <textarea
                      required
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                      rows={4}
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary resize-none outline-none focus:ring-4 focus:ring-primary/10"
                      placeholder="Share your experience with this artisan..."
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isSubmittingReview}
                    disabled={reviewForm.rating === 0}
                    className="w-full mt-2"
                  >
                    Submit Review
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
