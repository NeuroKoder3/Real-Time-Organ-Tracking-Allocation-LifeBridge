/**
 * 🌐 API Utility for LifeBridge
 * Handles authentication, JWT headers, CORS, and consistent error reporting.
 */

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000"; 
// ✅ Uses environment variable first, then falls back to localhost

// ✅ Log only in development
if (import.meta.env.DEV) {
  console.log("🧪 [API] BASE_URL:", BASE_URL);
}

/**
 * Helper to safely parse JSON (prevents crashes on malformed responses)
 */
async function safeJsonParse<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * API fetch wrapper
 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const userRaw = localStorage.getItem("lifebridge_user");
  const user = userRaw ? JSON.parse(userRaw) : {};
  const token = user?.token;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // ✅ Always include credentials for cookie/session authentication
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  try {
    const response = await fetch(`${BASE_URL}${path}`, fetchOptions);

    // 🔐 Handle expired session or unauthorized token
    if (response.status === 401) {
      console.warn("[API] Session expired — redirecting to login.");
      localStorage.removeItem("lifebridge_user");
      window.location.href = "/";
      throw new Error("Unauthorized: please sign in again.");
    }

    if (response.status === 204) {
      // No content
      return {} as T;
    }

    if (response.status === 304) {
      // Not Modified (e.g., caching scenario)
      if (import.meta.env.DEV)
        console.info(`ℹ️ [API] 304 Not Modified: ${path}`);
      return {} as T;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const message = errorText || `HTTP ${response.status}`;
      console.error(`❌ [API] Request failed (${response.status}): ${message}`);
      throw new Error(message);
    }

    const data = await safeJsonParse<T>(response);
    return (data ?? {}) as T;
  } catch (error) {
    console.error("🚨 [API] Network or runtime error:", error);
    throw error;
  }
}

export default api;
