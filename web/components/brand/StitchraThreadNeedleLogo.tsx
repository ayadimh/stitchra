import type { CSSProperties } from 'react';

export type StitchraThreadNeedleLogoVariant =
  | 'horizontal'
  | 'icon'
  | 'stacked'
  | 'oneColor'
  | 'patch';

type StitchraThreadNeedleLogoProps = {
  variant?: StitchraThreadNeedleLogoVariant;
  size?: number | string;
  showSubtitle?: boolean;
  monochrome?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

export function StitchraThreadNeedleLogo({
  variant = 'horizontal',
  size,
  showSubtitle = true,
  monochrome = false,
  className,
  style,
  title = 'Stitchra Thread Needle S logo preview',
}: StitchraThreadNeedleLogoProps) {
  const isMarkOnly = variant === 'icon' || variant === 'patch';
  const isStacked = variant === 'stacked';
  const isOneColor = monochrome || variant === 'oneColor' || variant === 'patch';
  const viewBox = isMarkOnly ? '0 0 160 160' : isStacked ? '0 0 300 250' : '0 0 560 160';
  const width = size ?? (isMarkOnly ? 96 : isStacked ? 220 : 300);

  return (
    <svg
      className={className}
      style={{ display: 'block', width, height: 'auto', ...style }}
      viewBox={viewBox}
      role="img"
      aria-label={title}
      data-variant={variant}
      data-monochrome={isOneColor}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="thread-needle-green" x1="42" y1="30" x2="130" y2="148">
          <stop stopColor="#d6ff3f" />
          <stop offset="0.48" stopColor="#8cff1f" />
          <stop offset="1" stopColor="#16e884" />
        </linearGradient>
        <linearGradient id="thread-needle-metal" x1="80" y1="12" x2="80" y2="148">
          <stop stopColor="#fffdf4" />
          <stop offset="0.45" stopColor="#cfd5d0" />
          <stop offset="1" stopColor="#737d78" />
        </linearGradient>
      </defs>

      {isStacked ? (
        <>
          <g transform="translate(70 0)">
            <NeedleMark monochrome={isOneColor} patch={false} />
          </g>
          <Wordmark x={24} y={196} monochrome={isOneColor} />
          {showSubtitle && <Subtitle x={42} y={226} monochrome={isOneColor} />}
        </>
      ) : (
        <>
          <NeedleMark monochrome={isOneColor} patch={variant === 'patch'} />
          {!isMarkOnly && (
            <>
              <Wordmark x={198} y={96} monochrome={isOneColor} />
              {showSubtitle && <Subtitle x={202} y={130} monochrome={isOneColor} />}
            </>
          )}
        </>
      )}
    </svg>
  );
}

function NeedleMark({ monochrome, patch }: { monochrome: boolean; patch: boolean }) {
  const fieldFill = monochrome ? 'none' : '#07100b';
  const fieldStroke = monochrome ? 'currentColor' : 'rgba(140,255,31,0.34)';
  const backboneStroke = monochrome ? 'currentColor' : '#030604';
  const highlightStroke = monochrome ? 'currentColor' : 'url(#thread-needle-green)';
  const needleStroke = monochrome ? 'currentColor' : 'url(#thread-needle-metal)';
  const stitchStroke = monochrome ? 'currentColor' : '#8cff1f';

  return (
    <g>
      {patch ? (
        <>
          <circle cx="80" cy="80" r="70" fill="none" stroke={fieldStroke} strokeWidth="7" />
          <circle cx="80" cy="80" r="58" fill="none" stroke={fieldStroke} strokeWidth="2.5" opacity="0.58" />
        </>
      ) : (
        <rect x="18" y="18" width="124" height="124" rx="34" fill={fieldFill} stroke={fieldStroke} strokeWidth="2.5" />
      )}
      <path
        d="M113 42H82C55 42 42 52 42 69C42 84 55 91 80 92H92C110 92 121 101 121 116C121 134 105 143 78 143H43"
        fill="none"
        stroke={backboneStroke}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M111 45H81C59 45 49 54 49 68C49 80 60 86 81 87H93C115 87 128 99 128 116C128 137 110 148 78 148H45"
        fill="none"
        stroke={highlightStroke}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M80 13V147" fill="none" stroke={needleStroke} strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M80 13C91 22 93 35 85 47C78 43 76 29 80 13Z"
        fill={monochrome ? 'none' : '#f8fff6'}
        stroke={monochrome ? 'currentColor' : '#f8fff6'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M69 62C78 57 88 57 98 62"
        fill="none"
        stroke={stitchStroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 5"
      />
      <path
        d="M60 112C75 104 95 104 112 112"
        fill="none"
        stroke={stitchStroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 5"
        opacity="0.82"
      />
      <path
        d="M41 78C54 69 68 66 82 68"
        fill="none"
        stroke={stitchStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.46"
      />
    </g>
  );
}

function Wordmark({ x, y, monochrome }: { x: number; y: number; monochrome: boolean }) {
  return (
    <g>
      <text
        x={x}
        y={y}
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="70"
        fontWeight="950"
        letterSpacing="-5"
      >
        Stitchra
      </text>
      <path
        d={`M${x + 5} ${y + 19}H${x + 223}`}
        fill="none"
        stroke={monochrome ? 'currentColor' : '#8cff1f'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
    </g>
  );
}

function Subtitle({ x, y, monochrome }: { x: number; y: number; monochrome: boolean }) {
  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      opacity={monochrome ? 0.72 : 0.62}
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="14"
      fontWeight="850"
      letterSpacing="2.4"
    >
      AI EMBROIDERY STUDIO
    </text>
  );
}

export default StitchraThreadNeedleLogo;
