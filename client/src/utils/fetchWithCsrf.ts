// utils/fetchWithCsrf.ts
/**
 * Secure fetch helper that automatically handles:
 *  - CSRF token retrieval
 *  - JWT Authorization header
 *  - JSON response parsing & error handling
 *
 * Works seamlessly with protected backend endpoints
 * like /api/organs or /api/users.
 */

interface AuthUser {
  token?: string;
  csrfToken?: string;
}

/**
 * Retrieves the current user authentication data
 * from localStorage or session context.
 * You can adapt this depending on your auth flow.
 */
function getStoredAuth(): AuthUser | null {
  try {
    const stored = localStorage.getItem("lifebridge_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export async function fetchWithCsrf(path: string, options: RequestInit = {}) {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    "https://api.lifebridge.online/api";

  // 1️⃣ Retrieve CSRF token from backend
  const csrfRes = await fetch(`${baseUrl}/csrf-token`, {
    credentials: "include",
  });

  if (!csrfRes.ok) {
    throw new Error("Failed to fetch CSRF token");
  }

  const { csrfToken } = await csrfRes.json();

  // 2️⃣ Retrieve JWT token from local storage or auth context
  const user = getStoredAuth();
  const jwtToken = user?.token || "";

  // 3️⃣ Build request headers
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body &&
    !(options.body instanceof FormData) &&
    !("Content-Type" in (options.headers || {}))
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers ?? {}),
    "x-csrf-token": csrfToken,
    ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
  };

  // 4️⃣ Build final request options
  const finalOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // ensures cookies/session info are sent
  };

  const fullUrl = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  // 5️⃣ Make the request
  const response = await fetch(fullUrl, finalOptions);

  // 6️⃣ Handle API errors gracefully
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      message = errData.message || message;
    } catch {
      const errText = await response.text();
      message = errText || message;
    }
    throw new Error(message);
  }

  // 7️⃣ Return parsed JSON response
  try {
    return await response.json();
  } catch {
    return null;
  }
}
