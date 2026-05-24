import type { CSSProperties } from 'react';

type StitchraLogoProps = {
  compact?: boolean;
  showSubtitle?: boolean;
  markOnly?: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function StitchraLogo({
  compact = false,
  showSubtitle = true,
  markOnly = false,
  size = 54,
  className,
  style,
}: StitchraLogoProps) {
  const markSize = compact ? Math.min(size, 42) : size;

  return (
    <span
      className={className}
      role="img"
      aria-label="Stitchra home"
      style={{
        ...logoShell,
        gap: compact ? 10 : 14,
        ...style,
      }}
    >
      <span
        style={{
          ...markShell,
          width: markSize,
          height: markSize,
          borderRadius: Math.round(markSize * 0.31),
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 96 96"
          width={markSize}
          height={markSize}
          style={markSvg}
        >
          <defs>
            <linearGradient id="stitchra-mark-bg" x1="12" y1="8" x2="86" y2="90">
              <stop stopColor="#10201c" />
              <stop offset="0.48" stopColor="#06110f" />
              <stop offset="1" stopColor="#020606" />
            </linearGradient>
            <linearGradient id="stitchra-thread" x1="24" y1="19" x2="74" y2="78">
              <stop stopColor="#f4fff9" />
              <stop offset="0.42" stopColor="#7cf0d4" />
              <stop offset="1" stopColor="#00ff88" />
            </linearGradient>
            <linearGradient id="stitchra-needle" x1="68" y1="18" x2="30" y2="80">
              <stop stopColor="#eafff7" />
              <stop offset="1" stopColor="#00d7ff" />
            </linearGradient>
            <filter id="stitchra-mark-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect x="4" y="4" width="88" height="88" rx="27" fill="url(#stitchra-mark-bg)" />
          <rect
            x="5.5"
            y="5.5"
            width="85"
            height="85"
            rx="25.5"
            fill="none"
            stroke="#7cf0d4"
            strokeOpacity="0.2"
          />
          <path
            d="M65.5 22.5C59.4 17.2 47.7 16.4 38.9 20.9C29.4 25.7 28.4 36.1 38.3 41.4L55.7 50.8C66.3 56.5 64.7 68.5 53.4 73.4C44 77.5 32.7 75 27.6 68.4"
            fill="none"
            stroke="url(#stitchra-thread)"
            strokeWidth="7.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#stitchra-mark-glow)"
          />
          <path
            d="M70.5 21.5L31.2 76.5"
            stroke="url(#stitchra-needle)"
            strokeWidth="2.7"
            strokeLinecap="round"
          />
          <path
            d="M70.5 21.5C74 22.6 76.3 25.3 77 29.3C73.5 28.7 71.1 25.9 70.5 21.5Z"
            fill="none"
            stroke="#eafff7"
            strokeWidth="2.1"
            strokeLinejoin="round"
          />
          <path
            d="M21 74C36.5 64.2 58.2 64.1 77 73.6"
            fill="none"
            stroke="#00d7ff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1 8"
            opacity="0.92"
          />
          <circle cx="31" cy="31" r="2.2" fill="#7cf0d4" />
          <circle cx="42" cy="20.5" r="1.8" fill="#00ff88" />
          <circle cx="58.5" cy="74" r="1.9" fill="#00d7ff" />
        </svg>
      </span>

      {!markOnly && (
        <span
          className="stitchra-logo-copy"
          style={{
            ...wordStack,
            gap: showSubtitle ? 2 : 0,
          }}
        >
          <span
            style={{
              ...wordmark,
              fontSize: compact ? 22 : 32,
            }}
          >
            Stitchra
          </span>
          {showSubtitle && (
            <span style={subtitle}>
              AI Embroidery Platform
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export default StitchraLogo;

const logoShell: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  color: '#f5f7f8',
  lineHeight: 1,
};

const markShell: CSSProperties = {
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  flex: '0 0 auto',
  overflow: 'hidden',
  background: '#06110f',
  boxShadow:
    '0 0 0 1px rgba(124,240,212,0.18), 0 0 34px rgba(0,255,136,0.22)',
};

const markSvg: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
};

const wordStack: CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const wordmark: CSSProperties = {
  fontWeight: 950,
  letterSpacing: '-0.04em',
  color: '#f7fffb',
  textShadow: '0 0 18px rgba(124,240,212,0.18)',
};

const subtitle: CSSProperties = {
  fontSize: 9,
  fontWeight: 900,
  lineHeight: 1.1,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'rgba(189,251,234,0.78)',
};
