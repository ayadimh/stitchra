import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'Pricing | Stitchra',
  description:
    'Understand Stitchra embroidery pricing factors and how quote requests are reviewed before production.',
};

export default function PricingPage() {
  return (
    <MobileInfoPage
      current="/pricing"
      eyebrow="Pricing"
      title="Clear estimates before stitching."
      description="Stitchra does not fake certainty for complex artwork. Uploading or generating a concept helps estimate real embroidery complexity."
      cards={[
        {
          title: 'Small logo',
          text: 'Simple left-chest designs can start around €9.',
          bullets: ['Clean marks', 'Club logos', 'Small badges'],
        },
        {
          title: 'Front design',
          text: 'Larger front designs can start around €13.',
          bullets: ['More coverage', 'More stitch time', 'Bigger visual impact'],
        },
        {
          title: 'Price factors',
          text: 'Final pricing depends on placement, logo size, colors, stitch detail, coverage and quantity.',
        },
        {
          title: 'Studio review',
          text: 'Manual review is quality control. The final offer is confirmed before production.',
        },
      ]}
    />
  );
}
