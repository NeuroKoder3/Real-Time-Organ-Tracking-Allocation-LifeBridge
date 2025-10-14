// src/pages/Messages.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Messages() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Secure Messages</h1>
      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Recipient Email or Team Name" />
          <Input placeholder="Message" />
          <Button>Send Message</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Inbox (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Message history will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
