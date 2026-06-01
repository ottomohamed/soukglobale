import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { saveBuyerSession } from "@/lib/buyerAuth";
import { useLocation } from "wouter";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, UserPlus, LogIn } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/buyer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");
      saveBuyerSession(json.token, json.buyer);
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">{error}</div>
      )}
      <Input label="Full Name" {...register("name")} error={errors.name?.message} />
      <Input label="Email Address" type="email" {...register("email")} error={errors.email?.message} />
      <Input label="Password" type="password" {...register("password")} error={errors.password?.message} autoComplete="new-password" />
      <Input label="Confirm Password" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} autoComplete="new-password" />
      <Button type="submit" size="lg" className="w-full" isLoading={loading}>
        <UserPlus className="w-4 h-4 mr-2" />
        Create Account
      </Button>
    </form>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/buyer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed");
      saveBuyerSession(json.token, json.buyer);
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">{error}</div>
      )}
      <Input label="Email Address" type="email" {...register("email")} error={errors.email?.message} />
      <Input label="Password" type="password" {...register("password")} error={errors.password?.message} autoComplete="current-password" />
      <Button type="submit" size="lg" className="w-full" isLoading={loading}>
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Button>
    </form>
  );
}

export default function BuyerAuth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [, navigate] = useLocation();

  const handleSuccess = () => {
    navigate("/my-orders");
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-card flex items-center py-20">
        <div className="max-w-md mx-auto px-4 w-full">

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display mb-2">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Sign in to track your orders and wishlist"
                : "Join SoukGlobale and start shopping authentic crafts"}
            </p>
          </div>

          <div className="flex rounded-xl border border-border p-1 mb-8 bg-muted/30">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "login" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "register" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Create Account
            </button>
          </div>

          <div className="bg-background rounded-2xl p-8 border border-border shadow-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {mode === "login"
                  ? <LoginForm onSuccess={handleSuccess} />
                  : <RegisterForm onSuccess={handleSuccess} />
                }
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Are you an artisan?</strong>{" "}
            <a href="/register" className="underline font-medium">Apply to sell on SoukGlobale →</a>
          </div>

        </div>
      </div>
    </Layout>
  );
}
