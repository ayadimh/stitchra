import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stitchra',
    short_name: 'Stitchra',
    description:
      'AI embroidery T-shirt platform for uploading logos, previewing placements and requesting clear quotes.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#07140f',
    theme_color: '#07140f',
    categories: ['design', 'shopping', 'productivity'],
    icons: [
      {
        src: '/brand/exports/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/exports/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/exports/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
