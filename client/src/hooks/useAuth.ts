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

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const userData = await api<User | null>("/auth/user");
        return userData ?? null;
      } catch (err) {
        console.warn("[useAuth] fetch user failed:", err);
        return null;
      }
    },
    retry: false,
  });

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const csrfRes = await api<CsrfResponse>("/csrf-token");
      const csrfToken = csrfRes?.csrfToken;
      if (!csrfToken?.trim()) {
        throw new Error("CSRF token missing");
      }

      const userData = await api<User>("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!userData?.id || !userData?.email) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...userData, token: userData.token }));

      queryClient.setQueryData(AUTH_QUERY_KEY, userData);
      return userData;
    },
    [queryClient]
  );

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

    localStorage.removeItem(STORAGE_KEY);
    queryClient.setQueryData(AUTH_QUERY_KEY, null);

    if (window.location.pathname !== "/") {
      window.location.assign("/");
    }
  }, [queryClient]);

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
