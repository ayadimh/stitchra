import { NextResponse } from 'next/server';
import { getOrderErrorMessage, getPricingSettings } from '@/lib/orders';
import { calculatePricing } from '@/lib/pricing';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      stitches?: unknown;
      colors?: unknown;
      coverage?: unknown;
      placement?: unknown;
    };
    const stitches = Number(body.stitches);
    const colors = Number(body.colors);
    const coverage = Number(body.coverage);
    const placement =
      typeof body.placement === 'string' ? body.placement : 'left';

    if (
      !Number.isFinite(stitches) ||
      !Number.isFinite(colors) ||
      !Number.isFinite(coverage)
    ) {
      return NextResponse.json(
        { message: 'Missing quote metrics.' },
        { status: 400 }
      );
    }

    const settings = await getPricingSettings();
    const pricing = calculatePricing({
      stitches,
      colors,
      placement,
      settings,
    });

    return NextResponse.json({
      public_quote: {
        stitches,
        colors,
        coverage,
        price_eur: pricing.customer_price_eur,
        manual_quote: pricing.manual_quote,
        pricing_tier: pricing.pricing_tier,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Pricing error.',
        details: getOrderErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
