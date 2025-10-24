import React, { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Users,
  BarChart3,
  CheckCircle,
  Plane,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import lifebridgeLogo from "@/assets/lifebridge-logo.jpg";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const DEMO_EMAIL = "admin@lifebridge.dev";
const DEMO_PASSWORD = "SuperSecure123!";

export default function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const features: Feature[] = [
    {
      icon: Users,
      title: "Intelligent Recipient Matching",
      description:
        "AI-powered recipient ranking based on medical compatibility, geography, and UNOS policies.",
    },
    {
      icon: Plane,
      title: "Transportation Management",
      description:
        "Multi-modal transport coordination with real-time tracking, route optimization, and backup planning.",
    },
    {
      icon: MessageSquare,
      title: "Secure Communication",
      description:
        "HIPAA-compliant messaging for surgeons, coordinators, and transport teams with audit trail.",
    },
    {
      icon: MapPin,
      title: "GPS Chain of Custody",
      description:
        "Real-time GPS tracking with temperature monitoring and custody verification from pickup to transplant.",
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description:
        "AI-driven forecasting, success probability modeling, and resource optimization for better outcomes.",
    },
  ];

  const benefits: string[] = [
    "Reduce 28,000+ annual organ discards",
    "Save hundreds of additional lives yearly",
    "50% reduction in coordination time",
    "Eliminate transport delays",
    "Improve transplant success rates",
    "End-to-end transparency for all teams",
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      navigate("/"); // Redirect to root
    } catch {
      setError("Login failed. Please check your credentials or backend.");
      toast({
        title: "Authentication Failed",
        description: "Please verify your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
    setLoading(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      toast({
        title: "Demo Login Successful",
        description: "Welcome to the LifeBridge demo dashboard.",
      });
      navigate("/");
    } catch {
      setError("Demo login unavailable. Check backend API connection.");
      toast({
        title: "Demo Login Failed",
        description: "Ensure demo credentials exist on the server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img
              src={lifebridgeLogo}
              alt="LifeBridge Logo"
              className="h-10 w-auto object-contain"
            />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center flex-1" aria-labelledby="hero-title">
        <div className="max-w-3xl mx-auto space-y-6">
          <Badge variant="outline" className="mb-4">
            Organ Transplant Coordination Platform
          </Badge>
          <h1 id="hero-title" className="text-5xl font-bold tracking-tight">
            Real-Time Organ Tracking
            <span className="text-primary block">& Allocation Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform fragmented organ coordination into a secure,
            data-driven ecosystem that maximizes every donation’s potential.
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-12 max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="off"
                />
                {error && (
                  <p className="text-red-600 text-sm text-center">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  aria-label="Sign In Button"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  aria-label="Demo Login Button"
                  data-testid="button-demo-login"
                >
                  🚀 Demo Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16" aria-labelledby="features-title">
        <div className="text-center mb-12">
          <h2 id="features-title" className="text-3xl font-bold mb-4">Core Platform Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Empowering OPOs, transplant centers, and transport teams with
            cutting-edge coordination and analytics tools.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-16" aria-labelledby="benefits-title">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="benefits-title" className="text-3xl font-bold mb-8">Expected Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <p>
            © {new Date().getFullYear()} LifeBridge — Real-time organ tracking
            and allocation platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
