// src/App.tsx
/* -------------------------------------------------------------------------- */
/* IMPORTANT (server-side): Add this Express CORS middleware to your backend. */
/*                                                                          */
/* In your server's entry (e.g. server/app.ts or server/index.ts) add:      */
/*                                                                          */
/* import express from "express";                                           */
/* import cors from "cors";                                                 */
/* import dotenv from "dotenv";                                             */
/* dotenv.config();                                                         */
/*                                                                          */
/* const app = express();                                                   */
/*                                                                          */
/* const allowedOrigins = [                                                 */
/*   "https://lifebridge-opotracking.netlify.app", // update to your frontend */
/*   "https://lifebridge.online",                    // domain you use      */
/* ];                                                                       */
/*                                                                          */
/* const corsOptions = {                                                    */
/*   origin: (origin, callback) => {                                        */
/*     // allow non-browser requests (curl, mobile) when origin is undefined */
/*     if (!origin) return callback(null, true);                            */
/*     if (allowedOrigins.includes(origin)) return callback(null, true);    */
/*     return callback(new Error("CORS not allowed by server"), false);     */
/*   },                                                                     */
/*   credentials: true, // allow cookies to be sent/received                 */
/*   methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],              */
/*   allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "Accept"], */
/*   preflightContinue: false,                                               */
/*   optionsSuccessStatus: 204,                                              */
/* };                                                                        */
/*                                                                          */
/* app.use(cors(corsOptions));                                               */
/* app.options("*", cors(corsOptions)); // handle preflight                   */
/*                                                                          */
/* // rest of server setup...                                                */
/*                                                                          */
/* This must be applied server-side. After this, browser preflight requests */
/* should receive Access-Control-Allow-Origin and related headers.          */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* ApiContext + apiFetch helper                                                */
/* -------------------------------------------------------------------------- */

/**
 * apiFetch: a small wrapper around fetch that:
 * - prefixes the base URL (import.meta.env.VITE_API_URL or '/api')
 * - sets credentials: 'include' so cookies (and CSRF cookies) are sent
 * - sets Content-Type and Accept headers for JSON
 * - parses JSON and throws on HTTP errors
 *
 * Use via the useApi() hook exported below:
 * const api = useApi();
 * const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ ... }) });
 */

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
  // Normalize slashes
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

    // Default headers for JSON, preserve user-supplied headers
    const headers: Record<string, string> = {
      "Accept": "application/json",
      // only set content-type if body present and not FormData
      ...(fetchOpts.body && !(fetchOpts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(fetchOpts.headers ? (fetchOpts.headers as Record<string, string>) : {}),
    };

    const res = await fetch(url, {
      credentials: "include", // important for cookie-based auth / CSRF
      ...fetchOpts,
      headers,
    });

    const contentType = res.headers.get("content-type") || "";
    // try to parse JSON when possible
    const isJson = contentType.includes("application/json");
    const text = isJson ? await res.text() : await res.text();

    if (!res.ok) {
      // Attempt to parse JSON error body if available
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

    // Return parsed JSON if JSON, otherwise raw text
    try {
      return isJson && text ? JSON.parse(text) : text;
    } catch {
      return text;
    }
  };
}

/* -------------------------------------------------------------------------- */
/*                                  Layouts                                    */
/* -------------------------------------------------------------------------- */

// ✅ Authenticated Layout
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

// ✅ Router with Auth Guard + Loading State
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
          <Route
            path="tracking"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold">Live Tracking - Coming Soon</h1>
              </div>
            }
          />
          <Route
            path="messages"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold">Messages - Coming Soon</h1>
              </div>
            }
          />
          <Route
            path="reports"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold">Reports - Coming Soon</h1>
              </div>
            }
          />
          <Route
            path="settings"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold">Settings - Coming Soon</h1>
              </div>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      )}
    </Routes>
  );
}

// ✅ App Root
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
