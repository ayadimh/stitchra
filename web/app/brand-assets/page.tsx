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

const faviconExports = [
  {
    label: '16px favicon',
    svg: '/brand/exports/icons/favicon.svg',
    png: '/brand/exports/icons/favicon-16x16.png',
    size: 16,
  },
  {
    label: '32px favicon',
    svg: '/brand/exports/icons/favicon.svg',
    png: '/brand/exports/icons/favicon-32x32.png',
    size: 32,
  },
];

const appIconExports = [
  {
    title: 'Apple touch icon',
    svg: '/brand/exports/icons/apple-touch-icon-source.svg',
    png: '/brand/exports/icons/apple-touch-icon.png',
    note: '180x180 PNG export for future iOS home screen usage.',
    width: 180,
    height: 180,
  },
  {
    title: 'PWA icon 192',
    svg: '/brand/exports/icons/icon-192.svg',
    png: '/brand/exports/icons/icon-192.png',
    note: '192x192 PNG export for future web app manifest usage.',
    width: 192,
    height: 192,
  },
  {
    title: 'PWA icon 512',
    svg: '/brand/exports/icons/icon-512.svg',
    png: '/brand/exports/icons/icon-512.png',
    note: '512x512 PNG export for future web app manifest usage.',
    width: 512,
    height: 512,
  },
];

const socialExports = [
  {
    title: 'Open Graph',
    svg: '/brand/exports/social/stitchra-og.svg',
    png: '/brand/exports/social/stitchra-og.png',
    note: '1200x630 source and PNG export.',
    width: 1200,
    height: 630,
  },
  {
    title: 'Twitter/X card',
    svg: '/brand/exports/social/stitchra-twitter.svg',
    png: '/brand/exports/social/stitchra-twitter.png',
    note: '1200x675 source and PNG export.',
    width: 1200,
    height: 675,
  },
  {
    title: 'Square social',
    svg: '/brand/exports/social/stitchra-square.svg',
    png: '/brand/exports/social/stitchra-square.png',
    note: '1080x1080 source and PNG export.',
    width: 1080,
    height: 1080,
  },
  {
    title: 'Wide banner',
    svg: '/brand/exports/banners/stitchra-banner.svg',
    png: '/brand/exports/banners/stitchra-banner.png',
    note: '1500x500 source and PNG export.',
    width: 1500,
    height: 500,
  },
];

export default function BrandAssetsPage() {
  return (
    <main className="brand-assets-page">
      <style>{brandAssetsStyles}</style>

      <section className="brand-assets-hero">
        <p>Installed globally</p>
        <h1>Stitchra Brand Assets</h1>
        <span>Thread Needle S asset pipeline. The approved identity is now wired into live brand surfaces.</span>
      </section>

      <section className="asset-section" aria-labelledby="inspection-title">
        <div className="section-heading">
          <p>Current asset audit</p>
          <h2 id="inspection-title">What exists and what is still missing.</h2>
        </div>
        <div className="audit-grid">
          <article>
            <h3>Ready now</h3>
            <ul>
              <li>Reference JPG is preserved only as visual direction.</li>
              <li>Clean master SVG icon, horizontal, one-color and patch assets.</li>
              <li>SVG and PNG favicon/app icon exports.</li>
              <li>SVG and PNG social/banner exports.</li>
              <li>Animation-ready layered SVG with stable IDs.</li>
            </ul>
          </article>
          <article>
            <h3>Installed globally</h3>
            <ul>
              <li>Live navbar, mobile header, footer, favicon, manifest icons and OG metadata use these assets.</li>
              <li>Final hand-refined vector polish is still recommended for a future refinement pass.</li>
              <li>Real device favicon/app icon QA is still required.</li>
              <li>Logo reveal animation is prepared but not implemented.</li>
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
            <StatusRow items={['Reference only', 'Do not use as final logo']} />
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
              <StatusRow items={['SVG source ready']} />
              <code>{asset.src}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="asset-section" aria-labelledby="icons-title">
        <div className="section-heading">
          <p>Favicons and app icons</p>
          <h2 id="icons-title">SVG sources plus PNG exports.</h2>
        </div>
        <div className="favicon-export-grid">
          {faviconExports.map((asset) => (
            <article key={asset.label} className="favicon-export-card">
              <h3>{asset.label}</h3>
              <div className="favicon-pair">
                <PreviewTile label="SVG source" src={asset.svg} size={asset.size} />
                <PreviewTile label="PNG export" src={asset.png} size={asset.size} />
              </div>
              <StatusRow items={['SVG source ready', 'PNG export ready']} />
              <code>{asset.png}</code>
            </article>
          ))}
        </div>
        <div className="app-icon-grid">
          {appIconExports.map((asset) => (
            <article key={asset.png} className="asset-card">
              <div className="asset-stage app-icon-stage">
                <div>
                  <span>SVG</span>
                  <Image src={asset.svg} alt={`${asset.title} SVG source`} width={asset.width} height={asset.height} unoptimized />
                </div>
                <div>
                  <span>PNG</span>
                  <Image src={asset.png} alt={`${asset.title} PNG export`} width={asset.width} height={asset.height} unoptimized />
                </div>
              </div>
              <h3>{asset.title}</h3>
              <p>{asset.note}</p>
              <StatusRow items={['SVG source ready', 'PNG export ready']} />
              <code>{asset.png}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="asset-section" aria-labelledby="social-title">
        <div className="section-heading">
          <p>Social and banners</p>
          <h2 id="social-title">Marketing SVG sources plus PNG exports.</h2>
        </div>
        <div className="export-grid">
          {socialExports.map((asset) => (
            <article key={asset.png} className="asset-card export-card">
              <div className="asset-stage">
                <Image
                  src={asset.png}
                  alt={`${asset.title} PNG export`}
                  width={asset.width}
                  height={asset.height}
                  unoptimized
                />
              </div>
              <h3>{asset.title}</h3>
              <p>{asset.note}</p>
              <StatusRow items={['SVG source ready', 'PNG export ready']} />
              <div className="code-pair">
                <code>{asset.svg}</code>
                <code>{asset.png}</code>
              </div>
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
            <StatusRow items={['SVG source ready', 'Animation-ready layers']} />
            <code>/brand/exports/animation/stitchra-logo-layered.svg</code>
          </article>
        </div>
      </section>

      <section className="asset-section final-note" aria-labelledby="status-title">
        <div>
          <p>Rollout status</p>
          <h2 id="status-title">Installed globally.</h2>
        </div>
        <p>
          The live navbar logo, mobile header, favicon references, manifest icons, Open Graph image, footer branding and
          Studio visual mark now use the Thread Needle S identity. The JPG reference remains reference-only.
        </p>
      </section>
    </main>
  );
}

function StatusRow({ items }: { items: string[] }) {
  return (
    <div className="status-row">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function PreviewTile({ label, src, size }: { label: string; src: string; size: number }) {
  return (
    <div className="preview-tile">
      <div className="favicon-stage" style={{ width: Math.max(size, 32), height: Math.max(size, 32) }}>
        <Image src={src} alt={`${label} ${size}px preview`} width={size} height={size} unoptimized />
      </div>
      <span>{label}</span>
    </div>
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
  .animation-card,
  .favicon-export-grid,
  .app-icon-grid {
    display: grid;
    gap: 16px;
  }

  .audit-grid,
  .reference-grid,
  .animation-card {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .master-grid,
  .export-grid,
  .favicon-export-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .app-icon-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 16px;
  }

  .audit-grid article,
  .reference-note,
  .asset-card,
  .animation-card article,
  .favicon-export-card {
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

  .code-pair {
    display: grid;
    gap: 6px;
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

  .favicon-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 14px 0;
  }

  .preview-tile {
    min-height: 112px;
    display: grid;
    place-items: center;
    gap: 10px;
    padding: 16px;
    border: 1px solid rgba(185, 255, 196, 0.1);
    border-radius: 18px;
    background: #07100b;
  }

  .preview-tile span,
  .app-icon-stage span {
    color: #dff6e8;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .favicon-stage {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .app-icon-stage {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-items: center;
  }

  .app-icon-stage > div {
    display: grid;
    gap: 10px;
    place-items: center;
  }

  .app-icon-stage img {
    width: min(100%, 150px);
    height: auto;
  }

  .status-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .status-row span {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    border: 1px solid rgba(140, 255, 31, 0.22);
    border-radius: 999px;
    padding: 4px 10px;
    background: rgba(140, 255, 31, 0.08);
    color: #dfffd6;
    font-size: 12px;
    font-weight: 850;
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
    .favicon-export-grid,
    .app-icon-grid,
    .final-note {
      grid-template-columns: 1fr;
    }

    .brand-assets-hero {
      padding-top: 28px;
    }
  }
`;
