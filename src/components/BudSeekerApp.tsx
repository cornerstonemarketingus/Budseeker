"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Leaf, Loader2, Search, Send, SlidersHorizontal, Sparkles, TrendingDown, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NearbyDispensaries } from "@/components/NearbyDispensaries";

type Deal = {
  dealScore: number;
  label: string;
  typicalPrice: number;
  lowestPrice: number;
  savingsVsTypical: number;
  suspiciousSale: boolean;
};

type ProductResult = {
  productName: string;
  slug: string;
  brand: string | null;
  category: string;
  strain: string | null;
  thcContent: number | null;
  cbdContent: number | null;
  effects: string[];
  variantId: string;
  variantLabel: string;
  price: number;
  comparePrice: number | null;
  deal: Deal | null;
};

type ProductSort = "deal" | "price-asc" | "price-desc";
type Message = { role: "user" | "assistant"; content: string };

const chip = (active: boolean) =>
  active
    ? "bg-emerald-700 text-white dark:bg-emerald-500/15 dark:text-emerald-300 dark:shadow-[0_0_0_1px_rgba(52,255,156,.4),0_0_16px_rgba(52,255,156,.25)]"
    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-white/10 dark:bg-white/[.03] dark:text-zinc-400 dark:hover:border-emerald-500/40";

export function BudSeekerApp() {
  // Product search
  const [productQuery, setProductQuery] = useState("");
  const [sort, setSort] = useState<ProductSort>("deal");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [productState, setProductState] = useState<"loading" | "done" | "error">("loading");

  // Ask Bud Seeker (collapsible helper, not a floating bot)
  const [askOpen, setAskOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "What are you in the mood for? Tell me the vibe, strength, or format and I'll match it against what's actually in stock right now.",
  }]);
  const [input, setInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function runProductSearch(q: string) {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search failed.");
      setProducts(data.results ?? []);
      setProductState("done");
    } catch {
      setProductState("error");
    }
  }

  // Load the full menu immediately so results are visible without typing first.
  useEffect(() => { runProductSearch(""); }, []);
  useEffect(() => { if (askOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, askOpen]);

  const sortedProducts = useMemo(() => {
    const copy = [...products];
    if (sort === "price-asc") copy.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") copy.sort((a, b) => b.price - a.price);
    else copy.sort((a, b) => (b.deal?.dealScore ?? 0) - (a.deal?.dealScore ?? 0));
    return copy;
  }, [products, sort]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || askLoading) return;
    const userMessage: Message = { role: "user", content: text };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setAskLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Guide is unavailable.");
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Guide is unavailable." }]);
    } finally {
      setAskLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_20px_rgba(52,255,156,.5)]">
              <Leaf className="h-4 w-4" />
            </span>
            Bud Seeker
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        {/* Search hub */}
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[.02] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Free · Instant · No signup</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Find your product, then find it nearby.</h1>

          <div className="mt-5 relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            <input
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") { setProductState("loading"); runProductSearch(productQuery); } }}
              placeholder="Search strain, product, brand, or effect"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-white dark:focus:border-emerald-400/60"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => { setProductState("loading"); runProductSearch(productQuery); }} className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-black">Search</button>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-500"><SlidersHorizontal className="h-3.5 w-3.5" />Sort</span>
            <button onClick={() => setSort("deal")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${chip(sort === "deal")}`}><TrendingDown className="h-3.5 w-3.5" />Best deal</button>
            <button onClick={() => setSort("price-asc")} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(sort === "price-asc")}`}>Price: low to high</button>
            <button onClick={() => setSort("price-desc")} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${chip(sort === "price-desc")}`}>Price: high to low</button>
          </div>

          <button onClick={() => setAskOpen((current) => !current)} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            {askOpen ? "Hide Bud Seeker" : "Not sure what you want? Ask Bud Seeker"}
          </button>

          {askOpen && (
            <div className="mt-4 flex h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-white/10">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Ask Bud Seeker</span>
                <button onClick={() => setAskOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((message, index) => message.role === "user" ? (
                  <div key={index} className="flex justify-end">
                    <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-emerald-700 px-3 py-2 text-sm leading-relaxed text-white dark:bg-emerald-500/15 dark:text-white">{message.content}</div>
                  </div>
                ) : (
                  <div key={index} className="flex gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Sparkles className="h-3.5 w-3.5" /></span>
                    <p className="max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-zinc-200">{message.content}</p>
                  </div>
                ))}
                {askLoading && <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs">Thinking…</span></div>}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 p-3 dark:border-white/10">
                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Vibe, strength, or format…"
                  className="h-10 flex-1 rounded-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[.03] dark:text-white" />
                <button disabled={!input.trim() || askLoading} className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white disabled:opacity-40 dark:bg-emerald-500 dark:text-black"><Send className="h-4 w-4" /></button>
              </form>
            </div>
          )}
        </section>

        {/* Product results */}
        <section>
          <h2 className="text-lg font-semibold">In our menu{productQuery ? ` — matching "${productQuery}"` : ""}</h2>
          {productState === "loading" && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[.03]" />)}
            </div>
          )}
          {productState === "error" && <p className="mt-6 text-sm text-red-600 dark:text-red-400">Product search is temporarily unavailable.</p>}
          {productState === "done" && sortedProducts.length === 0 && (
            <p className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-white/[.03] dark:text-zinc-500">No products match &quot;{productQuery}&quot;. Try a different strain, brand, or effect.</p>
          )}
          {productState === "done" && sortedProducts.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProducts.map((product) => (
                <article key={product.variantId} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[.02] dark:hover:border-emerald-400/40 dark:hover:shadow-[0_0_24px_rgba(52,255,156,.12)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{product.category}{product.brand ? ` · ${product.brand}` : ""}</p>
                      <h3 className="mt-0.5 font-semibold">{product.productName}</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">{product.variantLabel}{product.strain ? ` · ${product.strain}` : ""}</p>
                    </div>
                    <span className="shrink-0 text-lg font-semibold">${product.price}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-500 dark:text-zinc-500">
                    {product.thcContent != null && <span>THC {product.thcContent}%</span>}
                    {product.cbdContent != null && <span>CBD {product.cbdContent}%</span>}
                  </div>
                  {product.deal && (
                    <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <TrendingDown className="h-3 w-3" />{product.deal.label} · {product.deal.dealScore}/100
                    </span>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Nearby dispensaries */}
        <section>
          <h2 className="text-lg font-semibold">Nearby dispensaries</h2>
          <div className="mt-4">
            <NearbyDispensaries />
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-8 pt-2 text-center text-[11px] text-slate-500 dark:text-zinc-600">
        Adults 21+ only · Not medical advice
      </footer>
    </div>
  );
}
