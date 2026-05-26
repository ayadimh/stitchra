import type { ComponentType, ReactNode } from 'react';

export type LogoTone = 'color' | 'mono';
export type LogoLockup = 'mark' | 'horizontal';

export type LogoConceptArtworkProps = {
  tone?: LogoTone;
  lockup?: LogoLockup;
  className?: string;
  title?: string;
};

export type BrandLogoConcept = {
  id: string;
  name: string;
  direction: string;
  description: string;
  pros: string[];
  cons: string[];
  embroideryScore: 1 | 2 | 3 | 4 | 5;
  Artwork: ComponentType<LogoConceptArtworkProps>;
};

function LogoSvg({
  children,
  tone = 'color',
  lockup = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps & {
  children: ReactNode;
}) {
  const viewBox = lockup === 'mark' ? '0 0 112 112' : '0 0 396 112';

  return (
    <svg
      className={className}
      viewBox={viewBox}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-tone={tone}
      data-lockup={lockup}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function Wordmark({
  x = 132,
  y = 55,
  compact = false,
}: {
  x?: number;
  y?: number;
  compact?: boolean;
}) {
  return (
    <g className="concept-wordmark">
      <text x={x} y={y} className={compact ? 'concept-word compact' : 'concept-word'}>
        Stitchra
      </text>
      <path
        d={`M${x + 6} ${y + 18}C${x + 54} ${y + 8} ${x + 96} ${y + 30} ${x + 142} ${y + 18}`}
        className="concept-stitch-line"
        pathLength="1"
      />
    </g>
  );
}

function ThreadSMonogram({
  tone = 'color',
  lockup = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoSvg tone={tone} lockup={lockup} className={className} title={title}>
      <g transform="translate(0 0)">
        <rect x="12" y="12" width="88" height="88" rx="25" className="concept-mark-bg" />
        <path
          d="M76 27C68 19 48 18 37 27C24 38 33 50 49 54L63 58C78 62 81 78 66 86C53 94 34 89 27 77"
          className="concept-thread-stroke"
          pathLength="1"
        />
        <path d="M78 25L34 88" className="concept-needle-stroke" />
        <path d="M77 25C82 27 85 31 84 37C79 36 76 32 77 25Z" className="concept-needle-eye" />
        <path d="M24 80C40 70 62 70 84 80" className="concept-stitch-line" pathLength="1" />
      </g>
      {lockup === 'horizontal' && <Wordmark />}
    </LogoSvg>
  );
}

function NeedleLoopMark({
  tone = 'color',
  lockup = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoSvg tone={tone} lockup={lockup} className={className} title={title}>
      <g>
        <circle cx="56" cy="56" r="42" className="concept-soft-circle" />
        <path
          d="M72 18L35 93"
          className="concept-needle-stroke"
        />
        <path
          d="M72 18C78 21 81 27 80 34C74 32 71 26 72 18Z"
          className="concept-needle-eye"
        />
        <path
          d="M36 70C27 53 38 35 57 35C80 35 83 59 64 65L46 71C33 75 34 91 51 94C66 96 78 88 82 77"
          className="concept-thread-stroke"
          pathLength="1"
        />
      </g>
      {lockup === 'horizontal' && <Wordmark />}
    </LogoSvg>
  );
}

function EmbroiderySeal({
  tone = 'color',
  lockup = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoSvg tone={tone} lockup={lockup} className={className} title={title}>
      <g>
        <circle cx="56" cy="56" r="47" className="concept-seal-outer" />
        <circle cx="56" cy="56" r="38" className="concept-seal-inner" />
        <path
          d="M73 35C65 28 47 28 38 36C29 45 36 55 51 58L62 60C76 63 78 78 65 84C54 90 38 86 32 76"
          className="concept-thread-stroke seal-thread"
          pathLength="1"
        />
        <path d="M29 27L83 85" className="concept-stitch-line seal-stitches" pathLength="1" />
      </g>
      {lockup === 'horizontal' && <Wordmark />}
    </LogoSvg>
  );
}

function CustomWordmark({
  tone = 'color',
  lockup = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoSvg tone={tone} lockup={lockup} className={className} title={title}>
      {lockup === 'mark' ? (
        <g>
          <rect x="14" y="14" width="84" height="84" rx="18" className="concept-mark-bg" />
          <text x="56" y="72" textAnchor="middle" className="concept-single-letter">S</text>
          <path d="M32 82C46 74 66 74 82 82" className="concept-stitch-line" pathLength="1" />
        </g>
      ) : (
        <g>
          <text x="20" y="68" className="concept-word wordmark-focus">Stitchra</text>
          <path d="M152 33V68" className="concept-needle-stroke word-needle" />
          <path d="M152 33C156 35 158 38 158 43C154 42 152 38 152 33Z" className="concept-needle-eye" />
          <path d="M149 75C163 69 177 69 191 75" className="concept-stitch-line" pathLength="1" />
        </g>
      )}
    </LogoSvg>
  );
}

function AICraftMark({
  tone = 'color',
  lockup = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoSvg tone={tone} lockup={lockup} className={className} title={title}>
      <g>
        <rect x="13" y="13" width="86" height="86" rx="22" className="concept-grid-box" />
        <path d="M30 36H82M30 56H82M30 76H82M36 30V82M56 30V82M76 30V82" className="concept-grid-line" />
        <path
          d="M74 31C63 24 43 28 38 41C34 52 43 58 58 59C74 60 81 73 69 83C58 92 40 88 33 78"
          className="concept-thread-stroke"
          pathLength="1"
        />
        <circle cx="32" cy="36" r="3" className="concept-node" />
        <circle cx="82" cy="56" r="3" className="concept-node" />
        <circle cx="56" cy="82" r="3" className="concept-node" />
      </g>
      {lockup === 'horizontal' && <Wordmark />}
    </LogoSvg>
  );
}

function MinimalLuxuryMark({
  tone = 'color',
  lockup = 'horizontal',
  className,
  title,
}: LogoConceptArtworkProps) {
  return (
    <LogoSvg tone={tone} lockup={lockup} className={className} title={title}>
      <g>
        <path d="M56 13L91 33V79L56 99L21 79V33L56 13Z" className="concept-lux-frame" />
        <path
          d="M72 35C64 28 49 28 41 36C33 44 39 54 52 57L63 60C74 63 76 75 65 81C55 87 41 83 35 75"
          className="concept-thread-stroke lux-thread"
          pathLength="1"
        />
      </g>
      {lockup === 'horizontal' && (
        <g>
          <text x="130" y="65" className="concept-word luxury-word">Stitchra</text>
          <path d="M132 78H286" className="concept-lux-rule" />
        </g>
      )}
    </LogoSvg>
  );
}

export const stitchraLogoConcepts: BrandLogoConcept[] = [
  {
    id: 'thread-s-monogram',
    name: 'Thread-S Monogram',
    direction: 'Continuous thread icon',
    description:
      'A confident S built from a single thread stroke with a restrained needle detail. Strongest as an app icon and small mark.',
    pros: [
      'Memorable at small sizes',
      'Clear embroidery reference',
      'Works without the wordmark',
    ],
    cons: [
      'Needs careful stroke weight for tiny embroidery',
      'More expressive than corporate',
    ],
    embroideryScore: 4,
    Artwork: ThreadSMonogram,
  },
  {
    id: 'needle-loop-mark',
    name: 'Needle Loop Mark',
    direction: 'Elegant needle and loop',
    description:
      'A minimal needle and loop system that implies an S without becoming a generic sewing icon.',
    pros: [
      'Timeless and premium',
      'Good one-color potential',
      'Works well on invoices and labels',
    ],
    cons: [
      'Less instantly readable as S',
      'Needs wordmark support in first launch',
    ],
    embroideryScore: 5,
    Artwork: NeedleLoopMark,
  },
  {
    id: 'embroidery-seal',
    name: 'Embroidery Seal',
    direction: 'Patch and badge identity',
    description:
      'A circular seal that feels like a label, patch, sticker or social profile mark for creator-led merch.',
    pros: [
      'Excellent badge and sticker use',
      'Feels physical and crafted',
      'Strong social avatar shape',
    ],
    cons: [
      'More casual than luxury',
      'Circular lockup can feel busy at 32px',
    ],
    embroideryScore: 4,
    Artwork: EmbroiderySeal,
  },
  {
    id: 'custom-wordmark',
    name: 'Custom Wordmark',
    direction: 'Readable name-led identity',
    description:
      'A wordmark-first route where Stitchra owns the name, with one subtle needle treatment instead of a separate symbol-heavy logo.',
    pros: [
      'Most readable in navbar',
      'Good for invoices and product pages',
      'Avoids generic icon traps',
    ],
    cons: [
      'Needs a companion app icon',
      'Less distinctive as a standalone mark',
    ],
    embroideryScore: 4,
    Artwork: CustomWordmark,
  },
  {
    id: 'ai-craft-mark',
    name: 'AI Craft Mark',
    direction: 'Precision grid with thread',
    description:
      'A balanced AI-assisted craft direction using a precision grid, nodes and a thread S without robot or chatbot cues.',
    pros: [
      'Communicates AI assistance',
      'Feels technical but still tactile',
      'Distinctive for digital product surfaces',
    ],
    cons: [
      'Grid may need simplification for embroidery',
      'Slightly more startup-tech leaning',
    ],
    embroideryScore: 3,
    Artwork: AICraftMark,
  },
  {
    id: 'minimal-luxury-mark',
    name: 'Minimal Luxury Mark',
    direction: 'One-color premium system',
    description:
      'A simple geometric frame with a thread S, designed to work in black, off-white and mint with minimal effects.',
    pros: [
      'Best one-color behavior',
      'Premium and restrained',
      'Strong for labels and packaging',
    ],
    cons: [
      'Less playful for student audiences',
      'Needs polish to avoid fashion-monogram cliches',
    ],
    embroideryScore: 5,
    Artwork: MinimalLuxuryMark,
  },
];
