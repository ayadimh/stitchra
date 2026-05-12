import { NextResponse } from 'next/server';
import {
  getOrderErrorMessage,
  getPublicOrderByToken,
  isDatabaseConfigured,
  updatePublicOrderDecision,
  type CustomerDecision,
} from '@/lib/orders';

export const runtime = 'nodejs';

const databaseMessage = 'Database not configured.';
const publicTokenPattern = /^[A-Za-z0-9_-]{16,128}$/;

function isCustomerDecision(
  value: unknown
): value is Exclude<CustomerDecision, 'pending'> {
  return value === 'accepted' || value === 'declined';
}

function isPublicToken(value: string) {
  return publicTokenPattern.test(value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          databaseConfigured: false,
          message: databaseMessage,
        },
        { status: 503 }
      );
    }

    const { token } = await params;

    if (!isPublicToken(token)) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
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
    return NextResponse.json(
      {
        message: 'Order lookup error.',
        details: getOrderErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          databaseConfigured: false,
          message: databaseMessage,
        },
        { status: 503 }
      );
    }

    const { token } = await params;

    if (!isPublicToken(token)) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { decision?: unknown };

    if (!isCustomerDecision(body.decision)) {
      return NextResponse.json(
        { message: 'Decision must be accepted or declined.' },
        { status: 400 }
      );
    }

    const order = await updatePublicOrderDecision(
      token,
      body.decision
    );

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Order update error.',
        details: getOrderErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
