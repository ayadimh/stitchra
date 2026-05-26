import { stitchraLogoConcepts } from './logoConcepts';

function ScoreDots({ score }: { score: number }) {
  return (
    <span className="brand-lab-score" aria-label={`Embroidery suitability ${score} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <i key={index} data-active={index < score} />
      ))}
    </span>
  );
}

export default function StitchraBrandLab() {
  return (
    <main className="brand-lab-page">
      <style>{brandLabStyles}</style>

      <section className="brand-lab-hero">
        <p>Private exploration</p>
        <h1>Stitchra Brand Lab</h1>
        <span>
          Choose a timeless identity for an AI embroidery design studio.
        </span>
      </section>

      <section className="brand-lab-principles" aria-label="Brand principles">
        {[
          'Premium and modern',
          'Crafted, not clipart',
          'Embroidery-safe',
          'Strong at icon size',
          'AI-assisted without robot cues',
        ].map((principle) => (
          <span key={principle}>{principle}</span>
        ))}
      </section>

      <section className="brand-lab-grid" aria-label="Stitchra logo concepts">
        {stitchraLogoConcepts.map((concept, conceptIndex) => {
          const Artwork = concept.Artwork;

          return (
            <article key={concept.id} className="brand-concept-card">
              <header className="brand-concept-header">
                <span>{String(conceptIndex + 1).padStart(2, '0')}</span>
                <div>
                  <p>{concept.direction}</p>
                  <h2>{concept.name}</h2>
                </div>
              </header>

              <div className="brand-surface-grid">
                <div className="brand-surface brand-surface-dark">
                  <small>Dark background</small>
                  <Artwork className="brand-lockup" title={`${concept.name} dark version`} />
                </div>
                <div className="brand-surface brand-surface-light">
                  <small>Light background</small>
                  <Artwork className="brand-lockup" title={`${concept.name} light version`} />
                </div>
                <div className="brand-surface brand-surface-mono">
                  <small>One-color</small>
                  <Artwork tone="mono" className="brand-lockup" title={`${concept.name} one-color version`} />
                </div>
              </div>

              <div className="brand-preview-row" aria-label={`${concept.name} app icon previews`}>
                {[32, 64, 128].map((size) => (
                  <div key={size} className="brand-icon-preview" style={{ width: size + 24, height: size + 44 }}>
                    <Artwork
                      lockup="mark"
                      className="brand-icon-svg"
                      title={`${concept.name} ${size}px icon preview`}
                    />
                    <small>{size}px</small>
                  </div>
                ))}
              </div>

              <div className="brand-context-previews">
                <div className="brand-navbar-preview">
                  <span>Navbar</span>
                  <Artwork className="brand-nav-lockup" title={`${concept.name} navbar preview`} />
                  <button type="button">Start Designing</button>
                </div>

                <div className="brand-patch-preview">
                  <span>Neck label / patch</span>
                  <div>
                    <Artwork lockup="mark" tone="mono" className="brand-patch-mark" />
                    <strong>Stitchra</strong>
                    <small>AI embroidery studio</small>
                  </div>
                </div>
              </div>

              <p className="brand-concept-description">{concept.description}</p>

              <div className="brand-evaluation">
                <div>
                  <h3>Pros</h3>
                  <ul>
                    {concept.pros.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Cons</h3>
                  <ul>
                    {concept.cons.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <footer className="brand-concept-footer">
                <span>Embroidery suitability</span>
                <ScoreDots score={concept.embroideryScore} />
              </footer>
            </article>
          );
        })}
      </section>
    </main>
  );
}

const brandLabStyles = `
  .brand-lab-page {
    min-height: 100vh;
    padding: 64px 24px 88px;
    color: #f6fff9;
    background:
      radial-gradient(circle at 14% 8%, rgba(0,255,136,0.15), transparent 28%),
      radial-gradient(circle at 92% 4%, rgba(0,215,255,0.12), transparent 30%),
      radial-gradient(circle at 50% 96%, rgba(211,107,255,0.09), transparent 30%),
      #050607;
  }

  .brand-lab-hero {
    max-width: 1120px;
    margin: 0 auto 26px;
    display: grid;
    gap: 14px;
  }

  .brand-lab-hero p,
  .brand-concept-header > span,
  .brand-concept-header p,
  .brand-surface small,
  .brand-navbar-preview span,
  .brand-patch-preview > span,
  .brand-concept-footer > span {
    margin: 0;
    color: #00ff88;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .brand-lab-hero h1 {
    margin: 0;
    max-width: 840px;
    font-size: clamp(48px, 9vw, 112px);
    line-height: 0.9;
    letter-spacing: -0.075em;
  }

  .brand-lab-hero span {
    max-width: 680px;
    color: rgba(245,247,248,0.72);
    font-size: clamp(17px, 2vw, 22px);
    line-height: 1.55;
  }

  .brand-lab-principles {
    max-width: 1120px;
    margin: 0 auto 34px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .brand-lab-principles span {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    padding: 0 13px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.10);
    color: rgba(246,255,249,0.72);
    background: rgba(255,255,255,0.045);
    font-size: 12px;
    font-weight: 850;
  }

  .brand-lab-grid {
    max-width: 1480px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }

  .brand-concept-card {
    display: grid;
    gap: 18px;
    padding: clamp(18px, 2.5vw, 28px);
    border-radius: 30px;
    border: 1px solid rgba(255,255,255,0.11);
    background:
      radial-gradient(circle at 14% 10%, rgba(0,255,136,0.10), transparent 30%),
      radial-gradient(circle at 88% 22%, rgba(0,215,255,0.075), transparent 32%),
      rgba(255,255,255,0.045);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.08),
      0 30px 90px rgba(0,0,0,0.28);
  }

  .brand-concept-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .brand-concept-header > span {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 15px;
    color: #06100a;
    background: linear-gradient(135deg, #18ff9a, #00c8ff);
    letter-spacing: 0;
  }

  .brand-concept-header div {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  .brand-concept-header h2 {
    margin: 0;
    font-size: clamp(24px, 3vw, 38px);
    line-height: 1;
    letter-spacing: -0.045em;
  }

  .brand-surface-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .brand-surface,
  .brand-navbar-preview,
  .brand-patch-preview {
    min-width: 0;
    display: grid;
    gap: 12px;
    padding: 16px;
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
  }

  .brand-surface-dark {
    background: linear-gradient(145deg, #050806, #0b1714);
  }

  .brand-surface-light {
    background: linear-gradient(145deg, #f6f1e8, #dcebe5);
  }

  .brand-surface-light small,
  .brand-surface-mono small {
    color: rgba(7,20,15,0.62);
  }

  .brand-surface-mono {
    background: #f7f5ee;
    color: #07140f;
  }

  .brand-lockup {
    width: 100%;
    min-height: 112px;
    color: #f6fff9;
  }

  .brand-surface-light .brand-lockup,
  .brand-surface-mono .brand-lockup {
    color: #07140f;
  }

  .brand-preview-row {
    display: flex;
    align-items: end;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .brand-icon-preview {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    gap: 7px;
    padding: 10px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.24);
  }

  .brand-icon-svg {
    width: calc(100% - 24px);
    height: calc(100% - 44px);
    min-width: 32px;
    min-height: 32px;
  }

  .brand-icon-preview small {
    color: rgba(245,247,248,0.58);
    font-size: 11px;
    font-weight: 850;
  }

  .brand-context-previews {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.9fr);
    gap: 12px;
  }

  .brand-navbar-preview {
    background: rgba(0,0,0,0.38);
  }

  .brand-nav-lockup {
    width: min(300px, 100%);
    height: 72px;
  }

  .brand-navbar-preview button {
    width: fit-content;
    min-height: 36px;
    border: 0;
    border-radius: 999px;
    padding: 0 14px;
    color: #06100a;
    background: linear-gradient(135deg, #18ff9a, #00c8ff);
    font: inherit;
    font-size: 12px;
    font-weight: 900;
  }

  .brand-patch-preview {
    place-items: center;
    text-align: center;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03)),
      repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 3px, transparent 3px 8px);
  }

  .brand-patch-preview > div {
    width: 156px;
    min-height: 156px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 6px;
    padding: 18px;
    border-radius: 999px;
    border: 1px dashed rgba(245,247,248,0.28);
    color: rgba(246,255,249,0.84);
    background: rgba(0,0,0,0.32);
  }

  .brand-patch-mark {
    width: 58px;
    height: 58px;
  }

  .brand-patch-preview strong {
    font-size: 18px;
    line-height: 1;
  }

  .brand-patch-preview small {
    color: rgba(245,247,248,0.52);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .brand-concept-description {
    margin: 0;
    color: rgba(245,247,248,0.72);
    font-size: 15px;
    line-height: 1.65;
  }

  .brand-evaluation {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .brand-evaluation > div {
    min-width: 0;
    padding: 14px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.035);
  }

  .brand-evaluation h3 {
    margin: 0 0 8px;
    color: #9dffc4;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .brand-evaluation ul {
    margin: 0;
    padding-left: 18px;
    color: rgba(245,247,248,0.68);
    font-size: 13px;
    line-height: 1.6;
  }

  .brand-concept-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .brand-lab-score {
    display: inline-flex;
    gap: 6px;
  }

  .brand-lab-score i {
    width: 12px;
    height: 12px;
    display: block;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.08);
  }

  .brand-lab-score i[data-active="true"] {
    border-color: transparent;
    background: linear-gradient(135deg, #18ff9a, #00c8ff);
  }

  .concept-mark-bg,
  .concept-soft-circle,
  .concept-grid-box {
    fill: var(--logo-bg, rgba(255,255,255,0.045));
    stroke: var(--logo-muted, rgba(245,247,248,0.22));
    stroke-width: 2;
  }

  .concept-thread-stroke,
  .concept-needle-stroke,
  .concept-stitch-line,
  .concept-seal-outer,
  .concept-seal-inner,
  .concept-grid-line,
  .concept-lux-frame,
  .concept-lux-rule {
    fill: none;
    vector-effect: non-scaling-stroke;
  }

  .concept-thread-stroke {
    stroke: var(--logo-accent, #18ff9a);
    stroke-width: 7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .concept-needle-stroke {
    stroke: var(--logo-accent-2, #00c8ff);
    stroke-width: 3;
    stroke-linecap: round;
  }

  .concept-needle-eye {
    fill: none;
    stroke: var(--logo-ink, #f6fff9);
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .concept-stitch-line {
    stroke: var(--logo-accent-2, #00c8ff);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 0.03 0.07;
    opacity: 0.9;
  }

  .concept-word,
  .concept-single-letter {
    fill: var(--logo-ink, #f6fff9);
    font-family: Inter, Avenir Next, Helvetica Neue, Arial, sans-serif;
    font-weight: 950;
    letter-spacing: -0.055em;
  }

  .concept-word {
    font-size: 40px;
  }

  .concept-word.compact {
    font-size: 34px;
  }

  .concept-single-letter {
    font-size: 64px;
  }

  .concept-seal-outer {
    stroke: var(--logo-accent, #18ff9a);
    stroke-width: 4;
  }

  .concept-seal-inner {
    stroke: var(--logo-muted, rgba(245,247,248,0.26));
    stroke-width: 2;
  }

  .seal-thread,
  .lux-thread {
    stroke-width: 6;
  }

  .seal-stitches {
    opacity: 0.42;
  }

  .wordmark-focus {
    font-size: 52px;
  }

  .word-needle {
    stroke-width: 2.5;
  }

  .concept-grid-line {
    stroke: var(--logo-muted, rgba(245,247,248,0.18));
    stroke-width: 1.4;
  }

  .concept-node {
    fill: var(--logo-accent-2, #00c8ff);
  }

  .concept-lux-frame {
    stroke: var(--logo-ink, #f6fff9);
    stroke-width: 3;
  }

  .concept-lux-rule {
    stroke: var(--logo-accent, #18ff9a);
    stroke-width: 2;
  }

  svg[data-tone="mono"] {
    --logo-ink: currentColor;
    --logo-accent: currentColor;
    --logo-accent-2: currentColor;
    --logo-muted: currentColor;
    --logo-bg: transparent;
  }

  .brand-surface-light svg,
  .brand-surface-mono svg {
    --logo-ink: #07140f;
    --logo-accent: #087a55;
    --logo-accent-2: #0d7082;
    --logo-muted: rgba(7,20,15,0.22);
    --logo-bg: rgba(7,20,15,0.045);
  }

  @media (max-width: 1180px) {
    .brand-lab-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .brand-lab-page {
      padding: 42px 14px 72px;
    }

    .brand-surface-grid,
    .brand-context-previews,
    .brand-evaluation {
      grid-template-columns: 1fr;
    }

    .brand-concept-header {
      align-items: center;
    }

    .brand-preview-row {
      padding-bottom: 8px;
    }
  }
`;
