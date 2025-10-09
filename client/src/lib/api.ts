/**
 * 🌐 API Utility for LifeBridge
 * Handles authentication, JWT headers, CORS, and consistent error reporting.
 */

const BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";
// ✅ Uses env var if defined, falls back to localhost

if (import.meta.env.DEV) {
  console.log("🧪 [API] BASE_URL:", BASE_URL);
}

/**
 * Safely parses JSON to avoid crashes on empty/malformed responses
 */
async function safeJsonParse<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn("⚠️ Failed to parse JSON:", err);
    return null;
  }
}

/**
 * API request wrapper
 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token: string | undefined;

  try {
    const userRaw = localStorage.getItem("lifebridge_user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    token = user?.token;
  } catch (err) {
    console.warn("⚠️ Failed to read user token from localStorage:", err);
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Required for cookies/sessions
  };

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, fetchOptions);
  } catch (err) {
    console.error("🚨 [API] Network error or backend not reachable:", err);
    throw new Error("Network error: Unable to reach backend server.");
  }

  // 🔐 Handle unauthorized session
  if (response.status === 401) {
    console.warn("[API] Unauthorized — redirecting to login.");
    localStorage.removeItem("lifebridge_user");
    window.location.href = "/";
    throw new Error("Unauthorized: please sign in again.");
  }

  if (response.status === 204 || response.status === 304) {
    if (import.meta.env.DEV) {
      console.info(`ℹ️ [API] ${response.status} No content / Not modified: ${path}`);
    }
    return {} as T;
  }

  if (!response.ok) {
    const errorText = await response.text();
    const message = errorText || `HTTP ${response.status}`;
    console.error(`❌ [API] Request failed (${response.status}): ${message}`);
    throw new Error(message);
  }

  const data = await safeJsonParse<T>(response);
  if (data === null) {
    throw new Error("Invalid JSON response from API.");
  }

  return data;
}

export default api;
