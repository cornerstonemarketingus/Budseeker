import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AiUnavailableError, buildGroundedSystemPrompt, requestChatCompletion, type ChatMessage } from "@/server/ai/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { messages, email } = (await req.json()) as { messages: ChatMessage[]; email?: string };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !(await db.newsletterSubscriber.findUnique({ where: { email: normalizedEmail }, select: { id: true } }))) {
      return NextResponse.json({ error: "Email signup is required to use Bud Seeker." }, { status: 403 });
    }

    const systemPrompt = await buildGroundedSystemPrompt();
    const reply = await requestChatCompletion(messages, systemPrompt);
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Chat service unavailable" }, { status: 500 });
  }
}
