import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  getOrderErrorMessage,
  getPublicOrderByToken,
  isDatabaseConfigured,
  type PublicOrderRecord,
} from '@/lib/orders';
import { OrderResponseClient } from './response-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publicTokenPattern = /^[A-Za-z0-9_-]{16,128}$/;

function getTokenPrefix(token: string) {
  return token ? token.slice(0, 8) : 'missing';
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  let token = '';

  try {
    const resolvedParams = await params;
    token =
      typeof resolvedParams.token === 'string'
        ? resolvedParams.token.trim()
        : '';
  } catch (error) {
    console.error('[order-page] params unavailable', {
      token_prefix: 'missing',
      error_message: getOrderErrorMessage(error),
    });
    return <OfferUnavailablePage />;
  }

  if (!publicTokenPattern.test(token)) {
    return <OfferUnavailablePage />;
  }

  if (!isDatabaseConfigured()) {
    console.error('[order-page] database not configured', {
      token_prefix: getTokenPrefix(token),
    });
    return <OfferUnavailablePage />;
  }

  let order: PublicOrderRecord | null = null;

  try {
    order = await getPublicOrderByToken(token);
  } catch (error) {
    console.error('[order-page] public order load failed', {
      token_prefix: getTokenPrefix(token),
      error_message: getOrderErrorMessage(error),
    });
  }

  if (!order) {
    return <OfferUnavailablePage />;
  }

  return <OrderResponseClient initialOrder={order} />;
}

function OfferUnavailablePage() {
  return (
    <main style={pageShell}>
      <section style={messagePanel}>
        <p style={eyebrow}>Secure offer</p>
        <h1 style={title}>Offer not available</h1>
        <p style={mutedText}>
          This secure offer link may be expired or invalid. Please
          contact Stitchra Studio.
        </p>
        <Link href="/" style={backLink}>
          Back to Stitchra
        </Link>
      </section>
    </main>
  );
}

const pageShell = {
  minHeight: '100vh',
  padding: '40px clamp(18px, 4vw, 64px)',
  background:
    'radial-gradient(circle at 20% 12%, rgba(0,255,136,0.13), transparent 28%), radial-gradient(circle at 85% 24%, rgba(0,200,255,0.10), transparent 30%), #050607',
  color: '#f5f7f8',
  fontFamily:
    'var(--font-geist-sans), Inter, "Helvetica Neue", Arial, sans-serif',
} satisfies CSSProperties;

const messagePanel = {
  width: 'min(680px, 100%)',
  margin: '14vh auto',
  padding: 'clamp(24px, 4vw, 42px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 24,
  background: 'rgba(255,255,255,0.055)',
} satisfies CSSProperties;

const eyebrow = {
  color: '#00ff88',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  margin: '0 0 10px',
} satisfies CSSProperties;

const title = {
  margin: 0,
  fontSize: 'clamp(34px, 7vw, 64px)',
  lineHeight: 0.96,
} satisfies CSSProperties;

const mutedText = {
  color: 'rgba(245,247,248,0.68)',
  lineHeight: 1.55,
} satisfies CSSProperties;

const backLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 46,
  marginTop: 16,
  padding: '0 18px',
  borderRadius: 999,
  color: '#04100b',
  background: 'linear-gradient(135deg, #00ff88, #00d7ff)',
  fontWeight: 850,
  textDecoration: 'none',
} satisfies CSSProperties;
