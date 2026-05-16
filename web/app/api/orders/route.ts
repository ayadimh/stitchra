import { NextResponse } from 'next/server';
import {
  createOrder,
  getOrderErrorMessage,
  isDatabaseConfigured,
  isOfferEmailConfigured,
  isStudioRequest,
  listOrders,
  validatePublicOrderFields,
  type CreateOrderInput,
} from '@/lib/orders';

export const runtime = 'nodejs';

const databaseMessage = 'Database not configured.';

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
      Number.isFinite(value.coverage)
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateOrderInput>;
    const validationErrors = validatePublicOrderFields(body);

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        {
          message: 'Check the highlighted order fields.',
          errors: validationErrors,
        },
        { status: 400 }
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

    if (!hasRequiredOrderFields(body)) {
      return NextResponse.json(
        { message: 'Missing required quote information.' },
        { status: 400 }
      );
    }

    const order = await createOrder({
      customer_name: body.customer_name.trim(),
      customer_email: body.customer_email.trim(),
      customer_phone: body.customer_phone?.trim() || undefined,
      quantity: Number(body.quantity),
      note: body.note?.trim() || undefined,
      prompt: body.prompt?.trim() || undefined,
      placement: body.placement,
      shirt_color: body.shirt_color,
      logo_preview_url: body.logo_preview_url || undefined,
      design_config:
        body.design_config && typeof body.design_config === 'object'
          ? body.design_config
          : undefined,
      stitches: body.stitches,
      colors: body.colors,
      coverage: body.coverage,
      customer_price_eur: body.customer_price_eur,
      pricing_tier: body.pricing_tier,
      manual_quote: body.manual_quote,
      warnings: Array.isArray(body.warnings) ? body.warnings : [],
      recommendations: Array.isArray(body.recommendations)
        ? body.recommendations
        : [],
    });

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

export async function GET(request: Request) {
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

    return NextResponse.json({
      orders,
      emailConfigured: isOfferEmailConfigured(),
    });
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
