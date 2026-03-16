import { useState } from "react";
import { useDiscoverUsers, useLikeUser, useDislikeUser, useSuperlikeUser, useRewindSwipe, useBoostProfile, getGetMatchesQueryKey, getGetDiamondBalanceQueryKey } from "@workspace/api-client-react";
import { SwipeCard } from "@/components/swipe-card";
import { MatchOverlay } from "@/components/match-overlay";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { X, Heart, Star, Undo2, Zap, Loader2, Flame, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import type { PublicUser } from "@workspace/api-client-react";

export default function Swipe() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: users, isLoading, refetch } = useDiscoverUsers();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchData, setMatchData] = useState<{ user: PublicUser, matchId: number } | null>(null);
  const [isBoosted, setIsBoosted] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const likeMutation = useLikeUser({
    mutation: {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: getGetDiamondBalanceQueryKey() });
        if (data.isMatch && data.matchId) {
          const matchedUser = users?.find(u => u.id === variables.data.targetUserId);
          if (matchedUser) {
            setMatchData({ user: matchedUser, matchId: data.matchId });
            queryClient.invalidateQueries({ queryKey: getGetMatchesQueryKey() });
          }
        }
      },
      onError: (err: any) => toast({ title: "Oops", description: err?.data?.error || "Something went wrong", variant: "destructive" })
    }
  });

  const dislikeMutation = useDislikeUser({
    mutation: {
      onError: (err: any) => console.error("Dislike error:", err)
    }
  });

  const superlikeMutation = useSuperlikeUser({
    mutation: {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: getGetDiamondBalanceQueryKey() });
        if (data.isMatch && data.matchId) {
          const matchedUser = users?.find(u => u.id === variables.data.targetUserId);
          if (matchedUser) {
            setMatchData({ user: matchedUser, matchId: data.matchId });
            queryClient.invalidateQueries({ queryKey: getGetMatchesQueryKey() });
          }
        }
      },
      onError: (err: any) => toast({ title: "Not enough diamonds", description: "Superlike costs 10 💎", variant: "destructive" })
    }
  });

  const rewindMutation = useRewindSwipe({
    mutation: {
      onSuccess: () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
        queryClient.invalidateQueries({ queryKey: getGetDiamondBalanceQueryKey() });
        toast({ title: "Rewound!", description: "Went back to previous profile." });
      },
      onError: (err: any) => toast({ title: "Cannot rewind", description: "Rewind costs 30 💎", variant: "destructive" })
    }
  });

  const boostMutation = useBoostProfile({
    mutation: {
      onSuccess: () => {
        setIsBoosted(true);
        queryClient.invalidateQueries({ queryKey: getGetDiamondBalanceQueryKey() });
        toast({ title: "Profile Boosted! 🚀", description: "You'll be seen by more people for 30 minutes." });
        setTimeout(() => setIsBoosted(false), 30 * 60 * 1000);
      },
      onError: (err: any) => toast({ title: "Boost failed", description: "Boost costs 50 💎", variant: "destructive" })
    }
  });

  const handleSwipe = (dir: 'left' | 'right' | 'up', targetUserId: number) => {
    setCurrentIndex(prev => prev + 1);
    if (dir === 'right') likeMutation.mutate({ data: { targetUserId } });
    if (dir === 'left') dislikeMutation.mutate({ data: { targetUserId } });
    if (dir === 'up') superlikeMutation.mutate({ data: { targetUserId } });
  };

  const manualSwipe = (dir: 'left' | 'right' | 'up') => {
    if (!users || currentIndex >= users.length) return;
    const currentProfile = users[currentIndex];
    handleSwipe(dir, currentProfile.id);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse mb-4">
          <Heart className="w-8 h-8 text-primary animate-bounce" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Finding people near you...</p>
      </div>
    );
  }

  const currentUsers = users?.slice(currentIndex, currentIndex + 3).reverse() || [];
  const currentProfile = users?.[currentIndex];

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-6 overflow-hidden relative">
      <MatchOverlay 
        matchUser={matchData?.user || null} 
        matchId={matchData?.matchId || null}
        currentUserPhoto={user?.photos?.[0] || ""}
        onClose={() => setMatchData(null)} 
      />

      {/* Swipe Cards Stack */}
      <div className="relative flex-1 w-full max-w-sm mx-auto perspective-1000 mb-6">
        {currentUsers.length > 0 ? (
          currentUsers.map((profile, i) => {
            const isFront = i === currentUsers.length - 1;
            const scale = 1 - (currentUsers.length - 1 - i) * 0.05;
            const yOffset = (currentUsers.length - 1 - i) * 12;
            return (
              <SwipeCard
                key={profile.id}
                user={profile}
                isFront={isFront}
                onSwipe={handleSwipe}
                style={{ 
                  zIndex: i,
                  transform: `scale(${scale}) translateY(${yOffset}px)`,
                  transition: isFront ? 'none' : 'transform 0.3s ease-out'
                }}
              />
            );
          })
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center glass rounded-3xl p-8">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-gray-800 to-black p-[2px]">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center border border-white/5">
                <Flame className="w-10 h-10 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">You're caught up!</h3>
            <p className="text-muted-foreground mb-8">You've seen everyone. Come back later or boost your profile!</p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setCurrentIndex(0); refetch(); }}
                className="px-6 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
              >
                Refresh
              </button>
              <button 
                onClick={() => boostMutation.mutate()}
                disabled={boostMutation.isPending || isBoosted}
                className="px-6 py-3 rounded-full bg-purple-500/20 text-purple-400 font-semibold hover:bg-purple-500/30 transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Boost (50💎)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 max-w-sm mx-auto w-full">
        <button 
          onClick={() => rewindMutation.mutate()}
          disabled={currentIndex === 0 || rewindMutation.isPending}
          title="Rewind (30💎)"
          className="w-12 h-12 rounded-full glass flex items-center justify-center text-yellow-500 hover:bg-yellow-500/10 transition-all active:scale-90 disabled:opacity-50 disabled:pointer-events-none group"
        >
          {rewindMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-5 h-5 group-hover:-rotate-45 transition-transform" />}
        </button>
        
        <button 
          onClick={() => manualSwipe('left')}
          disabled={!currentProfile || likeMutation.isPending || dislikeMutation.isPending}
          title="Nope"
          className="w-16 h-16 rounded-full glass border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all active:scale-90 shadow-[0_0_15px_rgba(239,68,68,0.1)] disabled:opacity-50"
        >
          <X className="w-7 h-7" strokeWidth={3} />
        </button>

        <button 
          onClick={() => manualSwipe('up')}
          disabled={!currentProfile || superlikeMutation.isPending}
          title="Superlike (10💎)"
          className="w-14 h-14 rounded-full glass border border-cyan-400/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 transition-all active:scale-90 shadow-[0_0_15px_rgba(34,211,238,0.1)] disabled:opacity-50"
        >
          {superlikeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-6 h-6 fill-cyan-400/20" />}
        </button>

        <button 
          onClick={() => manualSwipe('right')}
          disabled={!currentProfile || likeMutation.isPending}
          title="Like (free)"
          className="w-16 h-16 rounded-full glass border border-green-500/30 flex items-center justify-center text-green-500 hover:bg-green-500/10 transition-all active:scale-90 shadow-[0_0_15px_rgba(34,197,94,0.1)] disabled:opacity-50"
        >
          {likeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-7 h-7 fill-green-500/20" />}
        </button>

        <button 
          onClick={() => boostMutation.mutate()}
          disabled={boostMutation.isPending || isBoosted}
          title={isBoosted ? "Boost active!" : "Boost profile (50💎)"}
          className={`w-12 h-12 rounded-full glass flex items-center justify-center transition-all active:scale-90 group ${isBoosted ? 'text-purple-400 bg-purple-400/20 shadow-[0_0_20px_rgba(192,132,252,0.4)]' : 'text-purple-400 hover:bg-purple-400/10'}`}
        >
          {boostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className={`w-5 h-5 ${isBoosted ? 'fill-purple-400' : 'fill-purple-400/20 group-hover:scale-110'} transition-transform`} />}
        </button>
      </div>
    </div>
  );
}
