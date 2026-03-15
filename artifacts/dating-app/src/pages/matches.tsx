import { Link } from "wouter";
import { useGetMatches } from "@workspace/api-client-react";
import { formatMessageTime } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function Matches() {
  const { data: matches, isLoading } = useGetMatches();

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  // Separate matches with and without messages
  const newMatches = matches?.filter(m => !m.lastMessage) || [];
  const activeChats = matches?.filter(m => m.lastMessage).sort((a, b) => 
    new Date(b.lastMessage!.createdAt).getTime() - new Date(a.lastMessage!.createdAt).getTime()
  ) || [];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-4">
        <h1 className="font-display font-bold text-2xl mb-4">Matches</h1>
        
        {/* New Matches Row */}
        {newMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 px-1">New Matches</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
              {newMatches.map((match) => (
                <Link key={match.id} href={`/chat/${match.id}`} className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                  <div className="relative">
                    <img 
                      src={match.user.photos?.[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} 
                      alt={match.user.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-[0_0_15px_rgba(255,77,77,0.3)] transition-transform group-hover:scale-105"
                    />
                    {match.user.isOnline && (
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  <span className="font-medium text-sm text-foreground/90">{match.user.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Active Chats */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Messages</h2>
          <div className="flex flex-col gap-2">
            {activeChats.length > 0 ? (
              activeChats.map(match => (
                <Link key={match.id} href={`/chat/${match.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="relative">
                      <img 
                        src={match.user.photos?.[0] || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop"} 
                        alt={match.user.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {match.user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-lg truncate pr-2 group-hover:text-primary transition-colors">{match.user.name}</h3>
                        {match.lastMessage && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatMessageTime(match.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={`truncate text-sm ${match.unreadCount > 0 ? 'text-white font-medium' : 'text-muted-foreground'}`}>
                          {match.lastMessage?.senderId === match.user.id ? "" : "You: "}
                          {match.lastMessage?.type === 'image' ? '📷 Image' : match.lastMessage?.content}
                        </p>
                        {match.unreadCount > 0 && (
                          <div className="ml-2 w-5 h-5 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white">
                            {match.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-24 h-24 mx-auto mb-4 opacity-50">
                  <img src={`${import.meta.env.BASE_URL}images/empty-matches.png`} alt="Empty" className="w-full h-full object-contain" />
                </div>
                <p className="text-muted-foreground">No conversations yet.<br/>Start swiping to meet new people!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
