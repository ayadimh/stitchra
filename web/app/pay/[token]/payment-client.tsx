'use client';

import { useState, type CSSProperties } from 'react';

type CheckoutPayload = {
  url?: string;
  message?: string;
};

export function PaymentCheckoutButton({
  publicToken,
}: {
  publicToken: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        '/api/payments/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public_token: publicToken }),
        }
      );
      const payload = (await response
        .json()
        .catch(() => ({}))) as CheckoutPayload;

      if (!response.ok || !payload.url) {
        throw new Error(
          payload.message ?? 'Stripe checkout could not be opened.'
        );
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Stripe checkout could not be opened.'
      );
      setLoading(false);
    }
  };

  return (
    <div style={checkoutAction}>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        style={{
          ...primaryButton,
          opacity: loading ? 0.72 : 1,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Opening Stripe...' : 'Pay securely with Stripe'}
      </button>
      {error && <p style={errorText}>{error}</p>}
    </div>
  );
}

const checkoutAction: CSSProperties = {
  display: 'grid',
  gap: 12,
};

const primaryButton: CSSProperties = {
  width: '100%',
  minHeight: 56,
  border: 0,
  borderRadius: 16,
  padding: '16px 18px',
  background: 'linear-gradient(135deg, #00ff88, #00c8ff)',
  color: '#04100b',
  fontSize: 15,
  fontWeight: 900,
  boxShadow: '0 18px 44px rgba(0,255,136,0.18)',
  transform: 'translateY(0)',
};

const errorText: CSSProperties = {
  margin: 0,
  color: '#ffb4b4',
  lineHeight: 1.5,
  fontWeight: 760,
};
