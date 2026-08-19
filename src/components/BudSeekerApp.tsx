"use client";

import { useMemo, useRef, useState } from "react";
import { Map, MessageCircle, Search, Send, SlidersHorizontal, TrendingDown } from "lucide-react";
import { NearbyDispensaries } from "@/components/NearbyDispensaries";

type Deal = { dealScore: number; label: string };
type ProductResult = { productName: string; slug: string; brand: string | null; category: string; strain: string | null; thcContent: number | null; cbdContent: number | null; effects: string[]; variantId: string; variantLabel: string; price: number; deal: Deal | null };
type ProductSort = "deal" | "price-asc" | "price-desc";
type Message = { role: "user" | "assistant"; content: string; products?: ProductResult[] };
type Tab = "search" | "map" | "ask";

const prompts = ["Something relaxing for sleep", "Best deal under $30", "High-THC flower nearby", "A balanced, low-key edible"];
const chip = (active: boolean) => active
  ? "border border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--bg-primary)]"
  : "border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:border-[var(--accent-moss)]";

function LeafVein({ thinking = false }: { thinking?: boolean }) {
  return <svg viewBox="0 0 240 34" className={`leaf-vein ${thinking ? "leaf-thinking" : ""}`} aria-hidden="true"><path d="M6 24c55-1 93-8 138-17 35-7 64-4 90 5M62 18 47 8M91 14 77 27M121 10 108 2M150 7l-9 16M177 6l11-5M203 8l13 10" /></svg>;
}

function BrandMark() {
  return <div className="font-display text-2xl font-semibold text-[var(--text-primary)]">Bud Seeker</div>;
}

function ProductCard({ product }: { product: ProductResult }) {
  return <article className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--accent-moss)]">
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-[13px] font-medium uppercase tracking-[.08em] text-[var(--accent-gold)]">{product.category}{product.brand ? ` · ${product.brand}` : ""}</p><h3 className="mt-1 text-[18px] font-medium">{product.productName}</h3><p className="mt-1 text-[13px] text-[var(--text-secondary)]">{product.variantLabel}{product.strain ? ` · ${product.strain}` : ""}</p></div>
      <span className="font-data shrink-0 text-[18px] text-[var(--text-primary)]">${product.price.toFixed(2)}</span>
    </div>
    <div className="font-data mt-4 flex flex-wrap gap-2 text-[13px] text-[var(--text-secondary)]">
      {product.thcContent != null && <span className="rounded-full bg-[var(--bg-surface-2)] px-3 py-1">THC {product.thcContent}%</span>}
      {product.cbdContent != null && <span className="rounded-full bg-[var(--bg-surface-2)] px-3 py-1">CBD {product.cbdContent}%</span>}
      {product.deal && <span className="rounded-full bg-[var(--bg-surface-2)] px-3 py-1 text-[var(--accent-gold)]">{product.deal.label}</span>}
    </div>
  </article>;
}

export function BudSeekerApp() {
  const [tab, setTab] = useState<Tab>("search");
  const [productQuery, setProductQuery] = useState("");
  const [sort, setSort] = useState<ProductSort>("deal");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [productState, setProductState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sortedProducts = useMemo(() => {
    const copy = [...products];
    if (sort === "price-asc") copy.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") copy.sort((a, b) => b.price - a.price);
    else copy.sort((a, b) => (b.deal?.dealScore ?? 0) - (a.deal?.dealScore ?? 0));
    return copy;
  }, [products, sort]);

  async function runProductSearch(query = productQuery) {
    const q = query.trim();
    if (!q) return;
    setProductState("loading");
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      if (!response.ok) throw new Error();
      setProducts(data.results ?? []); setProductState("done");
    } catch { setProductState("error"); }
  }

  async function ask(text: string) {
    const query = text.trim(); if (!query || askLoading) return;
    const userMessage: Message = { role: "user", content: query };
    const history = [...messages, userMessage];
    setMessages(history); setInput(""); setAskLoading(true);
    try {
      const [chatResponse, productResponse] = await Promise.all([
        fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }) }),
        fetch(`/api/products/search?q=${encodeURIComponent(query)}`),
      ]);
      const chat = await chatResponse.json(); const matches = await productResponse.json();
      if (!chatResponse.ok) throw new Error(chat.error || "Bud Seeker is unavailable right now.");
      setMessages(current => [...current, { role: "assistant", content: chat.reply, products: (matches.results ?? []).slice(0, 3) }]);
    } catch (error) { setMessages(current => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Bud Seeker is unavailable right now." }]); }
    finally { setAskLoading(false); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }
  }

  return <div className="min-h-screen bg-[var(--bg-primary)] pb-28 text-[var(--text-primary)]">
    <header className="sticky top-0 z-[1000] border-b border-[var(--border-hairline)] bg-[color:rgba(18,25,15,.94)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"><BrandMark /><span className="font-data text-[11px] uppercase tracking-[.12em] text-[var(--text-secondary)]">Adults 21+</span></div>
    </header>

    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      {tab === "search" && <section>
        <p className="text-[13px] font-medium uppercase tracking-[.12em] text-[var(--accent-gold)]">Product search</p>
        <h1 className="font-display mt-2 max-w-xl text-[32px] font-medium leading-tight">Find what fits, without scrolling every menu.</h1>
        <LeafVein />
        <form onSubmit={e => { e.preventDefault(); runProductSearch(); }} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" /><input value={productQuery} onChange={e => setProductQuery(e.target.value)} placeholder="Strain, product, brand, or effect" className="h-12 w-full rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] pl-11 pr-4 text-[15px] outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-moss)]" /></label>
          <button disabled={!productQuery.trim()} className="h-12 rounded-[var(--radius-button)] bg-[var(--accent-gold)] px-7 font-medium text-[var(--bg-primary)] disabled:opacity-40">Search</button>
        </form>
        {productState !== "idle" && <div className="mt-5 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary)]"><SlidersHorizontal className="h-3.5 w-3.5" />Sort</span><button onClick={() => setSort("deal")} className={`rounded-full px-3 py-1.5 text-[12px] ${chip(sort === "deal")}`}><TrendingDown className="mr-1 inline h-3 w-3" />Best deal</button><button onClick={() => setSort("price-asc")} className={`rounded-full px-3 py-1.5 text-[12px] ${chip(sort === "price-asc")}`}>Price: low</button><button onClick={() => setSort("price-desc")} className={`rounded-full px-3 py-1.5 text-[12px] ${chip(sort === "price-desc")}`}>Price: high</button></div>}
        {productState === "idle" && <div className="mt-16 text-center"><div className="mx-auto max-w-sm opacity-25"><LeafVein /></div><p className="mt-3 text-[15px] text-[var(--text-secondary)]">Search a strain, brand, product, or desired effect.</p></div>}
        {productState === "loading" && <div className="mx-auto mt-16 max-w-md text-center"><LeafVein thinking /><p className="text-[13px] text-[var(--text-secondary)]">Checking available products…</p></div>}
        {productState === "error" && <p className="mt-10 text-[15px] text-[var(--error)]">Product search is temporarily unavailable. Try again in a moment.</p>}
        {productState === "done" && sortedProducts.length === 0 && <p className="mt-10 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-[15px] text-[var(--text-secondary)]">No products match “{productQuery}.” Try a broader strain, brand, or effect.</p>}
        {productState === "done" && sortedProducts.length > 0 && <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sortedProducts.map(product => <ProductCard key={product.variantId} product={product} />)}</div>}
      </section>}

      {tab === "map" && <section><p className="text-[13px] font-medium uppercase tracking-[.12em] text-[var(--accent-gold)]">Nearby dispensaries</p><h1 className="font-display mt-2 text-[32px] font-medium">Find a store near you.</h1><div className="mt-7"><NearbyDispensaries /></div></section>}

      {tab === "ask" && <section className="mx-auto max-w-3xl"><p className="text-[13px] font-medium uppercase tracking-[.12em] text-[var(--accent-gold)]">Matched by Bud Seeker</p><h1 className="font-display mt-2 text-[32px] font-medium">What are you looking for?</h1>
        {messages.length === 0 && <div className="mt-8"><p className="max-w-lg text-[15px] leading-7 text-[var(--text-secondary)]">Describe the vibe, strength, format, or budget. Bud Seeker will check products that fit.</p><div className="mt-6 flex flex-wrap gap-2">{prompts.map(prompt => <button key={prompt} onClick={() => ask(prompt)} className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] px-4 py-2 text-left text-[13px] text-[var(--text-secondary)] hover:border-[var(--accent-moss)] hover:text-[var(--text-primary)]">{prompt}</button>)}</div><div className="mx-auto mt-14 max-w-sm opacity-20"><LeafVein /></div></div>}
        <div className="mt-8 space-y-7">{messages.map((message, index) => message.role === "user" ? <div key={index} className="flex justify-end"><div className="max-w-[82%] rounded-2xl rounded-br-md bg-[var(--bg-surface-2)] px-4 py-3 text-[15px] leading-6">{message.content}</div></div> : <div key={index}><p className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-primary)]">{message.content}</p>{message.products && message.products.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{message.products.map(product => <ProductCard key={product.variantId} product={product} />)}</div>}</div>)}{askLoading && <div className="max-w-sm"><LeafVein thinking /><p className="text-[13px] text-[var(--text-secondary)]">Matching products…</p></div>}<div ref={bottomRef} /></div>
        <form onSubmit={e => { e.preventDefault(); ask(input); }} className="sticky bottom-24 mt-10 flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2"><input value={input} onChange={e => setInput(e.target.value)} placeholder="Vibe, strength, format, or budget…" className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none placeholder:text-[var(--text-secondary)]" /><button disabled={!input.trim() || askLoading} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)] disabled:opacity-40"><Send className="h-4 w-4" /></button></form>
      </section>}
    </main>

    <nav className="fixed inset-x-0 bottom-0 z-[1100] border-t border-[var(--border-hairline)] bg-[color:rgba(27,36,21,.97)] pb-[env(safe-area-inset-bottom)] backdrop-blur"><div className="mx-auto grid max-w-lg grid-cols-3 px-2 py-2">{([{ id: "search", label: "Search", icon: Search }, { id: "map", label: "Map", icon: Map }, { id: "ask", label: "Ask Bud Seeker", icon: MessageCircle }] as const).map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-button)] text-[12px] transition-colors ${tab === item.id ? "bg-[var(--bg-surface-2)] text-[var(--accent-gold)]" : "text-[var(--text-secondary)]"}`}><item.icon className="h-5 w-5" /><span>{item.label}</span></button>)}</div></nav>
  </div>;
}
