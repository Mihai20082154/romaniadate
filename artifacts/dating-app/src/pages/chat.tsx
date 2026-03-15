import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetMessages, useSendMessage, useGetMatches } from "@workspace/api-client-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Send, Image as ImageIcon, Smile, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { matchId } = useParams();
  const mId = parseInt(matchId || "0");
  const { user } = useAuth();
  
  const { data: matches } = useGetMatches();
  const match = matches?.find(m => m.id === mId);
  const otherUser = match?.user;

  const { data: initialMessages, refetch } = useGetMessages(mId, { query: { enabled: !!mId } });
  const sendMessageMutation = useSendMessage();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      scrollToBottom();
    }
  }, [initialMessages]);

  useEffect(() => {
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'chat_message' && msg.data.matchId === mId) {
        setMessages(prev => {
          if (prev.find(p => p.id === msg.data.id)) return prev;
          return [...prev, msg.data];
        });
        scrollToBottom();
      }
    });
    return unsubscribe;
  }, [mId, subscribe]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !mId) return;

    const tempMsg = {
      id: Date.now(), // temp id
      matchId: mId,
      senderId: user?.id,
      content: input.trim(),
      type: "text" as const,
      isRead: false,
      isDelivered: false,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setInput("");
    scrollToBottom();

    try {
      await sendMessageMutation.mutateAsync({ matchId: mId, data: { content: tempMsg.content, type: "text" } });
      refetch(); // sync real IDs
    } catch (err) {
      console.error(err);
      // rollback or show error logic here
    }
  };

  if (!otherUser) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-background fixed inset-0 z-50 w-full max-w-md mx-auto">
      {/* Header */}
      <header className="glass border-b border-white/5 h-16 flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/matches">
            <button className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={otherUser.photos?.[0]} alt="" className="w-10 h-10 rounded-full object-cover" />
              {otherUser.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-background"></div>}
            </div>
            <div>
              <h2 className="font-bold">{otherUser.name}</h2>
              <p className="text-xs text-muted-foreground">{otherUser.isOnline ? 'Online now' : 'Offline'}</p>
            </div>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar flex flex-col relative z-0">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <img src={otherUser.photos?.[0]} alt="" className="w-24 h-24 rounded-full object-cover mb-4 shadow-lg" />
          <h3 className="font-bold text-xl">You matched with {otherUser.name}</h3>
          <p className="text-muted-foreground text-sm mt-1">{format(new Date(match!.createdAt), "MMM d, yyyy")}</p>
        </div>

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.id;
          const showTime = idx === 0 || new Date(msg.createdAt).getTime() - new Date(messages[idx-1].createdAt).getTime() > 5 * 60 * 1000;
          
          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              {showTime && <span className="text-[10px] text-muted-foreground/60 mb-1 mx-1">{format(new Date(msg.createdAt), "HH:mm")}</span>}
              <div className={cn(
                "max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] leading-snug",
                isMe 
                  ? "bg-primary text-white rounded-br-sm shadow-[0_4px_15px_rgba(255,77,77,0.2)]" 
                  : "bg-card border border-white/5 rounded-bl-sm"
              )}>
                {msg.content}
              </div>
              {isMe && msg.isRead && idx === messages.length - 1 && (
                <span className="text-[10px] text-muted-foreground mt-1 mr-1">Read</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="glass border-t border-white/5 p-3 pb-safe flex-shrink-0 z-10">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button type="button" className="p-2 text-muted-foreground hover:text-white transition-colors">
            <ImageIcon className="w-6 h-6" />
          </button>
          
          <div className="flex-1 relative">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-10 py-3 text-[15px] focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-white transition-colors">
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button 
            type="submit" 
            disabled={!input.trim()}
            className="p-3 rounded-full bg-primary text-white disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,77,77,0.3)]"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
