import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api"; // ✅ Make sure this points to your actual api.ts file

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  token?: string;
}

const STORAGE_KEY = "lifebridge_user";

export function useAuth() {
  const queryClient = useQueryClient();

  // ✅ Fetch current user session
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        return await api<User | null>("/api/auth/user");
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
        const { csrfToken } = await api<{ csrfToken: string }>("/api/csrf-token");

        // Login
        const data: User = await api<User>("/api/auth/login", {
          method: "POST",
          headers: { "X-CSRF-Token": csrfToken },
          body: JSON.stringify({ email, password }),
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        queryClient.setQueryData(["/api/auth/user"], data);

        return data;
      } catch (err) {
        console.error("Login error:", err);
        throw err;
      }
    },
    [queryClient]
  );

  // ✅ Logout
  const logout = useCallback(async () => {
    try {
      const { csrfToken } = await api<{ csrfToken: string }>("/api/csrf-token");

      await api("/api/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
      });
    } catch (err) {
      console.warn("Logout error:", err);
    }

    localStorage.removeItem(STORAGE_KEY);
    queryClient.setQueryData(["/api/auth/user"], null);
    window.location.href = "/";
  }, [queryClient]);

  // ✅ Fallback to localStorage if needed
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

export default useAuth;
