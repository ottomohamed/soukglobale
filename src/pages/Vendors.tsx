import { Layout } from "@/components/layout/Layout";
import { useListVendors } from "@/hooks/useApi";
import { Link } from "wouter";
import { MapPin, Video, Star } from "lucide-react";
import { motion } from "framer-motion";
import { StarRatingDisplay } from "@/components/ui/StarRating";

export default function Vendors() {
  const { data, isLoading } = useListVendors({ limit: 50 });

  return (
    <Layout>
      <div className="bg-secondary/10 border-b border-secondary/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">Our Artisans</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Meet the incredibly talented individuals keeping traditional crafts alive.
            Every artisan on our platform is verified and shares their process via video.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-card border border-border p-6 rounded-2xl h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data?.vendors?.map((vendor, i) => {
              const rating = vendor.rating ? Number(vendor.rating) : 0;
              const reviewsCount = (vendor as any).reviewsCount ?? 0;

              return (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/vendors/${vendor.id}`}>
                    <div className="group bg-card rounded-3xl p-8 border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full flex flex-col cursor-pointer">
                      
                      {/* Header: avatar + specialty */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display text-2xl font-bold overflow-hidden border-2 border-border">
                            {vendor.avatarUrl ? (
                              <img src={vendor.avatarUrl} alt={vendor.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              vendor.name.charAt(0)
                            )}
                          </div>
                          {/* Verified tick */}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold">✓</span>
                          </div>
                        </div>
                        <span className="bg-secondary/10 text-secondary-foreground text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                          {vendor.craftSpecialty}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="text-2xl font-display mb-1 group-hover:text-primary transition-colors">
                        {vendor.name}
                      </h3>

                      {/* Location */}
                      <div className="flex items-center text-muted-foreground mb-3 text-sm">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        {vendor.city ? `${vendor.city}, ` : ""}{vendor.country}
                      </div>

                      {/* ── STAR RATING ── */}
                      <div className="flex items-center gap-1.5 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(rating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-300"
                            }`}
                          />
                        ))}
                        {rating > 0 ? (
                          <span className="text-xs font-bold text-foreground ml-0.5">{rating.toFixed(1)}</span>
                        ) : null}
                        {reviewsCount > 0 ? (
                          <span className="text-xs text-muted-foreground">({reviewsCount})</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No reviews yet</span>
                        )}
                      </div>

                      {/* Bio */}
                      <p className="text-muted-foreground line-clamp-3 mb-6 flex-grow text-sm leading-relaxed">
                        {vendor.bio || `Specializing in ${vendor.craftSpecialty}, bringing traditional techniques to modern buyers.`}
                      </p>

                      {/* Video link */}
                      {vendor.youtubeUrl && (
                        <div className="flex items-center text-primary text-sm font-semibold mt-auto pt-4 border-t border-border">
                          <Video className="w-4 h-4 mr-2" />
                          Watch Process Video
                        </div>
                      )}
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
