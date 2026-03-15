import http from "http";
import app from "./app.js";
import { WebSocketManager } from "./lib/websocket.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);
const wsManager = new WebSocketManager(server);

// Make wsManager globally available for routes
(global as any).wsManager = wsManager;

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
