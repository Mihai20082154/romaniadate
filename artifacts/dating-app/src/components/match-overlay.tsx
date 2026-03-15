import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Link } from "wouter";
import type { PublicUser } from "@workspace/api-client-react/src/generated/api.schemas";

interface MatchOverlayProps {
  matchUser: PublicUser | null;
  matchId: number | null;
  currentUserPhoto: string;
  onClose: () => void;
}

export function MatchOverlay({ matchUser, matchId, currentUserPhoto, onClose }: MatchOverlayProps) {
  useEffect(() => {
    if (matchUser) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff4d4d', '#ff00ff', '#00f0ff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff4d4d', '#ff00ff', '#00f0ff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [matchUser]);

  return (
    <AnimatePresence>
      {matchUser && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl px-6"
        >
          <div className="w-full max-w-md flex flex-col items-center">
            <motion.h2 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="font-display font-black text-5xl md:text-6xl text-gradient mb-2 drop-shadow-2xl text-center"
            >
              It's a Match!
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-12 text-center"
            >
              You and <span className="font-bold text-foreground">{matchUser.name}</span> liked each other.
            </motion.p>

            <div className="flex items-center justify-center gap-4 mb-12">
              <motion.div 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 15, delay: 0.5 }}
                className="relative"
              >
                <img 
                  src={currentUserPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop"} 
                  alt="You" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-[0_0_30px_rgba(255,77,77,0.5)] z-10 relative"
                />
              </motion.div>
              
              <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 15, delay: 0.6 }}
                className="relative"
              >
                <img 
                  src={matchUser.photos?.[0] || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop"} 
                  alt={matchUser.name} 
                  className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-[0_0_30px_rgba(0,240,255,0.5)] z-0 relative"
                />
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="w-full space-y-4"
            >
              {matchId && (
                <Link href={`/chat/${matchId}`} className="block w-full">
                  <button className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-premium text-white shadow-[0_10px_30px_rgba(255,77,77,0.4)] hover:shadow-[0_10px_40px_rgba(255,77,77,0.6)] hover:-translate-y-1 transition-all">
                    Send a Message
                  </button>
                </Link>
              )}
              
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl font-bold text-lg border-2 border-white/10 hover:bg-white/5 transition-all text-white"
              >
                Keep Swiping
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
