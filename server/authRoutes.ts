import { Router, type Request, type Response, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import storage from "./storage.js";
import {
  generateTokens,
  authenticateRefreshToken,
} from "./middleware/sessionMiddleware.js";
import rateLimit from "express-rate-limit";

const router: Router = Router();

// ✅ Rate limiter for refresh endpoint (cast to RequestHandler for TS)
const refreshLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
}) as RequestHandler;

const isProd = process.env.NODE_ENV === "production";

// ---------------------------------------------------------
// Demo credentials
// ---------------------------------------------------------
const DEMO_EMAIL = "demo@lifebridge.online";
const DEMO_PASSWORD = "Demo1234";
const DEMO_USER_ID = "demo-user-id";

// ---------------------------------------------------------
// Storage adapters
// ---------------------------------------------------------
const has = {
  getUserByEmail: typeof (storage as any)?.getUserByEmail === "function",
  createUser: typeof (storage as any)?.createUser === "function",
  updateUser: typeof (storage as any)?.updateUser === "function",
  getUser: typeof (storage as any)?.getUser === "function",
};

// Dev fallback user store
type DevUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "coordinator" | "clinician";
  passwordHash: string;
};
const devUsers = new Map<string, DevUser>();

function randomId() {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  );
}

async function adapterGetUserByEmail(email: string) {
  if (has.getUserByEmail) {
    return (storage as any).getUserByEmail(email);
  }
  return devUsers.get(email) ?? null;
}

async function adapterCreateUser(input: {
  email: string;
  name: string;
  role: "admin" | "coordinator" | "clinician";
  passwordHash: string;
}) {
  if (has.createUser) {
    return (storage as any).createUser(input);
  }
  const id = randomId();
  const user: DevUser = { id, ...input };
  devUsers.set(user.email, user);
  return user;
}

// ---------------------------------------------------------
// Request types
// ---------------------------------------------------------
interface RefreshRequest extends Request {
  refreshUser?: {
    sub: string;
    email: string;
    role: string;
  };
}

// ---------------------------------------------------------
// Schemas
// ---------------------------------------------------------
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "coordinator", "clinician"]).optional().default("coordinator"),
});

// ---------------------------------------------------------
// Debug route
// ---------------------------------------------------------
router.get("/_debug", (_req, res) => {
  res.json({
    methods: Object.keys(storage ?? {}),
    has,
    devFallbackActive: !(has.getUserByEmail && has.createUser),
    nodeEnv: process.env.NODE_ENV,
    devUsersCount: devUsers.size,
  });
});

// ---------------------------------------------------------
// Register
// ---------------------------------------------------------
router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid input", errors: parsed.error.errors });
  }

  const { email, password, name, role } = parsed.data;

  try {
    const existing = await adapterGetUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await adapterCreateUser({ email, name, role, passwordHash });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = generateTokens(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const csrfToken =
      typeof (req as any).csrfToken === "function"
        ? (req as any).csrfToken()
        : undefined;

    return res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: (user as any).firstName ?? name,
      lastName: (user as any).lastName ?? null,
      role: user.role,
      token: accessToken,
      csrfToken,
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(500).json({
      message: "Internal server error",
      ...(process.env.NODE_ENV !== "production" && {
        detail: error?.message,
        stack: error?.stack,
      }),
    });
  }
});

// ---------------------------------------------------------
// Login (with demo credentials support)
// ---------------------------------------------------------
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Invalid input", errors: parsed.error.errors });
  }

  const { email, password } = parsed.data;

  try {
    // 1️⃣ DEMO LOGIN BYPASS
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const payload = { sub: DEMO_USER_ID, email: DEMO_EMAIL, role: "coordinator" };
      const { accessToken, refreshToken } = generateTokens(payload);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const csrfToken =
        typeof (req as any).csrfToken === "function"
          ? (req as any).csrfToken()
          : undefined;

      return res.json({
        id: DEMO_USER_ID,
        email: DEMO_EMAIL,
        firstName: "Demo",
        lastName: "User",
        role: "coordinator",
        token: accessToken,
        csrfToken,
      });
    }

    // 2️⃣ Normal login
    const user = await adapterGetUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.passwordHash || typeof user.passwordHash !== "string") {
      console.warn(`User ${email} missing passwordHash`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = generateTokens(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const csrfToken =
      typeof (req as any).csrfToken === "function"
        ? (req as any).csrfToken()
        : undefined;

    return res.json({
      id: user.id,
      email: user.email,
      firstName: (user as any).firstName ?? null,
      lastName: (user as any).lastName ?? null,
      role: user.role,
      token: accessToken,
      csrfToken,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
      ...(process.env.NODE_ENV !== "production" && {
        detail: error?.message,
        stack: error?.stack,
      }),
    });
  }
});

// ---------------------------------------------------------
// Refresh
// ---------------------------------------------------------
// ✅ Correct order: path string first, then limiter, then middleware, then handler
router.post(
  "/refresh",
  refreshLimiter,
  authenticateRefreshToken,
  async (req: RefreshRequest, res: Response) => {
    try {
      if (!req.refreshUser) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const { sub, email, role } = req.refreshUser;
      const { accessToken } = generateTokens({ sub, email, role });

      const csrfToken =
        typeof (req as any).csrfToken === "function"
          ? (req as any).csrfToken()
          : undefined;

      return res.json({ accessToken, csrfToken });
    } catch (error: any) {
      console.error("Token refresh error:", error);
      return res.status(500).json({
        message: "Internal server error",
        ...(process.env.NODE_ENV !== "production" && {
          detail: error?.message,
          stack: error?.stack,
        }),
      });
    }
  }
);

// ---------------------------------------------------------
// Logout
// ---------------------------------------------------------
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
  });

  const csrfToken =
    typeof (req as any).csrfToken === "function"
      ? (req as any).csrfToken()
      : undefined;

  return res.json({ message: "Logged out successfully", csrfToken });
});

// ---------------------------------------------------------
// Dev-only: seed demo user in memory
// ---------------------------------------------------------
router.post("/_seed-demo", async (_req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Forbidden in production" });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  devUsers.set(DEMO_EMAIL, {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    name: "Demo User",
    role: "coordinator",
    passwordHash,
  });

  return res.json({ message: "Demo user created" });
});

export default router;
