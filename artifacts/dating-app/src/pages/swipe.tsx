import { useState } from "react";
import { useDiscoverUsers, useLikeUser, useDislikeUser, useSuperlikeUser, useRewindSwipe, getGetMatchesQueryKey, getGetDiamondBalanceQueryKey } from "@workspace/api-client-react";
import { SwipeCard } from "@/components/swipe-card";
import { MatchOverlay } from "@/components/match-overlay";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { X, Heart, Star, Undo2, Zap, Loader2, Flame } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { PublicUser } from "@workspace/api-client-react";

export default function Swipe() {
  const { user } = useAuth();
  const { data: users, isLoading, refetch } = useDiscoverUsers({ onlineOnly: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [matchData, setMatchData] = useState<{ user: PublicUser, matchId: number } | null>(null);

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
      onError: (err) => toast({ title: "Oops", description: err.error, variant: "destructive" })
    }
  });

  const dislikeMutation = useDislikeUser();
  const superlikeMutation = useSuperlikeUser({
    mutation: {
      onSuccess: (data, variables) => {
        if (data.isMatch && data.matchId) {
          const matchedUser = users?.find(u => u.id === variables.data.targetUserId);
          if (matchedUser) {
            setMatchData({ user: matchedUser, matchId: data.matchId });
            queryClient.invalidateQueries({ queryKey: getGetMatchesQueryKey() });
          }
        }
      },
      onError: (err) => toast({ title: "Oops", description: err.error, variant: "destructive" })
    }
  });

  const rewindMutation = useRewindSwipe({
    mutation: {
      onSuccess: () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
        queryClient.invalidateQueries({ queryKey: getGetDiamondBalanceQueryKey() });
      },
      onError: (err) => toast({ title: "Cannot rewind", description: err.error, variant: "destructive" })
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
            // scale down and push down cards behind
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
            <p className="text-muted-foreground mb-8">You've seen everyone matching your current filters.</p>
            <button 
              onClick={() => { setCurrentIndex(0); refetch(); }}
              className="px-8 py-3 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
            >
              Refresh Profiles
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 max-w-sm mx-auto w-full">
        <button 
          onClick={() => rewindMutation.mutate()}
          disabled={currentIndex === 0 || rewindMutation.isPending}
          className="w-12 h-12 rounded-full glass flex items-center justify-center text-yellow-500 hover:bg-yellow-500/10 transition-all active:scale-90 disabled:opacity-50 disabled:pointer-events-none group"
        >
          <Undo2 className="w-5 h-5 group-hover:-rotate-45 transition-transform" />
        </button>
        
        <button 
          onClick={() => manualSwipe('left')}
          className="w-16 h-16 rounded-full glass border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all active:scale-90 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
        >
          <X className="w-7 h-7" strokeWidth={3} />
        </button>

        <button 
          onClick={() => manualSwipe('up')}
          className="w-14 h-14 rounded-full glass border border-cyan-400/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 transition-all active:scale-90 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
        >
          <Star className="w-6 h-6 fill-cyan-400/20" />
        </button>

        <button 
          onClick={() => manualSwipe('right')}
          className="w-16 h-16 rounded-full glass border border-green-500/30 flex items-center justify-center text-green-500 hover:bg-green-500/10 transition-all active:scale-90 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
        >
          <Heart className="w-7 h-7 fill-green-500/20" />
        </button>

        <button className="w-12 h-12 rounded-full glass flex items-center justify-center text-purple-400 hover:bg-purple-400/10 transition-all active:scale-90 group">
          <Zap className="w-5 h-5 fill-purple-400/20 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
