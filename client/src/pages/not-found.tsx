import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            The page you’re looking for doesn’t exist or may have been moved.
          </p>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => navigate("/dashboard")}
              data-testid="button-go-dashboard"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              data-testid="button-go-login"
            >
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
