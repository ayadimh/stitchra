import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'Pricing | Stitchra',
  description:
    'Understand Stitchra embroidery pricing factors and how quote requests are reviewed before production.',
};

export default function PricingPage() {
  return <MobileInfoPage current="/pricing" pageKey="pricing" />;
}
