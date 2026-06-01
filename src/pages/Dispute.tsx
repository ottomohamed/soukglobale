import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function Dispute() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialOrderId = searchParams.get('orderId') || '';
  
  const [formData, setFormData] = useState({
    orderId: initialOrderId,
    vendorId: '',
    buyerEmail: '',
    buyerName: '',
    reason: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [disputeId, setDisputeId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: Number(formData.orderId),
          vendorId: Number(formData.vendorId),
          buyerEmail: formData.buyerEmail,
          buyerName: formData.buyerName,
          reason: formData.reason
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setDisputeId(data.id);
        setSuccess(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-32 text-center">
          <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-display mb-4">Dispute Filed</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your dispute has been filed. Reference #{disputeId}. We will review it within 48 hours.
          </p>
          <Button onClick={() => window.location.href = '/'}>Return Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-card min-h-screen py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-display mb-4">File a Dispute</h1>
            <p className="text-muted-foreground">
              If the product you received does not match what was advertised, you can file a dispute here. Our team will review it within 48 hours.
            </p>
          </div>
          
          <div className="bg-background rounded-3xl p-8 md:p-12 border border-border shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Order ID" 
                  value={formData.orderId}
                  onChange={e => setFormData(f => ({...f, orderId: e.target.value}))}
                  required
                  type="number"
                />
                <Input 
                  label="Vendor ID" 
                  value={formData.vendorId}
                  onChange={e => setFormData(f => ({...f, vendorId: e.target.value}))}
                  required
                  type="number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Your Name" 
                  value={formData.buyerName}
                  onChange={e => setFormData(f => ({...f, buyerName: e.target.value}))}
                  required
                />
                <Input 
                  label="Your Email" 
                  type="email"
                  value={formData.buyerEmail}
                  onChange={e => setFormData(f => ({...f, buyerEmail: e.target.value}))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Reason for dispute</label>
                <textarea 
                  required
                  minLength={20}
                  value={formData.reason}
                  onChange={e => setFormData(f => ({...f, reason: e.target.value}))}
                  rows={6}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary resize-none"
                  placeholder="Please describe exactly how the item differs from the listing..."
                />
                <p className="text-xs text-muted-foreground mt-2">Minimum 20 characters required.</p>
              </div>

              <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                Submit Dispute
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}