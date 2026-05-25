import { NextResponse } from 'next/server';
import {
  buildEmbroideryArtworkPrompt,
  validateArtworkIdea,
} from '@/lib/artworkPrompt';
import {
  checkRateLimit,
  getClientRateLimitKey,
  parsePositiveInteger,
} from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_RATE_LIMIT_PER_IP = 2;
const DEFAULT_MAX_PROMPT_CHARS = 400;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const DISABLED_MESSAGE =
  'AI artwork generation is currently disabled. You can still upload your own logo.';
const RATE_LIMIT_MESSAGE =
  'You reached the generation limit for now. You can still upload your own logo.';
const PROVIDER = 'pollinations';

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function getSafeErrorReason(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown artwork generation error.';
}

function getImageMimeType(contentType: string | null) {
  if (contentType?.startsWith('image/')) {
    return contentType.split(';')[0] || 'image/png';
  }

  return 'image/png';
}

export async function POST(request: Request) {
  const enabled =
    process.env.STITCHRA_IMAGE_GENERATION_ENABLED ?? 'false';

  if (enabled.toLowerCase() !== 'true') {
    return jsonResponse({ ok: false, message: DISABLED_MESSAGE }, 503);
  }

  const maxPromptChars = parsePositiveInteger(
    process.env.IMAGE_GENERATION_MAX_PROMPT_CHARS,
    DEFAULT_MAX_PROMPT_CHARS
  );

  let body: { prompt?: unknown } | null = null;

  try {
    body = (await request.json()) as { prompt?: unknown };
  } catch {
    return jsonResponse(
      { ok: false, message: 'Please describe the artwork you want.' },
      400
    );
  }

  const rawPrompt =
    typeof body?.prompt === 'string' ? body.prompt.trim() : '';

  if (!rawPrompt) {
    return jsonResponse(
      { ok: false, message: 'Please describe the artwork you want.' },
      400
    );
  }

  if (rawPrompt.length > maxPromptChars) {
    return jsonResponse(
      {
        ok: false,
        message: `Please keep your idea under ${maxPromptChars} characters.`,
      },
      400
    );
  }

  const safety = validateArtworkIdea(rawPrompt);
  if (!safety.ok) {
    return jsonResponse({ ok: false, message: safety.message }, 400);
  }

  const rateLimit = parsePositiveInteger(
    process.env.IMAGE_GENERATION_RATE_LIMIT_PER_IP,
    DEFAULT_RATE_LIMIT_PER_IP
  );
  const rateKey = getClientRateLimitKey(request);
  const rateLimitResult = checkRateLimit({
    namespace: 'artwork-generation',
    key: rateKey,
    limit: rateLimit,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimitResult.allowed) {
    console.error('Artwork generation route failed', {
      reason: 'rate_limit_reached',
      provider: PROVIDER,
      limit: String(rateLimit),
    });
    return jsonResponse({ ok: false, message: RATE_LIMIT_MESSAGE }, 429);
  }

  const provider = process.env.STITCHRA_IMAGE_PROVIDER ?? PROVIDER;
  if (provider !== PROVIDER) {
    return jsonResponse(
      {
        ok: false,
        message:
          'AI artwork generation is currently disabled. You can still upload your own logo.',
      },
      503
    );
  }

  const model = process.env.POLLINATIONS_IMAGE_MODEL || 'flux';
  const artworkPrompt = buildEmbroideryArtworkPrompt(rawPrompt);
  const endpoint = new URL(
    `https://image.pollinations.ai/prompt/${encodeURIComponent(artworkPrompt)}`
  );

  endpoint.searchParams.set('model', model);
  endpoint.searchParams.set('width', '1024');
  endpoint.searchParams.set('height', '1024');
  endpoint.searchParams.set('format', 'png');
  endpoint.searchParams.set('nologo', 'true');
  endpoint.searchParams.set('private', 'true');
  endpoint.searchParams.set('safe', 'true');

  const pollinationsApiKey = process.env.POLLINATIONS_API_KEY;
  const headers = new Headers({
    Accept: 'image/png,image/*;q=0.9',
  });

  if (pollinationsApiKey) {
    headers.set('Authorization', `Bearer ${pollinationsApiKey}`);
    endpoint.searchParams.set('key', pollinationsApiKey);
  }

  try {
    const response = await fetch(endpoint, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Artwork generation route failed', {
        reason: 'provider_response_not_ok',
        provider: PROVIDER,
        model,
        status: String(response.status),
      });

      return jsonResponse(
        {
          ok: false,
          message:
            'AI artwork generation is temporarily unavailable. You can still upload your own logo.',
        },
        503
      );
    }

    const contentType = getImageMimeType(
      response.headers.get('content-type')
    );
    const buffer = Buffer.from(await response.arrayBuffer());

    return jsonResponse({
      ok: true,
      imageDataUrl: `data:${contentType};base64,${buffer.toString('base64')}`,
      source: PROVIDER,
      filename: 'stitchra-ai-concept.png',
    });
  } catch (error) {
    console.error('Artwork generation route failed', {
      reason: 'provider_request_failed',
      provider: PROVIDER,
      model,
      error: getSafeErrorReason(error),
    });

    return jsonResponse(
      {
        ok: false,
        message:
          'AI artwork generation is temporarily unavailable. You can still upload your own logo.',
      },
      503
    );
  }
}
