// ✅ server/middleware/cors.ts
import cors from "cors";

/**
 * 🌐 Centralized CORS Middleware
 * Handles all allowed origins, methods, and headers in one place.
 * Update the `allowedOrigins` list below as needed.
 */

const allowedOrigins = [
  "https://lifebridge.online",
  "https://www.lifebridge.online",
  "https://api.lifebridge.online",
  "https://lifebridge-opotracking.netlify.app",
  "https://real-time-organ-tracking-allocation.onrender.com", // optional legacy
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
];

// ✅ Configure CORS for all HTTP methods
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      console.log("🌍 [CORS] No Origin (likely server-side or mobile app)");
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`✅ [CORS] Allowed origin: ${origin}`);
      return callback(null, true);
    }

    console.warn(`🚫 [CORS] Blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"), false);
  },

  credentials: true, // Important: allows cookies/sessions
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-CSRF-Token",
  ],
  exposedHeaders: ["X-CSRF-Token"],
  optionsSuccessStatus: 204, // For legacy browsers
});

export default corsMiddleware;
