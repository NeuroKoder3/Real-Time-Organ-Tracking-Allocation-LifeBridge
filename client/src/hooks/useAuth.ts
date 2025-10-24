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

interface LoginResponse {
  user: Omit<User, "token">;
  token: string;
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

        if (!parsed?.token) {
          return null;
        }

        const userData = await api<User | null>("/auth/user", {
          headers: {
            Authorization: `Bearer ${parsed.token}`,
          },
        });

        if (!userData) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        return { ...userData, token: parsed.token }; // Preserve token
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

      // 👇 THIS IS THE FIX
      const res = await api<LoginResponse>("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res?.user || !res?.token) {
        throw new Error("Invalid login response");
      }

      const userWithToken: User = {
        ...res.user,
        token: res.token,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithToken));
      queryClient.setQueryData(AUTH_QUERY_KEY, userWithToken);

      return userWithToken;
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
