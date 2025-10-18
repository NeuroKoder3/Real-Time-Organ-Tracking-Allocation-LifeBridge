// src/pages/Messages.tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const dummyData = {
  opos: ["OneLegacy", "Gift of Life", "LifeCenter Northwest"],
  coordinators: ["Jane Doe", "John Smith", "Emily Brown"],
  hospitals: ["UCLA Medical", "Cleveland Clinic", "Mount Sinai"],
  hospitalStaff: ["Charge Nurse", "Transplant Coordinator", "ICU Lead"],
  surgeons: ["Dr. House", "Dr. Strange", "Dr. Bailey"],
  couriers: ["LifeFlight", "QuickTrans", "MediRunner"],
};

export default function Messages() {
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("OPO");

  const handleSend = () => {
    // TODO: Hook this into your messaging API
    alert(`Message sent to ${recipient}: ${message}`);
    setMessage("");
    setRecipient("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Secure Messages</h1>

      {/* Compose Section */}
      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>OPO</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select OPO" />
                </SelectTrigger>
                <SelectContent>
                  {dummyData.opos.map((opo) => (
                    <SelectItem key={opo} value={opo}>
                      {opo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Coordinator</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Coordinator" />
                </SelectTrigger>
                <SelectContent>
                  {dummyData.coordinators.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hospital</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Hospital" />
                </SelectTrigger>
                <SelectContent>
                  {dummyData.hospitals.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hospital Staff</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Hospital Staff" />
                </SelectTrigger>
                <SelectContent>
                  {dummyData.hospitalStaff.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Surgeon</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Surgeon" />
                </SelectTrigger>
                <SelectContent>
                  {dummyData.surgeons.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Courier</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Courier" />
                </SelectTrigger>
                <SelectContent>
                  {dummyData.couriers.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input
            placeholder="Recipient Email or Team Name"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <Input
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={handleSend}>Send Message</Button>
        </CardContent>
      </Card>

      {/* Inbox Section */}
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-x-2">
            {["OPO", "Hospital Staff", "Surgeons", "Couriers"].map((folder) => (
              <Button
                key={folder}
                variant={selectedFolder === folder ? "default" : "outline"}
                onClick={() => setSelectedFolder(folder)}
              >
                {folder}
              </Button>
            ))}
          </div>
          <div>
            <p className="text-muted-foreground">Viewing messages from: {selectedFolder}</p>
            <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
              <li>No messages in this folder yet.</li>
              {/* TODO: Render actual message data per folder */}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
