import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Link } from "wouter";

export default function About() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <h1 className="text-5xl md:text-7xl font-display text-center mb-12">The Mission</h1>
        
        <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-16 shadow-2xl">
          <img 
            src={`${import.meta.env.BASE_URL}images/about-hands.png`} 
            alt="Artisan hands weaving" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="prose prose-lg md:prose-xl prose-stone mx-auto">
          <p className="lead text-2xl font-display text-primary mb-8 text-center">
            True luxury isn't mass-produced. It's handcrafted with centuries of inherited knowledge.
          </p>
          
          <p>
            SoukGlobale was born from a simple observation: some of the world's most breathtaking, high-quality artisanal goods are created in developing nations by makers who struggle to access global markets.
          </p>
          
          <p>
            Meanwhile, buyers in developed nations are increasingly seeking authentic, ethically sourced, and truly unique items—but face layers of middlemen that inflate prices and dilute the artisan's share.
          </p>

          <h3 className="font-display text-3xl mt-12 mb-6">Our Strict Marketplace Model</h3>
          <p>
            We operate on a unique, asymmetrical model designed specifically to redistribute wealth and foster fair trade:
          </p>
          <ul className="space-y-4 my-8">
            <li className="flex items-start">
              <span className="bg-primary/20 text-primary p-1 rounded mr-3 mt-1 block">✓</span>
              <span><strong>Vendors:</strong> Only artisans residing in recognized developing nations are permitted to open shops. This ensures the platform remains a dedicated channel for those who need access most.</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary/20 text-primary p-1 rounded mr-3 mt-1 block">✓</span>
              <span><strong>Buyers:</strong> Purchasing is restricted to buyers in wealthy/developed nations. This creates a direct pipeline of capital where it makes the greatest impact.</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary/20 text-primary p-1 rounded mr-3 mt-1 block">✓</span>
              <span><strong>Transparency:</strong> Every vendor must link a YouTube channel demonstrating their craft. We don't allow resellers; we require proof of process. You buy directly from the hands that made it.</span>
            </li>
          </ul>

          <div className="mt-16 text-center border-t border-border pt-16">
            <h2 className="text-3xl font-display mb-6">Be part of the exchange.</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products"><Button size="lg">Shop the Collection</Button></Link>
              <Link href="/register"><Button variant="outline" size="lg">Apply as Artisan</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
