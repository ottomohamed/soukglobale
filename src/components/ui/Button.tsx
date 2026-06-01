import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export function buttonVariants(opts?: { variant?: string; size?: string; className?: string }) {
  const v = opts?.variant ?? "default";
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variantClass = v === "outline" ? "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
    : v === "ghost" ? "hover:bg-accent hover:text-accent-foreground"
    : v === "destructive" ? "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
    : v === "secondary" ? "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
    : v === "link" ? "text-primary underline-offset-4 hover:underline"
    : "bg-primary text-primary-foreground shadow hover:bg-primary/90";
  const sizeClass = opts?.size === "sm" ? "h-8 rounded-md px-3 text-xs"
    : opts?.size === "lg" ? "h-10 rounded-md px-8"
    : opts?.size === "icon" ? "h-9 w-9"
    : "h-9 px-4 py-2";
  return cn(base, variantClass, sizeClass, opts?.className);
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'default' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'default';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, asChild: _asChild, ...props }, ref) => {

    const variantStyles: Record<string, string> = {
      primary: "bg-primary text-primary-foreground shadow-[0_4px_14px_0_hsl(var(--primary)/0.39)] hover:shadow-[0_6px_20px_rgba(181,90,48,0.23)] hover:-translate-y-0.5",
      default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      outline: "border-2 border-primary text-primary hover:bg-primary/5",
      ghost: "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
      destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      link: "text-primary underline-offset-4 hover:underline p-0 h-auto shadow-none",
    };

    const sizeStyles: Record<string, string> = {
      sm: "h-9 px-4 text-sm",
      md: "h-12 px-6 text-base font-medium",
      lg: "h-14 px-8 text-lg font-semibold",
      icon: "h-9 w-9 p-0",
      default: "h-9 px-4 py-2 text-sm",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-95",
          variantStyles[variant] ?? variantStyles.primary,
          sizeStyles[size] ?? sizeStyles.md,
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
