import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import {
  getPublicOrderByToken,
  isDatabaseConfigured,
  type CustomerDecision,
  type OrderStatus,
  type PaymentStatus,
  type PublicOrderRecord,
} from '@/lib/orders';
import { PaymentCheckoutButton } from './payment-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TODO(Stripe live): keep test keys active until legal/business bank setup is ready.
// TODO(Stripe live): add the live webhook endpoint in Stripe Dashboard before going live.

const statusLabels: Record<OrderStatus, string> = {
  new: 'New request',
  needs_review: 'Needs review',
  approved: 'Approved',
  offer_sent: 'Offer sent',
  change_requested: 'Changes requested',
  customer_accepted: 'Customer accepted',
  pre_production: 'Pre-production',
  sent_to_production: 'In production',
  customer_declined: 'Customer declined',
  customer_cancelled: 'Customer cancelled',
  team_declined: 'Team declined',
  completed: 'Completed',
};

const decisionLabels: Record<CustomerDecision, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  change_requested: 'Changes requested',
  cancelled: 'Cancelled',
};

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

function formatMoney(value: number | null) {
  return value === null ? 'Pending' : `€${value.toFixed(2)}`;
}

function formatPublicPrice(order: PublicOrderRecord, value: number | null) {
  if (order.manual_quote && order.revised_price_eur === null) {
    return 'Manual quote';
  }

  return formatMoney(value);
}

function formatValue(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPlacement(value: string) {
  if (value === 'left') {
    return 'Left chest';
  }

  if (value === 'center') {
    return 'Center front';
  }

  return formatValue(value);
}

function getFinalPaymentAmount(order: PublicOrderRecord) {
  return (
    order.revised_price_eur ??
    (order.manual_quote ? null : order.customer_price_eur)
  );
}

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    success?: string;
    cancelled?: string;
    session_id?: string;
  }>;
}) {
  if (!isDatabaseConfigured()) {
    return (
      <main style={pageShell}>
        <section style={messagePanel}>
          <p style={eyebrow}>Payment</p>
          <h1 style={title}>Payment page unavailable</h1>
          <p style={mutedText}>
            The order database is not configured for this deployment.
          </p>
        </section>
      </main>
    );
  }

  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const order = await getPublicOrderByToken(token);

  if (!order) {
    notFound();
  }

  const finalAmount = getFinalPaymentAmount(order);
  const isAccepted = order.customer_decision === 'accepted';
  const isPaid = order.payment_status === 'paid';
  const canAttemptPayment =
    isAccepted &&
    !isPaid &&
    finalAmount !== null &&
    finalAmount > 0;
  const successPending = resolvedSearchParams.success === '1';
  const cancelled = resolvedSearchParams.cancelled === '1';

  return (
    <main style={pageShell}>
      <section style={layout}>
        <div style={summaryPanel}>
          <p style={eyebrow}>Secure payment</p>
          <h1 style={title}>Secure payment</h1>
          {isPaid ? (
            <p style={successNotice}>Payment received. Thank you.</p>
          ) : !isAccepted ? (
            <p style={warningNotice}>
              Please accept the offer before payment.
            </p>
          ) : successPending ? (
            <p style={successNotice}>
              Payment confirmation is being processed.
            </p>
          ) : order.payment_status === 'pending' ? (
            <p style={warningNotice}>
              Payment pending. You can retry if the checkout session expired.
            </p>
          ) : cancelled ? (
            <p style={warningNotice}>
              Checkout was cancelled. You can try again when ready.
            </p>
          ) : (
            <p style={mutedText}>
              Use secure Stripe Checkout to complete your Stitchra order.
            </p>
          )}

          <div style={amountPanel}>
            <span style={detailLabel}>Final amount</span>
            <strong style={amountText}>
              {formatPublicPrice(order, finalAmount)}
            </strong>
          </div>

          {canAttemptPayment && (
            <PaymentCheckoutButton publicToken={order.public_token} />
          )}
          {!isPaid && isAccepted && !canAttemptPayment && (
            <p style={warningNotice}>
              Payment is not available until the studio sets a final price.
            </p>
          )}
          <a href={`/order/${order.public_token}`} style={secondaryLink}>
            Back to offer
          </a>
        </div>

        <div style={detailPanel}>
          <div style={statusRow}>
            <span style={statusBadge}>
              Order: {statusLabels[order.status]}
            </span>
            <span style={decisionBadge(order.customer_decision)}>
              Response: {decisionLabels[order.customer_decision]}
            </span>
            <span style={statusBadge}>
              Payment: {paymentLabels[order.payment_status]}
            </span>
          </div>

          {order.logo_preview_url ? (
            <div style={previewFrame}>
              <div
                aria-label="Logo preview"
                style={{
                  ...logoPreview,
                  backgroundImage: `url(${order.logo_preview_url})`,
                }}
              />
            </div>
          ) : (
            <div style={previewFrame}>
              <span style={mutedText}>No logo preview available</span>
            </div>
          )}

          <div style={detailGrid}>
            <Detail
              label="Placement"
              value={formatPlacement(order.placement)}
            />
            <Detail
              label="Shirt color"
              value={formatValue(order.shirt_color)}
            />
            <Detail
              label="Quantity"
              value={String(order.quantity ?? 1)}
            />
            <Detail
              label="Price"
              value={formatPublicPrice(order, finalAmount)}
            />
          </div>

          {order.team_message && (
            <div style={messageCard}>
              <span style={detailLabel}>Message from the studio</span>
              <p style={messageText}>{order.team_message}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={detailCard}>
      <span style={detailLabel}>{label}: </span>
      <strong>{value}</strong>
    </div>
  );
}

const pageShell: CSSProperties = {
  minHeight: '100vh',
  padding: '40px clamp(18px, 4vw, 64px)',
  background:
    'radial-gradient(circle at 20% 12%, rgba(0,255,136,0.13), transparent 28%), radial-gradient(circle at 85% 24%, rgba(0,200,255,0.10), transparent 30%), #050607',
  color: '#f5f7f8',
  fontFamily:
    'var(--font-geist-sans), Inter, "Helvetica Neue", Arial, sans-serif',
};

const layout: CSSProperties = {
  width: 'min(1120px, 100%)',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
  gap: 20,
  alignItems: 'start',
};

const summaryPanel: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 24,
  padding: 'clamp(22px, 4vw, 34px)',
  background: 'rgba(255,255,255,0.055)',
  boxShadow: '0 30px 90px rgba(0,0,0,0.34)',
};

const detailPanel: CSSProperties = {
  ...summaryPanel,
  display: 'grid',
  gap: 18,
};

const messagePanel: CSSProperties = {
  width: 'min(680px, 100%)',
  margin: '14vh auto',
  padding: 'clamp(24px, 4vw, 42px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 24,
  background: 'rgba(255,255,255,0.055)',
};

const eyebrow: CSSProperties = {
  color: '#00ff88',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  margin: '0 0 10px',
};

const title: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(36px, 7vw, 72px)',
  lineHeight: 0.94,
};

const mutedText: CSSProperties = {
  color: 'rgba(245,247,248,0.62)',
  lineHeight: 1.55,
};

const successNotice: CSSProperties = {
  margin: '14px 0 0',
  border: '1px solid rgba(157,255,196,0.24)',
  borderRadius: 16,
  padding: '14px 16px',
  background: 'rgba(157,255,196,0.08)',
  color: '#dfffea',
  lineHeight: 1.5,
  fontWeight: 780,
};

const warningNotice: CSSProperties = {
  ...successNotice,
  border: '1px solid rgba(255,224,131,0.24)',
  background: 'rgba(255,224,131,0.08)',
  color: '#ffe7a3',
};

const amountPanel: CSSProperties = {
  margin: '28px 0 18px',
  border: '1px solid rgba(157,255,196,0.22)',
  borderRadius: 22,
  padding: 22,
  background:
    'linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,200,255,0.08))',
};

const amountText: CSSProperties = {
  display: 'block',
  marginTop: 8,
  fontSize: 'clamp(42px, 8vw, 72px)',
  lineHeight: 0.95,
};

const secondaryLink: CSSProperties = {
  display: 'block',
  marginTop: 12,
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 16,
  padding: '14px 18px',
  color: '#f5f7f8',
  background: 'rgba(255,255,255,0.045)',
  fontWeight: 800,
  textAlign: 'center',
  textDecoration: 'none',
};

const statusRow: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const statusBadge: CSSProperties = {
  border: '1px solid rgba(0,200,255,0.28)',
  borderRadius: 999,
  background: 'rgba(0,200,255,0.09)',
  color: '#9ee8ff',
  padding: '9px 12px',
  fontSize: 13,
  fontWeight: 850,
};

function decisionBadge(decision: CustomerDecision): CSSProperties {
  const color =
    decision === 'accepted'
      ? '#9dffc4'
      : decision === 'declined' || decision === 'cancelled'
        ? '#ffb4b4'
        : '#ffe083';

  return {
    ...statusBadge,
    borderColor: `${color}44`,
    background: `${color}14`,
    color,
  };
}

const previewFrame: CSSProperties = {
  minHeight: 300,
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.10)',
  display: 'grid',
  placeItems: 'center',
  background:
    'linear-gradient(135deg, rgba(8,14,13,0.95), rgba(24,30,27,0.95))',
  boxShadow: 'inset 0 0 70px rgba(0,0,0,0.35)',
};

const logoPreview: CSSProperties = {
  width: 'min(260px, 70%)',
  aspectRatio: '3 / 2',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'contain',
  filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.4))',
};

const detailGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
};

const detailCard: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(0,0,0,0.22)',
  display: 'grid',
  gap: 6,
};

const detailLabel: CSSProperties = {
  color: 'rgba(245,247,248,0.62)',
  fontSize: 13,
  fontWeight: 780,
};

const messageCard: CSSProperties = {
  border: '1px solid rgba(157,255,196,0.20)',
  borderRadius: 16,
  padding: 16,
  background: 'rgba(157,255,196,0.06)',
};

const messageText: CSSProperties = {
  margin: '8px 0 0',
  lineHeight: 1.55,
  color: '#dfffea',
};
