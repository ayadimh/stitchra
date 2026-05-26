import type { Metadata } from 'next';
import StitchraLogo from '@/components/brand/StitchraLogo';
import StitchraThreadNeedleLogo from '@/components/brand/StitchraThreadNeedleLogo';

export const metadata: Metadata = {
  title: 'Thread Needle S Preview',
  description: 'Private Stitchra logo identity preview page.',
  robots: {
    index: false,
    follow: false,
  },
};

const checklistItems = [
  'Works in navbar',
  'Works at 32px',
  'Works as app icon',
  'Works in one color',
  'Works as T-shirt neck label',
  'Works without glow',
  'Wordmark readable',
  'Feels more premium than current logo',
];

export default function BrandPreviewPage() {
  return (
    <main className="brand-preview-page">
      <style>{brandPreviewStyles}</style>

      <section className="brand-preview-hero">
        <p>Preview only</p>
        <h1>Thread Needle S Preview</h1>
        <span>The live logo has not been replaced yet.</span>
      </section>

      <section className="preview-section current-vs-candidate" aria-labelledby="current-vs-candidate-title">
        <div className="section-heading">
          <p>Current vs candidate</p>
          <h2 id="current-vs-candidate-title">A realistic decision view before rollout.</h2>
        </div>
        <div className="comparison-grid">
          <article>
            <span>Current live logo</span>
            <div className="comparison-surface">
              <StitchraLogo size={62} showSubtitle />
            </div>
            <p>Recognizable from the current site, but still leans more neon-tech than premium embroidery label.</p>
          </article>
          <article className="candidate-comparison">
            <span>Thread Needle S Refined</span>
            <div className="comparison-surface">
              <StitchraThreadNeedleLogo size={330} />
            </div>
            <p>Stronger S ownership, clearer thread/needle story and better app-icon potential.</p>
          </article>
        </div>
      </section>

      <section className="preview-section" aria-labelledby="navbar-preview-title">
        <div className="section-heading">
          <p>Real navbar preview</p>
          <h2 id="navbar-preview-title">Desktop and mobile header contexts.</h2>
        </div>
        <div className="navbar-preview desktop-navbar">
          <StitchraThreadNeedleLogo size={286} />
          <nav aria-label="Preview desktop navigation">
            <span>How It Works</span>
            <span>Pricing</span>
            <span>Gallery</span>
            <span>Features</span>
            <span>FAQ</span>
          </nav>
          <button type="button">Start Designing</button>
        </div>
        <div className="navbar-preview mobile-navbar">
          <StitchraThreadNeedleLogo variant="icon" size={46} />
          <StitchraThreadNeedleLogo size={178} showSubtitle={false} />
          <button type="button" aria-label="Preview menu button">
            Menu
          </button>
        </div>
      </section>

      <section className="preview-section hero-context" aria-labelledby="hero-preview-title">
        <div className="hero-mini">
          <div>
            <StitchraThreadNeedleLogo size={310} />
            <p>AI embroidery T-shirt platform</p>
            <h2 id="hero-preview-title">Upload a logo. Preview the stitch. Request a clear quote.</h2>
            <button type="button">Start Designing</button>
          </div>
          <div className="hero-preview-card">
            <StitchraThreadNeedleLogo variant="icon" size={126} />
            <span>Live mockup workspace</span>
          </div>
        </div>
      </section>

      <section className="preview-section context-grid-section" aria-labelledby="context-title">
        <div className="section-heading">
          <p>Real-site surfaces</p>
          <h2 id="context-title">Footer, email and Studio previews.</h2>
        </div>
        <div className="context-grid">
          <article className="footer-preview">
            <span>Footer preview</span>
            <StitchraThreadNeedleLogo size={250} />
            <p>AI embroidery T-shirt platform for creators, clubs and small brands.</p>
          </article>
          <article className="email-preview">
            <span>Email header preview</span>
            <div>
              <StitchraThreadNeedleLogo size={220} showSubtitle={false} />
              <h3>We received your Stitchra quote request</h3>
              <p>We will review your design and prepare your offer.</p>
            </div>
          </article>
          <article className="studio-preview">
            <span>Studio dashboard preview</span>
            <div>
              <StitchraThreadNeedleLogo variant="icon" size={58} />
              <p>Private Studio</p>
              <h3>Quote command center</h3>
              <small>Orders · Pricing · Production</small>
            </div>
          </article>
        </div>
      </section>

      <section className="preview-section scale-section" aria-labelledby="scale-title">
        <div className="section-heading">
          <p>Favicon / app icon preview</p>
          <h2 id="scale-title">Small-size readability check.</h2>
        </div>
        <div className="scale-grid">
          <div className="favicon-row">
            {[16, 32, 64, 128].map((size) => (
              <div key={size} className="favicon-scale-card">
                <div className="favicon-box" style={{ width: size, height: size }}>
                  <StitchraThreadNeedleLogo variant="icon" size={size} />
                </div>
                <small>{size}px</small>
              </div>
            ))}
          </div>
          <div className="app-icon-card">
            <div>
              <StitchraThreadNeedleLogo variant="icon" size={180} />
            </div>
            <span>512px app icon preview</span>
          </div>
        </div>
      </section>

      <section className="preview-section patch-section" aria-labelledby="patch-title">
        <div className="section-heading">
          <p>Textile application</p>
          <h2 id="patch-title">Patch and neck label preview.</h2>
        </div>
        <div className="patch-grid">
          <article className="fabric-label black-label">
            <span>Black fabric label</span>
            <div>
              <StitchraThreadNeedleLogo variant="stacked" monochrome size={172} />
            </div>
          </article>
          <article className="fabric-label mint-label">
            <span>Single mint thread</span>
            <div>
              <StitchraThreadNeedleLogo variant="oneColor" monochrome size={260} />
            </div>
          </article>
          <article className="fabric-label patch-label">
            <span>Circular patch version</span>
            <div>
              <StitchraThreadNeedleLogo variant="patch" monochrome size={138} />
            </div>
          </article>
        </div>
      </section>

      <section className="preview-section one-color-section" aria-labelledby="one-color-title">
        <div className="section-heading">
          <p>One-color / embroidery preview</p>
          <h2 id="one-color-title">No glow, no texture, production-first usage.</h2>
        </div>
        <div className="one-color-grid">
          <div className="one-color-card light-stamp">
            <span>Black on white</span>
            <StitchraThreadNeedleLogo variant="oneColor" monochrome size={300} />
          </div>
          <div className="one-color-card dark-stamp">
            <span>White on black</span>
            <StitchraThreadNeedleLogo variant="oneColor" monochrome size={300} />
          </div>
          <div className="one-color-card mint-stamp">
            <span>Single mint thread</span>
            <StitchraThreadNeedleLogo variant="oneColor" monochrome size={300} />
          </div>
        </div>
      </section>

      <section className="preview-section decision-section" aria-labelledby="decision-title">
        <div className="section-heading">
          <p>Decision checklist</p>
          <h2 id="decision-title">Approval criteria before global replacement.</h2>
        </div>
        <div className="decision-grid">
          {checklistItems.map((item) => (
            <div key={item}>
              <i aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="recommendation-note">
          This preview is for final visual decision only. If approved, the next step is applying the Thread Needle
          S identity across navbar, favicon, app icon, footer, email, Studio and Open Graph assets.
        </div>
      </section>
    </main>
  );
}

const brandPreviewStyles = `
  .brand-preview-page {
    min-height: 100vh;
    padding: 68px 22px 96px;
    color: #f4f0e8;
    background:
      linear-gradient(120deg, rgba(255,255,255,0.035) 1px, transparent 1px),
      radial-gradient(circle at 15% 4%, rgba(140,255,31,0.13), transparent 30%),
      radial-gradient(circle at 84% 8%, rgba(0,200,255,0.10), transparent 32%),
      #050706;
    background-size: 72px 72px, auto, auto, auto;
  }

  .brand-preview-hero,
  .preview-section {
    width: min(1420px, 100%);
    margin-inline: auto;
  }

  .brand-preview-hero {
    display: grid;
    gap: 16px;
    margin-bottom: 30px;
  }

  .brand-preview-hero p,
  .section-heading p,
  .comparison-grid article > span,
  .context-grid article > span,
  .fabric-label > span,
  .one-color-card > span {
    margin: 0;
    color: #8cff1f;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .brand-preview-hero h1 {
    margin: 0;
    max-width: 980px;
    font-size: clamp(52px, 8vw, 112px);
    line-height: 0.9;
    letter-spacing: -0.08em;
  }

  .brand-preview-hero > span {
    max-width: 720px;
    color: rgba(244,240,232,0.76);
    font-size: clamp(18px, 2vw, 24px);
    line-height: 1.55;
  }

  .preview-section {
    margin-top: 26px;
    padding: clamp(20px, 3vw, 34px);
    border: 1px solid rgba(255,255,255,0.11);
    border-radius: 32px;
    background:
      radial-gradient(circle at 10% 0%, rgba(140,255,31,0.08), transparent 34%),
      rgba(255,255,255,0.04);
    box-shadow: 0 28px 90px rgba(0,0,0,0.26);
  }

  .section-heading {
    display: grid;
    gap: 8px;
    margin-bottom: 18px;
  }

  .section-heading h2 {
    margin: 0;
    font-size: clamp(28px, 4vw, 58px);
    line-height: 0.98;
    letter-spacing: -0.06em;
  }

  .comparison-grid,
  .context-grid,
  .patch-grid,
  .one-color-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .comparison-grid article,
  .context-grid article,
  .fabric-label,
  .one-color-card,
  .navbar-preview,
  .hero-mini,
  .scale-grid,
  .decision-grid,
  .recommendation-note {
    border: 1px solid rgba(255,255,255,0.11);
    border-radius: 24px;
    background: rgba(255,255,255,0.045);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
  }

  .comparison-grid article {
    display: grid;
    gap: 12px;
    padding: 18px;
  }

  .comparison-surface {
    min-height: 172px;
    display: grid;
    place-items: center;
    border-radius: 20px;
    background: rgba(0,0,0,0.30);
    overflow: hidden;
  }

  .comparison-grid p,
  .context-grid p,
  .hero-mini p,
  .recommendation-note {
    margin: 0;
    color: rgba(244,240,232,0.70);
    line-height: 1.6;
  }

  .candidate-comparison .comparison-surface {
    color: #f4f0e8;
  }

  .navbar-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    min-height: 92px;
    padding: 16px 18px;
    overflow: hidden;
  }

  .navbar-preview nav {
    display: flex;
    gap: 24px;
    color: rgba(244,240,232,0.70);
    font-size: 14px;
    font-weight: 850;
  }

  .navbar-preview button,
  .hero-mini button {
    border: 0;
    border-radius: 999px;
    padding: 13px 18px;
    color: #07100b;
    background: linear-gradient(135deg, #18ff9a, #00c8ff);
    font-weight: 950;
  }

  .mobile-navbar {
    display: none;
    margin-top: 14px;
  }

  .hero-mini {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
    gap: 18px;
    padding: clamp(22px, 4vw, 44px);
    background:
      radial-gradient(circle at 70% 30%, rgba(140,255,31,0.12), transparent 34%),
      rgba(255,255,255,0.045);
  }

  .hero-mini > div:first-child {
    display: grid;
    gap: 15px;
    align-content: center;
  }

  .hero-mini h2 {
    max-width: 760px;
    margin: 0;
    font-size: clamp(34px, 6vw, 76px);
    line-height: 0.94;
    letter-spacing: -0.075em;
  }

  .hero-mini button {
    justify-self: start;
  }

  .hero-preview-card {
    min-height: 320px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 16px;
    border: 1px solid rgba(140,255,31,0.20);
    border-radius: 28px;
    background: rgba(0,0,0,0.26);
  }

  .hero-preview-card span {
    color: rgba(244,240,232,0.62);
    font-size: 12px;
    font-weight: 850;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .context-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .context-grid article {
    display: grid;
    gap: 13px;
    padding: 18px;
  }

  .email-preview > div,
  .studio-preview > div {
    display: grid;
    gap: 12px;
    padding: 18px;
    border-radius: 18px;
    background: rgba(0,0,0,0.28);
  }

  .email-preview h3,
  .studio-preview h3 {
    margin: 0;
    font-size: 22px;
    letter-spacing: -0.04em;
  }

  .studio-preview small {
    color: rgba(244,240,232,0.56);
    font-weight: 850;
  }

  .scale-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 240px;
    gap: 18px;
    padding: 18px;
  }

  .favicon-row {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: end;
  }

  .favicon-scale-card {
    display: grid;
    justify-items: center;
    gap: 8px;
  }

  .favicon-box {
    overflow: hidden;
    border-radius: 8px;
    background: #0b100d;
  }

  .favicon-scale-card small,
  .app-icon-card span {
    color: rgba(244,240,232,0.56);
    font-size: 11px;
    font-weight: 850;
  }

  .app-icon-card {
    display: grid;
    gap: 10px;
    justify-items: center;
  }

  .app-icon-card > div {
    width: 190px;
    height: 190px;
    display: grid;
    place-items: center;
    border-radius: 42px;
    background:
      radial-gradient(circle at 30% 14%, rgba(140,255,31,0.16), transparent 42%),
      #0b100d;
  }

  .patch-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .fabric-label,
  .one-color-card {
    display: grid;
    gap: 14px;
    padding: 18px;
  }

  .fabric-label > div,
  .one-color-card {
    min-height: 210px;
    place-items: center;
  }

  .fabric-label > div {
    display: grid;
    border-radius: 18px;
  }

  .black-label > div {
    color: #f4f0e8;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.04) 25%, transparent 25%) 0 0 / 18px 18px,
      #080a09;
  }

  .mint-label > div {
    color: #8cff1f;
    background: #0b100d;
  }

  .patch-label > div {
    width: 190px;
    height: 190px;
    justify-self: center;
    color: #101410;
    border-radius: 999px;
    background: #f4f0e8;
  }

  .one-color-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .light-stamp {
    color: #111512;
    background: #f4f0e8;
  }

  .dark-stamp {
    color: #f4f0e8;
    background: #050505;
  }

  .mint-stamp {
    color: #8cff1f;
    background: #07100b;
  }

  .decision-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 18px;
  }

  .decision-grid div {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    color: rgba(244,240,232,0.80);
    font-weight: 850;
  }

  .decision-grid i {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    border-radius: 999px;
    background:
      radial-gradient(circle at 50% 50%, #07100b 0 30%, transparent 31%),
      #8cff1f;
  }

  .recommendation-note {
    margin-top: 14px;
    padding: 18px;
    border-color: rgba(140,255,31,0.24);
  }

  @media (max-width: 1040px) {
    .comparison-grid,
    .context-grid,
    .hero-mini,
    .scale-grid,
    .patch-grid,
    .one-color-grid,
    .decision-grid {
      grid-template-columns: 1fr;
    }

    .desktop-navbar {
      display: none;
    }

    .mobile-navbar {
      display: flex;
    }
  }

  @media (max-width: 680px) {
    .brand-preview-page {
      padding: 42px 14px 72px;
    }

    .preview-section {
      border-radius: 24px;
      padding: 18px;
    }

    .mobile-navbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .hero-preview-card {
      min-height: 220px;
    }

    .favicon-row {
      gap: 12px;
    }
  }
`;
