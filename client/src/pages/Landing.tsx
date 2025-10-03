import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Heart,
  MapPin,
  Users,
  BarChart3,
  CheckCircle,
  Plane,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

export default function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const features: Feature[] = [
    {
      icon: Heart,
      title: "Real-Time Organ Tracking",
      description:
        "Live organ inventory with viability countdown timers. Track hearts (4-6 hrs), kidneys (24-36 hrs), and all organ types with precision.",
    },
    {
      icon: Users,
      title: "Intelligent Recipient Matching",
      description:
        "AI-powered recipient ranking based on medical compatibility, geography, wait time, and UNOS allocation policies.",
    },
    {
      icon: Plane,
      title: "Transportation Management",
      description:
        "Multi-modal transport coordination with real-time tracking, route optimization, and automatic backup planning.",
    },
    {
      icon: MessageSquare,
      title: "Multi-Stakeholder Hub",
      description:
        "HIPAA-compliant unified messaging for surgeons, coordinators, and transport teams with video conferencing.",
    },
    {
      icon: MapPin,
      title: "GPS Chain of Custody",
      description:
        "Real-time GPS tracking with temperature monitoring and digital chain of custody from procurement to transplant.",
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description:
        "AI-driven demand forecasting, success probability modeling, and resource optimization for better outcomes.",
    },
  ];

  const benefits: string[] = [
    "Reduce the 28,000+ annual organ discards",
    "Save hundreds more lives annually",
    "50% reduction in coordination time",
    "Eliminate preventable transport delays",
    "Improve transplant success rates",
    "Real-time visibility for all stakeholders",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("demo@lifebridge.com");
    setPassword("password123");
    setError("");
    setLoading(true);
    try {
      await login("demo@lifebridge.com", "password123");
      navigate("/dashboard");
    } catch {
      setError("Demo login failed. Please check backend configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">LifeBridge</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center flex-1">
        <div className="max-w-3xl mx-auto space-y-6">
          <Badge variant="outline" className="mb-4">
            Organ Transplant Coordination Platform
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight">
            Real-Time Organ Tracking
            <span className="text-primary block">& Allocation Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform organ transplantation from fragmented phone calls into a
            coordinated, data-driven system that maximizes the life-saving
            potential of every donated organ.
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
                />
                <Input
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

                {/* Demo Login Button */}
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
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Core Platform Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive platform for OPOs, transplant centers, and transport
            teams to coordinate life-saving organ transplants with unprecedented
            efficiency.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Expected Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-left">
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
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>
            &copy; 2025 LifeBridge. Real-time organ tracking and allocation
            platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
