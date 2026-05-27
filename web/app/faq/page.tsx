import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'FAQ | Stitchra',
  description:
    'Answers about Stitchra logo uploads, AI concepts, quote requests, payment timing and design rights.',
};

export default function FaqPage() {
  return <MobileInfoPage current="/faq" pageKey="faq" />;
}
