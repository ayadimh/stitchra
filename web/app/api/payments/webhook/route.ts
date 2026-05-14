import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  getOrderErrorMessage,
  markStripeCheckoutFailed,
  markStripeCheckoutPaid,
} from '@/lib/orders';
import { getStripeClient } from '@/lib/stripe';

export const runtime = 'nodejs';

function getPublicTokenFromMetadata(
  metadata: Stripe.Metadata | null | undefined
) {
  const token = metadata?.public_token;

  return typeof token === 'string' && token.trim()
    ? token.trim()
    : null;
}

async function markPaidFromSession(session: Stripe.Checkout.Session) {
  const publicToken = getPublicTokenFromMetadata(session.metadata);

  if (!publicToken) {
    console.warn('[api.payments.webhook] completed session missing token', {
      session_id: session.id,
    });
    return;
  }

  await markStripeCheckoutPaid({
    public_token: publicToken,
    session_id: session.id,
  });
}

async function markFailedFromSession(session: Stripe.Checkout.Session) {
  const publicToken = getPublicTokenFromMetadata(session.metadata);

  if (!publicToken) {
    console.warn('[api.payments.webhook] expired session missing token', {
      session_id: session.id,
    });
    return;
  }

  await markStripeCheckoutFailed({
    public_token: publicToken,
    session_id: session.id,
  });
}

async function markFailedFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
) {
  const publicToken = getPublicTokenFromMetadata(paymentIntent.metadata);

  if (!publicToken) {
    console.warn('[api.payments.webhook] failed payment intent missing token', {
      payment_intent_id: paymentIntent.id,
    });
    return;
  }

  await markStripeCheckoutFailed({
    public_token: publicToken,
    session_id: null,
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { message: 'Stripe webhook is not configured.' },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripeClient();
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Add the live webhook endpoint in Stripe Dashboard before switching to live keys.
    if (event.type === 'checkout.session.completed') {
      await markPaidFromSession(
        event.data.object as Stripe.Checkout.Session
      );
    }

    if (event.type === 'checkout.session.expired') {
      await markFailedFromSession(
        event.data.object as Stripe.Checkout.Session
      );
    }

    if (event.type === 'payment_intent.payment_failed') {
      await markFailedFromPaymentIntent(
        event.data.object as Stripe.PaymentIntent
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[api.payments.webhook] failed', {
      error_message: getOrderErrorMessage(error),
    });

    return NextResponse.json(
      { message: 'Stripe webhook error.' },
      { status: 400 }
    );
  }
}
