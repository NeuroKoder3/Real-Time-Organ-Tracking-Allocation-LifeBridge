export async function fetchWithCsrf(path: string, options: RequestInit = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "https://api.lifebridge.online/api";

  const csrfRes = await fetch(`${baseUrl}/csrf-token`, {
    credentials: "include",
  });

  if (!csrfRes.ok) {
    throw new Error("Failed to fetch CSRF token");
  }

  const { csrfToken } = await csrfRes.json();

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body &&
    !(options.body instanceof FormData) &&
    !("Content-Type" in (options.headers || {}))
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers ?? {}),
    "X-CSRF-Token": csrfToken,
  };

  const finalOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  const fullUrl = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(fullUrl, finalOptions);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `HTTP error ${response.status}`);
  }

  return response.json();
}
