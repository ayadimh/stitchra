import type { Metadata } from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'Design | Stitchra',
  description:
    'Start a Stitchra embroidery design with your own logo or an AI concept.',
};

export default function DesignPage() {
  return <Home entry="design" />;
}
