import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'Gallery | Stitchra',
  description:
    'Explore Stitchra embroidery placement ideas for badges, brand marks, events and creator shirts.',
};

export default function GalleryPage() {
  return (
    <MobileInfoPage
      current="/gallery"
      eyebrow="Gallery"
      title="Placement ideas for real shirts."
      description="Use these directions as starting points, then place your own logo or AI concept in the studio."
      cards={[
        {
          title: 'Left chest badge',
          text: 'A premium small logo placement for clubs, teams and brand marks.',
        },
        {
          title: 'Center chest mark',
          text: 'Balanced placement for readable logos and event graphics.',
        },
        {
          title: 'Large front artwork',
          text: 'A stronger visual direction for creator drops and statement designs.',
        },
        {
          title: 'Lower front detail',
          text: 'Streetwear-inspired placement for subtle branding.',
        },
      ]}
    />
  );
}
