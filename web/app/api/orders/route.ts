import { NextResponse } from 'next/server';
import {
  createOrder,
  isDatabaseConfigured,
  isStudioRequest,
  listOrders,
  type CreateOrderInput,
} from '@/lib/orders';

export const runtime = 'nodejs';

const databaseMessage =
  'Database not configured yet. Add DATABASE_URL to enable order storage.';

function hasRequiredOrderFields(
  value: Partial<CreateOrderInput>
): value is CreateOrderInput {
  return Boolean(
    value.customer_name?.trim() &&
      value.customer_email?.trim() &&
      value.placement &&
      value.shirt_color &&
      Number.isFinite(value.stitches) &&
      Number.isFinite(value.colors) &&
      Number.isFinite(value.coverage) &&
      value.pricing_tier
  );
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        databaseConfigured: false,
        message: databaseMessage,
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as Partial<CreateOrderInput>;

  if (!hasRequiredOrderFields(body)) {
    return NextResponse.json(
      { message: 'Missing required order information.' },
      { status: 400 }
    );
  }

  const order = await createOrder(body);

  if (!order) {
    return NextResponse.json(
      {
        databaseConfigured: false,
        message: databaseMessage,
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      order: {
        id: order.id,
        created_at: order.created_at,
        status: order.status,
      },
      message: 'Order request received.',
    },
    { status: 201 }
  );
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const orders = await listOrders(status);

  if (!orders) {
    return NextResponse.json(
      {
        databaseConfigured: false,
        message: databaseMessage,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ orders });
}
