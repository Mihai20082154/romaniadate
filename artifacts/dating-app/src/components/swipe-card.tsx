import { useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { MapPin, ShieldCheck, Info } from "lucide-react";
import type { PublicUser } from "@workspace/api-client-react/src/generated/api.schemas";

interface SwipeCardProps {
  user: PublicUser;
  isFront: boolean;
  onSwipe: (dir: 'left' | 'right' | 'up', userId: number) => void;
  style?: React.CSSProperties;
}

export function SwipeCard({ user, isFront, onSwipe, style }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  
  // Opacity transforms for stamps
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);
  const superlikeOpacity = useTransform(y, [-20, -100], [0, 1]);

  const animControls = useAnimation();

  const handleDragEnd = async (e: any, info: PanInfo) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    const isFast = Math.abs(info.velocity.x) > velocityThreshold;
    const isSwipeRight = info.offset.x > swipeThreshold || (info.velocity.x > velocityThreshold && info.offset.x > 0);
    const isSwipeLeft = info.offset.x < -swipeThreshold || (info.velocity.x < -velocityThreshold && info.offset.x < 0);
    const isSwipeUp = info.offset.y < -swipeThreshold || (info.velocity.y < -velocityThreshold && info.offset.y < 0);

    if (isSwipeUp && Math.abs(info.offset.y) > Math.abs(info.offset.x)) {
      await animControls.start({ y: -500, transition: { duration: 0.3 } });
      onSwipe('up', user.id);
    } else if (isSwipeRight) {
      await animControls.start({ x: 500, transition: { duration: 0.3 } });
      onSwipe('right', user.id);
    } else if (isSwipeLeft) {
      await animControls.start({ x: -500, transition: { duration: 0.3 } });
      onSwipe('left', user.id);
    } else {
      animControls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  const photoUrl = user.photos?.[0] || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop";

  return (
    <motion.div
      className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden bg-card border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] origin-bottom"
      style={{ x, y, rotate, ...style }}
      drag={isFront ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={animControls}
      whileTap={{ scale: 1.02 }}
    >
      <img 
        src={photoUrl} 
        alt={user.name} 
        className="w-full h-full object-cover pointer-events-none"
      />
      
      {/* Dark wash gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Stamps */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-12 left-8 border-4 border-green-500 rounded-lg px-4 py-1 pointer-events-none -rotate-12">
        <span className="font-display font-black text-4xl text-green-500 tracking-wider">LIKE</span>
      </motion.div>
      <motion.div style={{ opacity: nopeOpacity }} className="absolute top-12 right-8 border-4 border-red-500 rounded-lg px-4 py-1 pointer-events-none rotate-12">
        <span className="font-display font-black text-4xl text-red-500 tracking-wider">NOPE</span>
      </motion.div>
      <motion.div style={{ opacity: superlikeOpacity }} className="absolute top-32 left-1/2 -translate-x-1/2 border-4 border-cyan-400 rounded-lg px-6 py-2 pointer-events-none bg-black/30 backdrop-blur-sm">
        <span className="font-display font-black text-5xl text-cyan-400 tracking-wider">SUPER</span>
      </motion.div>

      {/* Profile Info */}
      <div className="absolute bottom-0 left-0 w-full p-6 text-white pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-display font-bold text-4xl drop-shadow-lg">{user.name}, {user.age}</h2>
          {user.isVerified && (
            <ShieldCheck className="w-6 h-6 text-blue-400 fill-blue-400/20 drop-shadow-lg" />
          )}
          {user.isOnline && (
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)] ml-2" />
          )}
        </div>
        
        <div className="flex items-center gap-1.5 text-white/90 mb-3 text-lg font-medium drop-shadow-md">
          <MapPin className="w-5 h-5" />
          <span>{user.city}</span>
        </div>

        {user.bio && (
          <p className="line-clamp-2 text-white/80 text-sm mb-4 leading-snug drop-shadow-md">
            {user.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {user.interests?.slice(0, 3).map((interest, i) => (
            <span key={i} className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-semibold border border-white/20">
              {interest}
            </span>
          ))}
          {user.interests && user.interests.length > 3 && (
            <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-semibold border border-white/20">
              +{user.interests.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Info Button Overlay */}
      <button className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 pointer-events-auto transition-colors">
        <Info className="w-5 h-5 text-white" />
      </button>
    </motion.div>
  );
}
