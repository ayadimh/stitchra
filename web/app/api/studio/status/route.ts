import { NextResponse } from 'next/server';
import {
  checkOrdersStorageHealth,
  isOfferEmailConfigured,
  isStudioRequest,
} from '@/lib/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type BinaryHealth = 'ok' | 'error';
type ReachabilityHealth = BinaryHealth | 'unknown';
type AppStatus = 'ok' | 'degraded' | 'error';

const railwayApiFallbackUrl = 'https://stitchra-production.up.railway.app';
const railwayTimeoutMs = 4_000;

function hasEnvValue(name: string) {
  return Boolean(process.env[name]?.trim());
}

function isSupabaseUrlConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      process.env.SUPABASE_URL?.trim()
  );
}

function getRailwayApiUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL === undefined
      ? railwayApiFallbackUrl
      : process.env.NEXT_PUBLIC_API_URL.trim();

  return configuredUrl.replace(/\/+$/, '');
}

async function getOrdersStorageCheck(): Promise<BinaryHealth> {
  try {
    return (await checkOrdersStorageHealth()) ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

async function getRailwayApiReachable(): Promise<ReachabilityHealth> {
  const apiUrl = getRailwayApiUrl();

  if (!apiUrl) {
    return 'unknown';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), railwayTimeoutMs);

  try {
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      signal: controller.signal,
    });

    return response.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  } finally {
    clearTimeout(timeoutId);
  }
}

function getAppStatus(input: {
  ordersStorageCheck: BinaryHealth;
  railwayApiReachable: ReachabilityHealth;
  supabaseUrlConfigured: boolean;
  supabaseServiceRoleConfigured: boolean;
  resendEmailConfigured: boolean;
  stripeConfigured: boolean;
}): AppStatus {
  if (
    input.ordersStorageCheck === 'error' ||
    input.railwayApiReachable === 'error'
  ) {
    return 'error';
  }

  if (
    input.railwayApiReachable === 'unknown' ||
    !input.supabaseUrlConfigured ||
    !input.supabaseServiceRoleConfigured ||
    !input.resendEmailConfigured ||
    !input.stripeConfigured
  ) {
    return 'degraded';
  }

  return 'ok';
}

export async function GET(request: Request) {
  const startedAt = Date.now();

  if (!isStudioRequest(request)) {
    return NextResponse.json(
      { message: 'Studio passcode required.' },
      { status: 401 }
    );
  }

  const [
    ordersStorageCheck,
    railwayApiReachable,
  ] = await Promise.all([
    getOrdersStorageCheck(),
    getRailwayApiReachable(),
  ]);
  const supabaseUrlConfigured = isSupabaseUrlConfigured();
  const supabaseServiceRoleConfigured = hasEnvValue(
    'SUPABASE_SERVICE_ROLE_KEY'
  );
  const resendEmailConfigured = isOfferEmailConfigured();
  const stripeConfigured =
    hasEnvValue('STRIPE_SECRET_KEY') &&
    hasEnvValue('STRIPE_WEBHOOK_SECRET');
  const appStatus = getAppStatus({
    ordersStorageCheck,
    railwayApiReachable,
    supabaseUrlConfigured,
    supabaseServiceRoleConfigured,
    resendEmailConfigured,
    stripeConfigured,
  });

  return NextResponse.json({
    appStatus,
    supabaseUrlConfigured,
    supabaseServiceRoleConfigured,
    ordersStorageCheck,
    railwayApiReachable,
    resendEmailConfigured,
    stripeConfigured,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}
