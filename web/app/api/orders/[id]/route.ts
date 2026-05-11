import { NextResponse } from 'next/server';
import {
  isDatabaseConfigured,
  isStudioRequest,
  ORDER_STATUSES,
  updateOrder,
  type OrderStatus,
} from '@/lib/orders';

export const runtime = 'nodejs';

const databaseMessage =
  'Database not configured yet. Add DATABASE_URL to enable order storage.';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const body = (await request.json()) as {
    status?: OrderStatus;
    production_notes?: string[];
  };

  if (
    body.status &&
    !ORDER_STATUSES.includes(body.status as OrderStatus)
  ) {
    return NextResponse.json(
      { message: 'Invalid order status.' },
      { status: 400 }
    );
  }

  const order = await updateOrder(id, {
    status: body.status,
    production_notes: Array.isArray(body.production_notes)
      ? body.production_notes
      : undefined,
  });

  if (!order) {
    return NextResponse.json(
      { message: 'Order not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}
