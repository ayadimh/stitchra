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
      <svg viewBox="0 0 160 160" focusable="false">
        <defs>
          <radialGradient id="agent-orb-core" cx="34%" cy="22%" r="78%">
            <stop offset="0%" stopColor="#1bfff0" stopOpacity="0.22" />
            <stop offset="46%" stopColor="#07140f" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#020607" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="agent-thread" x1="42" y1="30" x2="130" y2="148">
            <stop stopColor="#d6ff3f" />
            <stop offset="0.48" stopColor="#8cff1f" />
            <stop offset="1" stopColor="#16e884" />
          </linearGradient>
          <linearGradient id="agent-needle" x1="80" y1="13" x2="80" y2="147">
            <stop stopColor="#fffdf4" />
            <stop offset="0.48" stopColor="#cfd5d0" />
            <stop offset="1" stopColor="#737d78" />
          </linearGradient>
          <filter id="agent-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="10" y="10" width="140" height="140" rx="42" fill="url(#agent-orb-core)" stroke="rgba(140,255,31,0.36)" strokeWidth="3" />
        <rect x="20" y="20" width="120" height="120" rx="34" fill="none" stroke="rgba(22,232,132,0.22)" strokeDasharray="2 8" strokeWidth="2" />
        <path
          d="M113 42H82C55 42 42 52 42 69C42 84 55 91 80 92H92C110 92 121 101 121 116C121 134 105 143 78 143H43"
          fill="none"
          stroke="#030604"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M111 45H81C59 45 49 54 49 68C49 80 60 86 81 87H93C115 87 128 99 128 116C128 137 110 148 78 148H45"
          fill="none"
          stroke="url(#agent-thread)"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#agent-soft-glow)"
        />
        <path d="M80 13V147" fill="none" stroke="url(#agent-needle)" strokeWidth="4.5" strokeLinecap="round" />
        <path
          d="M80 13C91 22 93 35 85 47C78 43 76 29 80 13Z"
          fill="#f8fff6"
          stroke="#f8fff6"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M69 62C78 57 88 57 98 62M60 112C75 104 95 104 112 112"
          fill="none"
          stroke="#d6ff3f"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 5"
          opacity="0.86"
        />
        <circle
          className="stitchra-agent-orb-status"
          cx="128"
          cy="128"
          r="10"
          fill={active ? "#00c8ff" : "#16ff9a"}
          stroke="#020607"
          strokeWidth="4"
        />
      </svg>
    </span>
  );
}
