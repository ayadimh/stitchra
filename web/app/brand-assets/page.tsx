import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stitchra Brand Assets',
  description: 'Private Stitchra logo asset preparation preview.',
  robots: {
    index: false,
    follow: false,
  },
};

const masterAssets = [
  {
    title: 'Master icon',
    src: '/brand/master/stitchra-thread-needle-icon.svg',
    note: 'Primary Thread Needle S vector mark.',
    width: 160,
    height: 160,
  },
  {
    title: 'Horizontal logo',
    src: '/brand/master/stitchra-horizontal.svg',
    note: 'Primary wordmark lockup for headers and brand surfaces.',
    width: 560,
    height: 160,
  },
  {
    title: 'One-color logo',
    src: '/brand/master/stitchra-one-color.svg',
    note: 'Embroidery-safe one-color version for production tests.',
    width: 560,
    height: 160,
  },
  {
    title: 'Patch logo',
    src: '/brand/master/stitchra-patch.svg',
    note: 'Circular badge mark for labels, patches and social avatars.',
    width: 160,
    height: 160,
  },
];

const iconAssets = [
  { label: '16px', src: '/brand/exports/icons/favicon.svg', size: 16 },
  { label: '32px', src: '/brand/exports/icons/favicon.svg', size: 32 },
  { label: '64px', src: '/brand/exports/icons/favicon.svg', size: 64 },
  { label: '128px', src: '/brand/exports/icons/favicon.svg', size: 128 },
];

const exportAssets = [
  {
    title: 'Open Graph source',
    src: '/brand/exports/social/stitchra-og.svg',
    note: '1200x630 SVG source for future OG image export.',
    width: 1200,
    height: 630,
  },
  {
    title: 'Twitter/X card source',
    src: '/brand/exports/social/stitchra-twitter.svg',
    note: '1200x675 SVG source for social card export.',
    width: 1200,
    height: 675,
  },
  {
    title: 'Wide banner source',
    src: '/brand/exports/banners/stitchra-banner.svg',
    note: '1500x500 SVG source for profile banners and campaign headers.',
    width: 1500,
    height: 500,
  },
  {
    title: 'Square social source',
    src: '/brand/exports/social/stitchra-square.svg',
    note: '1080x1080 SVG source for square social placement.',
    width: 1080,
    height: 1080,
  },
];

export default function BrandAssetsPage() {
  return (
    <main className="brand-assets-page">
      <style>{brandAssetsStyles}</style>

      <section className="brand-assets-hero">
        <p>Preview only</p>
        <h1>Stitchra Brand Assets</h1>
        <span>Thread Needle S asset pipeline. The live website logo has not been changed.</span>
      </section>

      <section className="asset-section" aria-labelledby="inspection-title">
        <div className="section-heading">
          <p>Current asset audit</p>
          <h2 id="inspection-title">What exists and what is still missing.</h2>
        </div>
        <div className="audit-grid">
          <article>
            <h3>Exists now</h3>
            <ul>
              <li>Reference JPG at `brand/candidates/logo01.jpg`.</li>
              <li>Copied reference at `brand/source/thread-needle-s-reference.jpg`.</li>
              <li>Clean master SVG icon, horizontal, one-color and patch assets.</li>
              <li>SVG source files for favicon, app icons, avatar, social cards and banners.</li>
              <li>Animation-ready layered SVG with stable IDs.</li>
            </ul>
          </article>
          <article>
            <h3>Still missing</h3>
            <ul>
              <li>Final hand-refined vector polish from a professional logo pass.</li>
              <li>PNG favicon and app icon exports from the SVG sources.</li>
              <li>Live metadata, manifest and navbar rollout after final approval.</li>
              <li>Final logo reveal animation using the prepared SVG layers.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="asset-section" aria-labelledby="reference-title">
        <div className="section-heading">
          <p>Reference only</p>
          <h2 id="reference-title">Original Thread Needle S direction.</h2>
        </div>
        <div className="reference-grid">
          <div className="reference-card">
            <Image
              src="/brand/source/thread-needle-s-reference.jpg"
              alt="Thread Needle S JPG reference"
              width={448}
              height={576}
              priority
            />
          </div>
          <article className="reference-note">
            <h3>Not a production logo</h3>
            <p>
              This JPG sets the visual direction: stitched S silhouette, vertical needle and premium dark atelier
              atmosphere. It is intentionally kept as a reference, not used as a final logo asset.
            </p>
            <p>
              The production path uses simplified SVG assets so the identity can scale, animate, export to icons and
              survive embroidery constraints.
            </p>
          </article>
        </div>
      </section>

      <section className="asset-section" aria-labelledby="masters-title">
        <div className="section-heading">
          <p>Master SVGs</p>
          <h2 id="masters-title">Clean vector base assets.</h2>
        </div>
        <div className="master-grid">
          {masterAssets.map((asset) => (
            <article key={asset.src} className="asset-card">
              <div className="asset-stage">
                <Image
                  src={asset.src}
                  alt={asset.title}
                  width={asset.width}
                  height={asset.height}
                  unoptimized
                />
              </div>
              <h3>{asset.title}</h3>
              <p>{asset.note}</p>
              <code>{asset.src}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="asset-section" aria-labelledby="icons-title">
        <div className="section-heading">
          <p>Favicons and app icons</p>
          <h2 id="icons-title">Small-size source checks.</h2>
        </div>
        <div className="icon-layout">
          <div className="favicon-strip">
            {iconAssets.map((asset) => (
              <div key={asset.label} className="favicon-card">
                <div className="favicon-stage" style={{ width: asset.size, height: asset.size }}>
                  <Image src={asset.src} alt={`Stitchra favicon preview ${asset.label}`} width={asset.size} height={asset.size} unoptimized />
                </div>
                <span>{asset.label}</span>
              </div>
            ))}
          </div>
          <div className="app-icon-card">
            <Image
              src="/brand/exports/icons/icon-512.svg"
              alt="Stitchra 512 app icon source preview"
              width={260}
              height={260}
              unoptimized
            />
            <div>
              <h3>App icon source</h3>
              <p>Prepared as SVG source. PNG exports should be generated after final approval.</p>
              <code>/brand/exports/icons/icon-512.svg</code>
            </div>
          </div>
          <div className="app-icon-card light">
            <Image
              src="/brand/exports/icons/apple-touch-icon-source.svg"
              alt="Stitchra Apple touch icon source preview"
              width={220}
              height={220}
              unoptimized
            />
            <div>
              <h3>Apple touch icon source</h3>
              <p>Flat source for future 180x180 PNG export and iOS home screen testing.</p>
              <code>/brand/exports/icons/apple-touch-icon-source.svg</code>
            </div>
          </div>
        </div>
      </section>

      <section className="asset-section" aria-labelledby="social-title">
        <div className="section-heading">
          <p>Social and banners</p>
          <h2 id="social-title">SVG sources for marketing export.</h2>
        </div>
        <div className="export-grid">
          {exportAssets.map((asset) => (
            <article key={asset.src} className="asset-card export-card">
              <div className="asset-stage">
                <Image
                  src={asset.src}
                  alt={asset.title}
                  width={asset.width}
                  height={asset.height}
                  unoptimized
                />
              </div>
              <h3>{asset.title}</h3>
              <p>{asset.note}</p>
              <code>{asset.src}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="asset-section" aria-labelledby="animation-title">
        <div className="section-heading">
          <p>Animation-ready</p>
          <h2 id="animation-title">Prepared logo layers for a future reveal.</h2>
        </div>
        <div className="animation-card">
          <div className="asset-stage">
            <Image
              src="/brand/exports/animation/stitchra-logo-layered.svg"
              alt="Stitchra layered logo animation source"
              width={320}
              height={320}
              unoptimized
            />
          </div>
          <article>
            <h3>Layer IDs</h3>
            <ul>
              <li>`stitchra-s-mark` for the thread-shaped S.</li>
              <li>`stitchra-needle` for the vertical needle reveal.</li>
              <li>`stitchra-thread-dots` for stitch accents.</li>
              <li>`stitchra-glow-ring` for optional website glow.</li>
              <li>`stitchra-baseline` for the subtle thread sweep.</li>
            </ul>
            <p>The full intro animation is not implemented here. This file only prepares clean, addressable layers.</p>
            <code>/brand/exports/animation/stitchra-logo-layered.svg</code>
          </article>
        </div>
      </section>

      <section className="asset-section final-note" aria-labelledby="status-title">
        <div>
          <p>Rollout status</p>
          <h2 id="status-title">Preview-only pipeline.</h2>
        </div>
        <p>
          The live navbar logo, favicon, manifest icons, Open Graph image, footer, email header and Studio logo are
          intentionally unchanged. This page is a private asset QA surface before a future identity rollout.
        </p>
      </section>
    </main>
  );
}

const brandAssetsStyles = `
  .brand-assets-page {
    min-height: 100vh;
    overflow-x: hidden;
    background:
      radial-gradient(circle at 16% 6%, rgba(140, 255, 31, 0.16), transparent 26rem),
      radial-gradient(circle at 88% 0%, rgba(22, 232, 132, 0.12), transparent 30rem),
      #050807;
    color: #f7fff5;
    font-family: var(--font-geist-sans), Arial, sans-serif;
    padding: 42px clamp(16px, 4vw, 58px) 72px;
  }

  .brand-assets-hero {
    max-width: 1120px;
    margin: 0 auto 34px;
    padding: 52px 0 20px;
  }

  .brand-assets-hero p,
  .section-heading p,
  .final-note > div p {
    margin: 0 0 10px;
    color: #8cff1f;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .brand-assets-hero h1 {
    margin: 0;
    max-width: 840px;
    font-size: clamp(42px, 8vw, 92px);
    line-height: 0.92;
    letter-spacing: 0;
  }

  .brand-assets-hero span {
    display: block;
    max-width: 680px;
    margin-top: 18px;
    color: #b9cec2;
    font-size: clamp(16px, 2vw, 21px);
    line-height: 1.55;
  }

  .asset-section {
    max-width: 1120px;
    margin: 20px auto;
    padding: clamp(18px, 3vw, 30px);
    border: 1px solid rgba(185, 255, 196, 0.12);
    border-radius: 28px;
    background: rgba(6, 15, 10, 0.74);
    box-shadow: 0 24px 90px rgba(0, 0, 0, 0.28);
  }

  .section-heading {
    margin-bottom: 18px;
  }

  .section-heading h2,
  .final-note h2 {
    margin: 0;
    font-size: clamp(24px, 4vw, 40px);
    line-height: 1.05;
    letter-spacing: 0;
  }

  .audit-grid,
  .reference-grid,
  .master-grid,
  .export-grid,
  .animation-card {
    display: grid;
    gap: 16px;
  }

  .audit-grid,
  .reference-grid,
  .animation-card {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .master-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .export-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .audit-grid article,
  .reference-note,
  .asset-card,
  .animation-card article,
  .app-icon-card {
    border: 1px solid rgba(185, 255, 196, 0.12);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.035);
    padding: 18px;
  }

  h3 {
    margin: 0 0 10px;
    font-size: 18px;
  }

  p,
  li {
    color: #b9cec2;
    line-height: 1.65;
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }

  code {
    display: block;
    max-width: 100%;
    margin-top: 12px;
    color: #8cff1f;
    font-family: var(--font-geist-mono), monospace;
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .reference-card {
    border-radius: 26px;
    overflow: hidden;
    background: #020403;
    border: 1px solid rgba(185, 255, 196, 0.14);
  }

  .reference-card img {
    width: 100%;
    height: auto;
    display: block;
  }

  .asset-stage {
    min-height: 210px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(140, 255, 31, 0.04)),
      #07100b;
    border: 1px solid rgba(185, 255, 196, 0.1);
    overflow: hidden;
    padding: 18px;
  }

  .asset-stage img {
    max-width: 100%;
    height: auto;
  }

  .export-card .asset-stage {
    min-height: 170px;
  }

  .icon-layout {
    display: grid;
    grid-template-columns: 0.8fr 1fr 1fr;
    gap: 16px;
    align-items: stretch;
  }

  .favicon-strip {
    display: grid;
    gap: 12px;
    align-content: start;
    border: 1px solid rgba(185, 255, 196, 0.12);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.035);
    padding: 18px;
  }

  .favicon-card {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 44px;
  }

  .favicon-stage {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .favicon-card span {
    color: #dff6e8;
    font-weight: 800;
  }

  .app-icon-card {
    display: grid;
    align-content: start;
    gap: 14px;
  }

  .app-icon-card img {
    max-width: 100%;
    height: auto;
    margin: 0 auto;
  }

  .app-icon-card.light {
    background: #f4f8ef;
    color: #07100b;
  }

  .app-icon-card.light p {
    color: #315141;
  }

  .app-icon-card.light code {
    color: #0b6f46;
  }

  .animation-card {
    align-items: stretch;
  }

  .final-note {
    display: grid;
    grid-template-columns: 0.75fr 1.25fr;
    gap: 18px;
    align-items: start;
  }

  @media (max-width: 860px) {
    .brand-assets-page {
      padding: 22px 12px 48px;
    }

    .asset-section {
      border-radius: 22px;
      padding: 16px;
    }

    .audit-grid,
    .reference-grid,
    .master-grid,
    .export-grid,
    .animation-card,
    .icon-layout,
    .final-note {
      grid-template-columns: 1fr;
    }

    .brand-assets-hero {
      padding-top: 28px;
    }
  }
`;
