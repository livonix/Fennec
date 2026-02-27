import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

import authRoutes from "./routes/auth.js";
import botRoutes from "./routes/bots.js";
import channelRoutes from "./routes/channels.js";
import inviteRoutes from "./routes/invites.js";
import messageRoutes from "./routes/messages.js";
import policyRoutes from "./routes/policy.js";
import pushRoutes from "./routes/push.js";
import serverRoutes from "./routes/servers.js";
import syncRoutes from "./routes/sync.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://127.0.0.1:61267",
    ],
    credentials: true,
  }),
);
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/bots", botRoutes);
app.use("/channels", channelRoutes);
app.use("/invites", inviteRoutes);
app.use("/messages", messageRoutes);
app.use("/servers", serverRoutes);
app.use("/sync", syncRoutes);
app.use("/users", userRoutes);
app.use("/push", pushRoutes);
app.use("/policy", policyRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main API configuration route
app.get("/", (req, res) => {
  res.json({
    revolt: "0.6.0", // API version
    features: {
      captcha: false,
      email: true,
      invite_only: false,
      summer: false,
      halloween: false,
      voso: false,
    },
    ws: "ws://localhost:8000",
    app: "Fennec",
    vapid: null, // For push notifications
  });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`Stoat Backend API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, request) => {
  console.log("WebSocket client connected");

  // Extract token from URL parameters
  const url = new URL(request.url, `http://${request.headers.host}`);
  const token = url.searchParams.get("token");

  console.log("Client connecting with token:", token);

  // Send initial welcome message
  ws.send(JSON.stringify({ type: "Ready" }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received:", data);

      // Handle different message types
      switch (data.type) {
        case "Ping":
          ws.send(JSON.stringify({ type: "Pong", data: data.data }));
          break;
        case "Authenticate":
          // For now, just acknowledge
          ws.send(JSON.stringify({ type: "Authenticated" }));
          break;
        default:
          console.log("Unhandled message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
