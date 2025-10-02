import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import queryClient from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Organs from "@/pages/Organs";
import Recipients from "@/pages/Recipients";
import Allocations from "@/pages/Allocations";
import Transport from "@/pages/Transport";

// ✅ Authenticated Layout
function AuthenticatedLayout() {
  const { user } = useAuth();

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
                onClick={() => {
                  window.location.href = "/api/logout";
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
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

// ✅ Router with Loading Guard
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="lifebridge-ui-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
