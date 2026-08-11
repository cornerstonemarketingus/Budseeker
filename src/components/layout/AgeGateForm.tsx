"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Leaf } from "lucide-react";
import { confirmAge } from "@/server/compliance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AgeGateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await confirmAge(formData);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg px-6">
      <form action={handleSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-surface-2 p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg">
          <Leaf className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-fg">Confirm your age</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Budseeker lists licensed cannabis retailers. You must meet your jurisdiction&apos;s minimum age to
          continue.
        </p>
        <label htmlFor="dob" className="mt-6 block text-left text-sm font-medium text-fg">
          Date of birth
        </label>
        <Input id="dob" name="dob" type="date" required max={new Date().toISOString().slice(0, 10)} className="mt-2" />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-5 w-full">
          {pending ? "Checking…" : "Enter Budseeker"}
        </Button>
        <p className="mt-4 text-xs text-fg-muted">
          By continuing you confirm this information is accurate. Not medical advice.
        </p>
      </form>
    </div>
  );
}
