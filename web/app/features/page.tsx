import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'Features | Stitchra',
  description:
    'Stitchra features for AI concept creation, logo upload, background cleanup, shirt preview and quote requests.',
};

export default function FeaturesPage() {
  return <MobileInfoPage current="/features" pageKey="features" />;
}
