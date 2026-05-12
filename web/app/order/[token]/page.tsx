import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import {
  getPublicOrderByToken,
  isDatabaseConfigured,
} from '@/lib/orders';
import { OrderResponseClient } from './response-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function OrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  if (!isDatabaseConfigured()) {
    return (
      <main style={pageShell}>
        <section style={messagePanel}>
          <p style={eyebrow}>Order status</p>
          <h1 style={title}>Order page unavailable</h1>
          <p style={mutedText}>
            The order database is not configured for this deployment.
          </p>
        </section>
      </main>
    );
  }

  const { token } = await params;
  const order = await getPublicOrderByToken(token);

  if (!order) {
    notFound();
  }

  return <OrderResponseClient initialOrder={order} />;
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
