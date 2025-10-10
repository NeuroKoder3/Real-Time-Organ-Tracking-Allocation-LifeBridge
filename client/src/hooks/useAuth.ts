import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api"; // ✅ Ensure this correctly resolves to api.ts

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

export function useAuth() {
  const queryClient = useQueryClient();

  // ✅ Fetch current user session
  const { data: user, isLoading } = useQuery<User | null, Error, User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await api<User | null>("/api/auth/user");
        return response ?? null;
      } catch (err) {
        console.warn("Auth fetch failed:", err);
        return null;
      }
    },
    retry: false,
  });

  // ✅ Secure login with CSRF protection
  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      try {
        // Step 1: Get CSRF token
        const csrfRes = await api<CsrfResponse>("/api/csrf-token");
        const csrfToken = csrfRes?.csrfToken;

        if (typeof csrfToken !== "string" || !csrfToken.trim()) {
          throw new Error("CSRF token missing or invalid.");
        }

        // Step 2: Attempt login
        const userData = await api<User>("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({ email, password }),
        });

        if (!userData || !userData.id) {
          throw new Error("Invalid user data returned from login.");
        }

        // Step 3: Cache user in localStorage and React Query
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        queryClient.setQueryData(["/api/auth/user"], userData);

        return userData;
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
      const csrfRes = await api<CsrfResponse>("/api/csrf-token");
      const csrfToken = csrfRes?.csrfToken;

      if (typeof csrfToken === "string") {
        await api("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
        });
      }
    } catch (err) {
      console.warn("Logout error:", err);
    }

    localStorage.removeItem(STORAGE_KEY);
    queryClient.setQueryData(["/api/auth/user"], null);
    window.location.href = "/";
  }, [queryClient]);

  // ✅ Restore from localStorage if user is undefined
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed: User = JSON.parse(stored);
          if (parsed?.id && parsed?.email) {
            queryClient.setQueryData(["/api/auth/user"], parsed);
          }
        } catch (err) {
          console.warn("Failed to parse local user:", err);
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
