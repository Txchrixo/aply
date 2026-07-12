"use client";
/**
 * Login page - email + password.
 * Redirects to /dashboard on success.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Icon } from "@/components/aply/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (data.token) {
        try {
          localStorage.setItem("aply_token", data.token);
          localStorage.setItem("aply_email", data.user?.email || email);
        } catch {
          /* ignore storage errors */
        }
      }
      toast.success("Welcome back!");
      // Resume incomplete onboarding instead of skipping to a seeded dashboard
      try {
        const ob = await fetch("/api/onboarding").then((r) => r.json());
        if (!ob.completed) {
          router.push("/onboarding");
          return;
        }
      } catch {
        /* fall through to dashboard */
      }
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-heading text-2xl font-semibold text-foreground">
          Aply
        </Link>

        <h1 className="mt-8 font-heading text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to your Aply dashboard</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="touch-target bg-card shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="touch-target bg-card shadow-none"
            />
          </div>
            <Button type="submit" disabled={loading} className="touch-target w-full">
            {loading ? <Icon name="sync" size={16} className="animate-spin" /> : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
