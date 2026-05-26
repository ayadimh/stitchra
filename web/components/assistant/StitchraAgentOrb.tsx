type StitchraAgentOrbProps = {
  active?: boolean;
  className?: string;
};

export default function StitchraAgentOrb({
  active = false,
  className,
}: StitchraAgentOrbProps) {
  return (
    <span
      aria-hidden="true"
      className={className}
      data-active={active ? "true" : "false"}
    >
      <svg viewBox="0 0 64 64" focusable="false">
        <defs>
          <radialGradient
            id="stitchra-agent-orb-core"
            cx="34%"
            cy="22%"
            r="78%"
          >
            <stop offset="0%" stopColor="#1bfff0" stopOpacity="0.28" />
            <stop offset="42%" stopColor="#071b19" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#020607" stopOpacity="1" />
          </radialGradient>
          <linearGradient
            id="stitchra-agent-orb-ring"
            x1="10"
            y1="8"
            x2="56"
            y2="58"
          >
            <stop offset="0%" stopColor="#baffdf" />
            <stop offset="45%" stopColor="#16ff9a" />
            <stop offset="100%" stopColor="#00c8ff" />
          </linearGradient>
          <linearGradient
            id="stitchra-agent-orb-thread"
            x1="18"
            y1="14"
            x2="46"
            y2="52"
          >
            <stop offset="0%" stopColor="#eafff4" />
            <stop offset="50%" stopColor="#22ffad" />
            <stop offset="100%" stopColor="#00d9ff" />
          </linearGradient>
          <filter id="stitchra-agent-orb-soft-glow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="1.7" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.07 0 0 0 0 1 0 0 0 0 0.68 0 0 0 0.42 0"
            />
            <feBlend in="SourceGraphic" />
          </filter>
        </defs>

        <circle
          cx="32"
          cy="32"
          r="29"
          fill="url(#stitchra-agent-orb-core)"
          stroke="url(#stitchra-agent-orb-ring)"
          strokeWidth="2"
        />
        <circle
          cx="32"
          cy="32"
          r="23"
          fill="none"
          stroke="rgba(186, 255, 223, 0.16)"
          strokeDasharray="1.6 4.4"
          strokeLinecap="round"
        />

        <g filter="url(#stitchra-agent-orb-soft-glow)">
          <path
            d="M42.1 17.2C37.7 13.8 29 13.2 24.3 16.9C20.2 20.1 20.1 25.5 23.6 28.2C26.8 30.7 32.2 30.6 36.7 33.1C42.1 36.1 42.3 43.2 37.1 47.2C31.8 51.3 23.4 49.9 18.8 45.4"
            fill="none"
            stroke="url(#stitchra-agent-orb-thread)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4.6"
          />
          <path
            d="M42.1 17.2C37.7 13.8 29 13.2 24.3 16.9C20.2 20.1 20.1 25.5 23.6 28.2C26.8 30.7 32.2 30.6 36.7 33.1C42.1 36.1 42.3 43.2 37.1 47.2C31.8 51.3 23.4 49.9 18.8 45.4"
            fill="none"
            stroke="rgba(2, 6, 7, 0.52)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.1"
          />
        </g>

        <path
          d="M32.1 10.4L35 15.3L32.1 53.7L29.2 15.3Z"
          fill="rgba(233, 255, 246, 0.9)"
        />
        <path
          d="M32.1 10.4L35 15.3L32.1 18.8L29.2 15.3Z"
          fill="#0b1717"
          stroke="rgba(186, 255, 223, 0.65)"
          strokeLinejoin="round"
          strokeWidth="0.9"
        />
        <path
          d="M32.1 18.8V48.8"
          stroke="rgba(2, 6, 7, 0.55)"
          strokeLinecap="round"
          strokeWidth="0.9"
        />

        <circle cx="18.8" cy="21.4" r="2.2" fill="#16ff9a" />
        <circle cx="46.3" cy="30.4" r="2.3" fill="#00c8ff" />
        <circle cx="22.2" cy="43.1" r="1.8" fill="#f6ff8d" />
        <path
          d="M48.9 18.2L51.2 19.4L52.4 21.7L53.6 19.4L55.9 18.2L53.6 17L52.4 14.7L51.2 17Z"
          fill="rgba(186, 255, 223, 0.82)"
        />
        <circle
          className="stitchra-agent-orb-status"
          cx="50"
          cy="49"
          r="4.1"
          fill={active ? "#00c8ff" : "#16ff9a"}
          stroke="#020607"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  );
}
