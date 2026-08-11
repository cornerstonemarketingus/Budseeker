import "server-only";
import { db } from "@/lib/db";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

/**
 * Retrieval-then-generate, not free-form DB access: the model only ever
 * sees a text summary of rows this function fetched itself, and every
 * fact it can mention (price, stock, potency) traces back to a real
 * listing. This is the seam the tool-calling assistant (architecture
 * doc, section L) grows into — swapping this fixed retrieval for a
 * model-directed `searchProducts`/`getListingsForProduct` function call
 * is the next step, not a rewrite of this contract.
 */
export async function buildGroundedSystemPrompt(): Promise<string> {
  const listings = await db.dispensaryListing.findMany({
    where: { inStock: true },
    take: 40,
    orderBy: { createdAt: "desc" },
    include: {
      dispensary: { select: { name: true, city: true, state: true } },
      productVariant: {
        include: { canonicalProduct: { include: { brand: true, category: true, strain: true } } },
      },
    },
  });

  const lines = listings.map((listing) => {
    const product = listing.productVariant.canonicalProduct;
    const priceLabel = listing.salePrice ? `$${listing.salePrice} (sale, was $${listing.price})` : `$${listing.price}`;
    const potency = [
      listing.productVariant.thcPercent ? `THC ${listing.productVariant.thcPercent}%` : null,
      listing.productVariant.cbdPercent ? `CBD ${listing.productVariant.cbdPercent}%` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `• ${product.brand.name} ${product.name} (${product.category.name}${product.strain ? `, ${product.strain.name}` : ""}) — ${listing.productVariant.packageSize}${listing.productVariant.unit} — ${priceLabel} at ${listing.dispensary.name}, ${listing.dispensary.city} ${listing.dispensary.state}${potency ? ` — ${potency}` : ""}`;
  });

  return `You are the Budseeker AI budtender. Help people choose cannabis products using ONLY the inventory listed below — never invent a product, price, potency, or store that isn't listed here.

Rules:
- Adults 21+ only. Remind users of this when relevant.
- Never give medical advice; redirect medical questions to a healthcare provider.
- Never state a price, THC/CBD percentage, or stock status that isn't in the list below.
- If nothing below matches what the user is asking for, say so plainly instead of guessing.

Current inventory (sample, live-priced):
${lines.join("\n") || "(no in-stock listings available right now)"}

Be warm, concise, and specific — reference real product and store names from the list above.`;
}

export async function requestChatCompletion(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const baseUrl = (process.env.OLLAMA_BASE_URL || (process.env.OLLAMA_API_KEY ? "https://ollama.com" : "")).replace(/\/$/, "");
  if (!baseUrl) {
    throw new AiUnavailableError("Bud Seeker guidance is not configured yet.");
  }

  const model = process.env.OLLAMA_MODEL ?? "gemma4:31b";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.OLLAMA_API_KEY) headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;

  const response = await fetch(`${baseUrl}/api/chat`, {
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

  if (!response.ok) {
    console.error("Chat model request failed:", response.status, await response.text());
    throw new AiUnavailableError("Bud Seeker model is temporarily unavailable.");
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const reply = data.message?.content?.trim();
  if (!reply) throw new AiUnavailableError("Bud Seeker returned an empty response.");
  return reply;
}

export class AiUnavailableError extends Error {}
