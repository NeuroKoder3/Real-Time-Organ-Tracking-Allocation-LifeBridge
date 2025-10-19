const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "https://api.lifebridge.online/api";

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

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // ✅ Required for CSRF cookie
  };

  const fullUrl = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (import.meta.env.DEV) {
    console.log("📡 [API] Fetching:", fullUrl, fetchOptions);
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, fetchOptions);
  } catch (err) {
    console.error("🚨 [API] Network error:", err);
    throw new Error("Network error: Unable to reach backend server.");
  }

  if (response.status === 401) {
    console.warn("[API] 401 Unauthorized");
    throw new Error("Unauthorized");
  }

  if (response.status === 204 || response.status === 304) {
    return {} as T;
  }

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const text = await response.text();
      if (text) msg = text;
    } catch {
      // ignore
    }
    console.error(`❌ [API] Error ${response.status}: ${msg}`);
    throw new Error(msg);
  }

  const data = await safeJsonParse<T>(response);
  return data ?? ({} as T);
}

export default api;
