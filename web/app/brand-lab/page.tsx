import type { Metadata } from 'next';
import StitchraBrandLab from '@/components/brand/StitchraBrandLab';

export const metadata: Metadata = {
  title: 'Stitchra Brand Lab',
  description: 'Private Stitchra logo direction exploration.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BrandLabPage() {
  return <StitchraBrandLab />;
}
