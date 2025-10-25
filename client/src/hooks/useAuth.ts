// client/hooks/useAuth.ts
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
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as User) : null;

      if (!parsed?.token) return null;

      try {
        const userData = await api<User | null>("/auth/user", {
          headers: {
            Authorization: `Bearer ${parsed.token}`,
          },
        });

        if (!userData) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        const userWithToken: User = {
          ...userData,
          token: parsed.token,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithToken));
        queryClient.setQueryData(AUTH_QUERY_KEY, userWithToken);

        return userWithToken;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    },
    retry: false,
  });

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const { csrfToken } = await api<CsrfResponse>("/csrf-token");

      if (!csrfToken) throw new Error("Missing CSRF token");

      const userData = await api<User>("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!userData?.token) throw new Error("Invalid login response");

      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      queryClient.setQueryData(AUTH_QUERY_KEY, userData);
      return userData;
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      const { csrfToken } = await api<CsrfResponse>("/csrf-token");

      await api("/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
      });
    } catch (err) {
      console.warn("[useAuth] logout error:", err);
    }

    localStorage.removeItem(STORAGE_KEY);
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    window.location.assign("/");
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
