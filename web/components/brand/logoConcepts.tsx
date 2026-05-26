import type { ComponentType, ReactNode } from 'react';

export type LogoTone = 'color' | 'mono';
export type LogoVariant = 'horizontal' | 'mark';

export type LogoConceptArtworkProps = {
  tone?: LogoTone;
  variant?: LogoVariant;
  className?: string;
  title?: string;
};

export type BrandConceptScores = {
  memorability: number;
  premiumFeel: number;
  embroiderySuitability: number;
  smallSizeReadability: number;
  uniqueness: number;
  navbarReadability: number;
  appIconStrength: number;
  longTermPotential: number;
};

export type BrandLogoConcept = {
  id: string;
  name: string;
  shortName: string;
  direction: string;
  description: string;
  scores: BrandConceptScores;
  details: {
    coreIdea: string;
    visualSignature: string;
    typographyDirection: string;
    embroiderySuitability: string;
    scalabilityNotes: string;
    riskNotes: string;
  };
  critique: {
    works: string[];
    fails: string[];
    refine: string[];
  };
  Artwork: ComponentType<LogoConceptArtworkProps>;
};

function LogoCanvas({
  children,
  tone = 'color',
  variant = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps & {
  children: ReactNode;
}) {
  const viewBox = variant === 'mark' ? '0 0 160 160' : '0 0 560 160';

  return (
    <svg
      className={className}
      viewBox={viewBox}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-tone={tone}
      data-variant={variant}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function Word({
  x = 196,
  y = 96,
  className = '',
}: {
  x?: number;
  y?: number;
  className?: string;
}) {
  return (
    <g className={`pro-wordmark ${className}`}>
      <text x={x} y={y} className="pro-word">
        Stitchra
      </text>
      <path d={`M${x + 5} ${y + 20}H${x + 238}`} className="pro-word-rule" pathLength="1" />
    </g>
  );
}

function AtelierWordmark({
  tone = 'color',
  variant = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  if (variant === 'mark') {
    return (
      <LogoCanvas tone={tone} variant={variant} className={className} title={title}>
        <rect x="22" y="22" width="116" height="116" rx="30" className="pro-mark-field" />
        <path
          d="M101 44C93 36 73 35 62 43C49 52 54 65 72 69L89 73C109 77 113 96 96 108C80 120 55 114 48 99"
          className="pro-heavy-thread"
          pathLength="1"
        />
        <path d="M48 124C68 116 91 116 112 124" className="pro-micro-stitches" pathLength="1" />
      </LogoCanvas>
    );
  }

  return (
    <LogoCanvas tone={tone} variant={variant} className={className} title={title}>
      <g className="atelier-wordmark">
        <text x="34" y="98" className="atelier-word">
          Stitchra
        </text>
        <path d="M172 46V99" className="pro-needle" />
        <path d="M172 46C181 50 183 58 179 66C173 64 170 57 172 46Z" className="pro-needle-eye" />
        <path d="M170 113C184 105 203 105 221 113" className="pro-micro-stitches" pathLength="1" />
        <path d="M46 117H376" className="atelier-rule" pathLength="1" />
      </g>
    </LogoCanvas>
  );
}

function ThreadSSignature({
  tone = 'color',
  variant = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoCanvas tone={tone} variant={variant} className={className} title={title}>
      <g>
        <rect x="18" y="18" width="124" height="124" rx="38" className="signature-field" />
        <path
          d="M105 41C94 30 67 30 54 42C40 55 49 70 72 74L91 78C112 83 117 105 98 119C79 132 49 124 42 105"
          className="signature-thread"
          pathLength="1"
        />
        <path d="M104 39L52 121" className="signature-needle" />
        <circle cx="105" cy="40" r="5" className="signature-eye" />
        <circle cx="43" cy="105" r="4" className="signature-endpoint" />
      </g>
      {variant === 'horizontal' && <Word className="signature-word" />}
    </LogoCanvas>
  );
}

function ThreadNeedleSRefined({
  tone = 'color',
  variant = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoCanvas tone={tone} variant={variant} className={className} title={title}>
      <g className="refined-thread-needle">
        <rect x="18" y="18" width="124" height="124" rx="34" className="refined-field" />
        <path
          d="M113 42H82C55 42 42 52 42 69C42 84 55 91 80 92H92C110 92 121 101 121 116C121 134 105 143 78 143H43"
          className="refined-s-backbone"
          pathLength="1"
        />
        <path
          d="M111 45H81C59 45 49 54 49 68C49 80 60 86 81 87H93C115 87 128 99 128 116C128 137 110 148 78 148H45"
          className="refined-s-highlight"
          pathLength="1"
        />
        <path d="M80 13V147" className="refined-needle" />
        <path d="M80 13C91 22 93 35 85 47C78 43 76 29 80 13Z" className="refined-needle-eye" />
        <path d="M69 62C78 57 88 57 98 62" className="refined-stitch" pathLength="1" />
        <path d="M60 112C75 104 95 104 112 112" className="refined-stitch lower" pathLength="1" />
        <path d="M41 78C54 69 68 66 82 68" className="refined-inner-thread" pathLength="1" />
      </g>
      {variant === 'horizontal' && (
        <g className="refined-lockup">
          <text x="198" y="96" className="refined-word">
            Stitchra
          </text>
          <path d="M203 115H421" className="refined-word-stitch" pathLength="1" />
          <text x="201" y="132" className="refined-tagline">
            AI embroidery studio
          </text>
        </g>
      )}
    </LogoCanvas>
  );
}

function EmbroideryPatchSystem({
  tone = 'color',
  variant = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoCanvas tone={tone} variant={variant} className={className} title={title}>
      <g>
        <path
          d="M80 15C115 15 140 40 140 80C140 120 115 145 80 145C45 145 20 120 20 80C20 40 45 15 80 15Z"
          className="patch-outer"
        />
        <path
          d="M80 28C108 28 127 48 127 80C127 112 108 132 80 132C52 132 33 112 33 80C33 48 52 28 80 28Z"
          className="patch-inner"
        />
        <path
          d="M104 53C96 44 73 43 61 52C49 61 56 74 75 78L91 81C108 85 111 102 96 112C82 121 59 116 53 101"
          className="patch-thread"
          pathLength="1"
        />
        <path d="M45 45L115 115" className="patch-stitch" pathLength="1" />
        <path d="M47 115L115 45" className="patch-stitch secondary" pathLength="1" />
      </g>
      {variant === 'horizontal' && (
        <g>
          <Word className="patch-word" />
          <text x="199" y="122" className="pro-subline">
            AI embroidery studio
          </text>
        </g>
      )}
    </LogoCanvas>
  );
}

function AIAtelierGrid({
  tone = 'color',
  variant = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoCanvas tone={tone} variant={variant} className={className} title={title}>
      <g>
        <rect x="18" y="18" width="124" height="124" rx="28" className="grid-field" />
        <path d="M42 44H118M42 80H118M42 116H118M44 42V118M80 42V118M116 42V118" className="grid-lines" />
        <path
          d="M106 48C93 39 66 43 58 58C51 70 61 79 81 80C103 81 112 99 96 113C81 126 55 120 48 105"
          className="grid-thread"
          pathLength="1"
        />
        <circle cx="44" cy="44" r="4" className="grid-node" />
        <circle cx="116" cy="80" r="4" className="grid-node" />
        <circle cx="80" cy="116" r="4" className="grid-node" />
      </g>
      {variant === 'horizontal' && (
        <g>
          <Word className="grid-word" />
          <path d="M199 44H430" className="grid-top-rule" pathLength="1" />
        </g>
      )}
    </LogoCanvas>
  );
}

export const premiumLogoConcepts: BrandLogoConcept[] = [
  {
    id: 'atelier-wordmark',
    name: 'Stitchra Atelier Wordmark',
    shortName: 'Atelier Wordmark',
    direction: 'Wordmark-led identity',
    description:
      'A restrained wordmark-first system where Stitchra owns the brand and the stitch detail stays secondary.',
    scores: {
      memorability: 4,
      premiumFeel: 5,
      embroiderySuitability: 4,
      smallSizeReadability: 4,
      uniqueness: 4,
      navbarReadability: 5,
      appIconStrength: 3,
      longTermPotential: 5,
    },
    details: {
      coreIdea: 'Make the name the asset. The mark supports the word instead of competing with it.',
      visualSignature: 'A single needle/stitch intervention around the wordmark, not a generic sewing icon.',
      typographyDirection: 'High-contrast modern sans/soft-serif hybrid with a slightly tailored lowercase rhythm.',
      embroiderySuitability: 'Strong as a woven label or one-color chest mark because the detail is minimal.',
      scalabilityNotes: 'Best for navbar, invoices and packaging. Needs a refined companion monogram for tiny app use.',
      riskNotes: 'If the type is not custom enough, it can feel like a dressed-up text logo.',
    },
    critique: {
      works: [
        'The brand name becomes recognizable instead of relying on a decorative symbol.',
        'Premium enough for invoices, labels and a future clothing-adjacent identity.',
      ],
      fails: [
        'The standalone app icon is weaker than the other directions.',
        'A production version would need real type customization, not just SVG text.',
      ],
      refine: [
        'Draw custom S/t/i details and test the wordmark at 120px navbar width.',
        'Create a companion favicon monogram that inherits the same stitch logic.',
      ],
    },
    Artwork: AtelierWordmark,
  },
  {
    id: 'thread-s-signature',
    name: 'Thread-S Signature',
    shortName: 'Thread-S',
    direction: 'Refined monogram',
    description:
      'A controlled S thread path designed to work as app icon, favicon and social avatar without excessive glow.',
    scores: {
      memorability: 5,
      premiumFeel: 4,
      embroiderySuitability: 4,
      smallSizeReadability: 5,
      uniqueness: 4,
      navbarReadability: 4,
      appIconStrength: 5,
      longTermPotential: 4,
    },
    details: {
      coreIdea: 'Own a simple Stitchra S that feels drawn by thread but remains crisp.',
      visualSignature: 'One thick S curve, a needle axis and restrained endpoints for stitch craft.',
      typographyDirection: 'Pair with a confident geometric wordmark and wide tracking for premium utility.',
      embroiderySuitability: 'Excellent if simplified to two stroke weights for one-color embroidery.',
      scalabilityNotes: 'Strongest direction for favicon, app icon, stickers and social profile.',
      riskNotes: 'Could still drift toward generic thread-icon territory unless the S proportions are distinctive.',
    },
    critique: {
      works: [
        'Clear brand shorthand that reads quickly at small sizes.',
        'Can become a recognizable app icon and garment label mark.',
      ],
      fails: [
        'Many craft brands use thread loops, so the exact curve must be owned.',
        'The needle detail can become too literal if overemphasized.',
      ],
      refine: [
        'Iterate the S silhouette until it is unmistakable at 16px.',
        'Develop one-color and embroidered stroke versions before launch.',
      ],
    },
    Artwork: ThreadSSignature,
  },
  {
    id: 'embroidery-patch-system',
    name: 'Embroidery Patch System',
    shortName: 'Patch System',
    direction: 'Badge and label identity',
    description:
      'A fashion-label patch system that gives Stitchra a ready-made language for merch, neck labels and packaging.',
    scores: {
      memorability: 4,
      premiumFeel: 4,
      embroiderySuitability: 5,
      smallSizeReadability: 4,
      uniqueness: 4,
      navbarReadability: 3,
      appIconStrength: 5,
      longTermPotential: 4,
    },
    details: {
      coreIdea: 'Treat Stitchra like a patch label from day one, not only a SaaS interface.',
      visualSignature: 'Layered seal, stitch cross-lines and a centered S-thread form.',
      typographyDirection: 'Compact label typography with functional subline and high legibility.',
      embroiderySuitability: 'Very strong for labels and patches because the system already thinks in borders.',
      scalabilityNotes: 'Excellent for social avatars and physical applications; horizontal lockup needs restraint.',
      riskNotes: 'A badge can feel like a stamp if the proportions and type are not elevated.',
    },
    critique: {
      works: [
        'Directly connects to embroidery, patches and textile production.',
        'Creates a strong physical-world identity for labels and packaging.',
      ],
      fails: [
        'Less elegant in a narrow navbar than a pure wordmark.',
        'Too many rings or stitch details can make it feel souvenir-like.',
      ],
      refine: [
        'Reduce border complexity and test a stitched one-color patch sample.',
        'Create a calmer horizontal wordmark companion for web navigation.',
      ],
    },
    Artwork: EmbroideryPatchSystem,
  },
  {
    id: 'ai-atelier-grid',
    name: 'AI Atelier Grid',
    shortName: 'AI Grid',
    direction: 'Precision plus craft',
    description:
      'A subtle grid-and-thread identity that signals AI-assisted placement and production craft without robot tropes.',
    scores: {
      memorability: 4,
      premiumFeel: 4,
      embroiderySuitability: 3,
      smallSizeReadability: 4,
      uniqueness: 5,
      navbarReadability: 4,
      appIconStrength: 4,
      longTermPotential: 4,
    },
    details: {
      coreIdea: 'Position Stitchra as a precise design system: AI layout intelligence plus hand-finished craft.',
      visualSignature: 'Technical grid points crossed by a single organic thread stroke.',
      typographyDirection: 'Modern editorial sans with measured spacing and a technical substructure.',
      embroiderySuitability: 'Good if the grid is simplified or removed in small stitched applications.',
      scalabilityNotes: 'Distinctive in digital contexts and product UI; needs simplified embroidery variant.',
      riskNotes: 'The grid can skew too software-heavy if the thread does not feel warm enough.',
    },
    critique: {
      works: [
        'Communicates AI assistance without using a robot, sparkle or generic neural icon.',
        'Feels credible for a premium product customizer and design studio.',
      ],
      fails: [
        'More complex than the other systems for one-color embroidery.',
        'Could date faster if the grid treatment feels too current-tech.',
      ],
      refine: [
        'Create a reduced grid variant for favicon and embroidery.',
        'Warm up the wordmark so the system does not become too clinical.',
      ],
    },
    Artwork: AIAtelierGrid,
  },
];

export const threadNeedleSRefinedConcept: BrandLogoConcept = {
  id: 'thread-needle-s-refined',
  name: 'Thread Needle S Refined',
  shortName: 'Needle S',
  direction: 'Imported candidate refinement',
  description:
    'A simplified vector reinterpretation of the external Thread Needle S candidate: strong S silhouette, centered needle and restrained stitch accents without raster texture.',
  scores: {
    memorability: 5,
    premiumFeel: 5,
    embroiderySuitability: 4,
    smallSizeReadability: 4,
    uniqueness: 5,
    navbarReadability: 4,
    appIconStrength: 5,
    longTermPotential: 5,
  },
  details: {
    coreIdea: 'Convert the strongest raster idea into an ownable Stitchra S that works as a full identity system.',
    visualSignature: 'Bold thread-like S silhouette crossed by one vertical needle and a few controlled stitch accents.',
    typographyDirection: 'Pair with a quiet premium wordmark so the S can lead while the name remains clear.',
    embroiderySuitability: 'Good if the highlights and needle are reduced for one-color stitching and very small sizes.',
    scalabilityNotes: 'Strongest in app icon, social avatar, patch and hero contexts; needs small-size needle simplification.',
    riskNotes: 'If kept too close to the detailed JPG, it becomes texture-heavy and fragile. The production mark must stay simpler.',
  },
  critique: {
    works: [
      'Connects Stitchra directly to thread, embroidery and a recognizable S mark.',
      'Has stronger brand memory than the earlier generic concept set.',
      'Can become an app icon, patch mark and premium website signature.',
    ],
    fails: [
      'The needle can disappear at favicon size unless it is thickened or simplified.',
      'Too many interior stitch lines would make embroidery and one-color usage weaker.',
      'The wordmark pairing still needs real type refinement before launch.',
    ],
    refine: [
      'Test a 16px favicon variant with a shorter or thicker needle.',
      'Draw a custom Stitchra wordmark that matches the S proportions.',
      'Create embroidery production artwork with fewer highlights and clear stitch widths.',
    ],
  },
  Artwork: ThreadNeedleSRefined,
};

export const roundOneExplorations = [
  'Thread-S Monogram',
  'Needle Loop Mark',
  'Embroidery Seal',
  'Custom Wordmark',
  'AI Craft Mark',
  'Minimal Luxury Mark',
];
