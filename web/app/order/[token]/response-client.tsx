'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { OrderMannequinPreview } from '@/components/OrderMannequinPreview';
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

const processSteps = [
  ['1', 'Review offer'],
  ['2', 'Accept or decline'],
  ['3', 'Secure payment'],
  ['4', 'Production starts'],
  ['5', 'Delivery or pickup'],
] as const;

const trustCards = [
  'No production before approval',
  'Secure private offer link',
  'Transparent final price',
  'Studio checks every design',
] as const;

const faqItems = [
  [
    'Can I request a change?',
    'Contact the studio before approving and we will review the request.',
  ],
  [
    'When does production start?',
    'Production starts only after offer approval and payment confirmation.',
  ],
  [
    'Is payment live now?',
    'Secure checkout is being prepared. This page keeps your offer ready for payment.',
  ],
] as const;

function formatMoney(value: number | null) {
  return value === null ? 'Pending' : `€${value.toFixed(2)}`;
}

function formatValue(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPlacement(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === 'left' || normalized.includes('left')) {
    return 'Left chest';
  }

  if (normalized === 'center' || normalized.includes('center')) {
    return 'Center front';
  }

  return formatValue(value);
}

function getPaymentLabel(order: PublicOrderRecord) {
  if (order.payment_status === 'paid') {
    return 'Paid';
  }

  if (order.customer_decision === 'accepted') {
    return 'Payment pending';
  }

  return paymentLabels[order.payment_status];
}

function getFinalPrice(order: PublicOrderRecord) {
  return order.revised_price_eur ?? order.customer_price_eur;
}

function getFinalPriceLabel(order: PublicOrderRecord) {
  const finalPrice = getFinalPrice(order);

  if (order.manual_quote && finalPrice === null) {
    return 'Manual quote pending';
  }

  return formatMoney(finalPrice);
}

function shouldShowOriginalPrice(order: PublicOrderRecord) {
  return (
    order.revised_price_eur !== null &&
    order.customer_price_eur !== null &&
    order.revised_price_eur !== order.customer_price_eur
  );
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
  const finalPrice = getFinalPrice(order);
  const hasFinalOfferPrice = finalPrice !== null;
  const paymentReceived = order.payment_status === 'paid';
  const showDecisionActions =
    !paymentReceived && order.customer_decision === 'pending';
  const showPayAction =
    !paymentReceived &&
    order.customer_decision === 'accepted' &&
    hasFinalOfferPrice;
  const showAcceptedPendingPrice =
    !paymentReceived &&
    order.customer_decision === 'accepted' &&
    !hasFinalOfferPrice;
  const showDeclinedMessage =
    !paymentReceived && order.customer_decision === 'declined';

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
          ? 'Your offer is accepted. Continue to secure payment.'
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
      <OfferPageStyles />

      <section style={heroSection}>
        <Link href="/" style={brandLink}>
          <span style={brandMark}>S</span>
          <span>Stitchra</span>
        </Link>
        <div style={heroCopy}>
          <p style={eyebrow}>Private studio offer</p>
          <h1 style={title}>Your custom embroidery offer</h1>
          <p style={subtitle}>
            Review your design, price and production details before we
            start stitching.
          </p>
        </div>
        <div style={statusRow}>
          <span style={statusBadge('cyan')}>
            Offer: {statusLabels[order.status]}
          </span>
          <span style={statusBadge(order.customer_decision)}>
            Response: {decisionLabels[order.customer_decision]}
          </span>
          <span style={statusBadge(order.payment_status)}>
            Payment: {getPaymentLabel(order)}
          </span>
        </div>
      </section>

      <section className="offer-main-grid" style={mainGrid}>
        <section style={previewCard}>
          <div style={sectionHeader}>
            <div>
              <p style={eyebrow}>Artwork preview</p>
              <h2 style={sectionTitle}>Logo on shirt preview</h2>
            </div>
            <span style={pill}>
              {formatPlacement(order.placement)}
            </span>
          </div>
          <OrderMannequinPreview
            logoUrl={order.logo_preview_url}
            shirtColor={order.shirt_color}
            placement={order.placement}
          />
          <p style={captionText}>
            Preview is illustrative. Final embroidery may vary slightly
            depending on thread and fabric.
          </p>
        </section>

        <aside style={summaryCard}>
          <div style={pricePanel}>
            <span style={detailLabel}>Final offer price</span>
            <strong style={priceText}>
              {getFinalPriceLabel(order)}
            </strong>
            {order.manual_quote && hasFinalOfferPrice && (
              <span style={studioQuoteBadge}>
                Studio-reviewed quote
              </span>
            )}
            {order.manual_quote && !hasFinalOfferPrice && (
              <p style={mutedText}>
                The studio is reviewing this design and will confirm
                the final offer before payment.
              </p>
            )}
          </div>

          <div style={detailGrid}>
            {shouldShowOriginalPrice(order) && (
              <Detail
                label="Original price"
                value={formatMoney(order.customer_price_eur)}
              />
            )}
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
              label="Status"
              value={statusLabels[order.status]}
            />
            <Detail
              label="Customer response"
              value={decisionLabels[order.customer_decision]}
            />
            <Detail
              label="Payment status"
              value={getPaymentLabel(order)}
            />
          </div>

          {order.team_message && (
            <div style={studioMessageCard}>
              <span style={detailLabel}>Message from the studio</span>
              <p style={messageText}>{order.team_message}</p>
            </div>
          )}

          <div style={actionCard}>
            {paymentReceived && (
              <p style={successText}>
                Payment received. Thank you.
              </p>
            )}

            {showDecisionActions && (
              <>
                <p style={mutedText}>
                  No payment is taken until you accept.
                </p>
                <div style={actionRow}>
                  <button
                    type="button"
                    className="offer-action-button offer-primary-button"
                    onClick={() => void submitDecision('accepted')}
                    disabled={submittingDecision !== null}
                    style={primaryButton}
                  >
                    {submittingDecision === 'accepted'
                      ? 'Accepting...'
                      : 'Accept offer'}
                  </button>
                  <button
                    type="button"
                    className="offer-action-button offer-secondary-button"
                    onClick={() => void submitDecision('declined')}
                    disabled={submittingDecision !== null}
                    style={secondaryButton}
                  >
                    {submittingDecision === 'declined'
                      ? 'Declining...'
                      : 'Decline offer'}
                  </button>
                </div>
              </>
            )}

            {showPayAction && (
              <>
                <p style={mutedText}>
                  Your offer is accepted. Continue to secure payment.
                </p>
                <Link
                  href={paymentHref}
                  className="offer-action-button offer-primary-button"
                  style={payButton}
                >
                  Pay now
                </Link>
              </>
            )}

            {showAcceptedPendingPrice && (
              <p style={successText}>
                Your offer is accepted. The studio will confirm the
                final offer before payment.
              </p>
            )}

            {showDeclinedMessage && (
              <p style={errorText}>
                Offer declined. The studio has received your response.
              </p>
            )}

            {message && <p style={successText}>{message}</p>}
            {error && <p style={errorText}>{error}</p>}
          </div>
        </aside>
      </section>

      <section style={contentSection}>
        <div style={sectionHeader}>
          <div>
            <p style={eyebrow}>What happens next</p>
            <h2 style={sectionTitle}>A clear path to production</h2>
          </div>
        </div>
        <div style={timelineGrid}>
          {processSteps.map(([number, label]) => (
            <div key={number} style={timelineCard}>
              <span style={stepNumber}>{number}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </section>

      <section style={contentSection}>
        <div style={trustGrid}>
          {trustCards.map((item) => (
            <div key={item} style={trustCard}>
              <span style={trustIcon} />
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <section style={contentSection}>
        <div style={sectionHeader}>
          <div>
            <p style={eyebrow}>FAQ</p>
            <h2 style={sectionTitle}>Before you approve</h2>
          </div>
        </div>
        <div style={faqGrid}>
          {faqItems.map(([question, answer]) => (
            <div key={question} style={faqCard}>
              <strong>{question}</strong>
              <p style={mutedText}>{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={contactStrip}>
        <div>
          <p style={eyebrow}>Questions?</p>
          <h2 style={sectionTitle}>The Stitchra studio can help.</h2>
          <p style={mutedText}>
            Contact us if you need a change before approving your
            embroidery offer.
          </p>
        </div>
        <Link
          href="/contact"
          className="offer-action-button offer-secondary-button"
          style={contactButton}
        >
          Contact
        </Link>
      </section>

      <footer style={footer}>
        <Link href="/" style={footerLink}>
          Back to Stitchra
        </Link>
        <Link href="/contact" style={footerLink}>
          Contact
        </Link>
        <Link href="/privacy" style={footerLink}>
          Privacy
        </Link>
        <Link href="/terms" style={footerLink}>
          Terms
        </Link>
      </footer>
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
      <span style={detailLabel}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function statusBadge(
  tone: CustomerDecision | PublicOrderRecord['payment_status'] | 'cyan'
): CSSProperties {
  const color =
    tone === 'accepted' || tone === 'paid'
      ? '#9dffc4'
      : tone === 'declined' || tone === 'failed'
        ? '#ffb4b4'
        : tone === 'pending' || tone === 'unpaid'
          ? '#ffe083'
          : '#9ee8ff';

  return {
    border: `1px solid ${color}44`,
    borderRadius: 999,
    background: `${color}14`,
    color,
    padding: '9px 12px',
    fontSize: 13,
    fontWeight: 850,
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 36,
  };
}

function OfferPageStyles() {
  return (
    <style>
      {`
        .offer-action-button {
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, opacity 160ms ease;
          min-height: 52px;
        }

        .offer-action-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 18px 50px rgba(0,255,136,0.18), 0 0 34px rgba(0,200,255,0.12);
        }

        .offer-action-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .offer-action-button:disabled {
          cursor: not-allowed;
          opacity: 0.62;
          box-shadow: none;
        }

        .offer-main-grid {
          grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
        }

        @media (max-width: 980px) {
          .offer-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .offer-action-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}
    </style>
  );
}

const pageShell: CSSProperties = {
  minHeight: '100vh',
  padding: '32px clamp(16px, 4vw, 64px) 28px',
  background:
    'radial-gradient(circle at 18% 10%, rgba(0,255,136,0.14), transparent 28%), radial-gradient(circle at 86% 16%, rgba(0,200,255,0.12), transparent 30%), radial-gradient(circle at 50% 92%, rgba(0,255,240,0.08), transparent 36%), #050607',
  color: '#f5f7f8',
  fontFamily:
    'var(--font-geist-sans), Inter, "Helvetica Neue", Arial, sans-serif',
};

const heroSection: CSSProperties = {
  width: 'min(1240px, 100%)',
  margin: '0 auto 24px',
  display: 'grid',
  gap: 20,
};

const brandLink: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  alignItems: 'center',
  gap: 10,
  color: '#f5f7f8',
  textDecoration: 'none',
  fontWeight: 900,
};

const brandMark: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  display: 'grid',
  placeItems: 'center',
  background: 'linear-gradient(135deg, #00ff88, #00c8ff)',
  color: '#03100d',
  fontWeight: 950,
};

const heroCopy: CSSProperties = {
  maxWidth: 780,
};

const eyebrow: CSSProperties = {
  color: '#9dffc4',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: 0,
  textTransform: 'uppercase',
  margin: '0 0 10px',
};

const title: CSSProperties = {
  margin: 0,
  maxWidth: 820,
  fontSize: 'clamp(42px, 7vw, 86px)',
  lineHeight: 0.98,
};

const subtitle: CSSProperties = {
  margin: '16px 0 0',
  maxWidth: 680,
  color: 'rgba(245,247,248,0.70)',
  fontSize: 'clamp(17px, 2vw, 21px)',
  lineHeight: 1.5,
};

const statusRow: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const mainGrid: CSSProperties = {
  width: 'min(1240px, 100%)',
  margin: '0 auto',
  display: 'grid',
  gap: 22,
  alignItems: 'start',
};

const glassCard: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 30,
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))',
  boxShadow: '0 30px 90px rgba(0,0,0,0.34)',
  backdropFilter: 'blur(18px)',
};

const previewCard: CSSProperties = {
  ...glassCard,
  padding: 'clamp(18px, 3vw, 28px)',
};

const summaryCard: CSSProperties = {
  ...glassCard,
  padding: 'clamp(20px, 3vw, 30px)',
  display: 'grid',
  gap: 18,
};

const sectionHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 18,
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(25px, 3vw, 34px)',
  lineHeight: 1.08,
};

const pill: CSSProperties = {
  border: '1px solid rgba(157,255,196,0.24)',
  borderRadius: 999,
  padding: '9px 12px',
  color: '#9dffc4',
  background: 'rgba(157,255,196,0.07)',
  fontSize: 13,
  fontWeight: 850,
};

const captionText: CSSProperties = {
  margin: '14px 0 0',
  color: 'rgba(245,247,248,0.56)',
  fontSize: 13,
  lineHeight: 1.5,
};

const pricePanel: CSSProperties = {
  border: '1px solid rgba(0,255,136,0.22)',
  borderRadius: 22,
  padding: 18,
  background:
    'linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,200,255,0.08))',
  display: 'grid',
  gap: 8,
};

const priceText: CSSProperties = {
  fontSize: 'clamp(40px, 6vw, 64px)',
  lineHeight: 1,
};

const studioQuoteBadge: CSSProperties = {
  width: 'fit-content',
  border: '1px solid rgba(255,224,131,0.28)',
  borderRadius: 999,
  padding: '8px 10px',
  color: '#ffe083',
  background: 'rgba(255,224,131,0.08)',
  fontSize: 12,
  fontWeight: 850,
};

const detailGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 12,
};

const detailCard: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(0,0,0,0.22)',
  display: 'grid',
  gap: 7,
};

const detailLabel: CSSProperties = {
  color: 'rgba(245,247,248,0.62)',
  fontSize: 13,
  fontWeight: 780,
};

const studioMessageCard: CSSProperties = {
  border: '1px solid rgba(157,255,196,0.22)',
  borderRadius: 20,
  padding: 18,
  background:
    'linear-gradient(135deg, rgba(157,255,196,0.08), rgba(0,200,255,0.05))',
};

const messageText: CSSProperties = {
  margin: '8px 0 0',
  lineHeight: 1.6,
  color: '#dfffea',
};

const actionCard: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 20,
  padding: 18,
  background: 'rgba(0,0,0,0.24)',
  display: 'grid',
  gap: 14,
};

const actionRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};

const primaryButton: CSSProperties = {
  border: 0,
  borderRadius: 16,
  padding: '15px 20px',
  background: 'linear-gradient(135deg, #00ff88, #00c8ff)',
  color: '#03100d',
  fontSize: 16,
  fontWeight: 900,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
};

const secondaryButton: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 16,
  padding: '14px 18px',
  color: '#f5f7f8',
  background: 'rgba(255,255,255,0.05)',
  fontSize: 15,
  fontWeight: 850,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const payButton: CSSProperties = {
  ...primaryButton,
  width: '100%',
  fontSize: 18,
  padding: '18px 22px',
};

const contentSection: CSSProperties = {
  width: 'min(1240px, 100%)',
  margin: '24px auto 0',
};

const timelineGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
};

const timelineCard: CSSProperties = {
  ...glassCard,
  padding: 16,
  display: 'grid',
  gap: 12,
};

const stepNumber: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  display: 'grid',
  placeItems: 'center',
  background: 'linear-gradient(135deg, #00ff88, #00c8ff)',
  color: '#03100d',
  fontWeight: 950,
};

const trustGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 12,
};

const trustCard: CSSProperties = {
  ...glassCard,
  padding: 18,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const trustIcon: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  background: '#9dffc4',
  boxShadow: '0 0 24px rgba(157,255,196,0.50)',
  flex: '0 0 auto',
};

const faqGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 12,
};

const faqCard: CSSProperties = {
  ...glassCard,
  padding: 18,
  display: 'grid',
  gap: 10,
};

const contactStrip: CSSProperties = {
  ...glassCard,
  width: 'min(1240px, 100%)',
  margin: '24px auto 0',
  padding: 'clamp(20px, 3vw, 30px)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
};

const contactButton: CSSProperties = {
  ...secondaryButton,
  textDecoration: 'none',
};

const footer: CSSProperties = {
  width: 'min(1240px, 100%)',
  margin: '22px auto 0',
  padding: '12px 0 0',
  display: 'flex',
  gap: 14,
  flexWrap: 'wrap',
  color: 'rgba(245,247,248,0.56)',
  fontSize: 13,
};

const footerLink: CSSProperties = {
  color: 'inherit',
  textDecoration: 'none',
};

const mutedText: CSSProperties = {
  color: 'rgba(245,247,248,0.66)',
  lineHeight: 1.55,
  margin: 0,
};

const successText: CSSProperties = {
  color: '#9dffc4',
  margin: 0,
  lineHeight: 1.55,
};

const errorText: CSSProperties = {
  color: '#ffb4b4',
  margin: 0,
  lineHeight: 1.55,
};
