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

PNG export has not been committed in this pass. The current assets are SVG sources.

Recommended export workflow:

1. Open the SVG source in Figma, Illustrator, Inkscape, or a trusted SVG-to-PNG conversion tool.
2. Export favicon and app icon PNGs at:
   - `favicon-32x32.png`
   - `apple-touch-icon.png` at 180x180
   - `icon-192.png`
   - `icon-512.png`
3. Run the exported icon set through RealFaviconGenerator or a similar favicon QA tool.
4. Verify the icons on iOS Safari, Android Chrome, desktop Chrome, Safari, and pinned tabs.

## Future metadata update

Do not change live metadata until the Thread Needle S identity is approved.

When approved, update:

- `app/layout.tsx` Open Graph and Twitter image references.
- `app/manifest.ts` PWA icon references.
- public favicon and Apple touch icon files.
- navbar, footer, Studio, and email header logo usage.

## Current status

These files are asset preparation and preview assets only. The live website logo, favicon, manifest icons, Open Graph image, email logo, and Studio logo are intentionally unchanged.
