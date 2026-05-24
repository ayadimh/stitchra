import { createHash } from "node:crypto";
import { streamText } from "ai";
import type { ModelMessage } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "openai/gpt-5.4-mini";
const DEFAULT_MAX_INPUT_CHARS = 1200;
const DEFAULT_RATE_LIMIT_PER_IP = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_MESSAGES = 8;
const MAX_OUTPUT_TOKENS = 420;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const STITCHRA_SYSTEM_PROMPT = `
You are the Stitchra AI Design Agent, a public embroidery design consultant for the Stitchra website.

Stitchra workflow:
1. User starts designing.
2. User chooses black or white tee.
3. User chooses placement.
4. User uploads a logo/design.
5. User sees a 360 shirt preview.
6. User submits a quote request.
7. Stitchra reviews the design manually.
8. Stitchra sends a final offer.
9. Customer can accept, decline or request changes.
10. Payment happens later through Stripe.
11. Production starts after final approval/payment.

Rules:
- Be concise, practical and premium.
- Act like an embroidery design consultant.
- Never expose internal costs, profit, margin, cost breakdown, Studio data, production notes or private order data.
- Never promise guaranteed final price unless final offer is sent.
- Never promise exact delivery dates.
- Never ask for card details.
- Never process payment.
- Tell users to upload only logos/designs they own or are allowed to use.
- If users ask about Nike, Adidas, Louis Vuitton, luxury logos, trademarked logos or copyrighted artwork, explain they need rights/permission and Stitchra may reject risky designs.
- Do not give legal, tax or immigration advice.
- If user wants to order, guide them to Start Designing and submit a quote request.
- If user needs human support, mention orders@stitchra.com.
- Keep answers under 140 words unless the user asks for a checklist.
`.trim();

type ClientMessage = {
  role?: unknown;
  content?: unknown;
};

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function textResponse(message: string, status = 200) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function getRateLimitKey(request: Request) {
  const clientIp = getClientIp(request);
  return createHash("sha256").update(clientIp).digest("hex").slice(0, 24);
}

function isRateLimited(key: string, limit: number) {
  const now = Date.now();

  for (const [storedKey, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(storedKey);
    }
  }

  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (current.count >= limit) {
    return true;
  }

  current.count += 1;
  return false;
}

function sanitizeContent(content: string, maxChars: number) {
  return content
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone removed]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

function toModelMessages(messages: ClientMessage[], maxChars: number) {
  return messages
    .filter((message) => {
      return (
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      );
    })
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: sanitizeContent(message.content as string, maxChars),
    }))
    .filter((message) => message.content.length > 0) satisfies ModelMessage[];
}

export async function POST(request: Request) {
  const enabled = process.env.STITCHRA_ASSISTANT_ENABLED ?? "true";
  if (enabled.toLowerCase() === "false") {
    return textResponse("Stitchra AI Design Agent is not configured yet.");
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    console.warn("[assistant] AI_GATEWAY_API_KEY is missing.");
    return textResponse("Stitchra AI Design Agent is not configured yet.");
  }

  const rateLimit = parsePositiveInteger(
    process.env.ASSISTANT_RATE_LIMIT_PER_IP,
    DEFAULT_RATE_LIMIT_PER_IP,
  );
  const rateKey = getRateLimitKey(request);

  if (isRateLimited(rateKey, rateLimit)) {
    return textResponse(
      "Too many assistant requests. Please try again later.",
      429,
    );
  }

  const maxInputChars = parsePositiveInteger(
    process.env.ASSISTANT_MAX_INPUT_CHARS,
    DEFAULT_MAX_INPUT_CHARS,
  );

  let body: { messages?: ClientMessage[] } | null = null;

  try {
    body = (await request.json()) as { messages?: ClientMessage[] };
  } catch {
    return textResponse("Send a message to the Stitchra Design Agent.", 400);
  }

  const messages = toModelMessages(body?.messages ?? [], maxInputChars);

  if (!messages.some((message) => message.role === "user")) {
    return textResponse(
      "Ask me about logo placement, upload files, pricing or the Stitchra quote flow.",
      400,
    );
  }

  try {
    const result = streamText({
      model: process.env.STITCHRA_ASSISTANT_MODEL || DEFAULT_MODEL,
      system: STITCHRA_SYSTEM_PROMPT,
      messages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.35,
      maxRetries: 1,
      onError: ({ error }) => {
        const message =
          error instanceof Error ? error.message : "Unknown assistant error";
        console.error("[assistant] Gateway stream error:", message);
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown assistant error";
    console.error("[assistant] Gateway request failed:", message);
    return textResponse(
      "Stitchra AI Design Agent is not available right now. Please try again later.",
      500,
    );
  }
}
