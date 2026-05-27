import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'Contact | Stitchra',
  description: 'Contact Stitchra for quote and order support.',
};

export default function ContactPage() {
  return <MobileInfoPage current="/contact" pageKey="contact" />;
}
