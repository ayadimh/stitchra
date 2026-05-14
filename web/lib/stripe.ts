import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getSiteUrl() {
  return (process.env.SITE_URL?.trim() || 'https://stitchra.com').replace(
    /\/+$/,
    ''
  );
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error('Stripe is not configured.');
  }

  if (!secretKey.startsWith('sk_test_')) {
    throw new Error(
      'Stripe test mode is required. Use a STRIPE_SECRET_KEY starting with sk_test_.'
    );
  }

  if (!stripeClient) {
    // Use Stripe test keys now. Switch to live keys only after legal/business bank setup is ready.
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}
