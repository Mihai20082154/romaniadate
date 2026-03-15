import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useActivateVip } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Crown, Check, Diamond, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function VIP() {
  const { user } = useAuth();
  const { toast } = useToast();
  const activateVipMutation = useActivateVip();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const plans = [
    { id: 'monthly', name: '1 Month', price: 500, popular: false },
    { id: 'quarterly', name: '3 Months', price: 1200, popular: true, save: '20%' },
    { id: 'yearly', name: '12 Months', price: 3000, popular: false, save: '50%' },
  ] as const;

  const features = [
    "Unlimited Likes",
    "Unlimited Rewinds",
    "See who liked you",
    "10 Free Superlikes daily",
    "Incognito Mode",
    "Ad-free experience"
  ];

  const handleActivate = async () => {
    try {
      await activateVipMutation.mutateAsync({ data: { plan: selectedPlan } });
      toast({ title: "Welcome to VIP!", description: "Your premium features are now active." });
    } catch (e: any) {
      toast({ title: "Activation failed", description: e.error || "Not enough diamonds", variant: "destructive" });
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/vip-bg.png`} alt="VIP Background" className="w-full h-full object-cover opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background to-background" />
      </div>

      <div className="relative z-10 p-4 pb-24">
        <Link href="/settings" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 mb-6 hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-gradient-vip rounded-full p-[2px] mb-4 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
            <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
              <Crown className="w-10 h-10 text-yellow-500 fill-yellow-500/20" />
            </div>
          </div>
          <h1 className="font-display font-black text-4xl text-gradient-gold mb-2">RomaniaDate VIP</h1>
          <p className="text-white/80">Unlock the ultimate dating experience.</p>
        </div>

        <GlassCard className="mb-8 border-yellow-500/30 bg-black/60 shadow-[0_0_40px_rgba(251,191,36,0.1)]">
          <ul className="space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-yellow-500" />
                </div>
                <span className="font-medium text-white/90">{f}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <div className="grid gap-3 mb-8">
          {plans.map((p) => (
            <div 
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`relative p-4 rounded-2xl cursor-pointer transition-all ${selectedPlan === p.id ? 'bg-gradient-vip p-[2px] scale-[1.02]' : 'bg-white/5 border border-white/10'}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  MOST POPULAR
                </div>
              )}
              <div className={`w-full h-full rounded-[14px] flex items-center justify-between ${selectedPlan === p.id ? 'bg-card px-4 py-3' : 'px-4 py-3'}`}>
                <div>
                  <div className="font-bold text-lg text-white">{p.name}</div>
                  {p.save && <div className="text-xs text-yellow-500 font-bold">Save {p.save}</div>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-2xl">{p.price}</span>
                  <Diamond className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleActivate}
          disabled={activateVipMutation.isPending}
          className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-vip text-black shadow-[0_10px_30px_rgba(251,191,36,0.3)] hover:shadow-[0_10px_40px_rgba(251,191,36,0.5)] hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {activateVipMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Get VIP Now'}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Current balance: {user?.diamonds || 0} diamonds
        </p>
      </div>
    </div>
  );
}
