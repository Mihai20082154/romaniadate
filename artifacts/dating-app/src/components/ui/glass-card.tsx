import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "panel" | "premium";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl overflow-hidden relative",
          variant === "default" && "glass p-6",
          variant === "panel" && "glass-panel p-5",
          variant === "premium" && "bg-gradient-to-br from-card to-card border border-primary/30 shadow-[0_8px_32px_rgba(255,77,77,0.15)] p-6 before:absolute before:inset-0 before:bg-gradient-premium before:opacity-10 before:pointer-events-none",
          className
        )}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";
