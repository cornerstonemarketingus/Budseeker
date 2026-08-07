import { BudSeekerTrigger } from "@/components/BudSeekerTrigger";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold">Bud Seeker</h1>
      <p className="max-w-xl text-slate-600">
        An AI product guide and nearby-dispensary finder for cannabis retailers.
        Adults 21+ only. Not medical advice.
      </p>
      <BudSeekerTrigger />
    </main>
  );
}
