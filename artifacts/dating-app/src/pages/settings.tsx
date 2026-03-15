import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateSettings } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Bell, Lock, SlidersHorizontal, Gem, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const updateSettingsMutation = useUpdateSettings();

  const [pref, setPref] = useState(user?.preference || 'both');
  const [notifyMatch, setNotifyMatch] = useState(user?.notifyNewMatch ?? true);
  const [notifyMsg, setNotifyMsg] = useState(user?.notifyNewMessage ?? true);
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);

  const handleUpdate = async (updates: any) => {
    try {
      await updateSettingsMutation.mutateAsync({ data: updates });
      toast({ title: "Settings updated" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.error, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 p-4 pb-24 space-y-6">
      <h1 className="font-display font-bold text-2xl">Settings</h1>

      {/* Premium Upgrade Banner */}
      {!user.isVip && (
        <Link href="/vip">
          <GlassCard variant="premium" className="cursor-pointer group">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                  <Gem className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                  Upgrade to VIP
                </h3>
                <p className="text-white/70 text-sm">Unlimited likes, see who liked you & more</p>
              </div>
              <div className="bg-white text-primary px-4 py-2 rounded-full font-bold text-sm group-hover:scale-105 transition-transform">
                View Plans
              </div>
            </div>
          </GlassCard>
        </Link>
      )}

      {user.isVip && (
        <GlassCard className="bg-gradient-vip border-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white">VIP Active</div>
              <div className="text-white/80 text-xs">Expires {new Date(user.vipExpiresAt!).toLocaleDateString()}</div>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard variant="panel">
        <h3 className="font-bold mb-4 flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-muted-foreground" /> Discovery Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/90">Show me</span>
            <select 
              value={pref} 
              onChange={(e) => {
                setPref(e.target.value as any);
                handleUpdate({ preference: e.target.value });
              }}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="boy">Boys</option>
              <option value="girl">Girls</option>
              <option value="both">Everyone</option>
            </select>
          </div>
          
          <div className="pt-2 border-t border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/90">Age Range</span>
              <span className="text-primary font-bold text-sm">{user.ageCategory === 'teen' ? '14 - 17' : '18 - 99'}</span>
            </div>
            <p className="text-xs text-muted-foreground">Fixed based on your registered age category.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard variant="panel">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-muted-foreground" /> Notifications</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/90">New Matches</span>
            <button 
              onClick={() => {
                const n = !notifyMatch;
                setNotifyMatch(n);
                handleUpdate({ notifyNewMatch: n });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${notifyMatch ? 'bg-primary' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${notifyMatch ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white/90">Messages</span>
            <button 
              onClick={() => {
                const n = !notifyMsg;
                setNotifyMsg(n);
                handleUpdate({ notifyNewMessage: n });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${notifyMsg ? 'bg-primary' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${notifyMsg ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard variant="panel">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-muted-foreground" /> Privacy</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white/90 block mb-1">Private Account</span>
            <span className="text-xs text-muted-foreground">Only show me to people I like first</span>
          </div>
          <button 
            onClick={() => {
              if(!user.isVip) {
                toast({ title: "VIP Required", description: "Private mode is a VIP feature." });
                return;
              }
              const n = !isPrivate;
              setIsPrivate(n);
              handleUpdate({ isPrivate: n });
            }}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isPrivate ? 'bg-primary' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isPrivate ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </GlassCard>

      <button 
        onClick={logout}
        className="w-full py-4 rounded-xl border border-red-500/30 text-red-500 font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" /> Logout
      </button>
    </div>
  );
}
