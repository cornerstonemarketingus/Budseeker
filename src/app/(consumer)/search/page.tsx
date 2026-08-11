import Link from "next/link";
import type { Metadata } from "next";
import { Search as SearchIcon } from "lucide-react";
import { search } from "@/server/search/service";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const results = q ? await search(q) : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-3xl font-semibold">Search</h1>
      <form action="/search" className="relative mt-5">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
        <Input name="q" defaultValue={q} placeholder="Search products, dispensaries, brands…" className="h-12 pl-11" autoFocus />
      </form>

      {q && (
        <p className="mt-4 text-sm text-fg-muted">
          {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      )}

      <div className="mt-4 space-y-2">
        {results.map((r) => (
          <Link
            key={`${r.type}-${r.id}`}
            href={r.href}
            className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3 hover:border-accent/40"
          >
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-fg-muted">{r.subtitle}</p>
            </div>
            <Badge variant="neutral">{r.type}</Badge>
          </Link>
        ))}
        {q && results.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-fg-muted">
            No matches for &ldquo;{q}&rdquo;. Try a different spelling or a broader term.
          </p>
        )}
      </div>
    </div>
  );
}
