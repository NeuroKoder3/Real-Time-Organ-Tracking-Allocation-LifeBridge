// src/components/settings/ProfileForm.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function ProfileForm() {
  const [profile, setProfile] = useState({
    name: "Demo User",
    email: "admin@lifebridge.dev",
    title: "System Admin",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 🔗 Replace this with your API call
    console.log("Update profile ->", profile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input name="name" value={profile.name} onChange={handleChange} />
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" value={profile.email} onChange={handleChange} />
      </div>
      <div>
        <Label>Title</Label>
        <Input name="title" value={profile.title} onChange={handleChange} />
      </div>
      <Button type="submit">Save Changes</Button>
    </form>
  );
}
