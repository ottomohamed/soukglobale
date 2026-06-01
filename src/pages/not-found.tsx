import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-8xl font-display text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page not found</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg">Return Home</Button>
        </Link>
      </div>
    </Layout>
  );
}
