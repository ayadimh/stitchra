import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'Explore Stitchra | AI Embroidery Studio',
  description:
    'Explore how Stitchra helps you create or upload artwork, preview embroidery placement and request a clear quote.',
};

export default function ExplorePage() {
  return (
    <MobileInfoPage
      current="/explore"
      eyebrow="Explore Stitchra"
      title="Choose what you want to know."
      description="A compact mobile hub for the Stitchra workflow, pricing, features and common questions."
      cards={[
        {
          title: 'How it works',
          text: 'Create or upload, review, place, price and request.',
          href: '/how-it-works',
          cta: 'View workflow',
        },
        {
          title: 'Features',
          text: 'AI concepts, background cleanup, shirt preview and draft recovery.',
          href: '/features',
          cta: 'See features',
        },
        {
          title: 'Pricing',
          text: 'Small designs from €9, larger front designs from €13. Final offer before production.',
          href: '/pricing',
          cta: 'Understand pricing',
        },
        {
          title: 'Gallery',
          text: 'Example placements and design directions for clubs, creators, events and brands.',
          href: '/gallery',
          cta: 'Browse ideas',
        },
        {
          title: 'FAQ',
          text: 'Answers about files, rights, payment timing and one-shirt orders.',
          href: '/faq',
          cta: 'Read FAQ',
        },
        {
          title: 'Contact',
          text: 'Need help with a logo or quote request? Reach the Stitchra team.',
          href: '/contact',
          cta: 'Contact support',
        },
      ]}
    />
  );
}
