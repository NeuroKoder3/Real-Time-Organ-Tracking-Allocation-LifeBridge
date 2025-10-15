// src/components/settings/AvatarUploader.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AvatarUploader() {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    if (!avatar) return;
    // 🔗 Replace with actual upload logic (FormData → API)
    console.log("Uploading avatar", avatar.name);
  };

  return (
    <div className="space-y-4">
      {preview && (
        <img src={preview} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover" />
      )}
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <Button onClick={handleUpload}>Upload</Button>
    </div>
  );
}
