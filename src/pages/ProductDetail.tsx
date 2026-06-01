import { Layout } from "@/components/layout/Layout";
import { useGetProduct } from "@workspace/api-client-react";
import { Link, useRoute } from "wouter";
import { formatCurrency, getYoutubeVideoId } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Truck, Package, PlayCircle } from "lucide-react";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = params?.id ? Number(params.id) : 0;
  
  const { data: product, isLoading, isError } = useGetProduct(id);

  if (isLoading) return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>
    </Layout>
  );
  if (isError || !product) return (
    <Layout>
      <div className="text-center py-32"><h2 className="text-2xl font-display">Product not found.</h2></div>
    </Layout>
  );

  const youtubeId = getYoutubeVideoId(product.vendor?.youtubeUrl);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Images */}
          <div className="space-y-6">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-card border border-border shadow-xl shadow-black/5">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/30">No Image</div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-4">
                <Link href={`/products?category=${product.category}`} className="hover:text-primary transition-colors">{product.category}</Link>
                <span>/</span>
                <span>{product.vendorCountry}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4 leading-tight">{product.title}</h1>
              <p className="text-3xl font-semibold text-primary">{formatCurrency(product.priceUsd)}</p>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {product.description || "A beautifully handcrafted item."}
            </p>

            <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
              <h3 className="font-display text-xl mb-4">About the Artisan</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{product.vendor?.name}</p>
                  <p className="text-muted-foreground text-sm">{product.vendor?.city}, {product.vendorCountry}</p>
                </div>
                <Link href={`/vendors/${product.vendorId}`}>
                  <Button variant="outline" size="sm">View Profile</Button>
                </Link>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex items-center text-muted-foreground">
                <Truck className="w-5 h-5 mr-3 text-primary" />
                <span>
                  {(product as any).freeShipping
                    ? <span className="font-semibold text-green-600">Free Shipping — included by the artisan</span>
                    : `Shipping: ${product.shippingCostUsd === 0 ? 'Free' : formatCurrency(product.shippingCostUsd)}`
                  }
                </span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Package className="w-5 h-5 mr-3 text-primary" />
                <span>{product.stockQuantity} in stock</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <ShieldCheck className="w-5 h-5 mr-3 text-primary" />
                <span>Authenticity Guaranteed</span>
              </div>
            </div>

            <Link href={`/checkout?productId=${product.id}`}>
              <Button size="lg" className="w-full text-lg shadow-xl shadow-primary/20">
                Purchase Directly
              </Button>
            </Link>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Available only to buyers in select developed nations to support global fair trade.
            </p>
          </div>
        </div>

        {/* Video Section */}
        {youtubeId && (
          <div className="mt-32">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <PlayCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-display mb-4">See the Process</h2>
              <p className="text-muted-foreground">Watch how {product.vendor?.name} creates these beautiful pieces using traditional methods.</p>
            </div>
            <div className="aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-black/10 border-4 border-card">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
