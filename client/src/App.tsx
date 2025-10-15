import React, { createContext, useContext, ReactNode } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import queryClient from "@/lib/queryClient";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Organs from "@/pages/Organs";
import Recipients from "@/pages/Recipients";
import Allocations from "@/pages/Allocations";
import Transport from "@/pages/Transport";
import TrackingPage from "@/pages/Tracking"; // ✅ Correctly imported

import Messages from "@/pages/Messages";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

type ApiOptions = RequestInit & { query?: Record<string, string | number | boolean> };

const ApiContext = createContext<(path: string, opts?: ApiOptions) => Promise<any>>(
  async () => {
    throw new Error("ApiProvider not mounted");
  }
);

export function useApi() {
  return useContext(ApiContext);
}

function buildUrl(base: string, path: string, query?: Record<string, string | number | boolean>) {
  const baseNorm = base.replace(/\/+$/, "");
  const pathNorm = path.startsWith("/") ? path : `/${path}`;
  let url = `${baseNorm}${pathNorm}`;
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      params.set(k, String(v));
    }
    url += `?${params.toString()}`;
  }
  return url;
}

const DEFAULT_API_BASE = (import.meta as any).env?.VITE_API_URL || "/api";

function createApiFetch(baseUrl: string) {
  return async (path: string, opts: ApiOptions = {}) => {
    const { query, ...fetchOpts } = opts;
    const url = buildUrl(baseUrl, path, query);

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(fetchOpts.body && !(fetchOpts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(fetchOpts.headers ? (fetchOpts.headers as Record<string, string>) : {}),
    };

    const res = await fetch(url, {
      credentials: "include",
      ...fetchOpts,
      headers,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const text = await res.text();

    if (!res.ok) {
      let parsed: any = undefined;
      try {
        parsed = isJson && text ? JSON.parse(text) : text;
      } catch {
        parsed = text;
      }
      const err: any = new Error(`API request failed: ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.body = parsed;
      throw err;
    }

    try {
      return isJson && text ? JSON.parse(text) : text;
    } catch {
      return text;
    }
  };
}

function AuthenticatedLayout() {
  const { user, logout } = useAuth();

  const style: React.CSSProperties = {
    ["--sidebar-width" as any]: "16rem",
    ["--sidebar-width-icon" as any]: "3rem",
  };

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h2 className="text-lg font-semibold">LifeBridge Platform</h2>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.firstName || user?.email || "User"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
                aria-label="Logout"
              >
                Sign Out
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold">Loading...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<NotFound />} />
        </>
      ) : (
        <Route path="/*" element={<AuthenticatedLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="organs" element={<Organs />} />
          <Route path="recipients" element={<Recipients />} />
          <Route path="allocations" element={<Allocations />} />
          <Route path="transport" element={<Transport />} />
          <Route path="tracking" element={<TrackingPage />} /> {/* ✅ Correct component */}
          <Route path="messages" element={<Messages />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      )}
    </Routes>
  );
}

function App() {
  const apiBase = (import.meta as any).env?.VITE_API_URL || DEFAULT_API_BASE;
  const apiFetch = createApiFetch(apiBase);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={apiFetch}>
        <ThemeProvider defaultTheme="light" storageKey="lifebridge-ui-theme">
          <TooltipProvider>
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <p>Loading LifeBridge...</p>
                </div>
              }
            >
              <Router />
            </React.Suspense>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </ApiContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
