import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessDeal, recordPriceObservation } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { messages, email } = await req.json() as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      email?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !await db.newsletterSubscriber.findUnique({ where: { email: normalizedEmail }, select: { id: true } })) {
      return NextResponse.json({ error: "Email signup is required to use Bud Seeker." }, { status: 403 });
    }

    const products = await db.product.findMany({
      where: { published: true, inStock: true },
      include: { category: true },
      take: 30,
      orderBy: { featured: "desc" },
    });

    const productLines = await Promise.all(products.map(async (p) => {
      // Best-effort: today's snapshot and deal score should never block a chat reply.
      const deal = await Promise.all([
        recordPriceObservation(p.id, p.price, p.comparePrice).catch(() => undefined),
        assessDeal(p.id, p.price, p.comparePrice).catch(() => null),
      ]).then(([, assessment]) => assessment);

      const dealNote = deal
        ? ` | ${deal.label} (${deal.dealScore}/100${deal.savingsVsTypical > 0 ? `, $${deal.savingsVsTypical.toFixed(2)} below typical` : ""})`
        : "";
      return `• ${p.name} (${p.category.name}) — $${p.price}${p.thcContent ? ` | THC: ${p.thcContent}%` : ""}${p.cbdContent ? ` | CBD: ${p.cbdContent}%` : ""}${p.strain ? ` | ${p.strain}` : ""}${dealNote}`;
    }));
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
