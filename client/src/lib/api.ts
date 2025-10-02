/**
 * A typed API fetch wrapper with automatic JWT handling
 * and error management.
 */

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : import.meta.env.VITE_API_URL?.trim() || "";

// Debug: Log the resolved base URL at runtime
console.log("🧪 BASE_URL at runtime:", BASE_URL);

if (!BASE_URL) {
  console.error(
    "[API] ❌ VITE_API_URL is not defined. API calls will fail in production!"
  );
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
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Handle invalid/expired token
      localStorage.removeItem("lifebridge_user");
      window.location.href = "/";
      throw new Error("Unauthorized — please log in again.");
    }

    if (res.status === 304) {
      // Optional: handle 304 responses if your app expects caching behavior
      console.warn(`ℹ️ API response 304 - Not Modified: ${path}`);
      return {} as T;
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ API Error:", res.status, text);
      throw new Error(`API error ${res.status}: ${text}`);
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error("❌ Network or runtime error in API call:", error);
    throw error;
  }
}

// auto-fix: provide default export for compatibility with default imports
export default api;
