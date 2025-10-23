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
const AUTH_QUERY_KEY = ["/auth/user"];

export function useAuth() {
  const queryClient = useQueryClient();

  // Fetch user if token exists
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? (JSON.parse(stored) as User) : null;

        // Prevent calling the API when no token is found
        if (!parsed?.token) {
          return null;
        }

        // Verify user with server
        const userData = await api<User | null>("/auth/user", {
          headers: {
            Authorization: `Bearer ${parsed.token}`,
          },
        });

        // If server invalidates token, clear stored user
        if (!userData) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        return userData;
      } catch (err) {
        console.warn("[useAuth] fetch user failed:", err);
        return null;
      }
    },
    retry: false,
  });

  /**
   * Handles user login flow.
   * Fetches CSRF token, authenticates, and saves user info.
   */
  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      // Fetch CSRF token for login
      const csrfRes = await api<CsrfResponse>("/csrf-token");
      const csrfToken = csrfRes?.csrfToken;
      if (!csrfToken?.trim()) {
        throw new Error("CSRF token missing");
      }

      // Authenticate
      const userData = await api<User>("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!userData?.id || !userData?.email || !userData?.token) {
        throw new Error("Invalid login response");
      }

      // Store user and token locally
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      // Update cached user in React Query
      queryClient.setQueryData(AUTH_QUERY_KEY, userData);

      return userData;
    },
    [queryClient]
  );

  /**
   * Logs the user out and clears all auth state.
   */
  const logout = useCallback(async () => {
    try {
      const csrfRes = await api<CsrfResponse>("/csrf-token");
      const csrfToken = csrfRes?.csrfToken;

      if (csrfToken) {
        await api("/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
        });
      }
    } catch (err) {
      console.warn("[useAuth] logout error:", err);
    }

    // Clear storage and cache
    localStorage.removeItem(STORAGE_KEY);
    queryClient.setQueryData(AUTH_QUERY_KEY, null);

    // Redirect to home or login
    if (window.location.pathname !== "/") {
      window.location.assign("/");
    }
  }, [queryClient]);

  /**
   * Rehydrate user from localStorage if not yet loaded.
   */
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User;
          if (parsed?.id && parsed?.email) {
            queryClient.setQueryData(AUTH_QUERY_KEY, parsed);
          }
        } catch (err) {
          console.warn("[useAuth] parse stored user failed:", err);
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
