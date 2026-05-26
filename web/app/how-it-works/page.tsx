import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'How Stitchra Works | AI Embroidery Studio',
  description:
    'Learn the Stitchra workflow from design creation to manual review, final offer and production.',
};

export default function HowItWorksPage() {
  return (
    <MobileInfoPage
      current="/how-it-works"
      eyebrow="How it works"
      title="From idea to quote without guessing."
      description="Stitchra keeps the design flow guided: add artwork, review it clearly, place it on fabric and request a final offer."
      cards={[
        {
          title: '1. Create or upload',
          text: 'Bring your own logo or describe an original idea for an AI concept.',
        },
        {
          title: '2. Review concept',
          text: 'Check the artwork clearly before using it on the shirt.',
        },
        {
          title: '3. Place on fabric',
          text: 'Choose a preset placement or tap the shirt to place the logo yourself.',
        },
        {
          title: '4. Check price',
          text: 'Get a public estimate based on placement, size, color count and artwork detail.',
        },
        {
          title: '5. Request offer',
          text: 'Stitchra manually reviews the design and sends the final offer before production.',
        },
      ]}
    />
  );
}
