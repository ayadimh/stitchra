import { NextResponse } from 'next/server';
import {
  getOrderByPublicToken,
  getOrderErrorMessage,
  getStripeCheckoutPrice,
  isDatabaseConfigured,
  markStripeCheckoutPending,
} from '@/lib/orders';
import { getSiteUrl, getStripeClient } from '@/lib/stripe';

export const runtime = 'nodejs';

const publicTokenPattern = /^[A-Za-z0-9_-]{16,128}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatOrderValue(value: string) {
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

  return formatOrderValue(value);
}

function getTokenPrefix(token: string) {
  return token ? token.slice(0, 8) : 'missing';
}

export async function POST(request: Request) {
  let publicToken = '';

  try {
    const body = (await request.json().catch(() => ({}))) as {
      public_token?: unknown;
    };
    publicToken =
      typeof body.public_token === 'string'
        ? body.public_token.trim()
        : '';

    if (!publicTokenPattern.test(publicToken)) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { message: 'Payment service unavailable.' },
        { status: 503 }
      );
    }

    const order = await getOrderByPublicToken(publicToken);

    if (!order || order.public_token !== publicToken) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    if (order.customer_decision !== 'accepted') {
      return NextResponse.json(
        { message: 'Please accept the offer before payment.' },
        { status: 400 }
      );
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { message: 'Payment has already been received.' },
        { status: 409 }
      );
    }

    const price = getStripeCheckoutPrice(order);

    if (price === null || price <= 0) {
      return NextResponse.json(
        { message: 'No payable customer price is available for this order.' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const siteUrl = getSiteUrl();
    const description = [
      formatPlacement(order.placement),
      `${formatOrderValue(order.shirt_color)} shirt`,
      `Quantity ${order.quantity ?? 1}`,
    ].join(' · ');
    const customerEmail = order.customer_email.trim();
    const metadata = {
      order_id: order.id,
      public_token: publicToken,
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ...(emailPattern.test(customerEmail)
        ? { customer_email: customerEmail }
        : {}),
      client_reference_id: order.id,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Stitchra custom embroidery order',
              description,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata,
      payment_intent_data: {
        metadata,
      },
      success_url: `${siteUrl}/pay/${publicToken}?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pay/${publicToken}?cancelled=1`,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a Checkout URL.');
    }

    await markStripeCheckoutPending({
      public_token: publicToken,
      session_id: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[api.payments.create-checkout-session] failed', {
      token_prefix: getTokenPrefix(publicToken),
      error_message: getOrderErrorMessage(error),
    });

    return NextResponse.json(
      { message: 'Payment checkout could not be created.' },
      { status: 500 }
    );
  }
}
