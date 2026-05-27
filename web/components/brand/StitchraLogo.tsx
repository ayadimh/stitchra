import type { CSSProperties } from 'react';

export type StitchraLogoVariant =
  | 'navbar'
  | 'icon'
  | 'horizontal'
  | 'stacked'
  | 'oneColor'
  | 'patch'
  | 'email';

type StitchraLogoProps = {
  variant?: StitchraLogoVariant;
  compact?: boolean;
  showSubtitle?: boolean;
  markOnly?: boolean;
  monochrome?: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

export function StitchraLogo({
  variant,
  compact = false,
  showSubtitle = true,
  markOnly = false,
  monochrome = false,
  size = 54,
  className,
  style,
  title = 'Stitchra home',
}: StitchraLogoProps) {
  const resolvedVariant: StitchraLogoVariant =
    variant ?? (markOnly ? 'icon' : compact ? 'navbar' : 'horizontal');
  const isStacked = resolvedVariant === 'stacked' || resolvedVariant === 'email';
  const isOneColor = monochrome || resolvedVariant === 'oneColor' || resolvedVariant === 'patch';
  const markSize = compact ? Math.min(size, 42) : size;
  const wordmarkSize = compact ? 22 : 32;

  return (
    <span
      className={className}
      role="img"
      aria-label={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexDirection: isStacked ? 'column' : 'row',
        gap: isStacked ? 10 : compact ? 10 : 14,
        color: isOneColor ? 'currentColor' : '#f7fff5',
        lineHeight: 1,
        ...style,
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          flex: '0 0 auto',
          width: markSize,
          height: markSize,
          borderRadius: resolvedVariant === 'patch' ? '50%' : Math.round(markSize * 0.31),
          overflow: 'hidden',
          color: isOneColor ? 'currentColor' : '#8cff1f',
          background: isOneColor ? 'transparent' : '#07100b',
          boxShadow: isOneColor
            ? 'none'
            : '0 0 0 1px rgba(140,255,31,0.24), 0 18px 50px rgba(0,0,0,0.28)',
        }}
      >
        <svg
          viewBox="0 0 160 160"
          aria-hidden="true"
          focusable="false"
          width={markSize}
          height={markSize}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        >
          <ThreadNeedleMark monochrome={isOneColor} patch={resolvedVariant === 'patch'} />
        </svg>
      </span>

      {!markOnly && resolvedVariant !== 'icon' && resolvedVariant !== 'patch' && (
        <span
          className="stitchra-logo-copy"
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: isStacked ? 'center' : 'flex-start',
            gap: showSubtitle ? 2 : 0,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: wordmarkSize,
              fontWeight: 950,
              letterSpacing: '-0.045em',
              color: 'currentColor',
              textShadow: isOneColor ? 'none' : '0 0 18px rgba(140,255,31,0.14)',
            }}
          >
            Stitchra
          </span>
          {showSubtitle && (
            <span
              style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: compact ? 8 : 9,
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: isOneColor ? 'currentColor' : 'rgba(223,255,214,0.72)',
                opacity: isOneColor ? 0.72 : 1,
              }}
            >
              AI Embroidery Studio
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export default StitchraLogo;

function ThreadNeedleMark({
  monochrome,
  patch,
}: {
  monochrome: boolean;
  patch: boolean;
}) {
  const fieldFill = monochrome ? 'none' : '#07100b';
  const fieldStroke = monochrome ? 'currentColor' : 'rgba(140,255,31,0.38)';
  const backboneStroke = monochrome ? 'currentColor' : '#030604';
  const threadStroke = monochrome ? 'currentColor' : '#8cff1f';
  const threadHighlight = monochrome ? 'currentColor' : '#16e884';
  const needleStroke = monochrome ? 'currentColor' : '#f8fff6';

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
        opacity={monochrome ? 0.18 : 1}
      />
      <path
        d="M111 45H81C59 45 49 54 49 68C49 80 60 86 81 87H93C115 87 128 99 128 116C128 137 110 148 78 148H45"
        fill="none"
        stroke={threadStroke}
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M111 45H81C59 45 49 54 49 68"
        fill="none"
        stroke={threadHighlight}
        strokeWidth="3"
        strokeLinecap="round"
        opacity={monochrome ? 0 : 0.72}
      />
      <path d="M80 13V147" fill="none" stroke={needleStroke} strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M80 13C91 22 93 35 85 47C78 43 76 29 80 13Z"
        fill={monochrome ? 'none' : '#f8fff6'}
        stroke={needleStroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M69 62C78 57 88 57 98 62"
        fill="none"
        stroke={threadStroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 5"
      />
      <path
        d="M60 112C75 104 95 104 112 112"
        fill="none"
        stroke={threadStroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 5"
        opacity="0.82"
      />
      <path
        d="M41 78C54 69 68 66 82 68"
        fill="none"
        stroke={threadStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.46"
      />
    </g>
  );
}

export function LegacyStitchraLogo({
  compact = false,
  showSubtitle = true,
  markOnly = false,
  size = 54,
  className,
  style,
}: Omit<StitchraLogoProps, 'variant' | 'monochrome' | 'title'>) {
  const markSize = compact ? Math.min(size, 42) : size;

  return (
    <span
      className={className}
      role="img"
      aria-label="Legacy Stitchra logo"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        color: '#f5f7f8',
        gap: compact ? 10 : 14,
        lineHeight: 1,
        ...style,
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          flex: '0 0 auto',
          overflow: 'hidden',
          background: '#06110f',
          boxShadow:
            '0 0 0 1px rgba(124,240,212,0.18), 0 0 34px rgba(0,255,136,0.22)',
          width: markSize,
          height: markSize,
          borderRadius: Math.round(markSize * 0.31),
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 96 96" width={markSize} height={markSize} style={{ display: 'block' }}>
          <rect x="4" y="4" width="88" height="88" rx="27" fill="#06110f" />
          <path
            d="M65.5 22.5C59.4 17.2 47.7 16.4 38.9 20.9C29.4 25.7 28.4 36.1 38.3 41.4L55.7 50.8C66.3 56.5 64.7 68.5 53.4 73.4C44 77.5 32.7 75 27.6 68.4"
            fill="none"
            stroke="#7cf0d4"
            strokeWidth="7.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M70.5 21.5L31.2 76.5" stroke="#00d7ff" strokeWidth="2.7" strokeLinecap="round" />
        </svg>
      </span>
      {!markOnly && (
        <span style={{ display: 'inline-flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontWeight: 950, letterSpacing: '-0.04em', color: '#f7fffb', fontSize: compact ? 22 : 32 }}>
            Stitchra
          </span>
          {showSubtitle && (
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              AI Embroidery Platform
            </span>
          )}
        </span>
      )}
    </span>
  );
}
