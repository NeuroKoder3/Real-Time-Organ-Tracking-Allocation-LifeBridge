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
    credentials: "include", // Ensures cookies (CSRF/session) are sent
  };

  // ✅ Try sending the request
  let response: Response;
  try {
    const fullUrl = `${BASE_URL}${path}`;
    if (import.meta.env.DEV) {
      console.log(`📡 [API] Requesting: ${fullUrl}`);
    }
    response = await fetch(fullUrl, fetchOptions);
  } catch (err) {
    console.error("🚨 [API] Network error or backend not reachable:", err);
    throw new Error("Network error: Unable to reach backend server.");
  }

  // 🔒 Handle unauthorized
  if (response.status === 401) {
    console.warn("[API] Unauthorized — clearing session and redirecting.");
    localStorage.removeItem("lifebridge_user");
    window.location.href = "/";
    throw new Error("Unauthorized: Please sign in again.");
  }

  // ✅ Handle no content or not modified
  if (response.status === 204 || response.status === 304) {
    if (import.meta.env.DEV) {
      console.info(`ℹ️ [API] ${response.status} No content / Not modified: ${path}`);
    }
    return {} as T;
  }

  // ❌ Handle error responses
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorText = await response.text();
      if (errorText) message = errorText;
    } catch (err) {
      console.warn("⚠️ Could not read error message:", err);
    }

    console.error(`❌ [API] Request failed (${response.status}): ${message}`);
    throw new Error(message);
  }

  // ✅ Attempt JSON parsing safely
  const data = await safeJsonParse<T>(response);
  if (data === null) {
    if (import.meta.env.DEV) {
      console.warn("⚠️ [API] Empty or invalid JSON response from:", path);
    }
    return {} as T;
  }

  return data;
}

export default api;
