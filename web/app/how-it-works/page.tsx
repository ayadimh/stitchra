import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'How Stitchra Works | AI Embroidery Studio',
  description:
    'Learn the Stitchra workflow from design creation to manual review, final offer and production.',
};

export default function HowItWorksPage() {
  return <MobileInfoPage current="/how-it-works" pageKey="how" />;
}
