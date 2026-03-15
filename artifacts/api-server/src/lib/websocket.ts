import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";
import { verifyToken } from "./auth.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

interface AuthenticatedWS extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private userSockets: Map<number, Set<AuthenticatedWS>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.setup();
  }

  private setup() {
    this.wss.on("connection", async (ws: AuthenticatedWS, req: IncomingMessage) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(1008, "Token required");
        return;
      }

      try {
        const payload = verifyToken(token);
        ws.userId = payload.userId;
        ws.isAlive = true;

        // Mark user as online
        await db.update(usersTable).set({ isOnline: true }).where(eq(usersTable.id, payload.userId));

        if (!this.userSockets.has(payload.userId)) {
          this.userSockets.set(payload.userId, new Set());
        }
        this.userSockets.get(payload.userId)!.add(ws);

        ws.send(JSON.stringify({ type: "connected", userId: payload.userId }));

        ws.on("pong", () => { ws.isAlive = true; });

        ws.on("message", async (data) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.type === "typing") {
              this.sendToUser(msg.targetUserId, {
                type: "typing",
                fromUserId: ws.userId,
                matchId: msg.matchId,
              });
            } else if (msg.type === "ping") {
              ws.send(JSON.stringify({ type: "pong" }));
            }
          } catch {}
        });

        ws.on("close", async () => {
          if (ws.userId) {
            const sockets = this.userSockets.get(ws.userId);
            if (sockets) {
              sockets.delete(ws);
              if (sockets.size === 0) {
                this.userSockets.delete(ws.userId);
                // Mark user as offline
                await db
                  .update(usersTable)
                  .set({ isOnline: false, lastSeen: new Date() })
                  .where(eq(usersTable.id, ws.userId));
              }
            }
          }
        });
      } catch (err) {
        ws.close(1008, "Invalid token");
      }
    });

    // Heartbeat
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWS) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on("close", () => clearInterval(interval));
  }

  sendToUser(userId: number, payload: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    const data = JSON.stringify(payload);
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  broadcast(payload: any) {
    const data = JSON.stringify(payload);
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }
}

export { WebSocketManager };
