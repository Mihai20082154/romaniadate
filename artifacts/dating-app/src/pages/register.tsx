import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { GlassCard } from "@/components/ui/glass-card";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ROMANIAN_CITIES } from "@/lib/utils";
import type { RegisterRequest } from "@workspace/api-client-react";

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState<RegisterRequest>({
    name: "",
    email: "",
    password: "",
    birthDate: "",
    gender: "boy",
    preference: "both",
    city: "București",
    referralCode: ""
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast({ title: "Account created!", description: "Welcome to RomaniaDate." });
      setLocation("/swipe");
    } catch (err: any) {
      toast({ 
        title: "Registration failed", 
        description: err.message || "Please check your inputs.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 relative overflow-hidden bg-background py-10">
      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
             <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-8 h-8 object-contain" />
             <span className="font-display font-bold text-xl text-gradient">RomaniaDate</span>
          </div>
          <div className="text-sm font-medium text-muted-foreground">Step {step} of 2</div>
        </div>

        <GlassCard className="w-full">
          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Create Account</h2>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 px-1">Full Name</label>
                <input 
                  required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Ion Popescu"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 px-1">Email</label>
                <input 
                  type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="ion@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 px-1">Password</label>
                <input 
                  type="password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 px-1">Birth Date (14+ only)</label>
                <input 
                  type="date" required value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none [color-scheme:dark]"
                />
              </div>

              <button type="submit" className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-4">
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">A bit more about you</h2>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 px-1">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  {['boy', 'girl'].map(g => (
                    <button type="button" key={g} onClick={() => setFormData({...formData, gender: g as any})}
                      className={`py-3 rounded-xl border ${formData.gender === g ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-black/40 text-muted-foreground'} capitalize font-medium transition-all`}
                    >{g}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 mt-4">
                <label className="text-sm font-medium text-white/80 px-1">Interested in</label>
                <div className="grid grid-cols-3 gap-2">
                  {['boy', 'girl', 'both'].map(g => (
                    <button type="button" key={g} onClick={() => setFormData({...formData, preference: g as any})}
                      className={`py-3 rounded-xl border ${formData.preference === g ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-black/40 text-muted-foreground'} capitalize font-medium transition-all`}
                    >{g}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 mt-4">
                <label className="text-sm font-medium text-white/80 px-1">City</label>
                <select 
                  value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none"
                >
                  {ROMANIAN_CITIES.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                </select>
              </div>

              <div className="space-y-1 mt-4">
                <label className="text-sm font-medium text-white/80 px-1">Referral Code (Optional)</label>
                <input 
                  value={formData.referralCode || ''} onChange={e => setFormData({...formData, referralCode: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Enter code..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(1)} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-4 rounded-xl font-bold text-lg bg-gradient-premium text-white shadow-lg disabled:opacity-50 flex items-center justify-center">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Registration"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
