import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center bg-muted/20 px-4"
      role="main"
      aria-label="404 Page Not Found"
    >
      <Card className="w-full max-w-md shadow-lg border border-border/40">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <CardTitle className="text-2xl font-bold">404 - Page Not Found</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            The page you’re looking for doesn’t exist or may have been moved.
          </p>
        </CardHeader>

        <CardContent>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Button
              onClick={() => navigate(-1)}
              data-testid="button-go-back"
              variant="secondary"
              aria-label="Go Back to Previous Page"
            >
              Go Back
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              data-testid="button-go-dashboard"
              aria-label="Go to Dashboard"
            >
              Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              data-testid="button-go-login"
              aria-label="Go to Login Page"
            >
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
