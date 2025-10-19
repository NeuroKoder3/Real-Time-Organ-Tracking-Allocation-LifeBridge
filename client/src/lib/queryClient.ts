import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * 🛡️ Utility — throw if response not OK, with readable message
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * ⚙️ Generic Query Function Factory
 * Automatically prefixes your backend API base URL
 * and handles unauthorized responses gracefully.
 */
export function getQueryFn<T = unknown>({
  on401,
}: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    const path = queryKey[0] as string;

    // ✅ Respect production / development base URL
    const BASE_URL =
      import.meta.env.MODE === "development"
        ? import.meta.env.VITE_API_URL

        : import.meta.env.VITE_API_URL?.trim() || "";

    const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);

    return (await res.json()) as T;
  };
}

/**
 * ✅ Shared React Query Client Instance
 * Centralized across all hooks, ensuring caching and consistency.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 min (good balance for production)
      retry: 1, // retry once before error
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;
