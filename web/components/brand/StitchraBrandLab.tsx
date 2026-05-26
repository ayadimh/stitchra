import Image from 'next/image';

import {
  premiumLogoConcepts,
  roundOneExplorations,
  threadNeedleSRefinedConcept,
  type BrandConceptScores,
  type BrandLogoConcept,
} from './logoConcepts';

const scoreLabels: Record<keyof BrandConceptScores, string> = {
  memorability: 'Memorability',
  premiumFeel: 'Premium feel',
  embroiderySuitability: 'Embroidery suitability',
  smallSizeReadability: 'Small-size readability',
  uniqueness: 'Uniqueness',
  navbarReadability: 'Navbar readability',
  appIconStrength: 'App icon strength',
  longTermPotential: 'Long-term potential',
};

const promptPack = [
  {
    title: 'Premium wordmark prompt',
    prompt:
      'Create a premium custom wordmark logo for Stitchra, an AI embroidery T-shirt design studio. Focus on the word Stitchra as the main identity with custom typography, subtle thread or stitch micro-detail in one letter, modern crafted luxury feel, dark background version, light background version, one-color version, scalable app icon companion, suitable for embroidery and website navbar. Avoid generic AI robots, generic needle stock icons, clipart, childish effects, excessive neon glow, and unreadable small text.',
  },
  {
    title: 'Thread-S monogram prompt',
    prompt:
      'Design a refined Thread-S monogram for Stitchra, an AI embroidery T-shirt design studio. Build a standalone S mark from a controlled continuous thread path with one elegant stitch or needle-point detail. Premium, timeless, modern, crafted, readable at 16px and 32px, strong as app icon and social avatar, works in dark, light and one-color versions, suitable for embroidery. Avoid cheap neon effects, generic sewing icons, robot symbols and stock-logo composition.',
  },
  {
    title: 'Embroidery patch prompt',
    prompt:
      'Create a premium embroidery patch identity for Stitchra, an AI embroidery T-shirt design studio. Design a circular or soft-square badge/seal with a refined S/thread symbol, fashion-label feeling, scalable one-color embroidery version, app icon version, neck label version, dark and light lockups. Make it crafted and modern, not a cheap stamp. Avoid generic needle clipart, crowded details, childish badge styling and fake vintage clutter.',
  },
  {
    title: 'AI atelier grid prompt',
    prompt:
      'Create a premium AI atelier grid logo direction for Stitchra, an AI embroidery T-shirt design studio. Combine subtle precision grid or alignment-node language with a handcrafted thread/stitch symbol. Communicate AI-assisted craft without looking like a generic AI startup. Include custom Stitchra typography, dark/light/one-color versions, app icon, favicon, embroidery-safe simplified mark. Avoid robots, sparkles, stock neural icons, generic needles and excessive glowing effects.',
  },
];

function totalScore(scores: BrandConceptScores) {
  return Object.values(scores).reduce((sum, score) => sum + score, 0);
}

function ScorePips({ score }: { score: number }) {
  return (
    <span className="brand-score-pips" aria-label={`${score} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <i key={index} data-active={index < score} />
      ))}
    </span>
  );
}

function RoundOneSection() {
  return (
    <section className="lab-section lab-round-one" aria-labelledby="round-one-title">
      <div className="section-heading">
        <p>Round 1 archive</p>
        <h2 id="round-one-title">Rough structure tests, not final candidates.</h2>
      </div>
      <p className="section-copy">
        The first Brand Lab pass helped map possible territories, but these concepts are intentionally treated as
        raw scaffolding. Round 2 below is the serious identity exploration.
      </p>
      <div className="round-one-list" aria-label="Round 1 exploration names">
        {roundOneExplorations.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
    </section>
  );
}

function CandidateImage({
  className,
  sizes,
}: {
  className?: string;
  sizes?: string;
}) {
  return (
    <Image
      src="/brand/candidates/logo01.jpg"
      alt="External Thread Needle S logo candidate with embroidered S and vertical needle"
      width={1792}
      height={2304}
      className={className}
      sizes={sizes}
      priority={false}
    />
  );
}

function RasterCandidatePreviews() {
  return (
    <div className="external-candidate-grid">
      <div className="external-large-preview">
        <span>Uploaded JPG candidate</span>
        <CandidateImage className="candidate-large-image" sizes="(max-width: 900px) 100vw, 520px" />
      </div>

      <div className="external-raster-stack">
        <div className="raster-surface raster-dark">
          <span>Dark background preview</span>
          <CandidateImage className="raster-logo-image" sizes="240px" />
        </div>
        <div className="raster-surface raster-light">
          <span>Light background preview</span>
          <CandidateImage className="raster-logo-image" sizes="240px" />
        </div>
        <div className="raster-surface raster-navbar">
          <span>Navbar preview</span>
          <div>
            <CandidateImage className="raster-nav-image" sizes="80px" />
            <strong>Stitchra</strong>
            <button type="button">Start Designing</button>
          </div>
        </div>
      </div>

      <div className="external-raster-contexts">
        <div className="raster-favicons">
          <span>Favicon scale</span>
          {[16, 32, 64, 128].map((size) => (
            <div key={size}>
              <div style={{ width: size, height: size }}>
                <CandidateImage className="raster-favicon-image" sizes={`${size}px`} />
              </div>
              <small>{size}px</small>
            </div>
          ))}
        </div>
        <div className="raster-app-icon">
          <span>App icon preview</span>
          <div>
            <CandidateImage className="raster-app-image" sizes="128px" />
          </div>
        </div>
        <div className="raster-label-preview">
          <span>Patch / neck label preview</span>
          <div>
            <CandidateImage className="raster-label-image" sizes="72px" />
            <strong>STITCHRA</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExternalCandidateCritique() {
  const pros = [
    'Strong S silhouette',
    'Embroidery/thread identity',
    'Needle detail fits Stitchra',
    'Premium dark atelier feeling',
    'Stronger than previous generic concepts',
  ];
  const cons = [
    'Raster JPG, not vector',
    'Background texture makes it unusable as final logo',
    'Too detailed for small sizes',
    'Thin needle may disappear at favicon size',
    'Needs clean wordmark pairing',
    'Must be simplified for embroidery and one-color use',
  ];

  return (
    <div className="external-critique-grid">
      <div>
        <h4>Pros</h4>
        <ul>
          {pros.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4>Cons</h4>
        <ul>
          {cons.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RecommendationPanel() {
  return (
    <div className="recommendation-panel">
      <span>Recommendation</span>
      <p>
        This is currently the strongest Stitchra direction because it connects the brand name to thread,
        embroidery and a recognizable S mark. It should be refined into a vector identity system before
        replacing the live logo.
      </p>
    </div>
  );
}

function ExternalCandidateSection() {
  return (
    <section className="lab-section external-candidate-section" aria-labelledby="external-candidate-title">
      <div className="section-heading">
        <p>External candidate</p>
        <h2 id="external-candidate-title">Thread Needle S</h2>
      </div>
      <p className="section-copy">
        The imported DALL-E JPG is treated as directional inspiration only. The production path is the clean SVG
        reinterpretation below, not the raster image or its textured background.
      </p>

      <RasterCandidatePreviews />
      <ExternalCandidateCritique />
      <RecommendationPanel />

      <div className="section-heading refined-heading">
        <p>Vector reinterpretation</p>
        <h2>Thread Needle S Refined</h2>
      </div>
      <p className="section-copy">
        A simplified original SVG system inspired by the candidate: strong S, centered needle, restrained stitch
        detail and no raster texture.
      </p>
      <PremiumConceptCard concept={threadNeedleSRefinedConcept} index={0} />
    </section>
  );
}

function SurfacePreviews({ concept }: { concept: BrandLogoConcept }) {
  const Artwork = concept.Artwork;

  return (
    <div className="surface-preview-grid" aria-label={`${concept.name} color system previews`}>
      <div className="surface-card surface-dark">
        <span>Dark background</span>
        <Artwork className="surface-logo" title={`${concept.name} dark background version`} />
      </div>
      <div className="surface-card surface-light">
        <span>Light background</span>
        <Artwork className="surface-logo" title={`${concept.name} light background version`} />
      </div>
      <div className="surface-card surface-mono">
        <span>One-color</span>
        <Artwork tone="mono" className="surface-logo" title={`${concept.name} one-color version`} />
      </div>
    </div>
  );
}

function FaviconPreviews({ concept }: { concept: BrandLogoConcept }) {
  const Artwork = concept.Artwork;
  const sizes = [16, 32, 64, 128];

  return (
    <div className="favicon-panel">
      <div className="panel-label">Favicon / app icon scale</div>
      <div className="favicon-row">
        {sizes.map((size) => (
          <div key={size} className="favicon-frame">
            <div className="favicon-box" style={{ width: size, height: size }}>
              <Artwork variant="mark" className="favicon-logo" title={`${concept.name} ${size}px preview`} />
            </div>
            <small>{size}px</small>
          </div>
        ))}
      </div>
      <div className="app-icon-preview">
        <div>
          <Artwork variant="mark" className="app-icon-logo" title={`${concept.name} 512px app icon preview`} />
        </div>
        <span>512 app icon preview</span>
      </div>
    </div>
  );
}

function ApplicationPreviews({ concept }: { concept: BrandLogoConcept }) {
  const Artwork = concept.Artwork;

  return (
    <div className="application-grid" aria-label={`${concept.name} applied context previews`}>
      <div className="application-card navbar-application">
        <span>Navbar preview</span>
        <div>
          <Artwork className="nav-preview-logo" />
          <button type="button">Start Designing</button>
        </div>
      </div>

      <div className="application-card label-application">
        <span>T-shirt neck label</span>
        <div>
          <Artwork variant="mark" tone="mono" className="label-mark" />
          <strong>STITCHRA</strong>
          <small>AI EMBROIDERY</small>
        </div>
      </div>

      <div className="application-card patch-application">
        <span>Embroidered patch</span>
        <div>
          <Artwork variant="mark" tone="mono" className="patch-preview-mark" />
        </div>
      </div>

      <div className="application-card invoice-application">
        <span>Invoice / header</span>
        <div>
          <Artwork className="invoice-logo" />
          <p>Quote #ST-2048</p>
        </div>
      </div>

      <div className="application-card footer-application">
        <span>Footer preview</span>
        <div>
          <Artwork className="footer-logo" />
          <small>AI embroidery T-shirt platform</small>
        </div>
      </div>

      <div className="application-card email-application">
        <span>Email header preview</span>
        <div>
          <Artwork className="email-logo" />
          <p>We received your Stitchra quote request</p>
        </div>
      </div>

      <div className="application-card social-application">
        <span>Social avatar</span>
        <div>
          <Artwork variant="mark" className="social-avatar-mark" />
        </div>
      </div>

      <div className="application-card stamp-application">
        <span>Black-and-white stamp</span>
        <div>
          <Artwork tone="mono" className="stamp-logo" />
        </div>
      </div>
    </div>
  );
}

function ScorePanel({ scores }: { scores: BrandConceptScores }) {
  return (
    <div className="score-panel">
      <div className="score-total">
        <span>Total score</span>
        <strong>{totalScore(scores)} / 40</strong>
      </div>
      <div className="score-list">
        {(Object.entries(scores) as Array<[keyof BrandConceptScores, number]>).map(([key, score]) => (
          <div key={key} className="score-row">
            <span>{scoreLabels[key]}</span>
            <ScorePips score={score} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({ concept }: { concept: BrandLogoConcept }) {
  return (
    <div className="detail-panel">
      {Object.entries(concept.details).map(([key, value]) => (
        <div key={key}>
          <span>{key.replace(/([A-Z])/g, ' $1')}</span>
          <p>{value}</p>
        </div>
      ))}
    </div>
  );
}

function CritiquePanel({ concept }: { concept: BrandLogoConcept }) {
  return (
    <div className="critique-grid">
      <div>
        <h4>Why this could work</h4>
        <ul>
          {concept.critique.works.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4>Why this could fail</h4>
        <ul>
          {concept.critique.fails.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4>Must refine before production</h4>
        <ul>
          {concept.critique.refine.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PremiumConceptCard({ concept, index }: { concept: BrandLogoConcept; index: number }) {
  const Artwork = concept.Artwork;

  return (
    <article className="premium-concept-card">
      <header className="premium-concept-header">
        <div>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p>{concept.direction}</p>
          <h3>{concept.name}</h3>
        </div>
        <div className="primary-lockup">
          <span>Primary horizontal logo</span>
          <Artwork className="primary-logo" title={`${concept.name} primary horizontal logo`} />
        </div>
        <div className="standalone-mark">
          <span>Standalone icon</span>
          <Artwork variant="mark" className="standalone-logo" title={`${concept.name} standalone icon`} />
        </div>
      </header>

      <p className="concept-description">{concept.description}</p>

      <SurfacePreviews concept={concept} />

      <div className="deep-preview-grid">
        <FaviconPreviews concept={concept} />
        <ApplicationPreviews concept={concept} />
      </div>

      <div className="analysis-grid">
        <DetailPanel concept={concept} />
        <ScorePanel scores={concept.scores} />
      </div>

      <CritiquePanel concept={concept} />
    </article>
  );
}

function PromptPack() {
  return (
    <section className="lab-section prompt-pack" aria-labelledby="prompt-pack-title">
      <div className="section-heading">
        <p>External AI/design tool prompt pack</p>
        <h2 id="prompt-pack-title">Prompt Pack for Recraft / Kittl / Logo Diffusion</h2>
      </div>
      <p className="section-copy">
        These prompts are copy-ready starting points for generating stronger external candidates. Bring the best
        SVG/vector results back into Stitchra for final refinement.
      </p>
      <div className="prompt-grid">
        {promptPack.map((item) => (
          <article key={item.title} className="prompt-card">
            <h3>{item.title}</h3>
            <pre>{item.prompt}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}

function ImportedCandidates() {
  return (
    <section className="lab-section imported-candidates" aria-labelledby="imported-candidates-title">
      <div className="section-heading">
        <p>Future candidate intake</p>
        <h2 id="imported-candidates-title">Imported Candidates</h2>
      </div>
      <p className="section-copy">
        Drop final candidate files into <code>/public/brand/candidates/</code> later. These slots are placeholders
        only; no external assets are included in this task.
      </p>
      <div className="candidate-grid">
        {['Imported SVG Candidate 1', 'Imported PNG Candidate 2', 'Imported Vector Candidate 3'].map((label) => (
          <div key={label} className="candidate-slot">
            <span>{label}</span>
            <strong>Empty slot</strong>
            <p>Ready for a future reviewed candidate file.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StitchraBrandLab() {
  return (
    <main className="brand-lab-pro-page">
      <style>{brandLabProStyles}</style>

      <section className="brand-lab-pro-hero">
        <p>Private exploration</p>
        <h1>Stitchra Brand Lab Pro</h1>
        <span>Build a timeless identity for an AI embroidery design studio.</span>
        <div className="quality-note">
          The goal is not a glowing S. The goal is a scalable brand system: wordmark, monogram, patch mark, app
          icon, favicon and embroidery-safe one-color version.
        </div>
      </section>

      <section className="brand-principles" aria-label="Brand quality principles">
        {[
          'Wordmark must carry the identity',
          'Embroidery-safe in one color',
          'Readable at 16px',
          'Premium without neon dependence',
          'AI-assisted, not robot-coded',
          'Useful on labels and invoices',
        ].map((principle) => (
          <span key={principle}>{principle}</span>
        ))}
      </section>

      <RoundOneSection />
      <ExternalCandidateSection />

      <section className="lab-section premium-directions" aria-labelledby="round-two-title">
        <div className="section-heading">
          <p>Round 2</p>
          <h2 id="round-two-title">Premium Directions</h2>
        </div>
        <p className="section-copy">
          Four stricter identity systems built around scalable usage, honest critique and production constraints.
          These are still explorations, not final production logos.
        </p>
        <div className="premium-concepts">
          {premiumLogoConcepts.map((concept, index) => (
            <PremiumConceptCard key={concept.id} concept={concept} index={index} />
          ))}
        </div>
      </section>

      <PromptPack />
      <ImportedCandidates />
    </main>
  );
}

const brandLabProStyles = `
  .brand-lab-pro-page {
    min-height: 100vh;
    padding: 72px 22px 96px;
    color: #f4f0e8;
    background:
      linear-gradient(120deg, rgba(255,255,255,0.035) 1px, transparent 1px),
      radial-gradient(circle at 18% 4%, rgba(29,255,157,0.12), transparent 34%),
      radial-gradient(circle at 88% 2%, rgba(112,210,255,0.10), transparent 30%),
      linear-gradient(180deg, #070a08 0%, #030504 100%);
    background-size: 72px 72px, auto, auto, auto;
  }

  .brand-lab-pro-hero,
  .brand-principles,
  .lab-section {
    width: min(1500px, 100%);
    margin-inline: auto;
  }

  .brand-lab-pro-hero {
    display: grid;
    gap: 18px;
    padding: 28px 0 34px;
  }

  .brand-lab-pro-hero p,
  .section-heading p,
  .surface-card span,
  .panel-label,
  .application-card > span,
  .primary-lockup span,
  .standalone-mark span,
  .score-total span,
  .detail-panel span,
  .external-large-preview span,
  .raster-surface span,
  .external-raster-contexts span,
  .recommendation-panel span {
    margin: 0;
    color: #69f5b1;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .brand-lab-pro-hero h1 {
    margin: 0;
    max-width: 1020px;
    font-size: clamp(52px, 8vw, 116px);
    line-height: 0.88;
    letter-spacing: -0.08em;
  }

  .brand-lab-pro-hero > span {
    max-width: 760px;
    color: rgba(244,240,232,0.76);
    font-size: clamp(18px, 2vw, 25px);
    line-height: 1.55;
  }

  .quality-note {
    max-width: 980px;
    padding: 20px 22px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 22px;
    color: rgba(244,240,232,0.82);
    background: rgba(255,255,255,0.055);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    font-size: clamp(15px, 1.5vw, 18px);
    line-height: 1.6;
  }

  .brand-principles {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 42px;
  }

  .brand-principles span,
  .round-one-list span {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    border: 1px solid rgba(255,255,255,0.11);
    border-radius: 999px;
    padding: 0 14px;
    color: rgba(244,240,232,0.78);
    background: rgba(255,255,255,0.045);
    font-size: 12px;
    font-weight: 800;
  }

  .lab-section {
    margin-top: 32px;
    padding: clamp(22px, 3vw, 38px);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 34px;
    background:
      radial-gradient(circle at 8% 0%, rgba(105,245,177,0.075), transparent 32%),
      rgba(255,255,255,0.035);
    box-shadow: 0 30px 100px rgba(0,0,0,0.24);
  }

  .section-heading {
    display: grid;
    gap: 9px;
    margin-bottom: 10px;
  }

  .section-heading h2 {
    margin: 0;
    font-size: clamp(32px, 5vw, 72px);
    line-height: 0.94;
    letter-spacing: -0.065em;
  }

  .section-copy {
    max-width: 900px;
    margin: 0 0 22px;
    color: rgba(244,240,232,0.70);
    font-size: 16px;
    line-height: 1.65;
  }

  .round-one-list {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .external-candidate-section {
    background:
      radial-gradient(circle at 12% 0%, rgba(147,255,35,0.11), transparent 34%),
      linear-gradient(135deg, rgba(255,255,255,0.062), rgba(255,255,255,0.025)),
      #070b09;
  }

  .external-candidate-grid {
    display: grid;
    grid-template-columns: minmax(280px, 0.78fr) minmax(240px, 0.46fr) minmax(280px, 0.58fr);
    gap: 16px;
    margin-bottom: 18px;
  }

  .external-large-preview,
  .raster-surface,
  .external-raster-contexts > div,
  .recommendation-panel,
  .external-critique-grid > div {
    border: 1px solid rgba(255,255,255,0.11);
    background: rgba(255,255,255,0.045);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
  }

  .external-large-preview {
    display: grid;
    gap: 14px;
    border-radius: 28px;
    padding: 18px;
  }

  .candidate-large-image {
    width: 100%;
    height: min(620px, 64vw);
    object-fit: cover;
    object-position: center;
    border-radius: 22px;
    box-shadow: 0 24px 70px rgba(0,0,0,0.34);
  }

  .external-raster-stack,
  .external-raster-contexts {
    display: grid;
    gap: 14px;
  }

  .raster-surface,
  .external-raster-contexts > div {
    display: grid;
    gap: 12px;
    align-content: center;
    border-radius: 24px;
    padding: 16px;
  }

  .raster-light {
    color: #111512;
    background: #f4f0e8;
  }

  .raster-light span {
    color: rgba(17,21,18,0.55);
  }

  .raster-logo-image {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    object-position: center;
    border-radius: 18px;
  }

  .raster-navbar > div {
    display: grid;
    grid-template-columns: 50px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 70px;
    border-radius: 18px;
    padding: 10px;
    background: rgba(0,0,0,0.34);
  }

  .raster-navbar button {
    border: 0;
    border-radius: 999px;
    padding: 9px 12px;
    color: #07100b;
    background: linear-gradient(135deg, #18ff9a, #00c8ff);
    font-size: 12px;
    font-weight: 900;
  }

  .raster-nav-image {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 14px;
  }

  .raster-navbar strong {
    min-width: 0;
    font-size: 18px;
    letter-spacing: -0.04em;
  }

  .raster-favicons {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .raster-favicons > span {
    grid-column: 1 / -1;
  }

  .raster-favicons > div {
    display: grid;
    justify-items: center;
    gap: 6px;
  }

  .raster-favicons > div > div {
    overflow: hidden;
    border-radius: 8px;
    background: #0c110e;
  }

  .raster-favicon-image,
  .raster-app-image,
  .raster-label-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .raster-favicons small {
    color: rgba(244,240,232,0.55);
    font-size: 10px;
    font-weight: 800;
  }

  .raster-app-icon > div {
    width: 132px;
    height: 132px;
    overflow: hidden;
    border-radius: 30px;
    background: #0c110e;
  }

  .raster-label-preview > div {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    min-height: 94px;
    border-radius: 6px;
    padding: 10px;
    color: #111512;
    background: #f4f0e8;
  }

  .raster-label-image {
    border-radius: 4px;
  }

  .external-critique-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin: 18px 0;
  }

  .external-critique-grid > div,
  .recommendation-panel {
    border-radius: 24px;
    padding: 18px;
  }

  .external-critique-grid h4 {
    margin: 0 0 10px;
    font-size: 15px;
  }

  .external-critique-grid ul {
    margin: 0;
    padding-left: 18px;
    color: rgba(244,240,232,0.72);
    line-height: 1.6;
    font-size: 14px;
  }

  .recommendation-panel {
    display: grid;
    gap: 8px;
    margin-bottom: 34px;
    border-color: rgba(105,245,177,0.28);
    background:
      radial-gradient(circle at 0% 0%, rgba(105,245,177,0.14), transparent 44%),
      rgba(255,255,255,0.055);
  }

  .recommendation-panel p {
    max-width: 980px;
    margin: 0;
    color: rgba(244,240,232,0.82);
    font-size: 16px;
    line-height: 1.65;
  }

  .refined-heading {
    margin-top: 8px;
  }

  .premium-concepts {
    display: grid;
    gap: 28px;
  }

  .premium-concept-card {
    display: grid;
    gap: 24px;
    padding: clamp(18px, 2.5vw, 30px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 30px;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.070), rgba(255,255,255,0.025)),
      #070b09;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.09),
      0 24px 90px rgba(0,0,0,0.25);
  }

  .premium-concept-header {
    display: grid;
    grid-template-columns: minmax(240px, 0.78fr) minmax(340px, 1.34fr) minmax(150px, 0.42fr);
    gap: 16px;
    align-items: stretch;
  }

  .premium-concept-header > div:first-child {
    display: grid;
    align-content: center;
    gap: 8px;
  }

  .premium-concept-header > div:first-child > span {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    color: #07100b;
    background: linear-gradient(135deg, #f4f0e8, #69f5b1);
    font-size: 14px;
    font-weight: 950;
  }

  .premium-concept-header p {
    margin: 0;
    color: #69f5b1;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .premium-concept-header h3 {
    margin: 0;
    max-width: 520px;
    font-size: clamp(29px, 4vw, 52px);
    line-height: 0.96;
    letter-spacing: -0.055em;
  }

  .primary-lockup,
  .standalone-mark,
  .surface-card,
  .favicon-panel,
  .application-card,
  .detail-panel,
  .score-panel,
  .critique-grid > div,
  .prompt-card,
  .candidate-slot {
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.045);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
  }

  .primary-lockup,
  .standalone-mark {
    min-height: 180px;
    display: grid;
    gap: 12px;
    align-content: center;
    border-radius: 24px;
    padding: 18px;
    overflow: hidden;
  }

  .primary-logo {
    width: 100%;
    height: 112px;
  }

  .standalone-logo {
    width: min(124px, 100%);
    height: 124px;
    justify-self: center;
  }

  .concept-description {
    max-width: 980px;
    margin: 0;
    color: rgba(244,240,232,0.78);
    font-size: 17px;
    line-height: 1.65;
  }

  .surface-preview-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .surface-card {
    min-height: 190px;
    display: grid;
    gap: 12px;
    align-content: center;
    border-radius: 24px;
    padding: 18px;
    overflow: hidden;
  }

  .surface-light {
    color: #111512;
    background: #f4f0e8;
  }

  .surface-dark {
    background:
      radial-gradient(circle at 22% 14%, rgba(105,245,177,0.12), transparent 36%),
      #070b09;
  }

  .surface-mono {
    background: #111;
  }

  .surface-light span {
    color: rgba(17,21,18,0.56);
  }

  .surface-logo {
    width: 100%;
    height: 120px;
  }

  .deep-preview-grid {
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 16px;
  }

  .favicon-panel {
    display: grid;
    gap: 16px;
    align-content: start;
    border-radius: 24px;
    padding: 18px;
  }

  .favicon-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
  }

  .favicon-frame {
    min-width: 58px;
    display: grid;
    justify-items: center;
    gap: 7px;
  }

  .favicon-box {
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 9px;
    background: #101612;
  }

  .favicon-logo,
  .app-icon-logo,
  .social-avatar-mark {
    width: 100%;
    height: 100%;
  }

  .favicon-frame small,
  .app-icon-preview span {
    color: rgba(244,240,232,0.52);
    font-size: 11px;
    font-weight: 800;
  }

  .app-icon-preview {
    display: grid;
    gap: 10px;
  }

  .app-icon-preview > div {
    width: 152px;
    height: 152px;
    display: grid;
    place-items: center;
    border-radius: 34px;
    background:
      radial-gradient(circle at 30% 12%, rgba(105,245,177,0.16), transparent 42%),
      #111612;
  }

  .application-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .application-card {
    min-height: 152px;
    display: grid;
    gap: 12px;
    align-content: center;
    border-radius: 24px;
    padding: 16px;
    overflow: hidden;
  }

  .navbar-application {
    grid-column: span 3;
  }

  .navbar-application > div {
    display: flex;
    min-height: 74px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-radius: 18px;
    padding: 12px 14px;
    background: rgba(0,0,0,0.34);
  }

  .navbar-application button {
    flex: 0 0 auto;
    border: 0;
    border-radius: 999px;
    padding: 12px 16px;
    color: #07100b;
    background: linear-gradient(135deg, #18ff9a, #00c8ff);
    font-weight: 900;
  }

  .nav-preview-logo {
    width: min(310px, 62%);
    height: 58px;
  }

  .label-application > div,
  .patch-application > div,
  .social-application > div {
    display: grid;
    place-items: center;
  }

  .label-application > div {
    min-height: 92px;
    border: 1px solid rgba(244,240,232,0.38);
    border-radius: 4px;
    color: #111;
    background: #f4f0e8;
  }

  .label-mark {
    width: 42px;
    height: 42px;
  }

  .label-application strong {
    font-size: 12px;
    letter-spacing: 0.18em;
  }

  .label-application small {
    color: rgba(17,21,18,0.62);
    font-size: 8px;
    letter-spacing: 0.12em;
  }

  .patch-application > div {
    width: 104px;
    height: 104px;
    justify-self: center;
    border-radius: 999px;
    background: #f4f0e8;
  }

  .patch-preview-mark {
    width: 82px;
    height: 82px;
  }

  .invoice-application > div {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 10px;
    color: #141812;
    background: #f4f0e8;
  }

  .invoice-logo {
    width: 220px;
    max-width: 100%;
    height: 52px;
  }

  .invoice-application p {
    margin: 0;
    color: rgba(20,24,18,0.55);
    font-size: 12px;
    font-weight: 850;
  }

  .footer-application > div,
  .email-application > div {
    display: grid;
    gap: 8px;
    padding: 14px;
    border-radius: 14px;
    background: rgba(0,0,0,0.28);
  }

  .footer-logo,
  .email-logo {
    width: 220px;
    max-width: 100%;
    height: 48px;
  }

  .footer-application small,
  .email-application p {
    margin: 0;
    color: rgba(244,240,232,0.56);
    font-size: 12px;
    font-weight: 800;
  }

  .social-application > div {
    width: 96px;
    height: 96px;
    justify-self: center;
    border-radius: 999px;
    background: #0d130f;
  }

  .stamp-application > div {
    display: grid;
    min-height: 92px;
    place-items: center;
    border: 2px solid #f4f0e8;
    border-radius: 12px;
    filter: grayscale(1);
  }

  .stamp-logo {
    width: 220px;
    max-width: 96%;
    height: 58px;
  }

  .analysis-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.55fr);
    gap: 16px;
  }

  .detail-panel,
  .score-panel {
    border-radius: 24px;
    padding: 18px;
  }

  .detail-panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 15px;
  }

  .detail-panel div {
    display: grid;
    gap: 6px;
  }

  .detail-panel p {
    margin: 0;
    color: rgba(244,240,232,0.72);
    line-height: 1.55;
    font-size: 14px;
  }

  .score-panel {
    display: grid;
    gap: 16px;
    align-content: start;
  }

  .score-total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .score-total strong {
    font-size: 28px;
    letter-spacing: -0.04em;
  }

  .score-list {
    display: grid;
    gap: 10px;
  }

  .score-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: rgba(244,240,232,0.72);
    font-size: 13px;
    font-weight: 750;
  }

  .brand-score-pips {
    display: inline-flex;
    gap: 4px;
  }

  .brand-score-pips i {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(244,240,232,0.17);
  }

  .brand-score-pips i[data-active='true'] {
    background: #69f5b1;
  }

  .critique-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .critique-grid > div {
    border-radius: 24px;
    padding: 18px;
  }

  .critique-grid h4,
  .prompt-card h3,
  .candidate-slot strong {
    margin: 0 0 10px;
    font-size: 15px;
    letter-spacing: -0.02em;
  }

  .critique-grid ul {
    margin: 0;
    padding-left: 18px;
    color: rgba(244,240,232,0.70);
    line-height: 1.58;
    font-size: 14px;
  }

  .prompt-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .prompt-card {
    display: grid;
    gap: 10px;
    border-radius: 24px;
    padding: 18px;
  }

  .prompt-card pre {
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    color: rgba(244,240,232,0.74);
    font-family: inherit;
    font-size: 13px;
    line-height: 1.62;
  }

  .candidate-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .candidate-slot {
    min-height: 210px;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 8px;
    border-style: dashed;
    border-radius: 26px;
    padding: 20px;
    text-align: center;
  }

  .candidate-slot span {
    color: #69f5b1;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .candidate-slot p {
    margin: 0;
    color: rgba(244,240,232,0.56);
    font-size: 14px;
  }

  .primary-logo,
  .standalone-logo,
  .surface-logo,
  .nav-preview-logo,
  .label-mark,
  .patch-preview-mark,
  .invoice-logo,
  .footer-logo,
  .email-logo,
  .social-avatar-mark,
  .stamp-logo,
  .favicon-logo,
  .app-icon-logo {
    overflow: visible;
  }

  svg[data-tone='color'] .pro-mark-field,
  svg[data-tone='color'] .signature-field,
  svg[data-tone='color'] .grid-field,
  svg[data-tone='color'] .refined-field {
    fill: rgba(105,245,177,0.08);
    stroke: rgba(105,245,177,0.44);
  }

  svg[data-tone='mono'] .pro-mark-field,
  svg[data-tone='mono'] .signature-field,
  svg[data-tone='mono'] .grid-field,
  svg[data-tone='mono'] .refined-field {
    fill: none;
    stroke: currentColor;
  }

  .pro-heavy-thread,
  .signature-thread,
  .patch-thread,
  .grid-thread,
  .refined-s-backbone,
  .refined-s-highlight {
    fill: none;
    stroke: currentColor;
    stroke-width: 9;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  svg[data-tone='color'] .pro-heavy-thread,
  svg[data-tone='color'] .signature-thread,
  svg[data-tone='color'] .patch-thread,
  svg[data-tone='color'] .grid-thread,
  svg[data-tone='color'] .refined-s-backbone,
  svg[data-tone='color'] .refined-s-highlight,
  svg[data-tone='color'] .refined-word,
  svg[data-tone='color'] .pro-word,
  svg[data-tone='color'] .atelier-word {
    color: #f4f0e8;
    fill: #f4f0e8;
    stroke: #69f5b1;
  }

  svg[data-tone='mono'] .pro-heavy-thread,
  svg[data-tone='mono'] .signature-thread,
  svg[data-tone='mono'] .patch-thread,
  svg[data-tone='mono'] .grid-thread,
  svg[data-tone='mono'] .refined-s-backbone,
  svg[data-tone='mono'] .refined-s-highlight,
  svg[data-tone='mono'] .refined-word,
  svg[data-tone='mono'] .pro-word,
  svg[data-tone='mono'] .atelier-word {
    color: currentColor;
    fill: currentColor;
    stroke: currentColor;
  }

  .pro-word,
  .atelier-word,
  .refined-word {
    fill: currentColor;
    stroke: none;
    font-size: 68px;
    font-weight: 950;
    letter-spacing: -0.075em;
  }

  .atelier-word {
    font-size: 82px;
    letter-spacing: -0.09em;
  }

  .refined-word {
    font-size: 70px;
    letter-spacing: -0.07em;
  }

  .pro-word-rule,
  .atelier-rule,
  .pro-micro-stitches,
  .grid-top-rule,
  .refined-word-stitch,
  .refined-stitch,
  .refined-inner-thread {
    fill: none;
    stroke: #69f5b1;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 0.05 0.055;
  }

  .pro-subline {
    fill: rgba(244,240,232,0.58);
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .pro-needle,
  .signature-needle,
  .refined-needle {
    fill: none;
    stroke: #f4f0e8;
    stroke-width: 3.5;
    stroke-linecap: round;
  }

  .pro-needle-eye,
  .signature-eye,
  .signature-endpoint,
  .grid-node,
  .refined-needle-eye {
    fill: #69f5b1;
  }

  .refined-s-backbone {
    stroke: rgba(3,6,4,0.94);
    stroke-width: 28;
  }

  .refined-s-highlight {
    stroke: #8cff1f;
    stroke-width: 7;
  }

  .refined-needle {
    stroke-width: 4.5;
  }

  .refined-needle-eye {
    stroke: rgba(244,240,232,0.82);
    stroke-width: 1;
  }

  .refined-stitch,
  .refined-inner-thread,
  .refined-word-stitch {
    stroke-width: 3;
    stroke-dasharray: 0.045 0.055;
  }

  .refined-inner-thread {
    stroke: rgba(140,255,31,0.48);
  }

  .refined-tagline {
    fill: rgba(244,240,232,0.58);
    font-size: 14px;
    font-weight: 850;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .patch-outer {
    fill: #f4f0e8;
    stroke: rgba(105,245,177,0.55);
    stroke-width: 3;
  }

  .patch-inner {
    fill: #0b100d;
    stroke: rgba(244,240,232,0.48);
    stroke-width: 2;
  }

  .patch-stitch {
    fill: none;
    stroke: rgba(105,245,177,0.72);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 0.035 0.06;
  }

  .patch-stitch.secondary {
    stroke: rgba(244,240,232,0.42);
  }

  .grid-lines {
    fill: none;
    stroke: rgba(244,240,232,0.20);
    stroke-width: 1.5;
  }

  svg[data-tone='mono'] .patch-outer,
  svg[data-tone='mono'] .patch-inner {
    fill: none;
    stroke: currentColor;
  }

  svg[data-tone='mono'] .patch-stitch,
  svg[data-tone='mono'] .grid-lines,
  svg[data-tone='mono'] .pro-word-rule,
  svg[data-tone='mono'] .atelier-rule,
  svg[data-tone='mono'] .pro-micro-stitches,
  svg[data-tone='mono'] .grid-top-rule,
  svg[data-tone='mono'] .refined-word-stitch,
  svg[data-tone='mono'] .refined-stitch,
  svg[data-tone='mono'] .refined-inner-thread,
  svg[data-tone='mono'] .pro-needle,
  svg[data-tone='mono'] .signature-needle,
  svg[data-tone='mono'] .refined-needle {
    stroke: currentColor;
  }

  svg[data-tone='mono'] .pro-needle-eye,
  svg[data-tone='mono'] .signature-eye,
  svg[data-tone='mono'] .signature-endpoint,
  svg[data-tone='mono'] .grid-node,
  svg[data-tone='mono'] .refined-needle-eye {
    fill: currentColor;
  }

  svg[data-tone='mono'] .refined-s-backbone {
    stroke: currentColor;
  }

  svg[data-tone='mono'] .refined-s-highlight {
    stroke: currentColor;
  }

  .surface-light svg[data-tone='color'] .pro-word,
  .surface-light svg[data-tone='color'] .atelier-word,
  .surface-light svg[data-tone='color'] .refined-word,
  .surface-light svg[data-tone='color'] .pro-heavy-thread,
  .surface-light svg[data-tone='color'] .signature-thread,
  .surface-light svg[data-tone='color'] .refined-s-backbone,
  .surface-light svg[data-tone='color'] .refined-s-highlight,
  .surface-light svg[data-tone='color'] .grid-thread {
    fill: #111512;
    stroke: #0f6d46;
    color: #111512;
  }

  .surface-light svg[data-tone='color'] .patch-inner {
    fill: #111512;
  }

  code {
    border-radius: 7px;
    padding: 2px 6px;
    color: #69f5b1;
    background: rgba(105,245,177,0.10);
  }

  @media (max-width: 1180px) {
    .premium-concept-header,
    .deep-preview-grid,
    .analysis-grid {
      grid-template-columns: 1fr;
    }

    .application-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .navbar-application {
      grid-column: span 2;
    }
  }

  @media (max-width: 760px) {
    .brand-lab-pro-page {
      padding: 42px 14px 72px;
    }

    .lab-section,
    .premium-concept-card {
      border-radius: 24px;
      padding: 18px;
    }

    .surface-preview-grid,
    .application-grid,
    .detail-panel,
    .critique-grid,
    .prompt-grid,
    .candidate-grid {
      grid-template-columns: 1fr;
    }

    .navbar-application {
      grid-column: auto;
    }

    .navbar-application > div {
      align-items: flex-start;
      flex-direction: column;
    }

    .nav-preview-logo {
      width: 100%;
    }

    .primary-lockup,
    .standalone-mark,
    .surface-card {
      min-height: 150px;
    }

    .primary-logo,
    .surface-logo {
      height: 92px;
    }
  }
`;
