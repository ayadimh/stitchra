import type { Metadata } from 'next';
import MobileInfoPage from '@/components/mobile/MobileInfoPage';

export const metadata: Metadata = {
  title: 'Gallery | Stitchra',
  description:
    'Explore Stitchra embroidery placement ideas for badges, brand marks, events and creator shirts.',
};

export default function GalleryPage() {
  return <MobileInfoPage current="/gallery" pageKey="gallery" />;
}
