import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'FAQ | Stitchra',
  description:
    'Answers about Stitchra logo uploads, AI concepts, quote requests, payment timing and design rights.',
};

export default function FaqPage() {
  return (
    <MobileInfoPage
      current="/faq"
      eyebrow="FAQ"
      title="Answers before you order."
      description="A short guide to the most common Stitchra questions."
      cards={[
        {
          title: 'Can I order one T-shirt?',
          text: 'Yes. You can request a quote for one shirt or a small batch.',
        },
        {
          title: 'When do I pay?',
          text: 'Payment happens later after Stitchra reviews your design and sends a final offer.',
        },
        {
          title: 'Can I use a brand logo?',
          text: 'Only upload logos or artwork you own or have permission to use. Risky designs may be rejected.',
        },
        {
          title: 'Are AI concepts final stitch files?',
          text: 'No. AI concepts are previews. Stitchra reviews final stitch-ready artwork before production.',
        },
        {
          title: 'What files can I upload?',
          text: 'PNG, JPG and SVG files are supported for the public design preview.',
        },
      ]}
    />
  );
}
