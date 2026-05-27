# Stitchra Brand Assets

This folder prepares the Thread Needle S identity direction as a clean brand asset system.

## Source and reference

- `candidates/logo01.jpg` is the original external visual reference supplied by the founder.
- `source/thread-needle-s-reference.jpg` is a copied reference file for the brand pipeline.
- The JPG is reference only. It is not a production logo, favicon, app icon, or final vector asset.

## Master vector files

- `master/stitchra-thread-needle-icon.svg` is the master icon direction.
- `master/stitchra-horizontal.svg` is the horizontal logo lockup.
- `master/stitchra-one-color.svg` is the one-color embroidery-safe lockup.
- `master/stitchra-patch.svg` is the patch/badge version.

These SVGs are the current production base for refinement. They are clean vector reinterpretations of the Thread Needle S direction, not pixel traces of the JPG.

## Export source files

### Icons

- `exports/icons/favicon.svg` - favicon source SVG.
- `exports/icons/icon-192.svg` - PWA icon source at a 192x192 view.
- `exports/icons/icon-512.svg` - PWA icon source at a 512x512 view.
- `exports/icons/apple-touch-icon-source.svg` - Apple touch icon source.
- `exports/icons/stitchra-avatar.svg` - profile/avatar source.

### Social and banners

- `exports/social/stitchra-og.svg` - Open Graph source at 1200x630.
- `exports/social/stitchra-twitter.svg` - Twitter/X card source at 1200x675.
- `exports/social/stitchra-square.svg` - square social source at 1080x1080.
- `exports/banners/stitchra-banner.svg` - wide banner source at 1500x500.

### Animation

- `exports/animation/stitchra-logo-layered.svg` contains stable layer IDs:
  - `stitchra-s-mark`
  - `stitchra-needle`
  - `stitchra-thread-dots`
  - `stitchra-glow-ring`
  - `stitchra-baseline`

These IDs are prepared so a future animation can reveal the logo with a moving needle, stitch dots, and a brief glow.

## PNG export

PNG exports are generated from the clean SVG sources with Sharp.

Generated PNG files:

- `exports/icons/favicon-16x16.png`
- `exports/icons/favicon-32x32.png`
- `exports/icons/apple-touch-icon.png` at 180x180
- `exports/icons/icon-192.png`
- `exports/icons/icon-512.png`
- `exports/social/stitchra-og.png` at 1200x630
- `exports/social/stitchra-twitter.png` at 1200x675
- `exports/social/stitchra-square.png` at 1080x1080
- `exports/banners/stitchra-banner.png` at 1500x500

Regenerate the PNG exports from the `web` folder:

```bash
npm run brand:export
```

The script lives at `scripts/export-brand-assets.mjs`. It reads only the SVG sources in this folder and writes PNGs back to `public/brand/exports/`.

Recommended final QA workflow:

1. Inspect the SVG and PNG previews at `/brand-assets`.
2. Run the exported icon set through RealFaviconGenerator or a similar favicon QA tool.
3. Verify the icons on iOS Safari, Android Chrome, desktop Chrome, Safari, and pinned tabs.
4. Only after approval, copy or point live metadata/manifest references to the approved production files.

## Future metadata update

Do not change live metadata until the Thread Needle S identity is approved.

When approved, update:

- `app/layout.tsx` Open Graph and Twitter image references.
- `app/manifest.ts` PWA icon references.
- public favicon and Apple touch icon files.
- navbar, footer, Studio, and email header logo usage.

## Current status

These files are asset preparation and preview assets only. The live website logo, favicon, manifest icons, Open Graph image, email logo, and Studio logo are intentionally unchanged.

Production-ready candidates:

- The clean SVG master files.
- The generated PNG icon/social/banner exports.

Still reference or preview only:

- `candidates/logo01.jpg`
- `source/thread-needle-s-reference.jpg`
- Any `/brand-assets`, `/brand-lab`, or `/brand-preview` presentation context.
