import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'Features | Stitchra',
  description:
    'Stitchra features for AI concept creation, logo upload, background cleanup, shirt preview and quote requests.',
};

export default function FeaturesPage() {
  return (
    <MobileInfoPage
      current="/features"
      eyebrow="Features"
      title="Built for practical embroidery decisions."
      description="The mobile studio focuses on the actions customers actually need before requesting a quote."
      cards={[
        {
          title: 'AI concept studio',
          text: 'Generate original embroidery-friendly concepts and review them before placing them on the shirt.',
        },
        {
          title: 'Bring your own design',
          text: 'Upload PNG, JPG or SVG and preview it directly on the T-shirt.',
        },
        {
          title: 'Background cleanup',
          text: 'Remove simple backgrounds locally before using a logo on dark or light fabric.',
        },
        {
          title: 'Fabric preview',
          text: 'Choose black or white tee, placement, custom position and logo size.',
        },
        {
          title: 'Draft recovery',
          text: 'Your mobile design draft can survive an accidental refresh.',
        },
      ]}
    />
  );
}
