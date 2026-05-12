import { NextResponse } from 'next/server';
import {
  getOrderErrorMessage,
  isDatabaseConfigured,
  isStudioRequest,
  ORDER_STATUSES,
  updateOrder,
  type OrderStatus,
} from '@/lib/orders';

export const runtime = 'nodejs';

const databaseMessage = 'Database not configured.';

type OrderPatchBody = {
  status?: OrderStatus;
  production_notes?: unknown;
  team_message?: unknown;
  revised_price_eur?: unknown;
  customer_price_eur?: unknown;
  quantity?: unknown;
};

function hasOwn(
  value: object,
  key: string
): value is Record<string, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function parseNullableMoney(value: unknown) {
  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isStudioRequest(request)) {
      return NextResponse.json(
        { message: 'Studio passcode required.' },
        { status: 401 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          databaseConfigured: false,
          message: databaseMessage,
        },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as OrderPatchBody;

    if (
      body.status &&
      !ORDER_STATUSES.includes(body.status as OrderStatus)
    ) {
      return NextResponse.json(
        { message: 'Invalid order status.' },
        { status: 400 }
      );
    }

    const errors: Record<string, string> = {};
    const updates: Parameters<typeof updateOrder>[1] = {};

    if (body.status) {
      updates.status = body.status;
    }

    if (hasOwn(body, 'production_notes')) {
      if (!Array.isArray(body.production_notes)) {
        errors.production_notes = 'Production notes must be a list.';
      } else {
        updates.production_notes = body.production_notes.map(String);
      }
    }

    if (hasOwn(body, 'team_message')) {
      if (
        body.team_message !== null &&
        typeof body.team_message !== 'string'
      ) {
        errors.team_message = 'Team message must be text.';
      } else {
        updates.team_message =
          typeof body.team_message === 'string'
            ? body.team_message.trim() || null
            : null;
      }
    }

    if (hasOwn(body, 'revised_price_eur')) {
      const revisedPrice = parseNullableMoney(body.revised_price_eur);

      if (revisedPrice === undefined) {
        errors.revised_price_eur =
          'Revised price must be a non-negative number.';
      } else {
        updates.revised_price_eur = revisedPrice;
      }
    }

    if (hasOwn(body, 'customer_price_eur')) {
      const customerPrice = parseNullableMoney(body.customer_price_eur);

      if (customerPrice === undefined) {
        errors.customer_price_eur =
          'Customer price must be a non-negative number.';
      } else {
        updates.customer_price_eur = customerPrice;
      }
    }

    if (hasOwn(body, 'quantity')) {
      const quantity = Number(body.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        errors.quantity = 'Quantity must be at least 1.';
      } else {
        updates.quantity = quantity;
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          message: 'Check the highlighted order fields.',
          errors,
        },
        { status: 400 }
      );
    }

    const order = await updateOrder(id, updates);

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
        message: 'Order storage error.',
        details: getOrderErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
