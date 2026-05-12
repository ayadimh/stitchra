import { NextResponse } from 'next/server';
import {
  getOrderById,
  getOrderErrorMessage,
  isDatabaseConfigured,
  isOfferEmailConfigured,
  isStudioRequest,
  sendOfferEmail,
  updateOrder,
} from '@/lib/orders';

export const runtime = 'nodejs';

const databaseMessage = 'Database not configured.';
const emailMessage =
  'Email not configured. Copy customer link manually.';

export async function POST(
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

    if (!isOfferEmailConfigured()) {
      return NextResponse.json(
        {
          emailConfigured: false,
          message: emailMessage,
        },
        { status: 503 }
      );
    }

    const { id } = await params;
    const existingOrder = await getOrderById(id);

    if (!existingOrder) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    if (
      existingOrder.manual_quote &&
      existingOrder.revised_price_eur === null
    ) {
      return NextResponse.json(
        {
          message:
            'Enter a final customer price before sending a manual quote.',
        },
        { status: 400 }
      );
    }

    await sendOfferEmail(existingOrder);

    const order = await updateOrder(id, {
      offer_sent_at: new Date().toISOString(),
      status: 'offer_sent',
    });

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order,
      emailConfigured: true,
      message: 'Offer email sent.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Offer email error.',
        details: getOrderErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
