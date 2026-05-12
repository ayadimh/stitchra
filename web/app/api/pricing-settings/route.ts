import { NextResponse } from 'next/server';
import {
  getOrderErrorMessage,
  getPricingSettings,
  isDatabaseConfigured,
  isStudioRequest,
  savePricingSettings,
} from '@/lib/orders';
import { normalizePricingSettings } from '@/lib/pricing';

export const runtime = 'nodejs';

const databaseMessage = 'Database not configured.';

export async function GET(request: Request) {
  try {
    if (!isStudioRequest(request)) {
      return NextResponse.json(
        { message: 'Studio passcode required.' },
        { status: 401 }
      );
    }

    const settings = await getPricingSettings();

    return NextResponse.json({
      settings,
      databaseConfigured: isDatabaseConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Pricing settings error.',
        details: getOrderErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = (await request.json()) as unknown;
    const settings = await savePricingSettings(
      normalizePricingSettings(body)
    );

    if (!settings) {
      return NextResponse.json(
        {
          databaseConfigured: false,
          message: databaseMessage,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Pricing settings error.',
        details: getOrderErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
