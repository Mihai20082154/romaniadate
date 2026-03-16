import { useState } from "react";
import { useGetUserStats, useGetReferralInfo, useGetLeaderboard, useGetDiamondBalance, useGetDiamondHistory } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Gem, Copy, TrendingUp, Award, Flame, Users, CheckCircle2, Crown, ArrowRight, Sparkles, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { getRankByLevel, formatMessageTime } from "@/lib/utils";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useGetUserStats();
  const { data: referral } = useGetReferralInfo();
  const { data: leaderboard } = useGetLeaderboard();
  const { data: diamonds } = useGetDiamondBalance();
  const { data: history } = useGetDiamondHistory();
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);

  const handleCopy = () => {
    if (referral?.referralCode) {
      navigator.clipboard.writeText(referral.referralCode)
        .then(() => toast({ title: "Copied!", description: "Share your referral code to earn diamonds." }))
        .catch(() => toast({ title: "Copied!", description: referral.referralCode }));
    }
  };

  const rank = user ? getRankByLevel(user.level) : null;
  const xpProgress = user ? (user.xp % 100) : 0;

  return (
    <div className="flex-1 p-4 space-y-6 pb-8">
      <h1 className="font-display font-bold text-2xl">Dashboard</h1>

      {/* Diamond Balance Card */}
      <GlassCard className="col-span-2 relative overflow-hidden bg-gradient-premium border-0 p-6 flex flex-col justify-center">
        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none"><Gem className="w-24 h-24" /></div>
        <p className="text-white/80 font-medium mb-1 relative z-10">Diamond Balance</p>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="font-display font-black text-5xl text-white tracking-tight">{diamonds?.balance ?? user?.diamonds ?? 0}</span>
          <Gem className="w-6 h-6 text-white" />
        </div>
        <div className="mt-4 flex gap-2 relative z-10">
          <button 
            onClick={handleCopy}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium text-sm backdrop-blur-md transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Earn Free
          </button>
          <Link href="/vip">
            <button className="px-4 py-2 bg-white text-primary rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
              <Crown className="w-4 h-4" /> Buy More
            </button>
          </Link>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium text-sm backdrop-blur-md transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" /> History
          </button>
        </div>
      </GlassCard>

      {/* Diamond History */}
      {showHistory && history && (
        <GlassCard variant="panel" className="space-y-2">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Diamond History</h3>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No transactions yet</p>
          ) : (
            history.slice(0, 10).map((tx: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium">{tx.reason}</p>
                  <p className="text-xs text-muted-foreground">{formatMessageTime(tx.createdAt)}</p>
                </div>
                <span className={`font-bold ${tx.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount}💎
                </span>
              </div>
            ))
          )}
        </GlassCard>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard variant="panel" className="flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <span className="font-bold text-2xl">{stats?.totalMatches ?? 0}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Matches</span>
        </GlassCard>

        <GlassCard variant="panel" className="flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
            <Award className="w-6 h-6 text-purple-400" />
          </div>
          <span className={`font-bold text-lg ${rank?.color}`}>{rank?.name || 'Beginner'}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Lvl {user?.level || 1}</span>
        </GlassCard>
      </div>

      {/* XP Progress */}
      <GlassCard variant="panel">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> XP Progress</h3>
          <span className="text-sm text-muted-foreground">{user?.xp || 0} XP</span>
        </div>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000" 
            style={{ width: `${xpProgress}%` }} 
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{100 - xpProgress} XP to next level</p>
      </GlassCard>

      {/* Referral System */}
      <GlassCard variant="panel" className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Invite Friends</h3>
            <p className="text-sm text-muted-foreground mt-1">Get 500💎 for every 10 friends you refer</p>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
            {referral?.referredCount || 0} / {referral?.nextMilestone || 10}
          </div>
        </div>
        
        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" 
            style={{ width: `${Math.min(100, ((referral?.referredCount || 0) / (referral?.nextMilestone || 10)) * 100)}%` }} 
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm flex items-center text-white/80 truncate">
            {referral?.referralCode || 'Loading...'}
          </div>
          <button onClick={handleCopy} className="p-3 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 transition-colors active:scale-95">
            <Copy className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-muted-foreground bg-black/30 rounded-lg px-3 py-2">
          Share your code & earn diamonds when friends join! 💎
        </div>
      </GlassCard>

      {/* Activity Chart */}
      <GlassCard variant="panel" className="pt-6">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Weekly Swipes</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.weeklySwipes || []}>
              <XAxis dataKey="date" tickFormatter={(v) => v.split('-')[2]} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} 
              />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Leaderboard */}
      <GlassCard variant="panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Top Users</h3>
        </div>
        <div className="space-y-3">
          {(leaderboard || []).map((entry: any) => (
            <div key={entry.userId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className={`w-6 text-center font-bold ${entry.rank <= 3 ? 'text-yellow-400' : 'text-muted-foreground'}`}>{entry.rank}</div>
              <img 
                src={entry.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} 
                className="w-10 h-10 rounded-full object-cover border-2 border-white/10" 
                alt="" 
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{entry.name}</div>
                <div className="text-xs text-muted-foreground truncate">Lvl {entry.level} • {entry.xp} XP</div>
              </div>
              {entry.userId === user?.id && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
              {entry.rank === 1 && <span className="text-yellow-400 flex-shrink-0">👑</span>}
            </div>
          ))}
          {(!leaderboard || leaderboard.length === 0) && (
            <p className="text-center text-muted-foreground text-sm py-4">Swipe to start climbing the ranks!</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
