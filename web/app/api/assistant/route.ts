import { createHash } from "node:crypto";
import { generateText, gateway } from "ai";
import type { ModelMessage } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "openai/gpt-5.4-mini";
const DEFAULT_MAX_INPUT_CHARS = 1200;
const DEFAULT_RATE_LIMIT_PER_IP = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_MESSAGES = 6;
const MAX_OUTPUT_TOKENS = 260;
const DISABLED_MESSAGE = "Stitchra AI Design Agent is currently disabled.";
const NOT_CONFIGURED_MESSAGE =
  "Stitchra AI Design Agent is not configured yet.";
const TEMPORARILY_UNAVAILABLE_MESSAGE =
  "The Stitchra AI Design Agent is temporarily unavailable. You can still use the configurator and submit a quote request.";
const RATE_LIMIT_MESSAGE =
  "You reached the assistant limit for now. You can still use the configurator and submit a quote request.";
const SUGGESTED_MODEL = "openai/gpt-5.4";

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
- Pricing guidance: simple small left-chest designs can start around €9. Larger front designs can start around €13. Final price depends on placement, logo size, colors, stitch detail, quantity and studio review. The final customer offer is confirmed before production.
- Placement guidance: left chest works well for small premium logos, clubs and clean brand marks. Center chest or center/front placements work better for larger artwork. Tiny text and highly detailed logos may need simplification or studio review.
- Keep answers under 90 words unless the user asks for a checklist.
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

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getAssistantConfig() {
  const enabledValue = process.env.STITCHRA_ASSISTANT_ENABLED ?? "true";
  const model = process.env.STITCHRA_ASSISTANT_MODEL || DEFAULT_MODEL;

  return {
    enabled: enabledValue.toLowerCase() === "true",
    gatewayKeyPresent: Boolean(process.env.AI_GATEWAY_API_KEY),
    model,
  };
}

function getSafeErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      name: "UnknownError",
      message: "Unknown assistant route error",
    };
  }

  return {
    name: error.name,
    message: error.message,
  };
}

function classifyAssistantError(error: unknown) {
  const { name, message } = getSafeErrorDetails(error);
  const searchable = `${name} ${message}`.toLowerCase();

  if (
    searchable.includes("authentication") ||
    searchable.includes("unauthorized") ||
    searchable.includes("forbidden") ||
    searchable.includes("invalid api") ||
    searchable.includes("401") ||
    searchable.includes("403")
  ) {
    return "gateway_authentication_failed";
  }

  if (
    searchable.includes("model not found") ||
    searchable.includes("model_not_found") ||
    searchable.includes("no such model") ||
    searchable.includes("404")
  ) {
    return "model_unavailable";
  }

  if (
    searchable.includes("rate limit") ||
    searchable.includes("ratelimit") ||
    searchable.includes("429")
  ) {
    return "gateway_rate_limited";
  }

  if (searchable.includes("empty")) {
    return "empty_gateway_response";
  }

  return "gateway_request_failed";
}

function logAssistantFailure(
  reason: string,
  model: string,
  extra?: Record<string, string | boolean>
) {
  console.error("Assistant route failed", {
    reason,
    model,
    ...extra,
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
  const config = getAssistantConfig();

  if (!config.enabled) {
    logAssistantFailure("assistant_disabled", config.model);
    return textResponse(DISABLED_MESSAGE, 503);
  }

  if (!config.gatewayKeyPresent) {
    logAssistantFailure("gateway_key_missing", config.model);
    return textResponse(NOT_CONFIGURED_MESSAGE, 503);
  }

  const rateLimit = parsePositiveInteger(
    process.env.ASSISTANT_RATE_LIMIT_PER_IP,
    DEFAULT_RATE_LIMIT_PER_IP,
  );
  const rateKey = getRateLimitKey(request);

  if (isRateLimited(rateKey, rateLimit)) {
    logAssistantFailure("rate_limit_reached", config.model, {
      limit: String(rateLimit),
    });
    return textResponse(RATE_LIMIT_MESSAGE, 429);
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
    const result = await generateText({
      model: gateway(config.model),
      system: STITCHRA_SYSTEM_PROMPT,
      messages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.35,
      maxRetries: 1,
      providerOptions: {
        gateway: {
          user: rateKey,
          tags: ["stitchra-design-agent", "public-homepage"],
          models:
            config.model === SUGGESTED_MODEL
              ? undefined
              : [config.model, SUGGESTED_MODEL],
        },
      },
    });

    const answer = result.text.trim();

    if (!answer) {
      throw new Error("empty_gateway_response");
    }

    return textResponse(answer);
  } catch (error) {
    const reason = classifyAssistantError(error);

    logAssistantFailure(reason, config.model, {
      gatewayKeyPresent: config.gatewayKeyPresent,
      suggestedModel:
        reason === "model_unavailable" ? SUGGESTED_MODEL : "",
    });

    if (reason === "gateway_authentication_failed") {
      return textResponse(NOT_CONFIGURED_MESSAGE, 503);
    }

    return textResponse(TEMPORARILY_UNAVAILABLE_MESSAGE, 503);
  }
}

export async function GET() {
  const config = getAssistantConfig();

  return jsonResponse({
    configured: config.gatewayKeyPresent,
    enabled: config.enabled,
    model: config.model,
    suggestedModel: SUGGESTED_MODEL,
    maxInputChars: parsePositiveInteger(
      process.env.ASSISTANT_MAX_INPUT_CHARS,
      DEFAULT_MAX_INPUT_CHARS,
    ),
    maxMessages: MAX_MESSAGES,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    rateLimitPerHour: parsePositiveInteger(
      process.env.ASSISTANT_RATE_LIMIT_PER_IP,
      DEFAULT_RATE_LIMIT_PER_IP,
    ),
  });
}
