"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("demo.consumer@example.com");
  const [password, setPassword] = useState("budseeker-demo-2026");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Incorrect email or password.");
        return;
      }
      router.push(searchParams.get("callbackUrl") ?? "/explore");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg">
        <Leaf className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-center text-2xl font-semibold">Sign in to Budseeker</h1>
      <p className="mt-2 text-center text-sm text-fg-muted">
        Demo account prefilled — <code>demo.consumer@example.com</code> / <code>budseeker-demo-2026</code>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
