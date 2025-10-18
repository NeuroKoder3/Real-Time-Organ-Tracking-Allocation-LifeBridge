import {
  Home,
  Heart,
  Users,
  Plane,
  MessageSquare,
  BarChart3,
  Settings,
  MapPin,
  Clock,
  TestTube, // ✅ New icon for Labs
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items for LifeBridge platform
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Organs",
    url: "/organs",
    icon: Heart,
  },
  {
    title: "Recipients",
    url: "/recipients",
    icon: Users,
  },
  {
    title: "Allocations",
    url: "/allocations",
    icon: Clock,
  },
  {
    title: "Transport",
    url: "/transport",
    icon: Plane,
  },
  {
    title: "Tracking",
    url: "/tracking",
    icon: MapPin,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Labs", // ✅ New Labs tab
    url: "/labs",
    icon: TestTube,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>LifeBridge Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

// auto-fix: provide default export for compatibility with default imports
export default AppSidebar;
