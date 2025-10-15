// src/components/settings/ChangePassword.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ChangePassword() {
  const [form, setForm] = useState({ current: "", new: "", confirm: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.new !== form.confirm) {
      alert("❌ Passwords do not match");
      return;
    }

    // 🔗 Replace this with API call
    console.log("Password change request ->", form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Current Password</Label>
        <Input type="password" name="current" value={form.current} onChange={handleChange} />
      </div>
      <div>
        <Label>New Password</Label>
        <Input type="password" name="new" value={form.new} onChange={handleChange} />
      </div>
      <div>
        <Label>Confirm New Password</Label>
        <Input type="password" name="confirm" value={form.confirm} onChange={handleChange} />
      </div>
      <Button type="submit">Change Password</Button>
    </form>
  );
}
