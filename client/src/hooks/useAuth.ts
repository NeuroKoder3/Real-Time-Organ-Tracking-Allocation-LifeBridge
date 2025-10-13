import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  token?: string;
}

interface CsrfResponse {
  csrfToken: string;
}

const STORAGE_KEY = "lifebridge_user";
const AUTH_QUERY_KEY = ["/api/auth/user"];

export function useAuth() {
  const queryClient = useQueryClient();

  // ✅ Fetch current user session
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await api<User | null>("/api/auth/user");
        return response ?? null;
      } catch (err) {
        console.warn("⚠️ Auth fetch failed:", err);
        return null;
      }
    },
    retry: false,
  });

  // ✅ Secure login with CSRF protection
  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const csrfRes = await api<CsrfResponse>("/api/csrf-token");
      const csrfToken = csrfRes?.csrfToken;

      if (!csrfToken?.trim()) {
        throw new Error("CSRF token missing or invalid.");
      }

      const userData = await api<User>("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!userData?.id || !userData?.email) {
        throw new Error("Invalid user data returned from login.");
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      queryClient.setQueryData(AUTH_QUERY_KEY, userData);

      return userData;
    },
    [queryClient]
  );

  // ✅ Logout
  const logout = useCallback(async () => {
    try {
      const csrfRes = await api<CsrfResponse>("/api/csrf-token");
      const csrfToken = csrfRes?.csrfToken;

      if (csrfToken) {
        await api("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
        });
      }
    } catch (err) {
      console.warn("⚠️ Logout error:", err);
    }

    localStorage.removeItem(STORAGE_KEY);
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    window.location.assign("/"); // ✅ More robust than href redirect
  }, [queryClient]);

  // ✅ Restore user from localStorage if needed
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed: User = JSON.parse(stored);
          if (parsed?.id && parsed?.email) {
            queryClient.setQueryData(AUTH_QUERY_KEY, parsed);
          }
        } catch (err) {
          console.warn("⚠️ Failed to parse local user:", err);
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
