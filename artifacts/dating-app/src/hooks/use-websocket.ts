import { useState, useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import type { Message } from "@workspace/api-client-react";

type WSMessage = 
  | { type: 'chat_message', data: Message }
  | { type: 'new_message', data: Message }
  | { type: 'typing', data: { matchId: number, userId: number } }
  | { type: 'match_update', data: any };

export function useWebSocket() {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  
  // Listeners mapping
  const listenersRef = useRef<Set<(msg: WSMessage) => void>>(new Set());

  const connect = () => {
    if (!token) return;
    
    // Use proper ws protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        listenersRef.current.forEach(listener => listener(msg));
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      // Try to reconnect in 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
    };
    
    wsRef.current = ws;
  };

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token]);

  const subscribe = (callback: (msg: WSMessage) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  };

  const send = (msg: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  return { isConnected, subscribe, send };
}
