const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://real-time-organ-tracking-allocation.onrender.com/api";

if (import.meta.env.DEV) {
  console.log("🧪 [API] BASE_URL:", BASE_URL);
}

async function safeJsonParse<T>(res: Response): Promise<T | null> {
  try {
    const contentType = res.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) return null;

    const txt = await res.text();
    if (!txt.trim()) return null;

    return JSON.parse(txt) as T;
  } catch (err) {
    console.warn("⚠️ Failed to parse JSON:", err);
    return null;
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // 🔐 Grab token from localStorage
  let token: string | undefined;
  try {
    const stored = localStorage.getItem("lifebridge_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      token = parsed?.token;
    }
  } catch (err) {
    console.warn("⚠️ Could not parse stored user:", err);
  }

  // ✅ Build real Headers object (fixes Authorization not attaching)
  const headers = new Headers(options.headers || {});

  // 🔐 Set Authorization header if token exists
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // 🧠 Ensure JSON content type if applicable
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // needed for CSRF cookies
  };

  // 📡 Compose full URL
  const fullUrl = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (import.meta.env.DEV) {
    console.log("📡 [API] Fetching:", fullUrl);
    console.log("➡️ [API] Headers:", Array.from(headers.entries()));
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, fetchOptions);
  } catch (err) {
    console.error("🚨 [API] Network error:", err);
    throw new Error("Network error: Unable to reach backend server.");
  }

  // 🔐 Handle 401 Unauthorized
  if (response.status === 401) {
    console.warn("[API] 401 Unauthorized");
    throw new Error("Unauthorized");
  }

  // 🟡 Handle no-content responses
  if (response.status === 204 || response.status === 304) {
    return {} as T;
  }

  // 🔴 Handle other server errors
  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const text = await response.text();
      if (text) msg = text;
    } catch {
      // fallback message
    }
    console.error(`❌ [API] Error ${response.status}: ${msg}`);
    throw new Error(msg);
  }

  // ✅ Parse JSON safely
  const data = await safeJsonParse<T>(response);
  return data ?? ({} as T);
}

export default api;
