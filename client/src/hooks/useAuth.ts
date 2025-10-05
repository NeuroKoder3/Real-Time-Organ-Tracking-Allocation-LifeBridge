import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  token?: string;
}

const STORAGE_KEY = "lifebridge_user";
const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * useAuth()
 * Centralized authentication + session hook
 * - Uses HTTP-only cookies (CSRF-protected)
 * - Syncs session with backend & localStorage fallback
 * - Works with Netlify/Vercel production environments
 */
export function useAuth() {
  const queryClient = useQueryClient();

  // ✅ Fetch current user session
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/user`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        return res.json();
      } catch (err) {
        console.warn("Auth fetch failed:", err);
        return null;
      }
    },
    retry: false,
  });

  // ✅ Secure login with CSRF protection
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        // Get CSRF token first
        const csrfRes = await fetch(`${API_BASE}/api/csrf-token`, {
          credentials: "include",
        });
        if (!csrfRes.ok) throw new Error("Failed to fetch CSRF token");
        const { csrfToken } = await csrfRes.json();

        // Login
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Login failed: ${errText}`);
        }

        const data: User = await res.json();

        // Persist in localStorage for client session continuity
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // Sync with React Query cache
        queryClient.setQueryData(["/api/auth/user"], data);

        return data;
      } catch (err) {
        console.error("Login error:", err);
        throw err;
      }
    },
    [queryClient]
  );

  // ✅ Logout securely (CSRF + cookie clear)
  const logout = useCallback(async () => {
    try {
      const csrfRes = await fetch(`${API_BASE}/api/csrf-token`, {
        credentials: "include",
      });
      const { csrfToken } = await csrfRes.json();

      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });
    } catch (err) {
      console.warn("Logout error:", err);
    }

    // Cleanup local + client cache
    localStorage.removeItem(STORAGE_KEY);
    queryClient.setQueryData(["/api/auth/user"], null);

    // Redirect to landing or login
    window.location.href = "/";
  }, [queryClient]);

  // ✅ Rehydrate user from localStorage if server session missing
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          queryClient.setQueryData(["/api/auth/user"], parsed);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [user, queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

// ✅ Default export for backwards compatibility
export default useAuth;
