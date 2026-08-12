import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { computeDealAssessment, getPriceHistoryMap, recordPriceObservationsBatch } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const listings = await db.retailerListing.findMany({
      where: { published: true, inStock: true },
      include: { variant: { include: { canonicalProduct: { include: { category: true } } } } },
      take: 30,
      orderBy: { featured: "desc" },
    });

    const listingIds = listings.map((listing) => listing.id);
    // Today's snapshot is bookkeeping for future DealScores, not needed for this reply —
    // deferred to run after the response is sent instead of blocking it.
    after(() =>
      recordPriceObservationsBatch(
        listings.map((listing) => ({ listingId: listing.id, price: listing.price, comparePrice: listing.comparePrice })),
      ).catch((err) => console.error("Price observation batch failed:", err)),
    );
    const historyMap = await getPriceHistoryMap(listingIds);

    const productLines = listings.map((listing) => {
      const product = listing.variant.canonicalProduct;
      const deal = computeDealAssessment(historyMap.get(listing.id) ?? [], listing.price, listing.comparePrice);

      const dealNote = deal
        ? ` | ${deal.label} (${deal.dealScore}/100${deal.savingsVsTypical > 0 ? `, $${deal.savingsVsTypical.toFixed(2)} below typical` : ""})`
        : "";
      const sizeNote = listing.variant.label ? ` ${listing.variant.label}` : "";
      return `• ${product.name}${sizeNote} (${product.category.name}) — $${listing.price}${product.thcContent ? ` | THC: ${product.thcContent}%` : ""}${product.cbdContent ? ` | CBD: ${product.cbdContent}%` : ""}${product.strain ? ` | ${product.strain}` : ""}${dealNote}`;
    });
    const productSummary = productLines.join("\n");

    const systemPrompt = `You are Bud Seeker, a friendly, knowledgeable budtender assistant that helps people choose the right cannabis product.

Your role:
- Help customers choose the right cannabis products for their needs
- Answer questions about strains, effects, dosing, and product types
- Point out genuinely good deals (labeled "Excellent deal" or "Good deal") when they fit what the customer is asking for, but don't oversell a "Fair price" or "Above typical" item as a deal
- Always remind customers that products are for adults 21+ only
- Never provide medical advice; direct medical questions to a healthcare provider

Current inventory (deal ratings are based on each product's own trailing price history, not other retailers):
${productSummary}

Be warm, professional, and concise. Use cannabis-friendly language but stay legal and responsible.`;

    const baseUrl = (process.env.OLLAMA_BASE_URL || (process.env.OLLAMA_API_KEY ? "https://ollama.com" : "")).replace(/\/$/, "");
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Bud Seeker guidance is not configured yet. Nearby dispensary search is still available." },
        { status: 503 },
      );
    }

    const model = process.env.OLLAMA_MODEL ?? "gemma4:31b";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.OLLAMA_API_KEY) headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;

    const llmRes = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...messages.slice(-10)],
        options: { temperature: 0.7, num_predict: 500 },
        stream: false,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!llmRes.ok) {
      console.error("Chat model request failed:", llmRes.status, await llmRes.text());
      return NextResponse.json({ error: "Bud Seeker model is temporarily unavailable." }, { status: 502 });
    }

    const data = await llmRes.json() as { message?: { content?: string } };
    const reply = data.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Bud Seeker returned an empty response." }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Chat service unavailable" }, { status: 500 });
  }
}
