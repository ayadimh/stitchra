import { NextResponse } from 'next/server';
import {
  getOrderErrorMessage,
  getPublicOrderByToken,
  isDatabaseConfigured,
  updatePublicOrderDecision,
  type CustomerDecision,
} from '@/lib/orders';

export const runtime = 'nodejs';

const databaseMessage = 'Order service unavailable.';
const publicTokenPattern = /^[A-Za-z0-9_-]{16,128}$/;

function getTokenPrefix(token: string) {
  return token ? token.slice(0, 8) : 'missing';
}

function isCustomerDecision(
  value: unknown
): value is Exclude<CustomerDecision, 'pending'> {
  return (
    value === 'accepted' ||
    value === 'declined' ||
    value === 'change_requested' ||
    value === 'cancelled'
  );
}

function isPublicToken(value: string) {
  return publicTokenPattern.test(value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  let token = '';

  try {
    const resolvedParams = await params;
    token =
      typeof resolvedParams.token === 'string'
        ? resolvedParams.token.trim()
        : '';

    if (!isPublicToken(token)) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    if (!isDatabaseConfigured()) {
      console.error('[api.orders.public.GET] database not configured', {
        token_prefix: getTokenPrefix(token),
      });
      return NextResponse.json(
        {
          message: databaseMessage,
        },
        { status: 500 }
      );
    }

    const order = await getPublicOrderByToken(token);

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('[api.orders.public.GET] public order lookup failed', {
      token_prefix: getTokenPrefix(token),
      error_message: getOrderErrorMessage(error),
    });

    return NextResponse.json(
      {
        message: 'Order lookup error.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  let token = '';

  try {
    const resolvedParams = await params;
    token =
      typeof resolvedParams.token === 'string'
        ? resolvedParams.token.trim()
        : '';

    if (!isPublicToken(token)) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    if (!isDatabaseConfigured()) {
      console.error('[api.orders.public.PATCH] database not configured', {
        token_prefix: getTokenPrefix(token),
      });
      return NextResponse.json(
        {
          message: databaseMessage,
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      decision?: unknown;
      proposed_price_eur?: unknown;
      requested_quantity?: unknown;
      customer_change_note?: unknown;
      wants_logo_change?: unknown;
    };

    if (!isCustomerDecision(body.decision)) {
      return NextResponse.json(
        { message: 'Decision must be accepted, declined, changed, or cancelled.' },
        { status: 400 }
      );
    }

    const errors: Record<string, string> = {};
    const proposedPrice =
      body.proposed_price_eur === null ||
      body.proposed_price_eur === undefined ||
      body.proposed_price_eur === ''
        ? null
        : Number(body.proposed_price_eur);
    const requestedQuantity =
      body.requested_quantity === null ||
      body.requested_quantity === undefined ||
      body.requested_quantity === ''
        ? null
        : Number(body.requested_quantity);
    const changeNote =
      typeof body.customer_change_note === 'string'
        ? body.customer_change_note.trim()
        : '';

    if (
      proposedPrice !== null &&
      (!Number.isFinite(proposedPrice) || proposedPrice <= 0)
    ) {
      errors.proposed_price_eur =
        'Proposed price must be greater than 0.';
    }

    if (
      requestedQuantity !== null &&
      (!Number.isInteger(requestedQuantity) || requestedQuantity < 1)
    ) {
      errors.requested_quantity =
        'Requested quantity must be at least 1.';
    }

    if (body.decision === 'change_requested' && !changeNote) {
      errors.customer_change_note =
        'Add a note for the studio before requesting changes.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          message: 'Check the highlighted change request fields.',
          errors,
        },
        { status: 400 }
      );
    }

    const order = await updatePublicOrderDecision(
      token,
      {
        decision: body.decision,
        proposed_price_eur: proposedPrice,
        requested_quantity: requestedQuantity,
        customer_change_note: changeNote,
        wants_logo_change: Boolean(body.wants_logo_change),
      }
    );

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('[api.orders.public.PATCH] public order update failed', {
      token_prefix: getTokenPrefix(token),
      error_message: getOrderErrorMessage(error),
    });

    return NextResponse.json(
      {
        message: 'Order update error.',
      },
      { status: 500 }
    );
  }
}
