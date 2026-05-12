'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type {
  CustomerDecision,
  PublicOrderRecord,
} from '@/lib/orders';

const statusLabels: Record<PublicOrderRecord['status'], string> = {
  new: 'New request',
  needs_review: 'Needs review',
  approved: 'Approved',
  offer_sent: 'Offer sent',
  customer_accepted: 'Customer accepted',
  pre_production: 'Pre-production',
  sent_to_production: 'In production',
  customer_declined: 'Customer declined',
  team_declined: 'Team declined',
  completed: 'Completed',
};

const decisionLabels: Record<CustomerDecision, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
};

const paymentLabels: Record<PublicOrderRecord['payment_status'], string> = {
  unpaid: 'Unpaid',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

function formatMoney(value: number | null) {
  return value === null ? 'Pending' : `€${value.toFixed(2)}`;
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

export function OrderResponseClient({
  initialOrder,
}: {
  initialOrder: PublicOrderRecord;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [submittingDecision, setSubmittingDecision] =
    useState<CustomerDecision | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const paymentHref = `/pay/${order.public_token}`;

  const submitDecision = async (
    decision: Exclude<CustomerDecision, 'pending'>
  ) => {
    setMessage('');
    setError('');
    setSubmittingDecision(decision);

    try {
      const response = await fetch(
        `/api/orders/public/${order.public_token}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ decision }),
        }
      );
      const payload = (await response
        .json()
        .catch(() => ({}))) as {
        order?: PublicOrderRecord;
        message?: string;
        details?: string;
      };

      if (!response.ok || !payload.order) {
        setError(
          payload.details ??
            payload.message ??
            'Could not save your response.'
        );
        return;
      }

      setOrder(payload.order);
      setMessage(
        decision === 'accepted'
          ? 'Offer accepted. The studio will follow up with next steps.'
          : 'Offer declined. The studio has received your response.'
      );
    } catch {
      setError('Could not save your response.');
    } finally {
      setSubmittingDecision(null);
    }
  };

  return (
    <main style={pageShell}>
      <section style={layout}>
        <div style={summaryPanel}>
          <p style={eyebrow}>Order status</p>
          <h1 style={title}>Your Stitchra offer</h1>
          <div style={statusRow}>
            <span style={statusBadge}>
              {statusLabels[order.status]}
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
        </div>

        <div style={detailPanel}>
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
              label="Original price"
              value={formatMoney(order.customer_price_eur)}
            />
            {order.revised_price_eur !== null && (
              <Detail
                label="Final offer price"
                value={formatMoney(order.revised_price_eur)}
              />
            )}
          </div>

          {order.team_message && (
            <div style={messageCard}>
              <span style={detailLabel}>Message from the studio</span>
              <p style={messageText}>{order.team_message}</p>
            </div>
          )}

          {order.payment_status === 'paid' && (
            <p style={successText}>
              Payment received. Thank you.
            </p>
          )}

          {order.payment_status !== 'paid' &&
            order.customer_decision === 'pending' && (
              <div style={actionRow}>
                <button
                  type="button"
                  onClick={() => void submitDecision('accepted')}
                  disabled={submittingDecision !== null}
                  style={{
                    ...primaryButton,
                    opacity: submittingDecision ? 0.68 : 1,
                  }}
                >
                  {submittingDecision === 'accepted'
                    ? 'Accepting...'
                    : 'Accept offer'}
                </button>
                <button
                  type="button"
                  onClick={() => void submitDecision('declined')}
                  disabled={submittingDecision !== null}
                  style={{
                    ...secondaryButton,
                    opacity: submittingDecision ? 0.68 : 1,
                  }}
                >
                  {submittingDecision === 'declined'
                    ? 'Declining...'
                    : 'Decline offer'}
                </button>
              </div>
            )}

          {order.payment_status !== 'paid' &&
            order.customer_decision === 'accepted' && (
              <a href={paymentHref} style={payButton}>
                Pay now
              </a>
            )}

          {order.payment_status !== 'paid' &&
            order.customer_decision === 'declined' && (
              <p style={errorText}>
                Offer declined. The studio has received your response.
              </p>
            )}

          {message && <p style={successText}>{message}</p>}
          {error && <p style={errorText}>{error}</p>}
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

const statusRow: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  margin: '24px 0 20px',
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
      : decision === 'declined'
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
  minHeight: 340,
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

const actionRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};

const primaryButton: CSSProperties = {
  border: 0,
  borderRadius: 16,
  padding: '14px 18px',
  background: 'linear-gradient(135deg, #00ff88, #00c8ff)',
  color: '#03100d',
  fontSize: 15,
  fontWeight: 850,
  cursor: 'pointer',
};

const payButton: CSSProperties = {
  ...primaryButton,
  display: 'block',
  textAlign: 'center',
  textDecoration: 'none',
  fontSize: 17,
  padding: '17px 22px',
};

const secondaryButton: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 16,
  padding: '13px 18px',
  color: '#f5f7f8',
  background: 'rgba(255,255,255,0.045)',
  fontWeight: 800,
  cursor: 'pointer',
};

const mutedText: CSSProperties = {
  color: 'rgba(245,247,248,0.62)',
  lineHeight: 1.55,
};

const successText: CSSProperties = {
  color: '#9dffc4',
  margin: 0,
};

const errorText: CSSProperties = {
  color: '#ffb4b4',
  margin: 0,
};
