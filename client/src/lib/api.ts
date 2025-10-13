/**
 * 🌐 API Utility for LifeBridge
 * Handles authentication, JWT headers, CORS, and consistent error reporting.
 */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:5000/api";
// ✅ Uses correct production base URL, falls back to localhost/api during dev

if (import.meta.env.DEV) {
  console.log("🧪 [API] BASE_URL:", BASE_URL);
}

/**
 * Safely parses JSON responses (avoids crashes on malformed or empty responses)
 */
async function safeJsonParse<T>(res: Response): Promise<T | null> {
  try {
    const contentType = res.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) return null;

    const text = await res.text();
    if (!text.trim()) return null;

    return JSON.parse(text) as T;
  } catch (err) {
    console.warn("⚠️ Failed to parse JSON response:", err);
    return null;
  }
}

/**
 * Main API request wrapper
 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token: string | undefined;

  // ✅ Safely read user token from localStorage
  try {
    const storedUser = localStorage.getItem("lifebridge_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      token = parsedUser?.token;
    }
  } catch (err) {
    console.warn("⚠️ Could not parse user data from localStorage:", err);
  }

  // ✅ Build headers cleanly
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // For session/cookie support (if used)
  };

  const fullUrl = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (import.meta.env.DEV) {
    console.log(`📡 [API] Requesting: ${fullUrl}`);
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, fetchOptions);
  } catch (err) {
    console.error("🚨 [API] Network error or backend not reachable:", err);
    throw new Error("Network error: Unable to reach backend server.");
  }

  // 🔒 Handle 401 (Unauthorized)
  if (response.status === 401) {
    console.warn("[API] Unauthorized — clearing session and redirecting.");
    localStorage.removeItem("lifebridge_user");
    window.location.href = "/";
    throw new Error("Unauthorized: Please sign in again.");
  }

  // 🧩 Handle no-content responses
  if (response.status === 204 || response.status === 304) {
    return {} as T;
  }

  // ❌ Handle HTTP errors
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorText = await response.text();
      if (errorText) message = errorText;
    } catch {
      /* ignore parsing errors */
    }

    console.error(`❌ [API] Request failed (${response.status}): ${message}`);
    throw new Error(message);
  }

  // ✅ Return parsed JSON
  const data = await safeJsonParse<T>(response);
  return data ?? ({} as T);
}

export default api;
