import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');

const outputs = [
  {
    source: 'public/brand/exports/icons/favicon.svg',
    output: 'public/brand/exports/icons/favicon-16x16.png',
    width: 16,
    height: 16,
    density: 1024,
  },
  {
    source: 'public/brand/exports/icons/favicon.svg',
    output: 'public/brand/exports/icons/favicon-32x32.png',
    width: 32,
    height: 32,
    density: 1024,
  },
  {
    source: 'public/brand/exports/icons/apple-touch-icon-source.svg',
    output: 'public/brand/exports/icons/apple-touch-icon.png',
    width: 180,
    height: 180,
    density: 768,
  },
  {
    source: 'public/brand/exports/icons/icon-192.svg',
    output: 'public/brand/exports/icons/icon-192.png',
    width: 192,
    height: 192,
    density: 768,
  },
  {
    source: 'public/brand/exports/icons/icon-512.svg',
    output: 'public/brand/exports/icons/icon-512.png',
    width: 512,
    height: 512,
    density: 512,
  },
  {
    source: 'public/brand/exports/social/stitchra-og.svg',
    output: 'public/brand/exports/social/stitchra-og.png',
    width: 1200,
    height: 630,
    density: 144,
  },
  {
    source: 'public/brand/exports/social/stitchra-twitter.svg',
    output: 'public/brand/exports/social/stitchra-twitter.png',
    width: 1200,
    height: 675,
    density: 144,
  },
  {
    source: 'public/brand/exports/social/stitchra-square.svg',
    output: 'public/brand/exports/social/stitchra-square.png',
    width: 1080,
    height: 1080,
    density: 144,
  },
  {
    source: 'public/brand/exports/banners/stitchra-banner.svg',
    output: 'public/brand/exports/banners/stitchra-banner.png',
    width: 1500,
    height: 500,
    density: 144,
  },
];

for (const asset of outputs) {
  const sourcePath = path.join(projectRoot, asset.source);
  const outputPath = path.join(projectRoot, asset.output);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing SVG source: ${asset.source}`);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });

  await sharp(sourcePath, { density: asset.density })
    .resize(asset.width, asset.height, {
      fit: 'fill',
      kernel: sharp.kernel.lanczos3,
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: false,
    })
    .toFile(outputPath);

  console.log(`Generated ${asset.output} (${asset.width}x${asset.height})`);
}
