import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetDiamondBalance } from "@workspace/api-client-react";
import { 
  Flame, 
  MessageCircleHeart, 
  Gem, 
  UserCircle, 
  Bell,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const { data: diamonds } = useGetDiamondBalance();

  if (!user) return <>{children}</>;

  const navItems = [
    { href: "/swipe", icon: Flame, label: "Discover" },
    { href: "/matches", icon: MessageCircleHeart, label: "Matches" },
    { href: "/dashboard", icon: Gem, label: "Dashboard" },
    { href: "/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto sticky top-0 z-40 glass border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="RomaniaDate" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,77,77,0.8)]" />
          <span className="font-display font-bold text-xl tracking-tight text-gradient">
            RomaniaDate
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 bg-card border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all active:scale-95 cursor-pointer">
            <Gem className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            <span className="font-bold text-sm text-cyan-50">{diamonds?.balance || user.diamonds}</span>
          </Link>
          <button className="w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center relative hover:bg-white/5 transition-all active:scale-95">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {/* Mock notification dot */}
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_var(--color-primary)]"></span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md mx-auto flex-1 relative flex flex-col overflow-x-hidden pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md mx-auto z-40 glass border-t border-white/5 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith("/chat") && item.href === "/matches");
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer group"
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-primary/20 text-primary scale-110 shadow-[0_0_15px_rgba(255,77,77,0.3)]" 
                    : "text-muted-foreground group-hover:text-foreground group-hover:bg-white/5"
                )}>
                  <Icon className={cn("w-6 h-6 transition-all", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_var(--color-primary)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
