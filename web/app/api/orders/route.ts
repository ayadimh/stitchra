import { NextResponse } from 'next/server';
import {
  createOrder,
  getOrderErrorMessage,
  isDatabaseConfigured,
  isOfferEmailConfigured,
  isStudioRequest,
  listOrders,
  notifyTeamOfNewOrderRequest,
  sendCustomerOrderRequestConfirmation,
  validatePublicOrderFields,
  type CreateOrderInput,
} from '@/lib/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const databaseMessage = 'Database not configured.';
const previewNotConfiguredMessage =
  'This preview deployment is not fully configured. Please test the live site at stitchra.com.';
const requiredDatabaseEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;
const studioOrdersTimeoutMs = 9_000;

function isPreviewDeployment() {
  return process.env.VERCEL_ENV === 'preview';
}

function getDatabaseConfigStatus() {
  return {
    supabaseUrlPresent: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    ),
    serviceRolePresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Studio orders request timed out after ${timeoutMs / 1000}s.`
        )
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

function getSafeStudioOrdersFailure(error: unknown) {
  const message = getOrderErrorMessage(error).toLowerCase();

  if (message.includes('timed out') || message.includes('timeout')) {
    return {
      code: 'STUDIO_ORDERS_TIMEOUT',
      message: 'Orders took too long to load. Try again.',
      reason: 'timeout',
      status: 504,
    };
  }

  return {
    code: 'STUDIO_ORDERS_FAILED',
    message: 'Could not load orders.',
    reason: 'storage_error',
    status: 500,
  };
}

function getPublicDatabaseUnavailablePayload() {
  return {
    code: isPreviewDeployment()
      ? 'PREVIEW_NOT_CONFIGURED'
      : 'DATABASE_NOT_CONFIGURED',
    databaseConfigured: false,
    message: isPreviewDeployment()
      ? previewNotConfiguredMessage
      : databaseMessage,
    requiredEnvironmentVariables: requiredDatabaseEnvVars,
  };
}

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
        getPublicDatabaseUnavailablePayload(),
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
        getPublicDatabaseUnavailablePayload(),
        { status: 503 }
      );
    }

    const [, customerConfirmation] = await Promise.all([
      notifyTeamOfNewOrderRequest(order),
      sendCustomerOrderRequestConfirmation(order),
    ]);

    return NextResponse.json(
      {
        order: {
          id: order.id,
          created_at: order.created_at,
          status: order.status,
        },
        message: 'Order request received.',
        customerConfirmationSent: customerConfirmation.ok,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      '[api/orders] Public order request failed:',
      getOrderErrorMessage(error)
    );

    return NextResponse.json(
      {
        message: isPreviewDeployment()
          ? previewNotConfiguredMessage
          : 'Could not submit this quote request right now.',
        code: isPreviewDeployment()
          ? 'PREVIEW_NOT_CONFIGURED'
          : 'ORDER_REQUEST_FAILED',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const startedAt = Date.now();

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
    const orders = await withTimeout(
      listOrders(status),
      studioOrdersTimeoutMs
    );

    if (!orders) {
      const durationMs = Date.now() - startedAt;
      console.error('Studio orders failed', {
        reason: 'database_not_configured',
        durationMs,
        ...getDatabaseConfigStatus(),
      });

      return NextResponse.json(
        {
          databaseConfigured: false,
          message: databaseMessage,
        },
        { status: 503 }
      );
    }

    console.info('Studio orders loaded', {
      durationMs: Date.now() - startedAt,
      count: orders.length,
    });

    return NextResponse.json({
      orders,
      emailConfigured: isOfferEmailConfigured(),
    });
  } catch (error) {
    const failure = getSafeStudioOrdersFailure(error);

    console.error('Studio orders failed', {
      reason: failure.reason,
      durationMs: Date.now() - startedAt,
      ...getDatabaseConfigStatus(),
    });

    return NextResponse.json(
      {
        message: failure.message,
        code: failure.code,
      },
      { status: failure.status }
    );
  }
}
