import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'Explore Stitchra | AI Embroidery Studio',
  description:
    'Explore how Stitchra helps you create or upload artwork, preview embroidery placement and request a clear quote.',
};

export default function ExplorePage() {
  return <MobileInfoPage current="/explore" pageKey="explore" />;
}
