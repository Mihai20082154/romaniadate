import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { GlassCard } from "@/components/ui/glass-card";
import { Flame, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      setLocation("/swipe");
    } catch (err: any) {
      toast({ 
        title: "Login failed", 
        description: err.message || "Invalid credentials", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 relative overflow-hidden bg-[#09090b]">
      {/* Background image & gradient */}
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="Background" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-premium p-[2px] mb-4 shadow-[0_0_40px_rgba(255,77,77,0.4)]">
            <div className="w-full h-full bg-card rounded-[22px] flex items-center justify-center">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight text-white mb-2">RomaniaDate</h1>
          <p className="text-muted-foreground">Find your match today.</p>
        </div>

        <GlassCard className="w-full">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80 px-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80 px-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-premium text-white shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:pointer-events-none mt-2 flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Create one
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
