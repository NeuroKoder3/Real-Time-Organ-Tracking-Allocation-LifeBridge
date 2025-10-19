// ✅ server/middleware/cors.ts
import cors from "cors";

/**
 * 🌐 Centralized CORS Middleware
 * Handles allowed origins, methods, headers, and credentials securely.
 * Update the `allowedOrigins` list as needed.
 */

const allowedOrigins = [
  "https://lifebridge.online",                           // Netlify production
  "https://www.lifebridge.online",                       // Optional www support
  "https://api.lifebridge.online",                       // API subdomain (if used)
  "https://lifebridge-opotracking.netlify.app",          // Netlify preview or secondary frontend
  "https://real-time-organ-tracking-allocation.onrender.com", // Legacy Render frontend
  "http://localhost:5173",                               // Vite dev
  "http://127.0.0.1:5173",
  "http://localhost:5000",                               // Local backend
];

// ✅ CORS Middleware Setup
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, server-to-server)
    if (!origin) {
      console.log("🌍 [CORS] No origin header — likely internal or mobile");
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`✅ [CORS] Allowed origin: ${origin}`);
      return callback(null, true);
    }

    console.warn(`🚫 [CORS] Blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"), false);
  },

  credentials: true, // Required for cookies / session auth
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-CSRF-Token",
  ],
  exposedHeaders: ["X-CSRF-Token"],
  optionsSuccessStatus: 204, // For legacy clients using OPTIONS
});

export default corsMiddleware;
