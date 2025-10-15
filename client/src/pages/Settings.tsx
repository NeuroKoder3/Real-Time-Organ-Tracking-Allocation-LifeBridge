// src/pages/Settings.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import ProfileForm from "@/components/settings/ProfileForm";
import ChangePassword from "@/components/settings/ChangePassword";
import AvatarUploader from "@/components/settings/AvatarUploader";
import LogoutAllButton from "@/components/settings/LogoutAllButton";


export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Settings</h1>

      {/* 🔧 Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      {/* 🖼 Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUploader />
        </CardContent>
      </Card>

      {/* 🔒 Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePassword />
        </CardContent>
      </Card>

      {/* 🚪 Logout Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Log Out of All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoutAllButton />
        </CardContent>
      </Card>

      {/* ⚙️ Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Enable Notifications</span>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span>Auto-Refresh Dashboard</span>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
