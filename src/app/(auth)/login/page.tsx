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
      // Demo: accept any email/password, redirect to dashboard
      await new Promise((r) => setTimeout(r, 500));
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Icon name="rocket" size={24} className="text-primary" />
            <span className="font-heading text-xl font-semibold">Aply</span>
          </Link>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/40 sm:p-8">
          <h1 className="font-heading text-2xl font-semibold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log in to your Aply dashboard</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="touch-target"
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
                className="touch-target"
              />
            </div>
            <Button type="submit" disabled={loading} className="touch-target w-full">
              {loading ? <Icon name="sync" size={16} className="animate-spin" /> : "Log in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Local-first · Your data stays on your machine
        </p>
      </div>
    </div>
  );
}
