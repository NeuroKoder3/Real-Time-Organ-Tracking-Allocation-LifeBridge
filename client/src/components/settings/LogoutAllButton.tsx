// src/components/settings/LogoutAllButton.tsx
import { Button } from "@/components/ui/button";

export default function LogoutAllButton() {
  const handleLogoutAll = async () => {
    // 🔗 Replace with your API call to invalidate all sessions
    const confirmed = confirm("Are you sure you want to log out of all devices?");
    if (!confirmed) return;

    console.log("Logging out all sessions...");
    // await fetch("/api/auth/logout-all", { method: "POST" });
  };

  return (
    <Button variant="destructive" onClick={handleLogoutAll}>
      Log Out All Sessions
    </Button>
  );
}
