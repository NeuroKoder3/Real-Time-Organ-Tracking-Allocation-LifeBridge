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

export function useAuth() {
  const queryClient = useQueryClient();

  // ✅ Fetch user session from server
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include", // send cookies
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  // ✅ Login with CSRF + store token
  const login = useCallback(
    async (email: string, password: string) => {
      // 1. Get CSRF token
      const csrfRes = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      if (!csrfRes.ok) throw new Error("Failed to fetch CSRF token");
      const { csrfToken } = await csrfRes.json();

      // 2. Send login request
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data: User = await res.json();

      // ✅ Save user + JWT to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // ✅ Update cache immediately
      queryClient.setQueryData(["/api/auth/user"], data);

      return data;
    },
    [queryClient]
  );

  // ✅ Logout with CSRF + clear session
  const logout = useCallback(async () => {
    try {
      const csrfRes = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const { csrfToken } = await csrfRes.json();

      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });
    } catch {
      // ignore
    }

    localStorage.removeItem(STORAGE_KEY);
    queryClient.setQueryData(["/api/auth/user"], null);
    window.location.href = "/";
  }, [queryClient]);

  // ✅ Load stored user on first mount
  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        queryClient.setQueryData(["/api/auth/user"], JSON.parse(storedUser));
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
