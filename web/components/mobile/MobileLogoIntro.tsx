'use client';

import { useEffect, useState } from 'react';
import StitchraLogo from '@/components/brand/StitchraLogo';

const MOBILE_INTRO_KEY = 'stitchra-mobile-intro-seen-v1';

function shouldShowMobileIntro() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.sessionStorage.getItem(MOBILE_INTRO_KEY) === 'true') {
    return false;
  }

  return window.matchMedia('(max-width: 768px)').matches;
}

export default function MobileLogoIntro() {
  const [visible, setVisible] = useState(() => shouldShowMobileIntro());

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      window.sessionStorage.setItem(MOBILE_INTRO_KEY, 'true');
      setVisible(false);
    }, 1050);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [visible]);

  const dismiss = () => {
    window.sessionStorage.setItem(MOBILE_INTRO_KEY, 'true');
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <section
      className="mobile-logo-intro"
      aria-label="Stitchra intro"
      onClick={dismiss}
    >
      <button type="button" className="mobile-logo-intro-stage">
        <span className="mobile-logo-intro-mark">
          <StitchraLogo compact markOnly size={92} />
          <i />
          <b />
          <em />
        </span>
        <span className="mobile-logo-intro-word">Stitchra</span>
        <span className="mobile-logo-intro-action">Enter</span>
      </button>

      <style>{`
        .mobile-logo-intro {
          position: fixed;
          inset: 0;
          z-index: 420;
          display: grid;
          place-items: center;
          padding: 24px;
          padding-top: calc(24px + env(safe-area-inset-top));
          padding-bottom: calc(24px + env(safe-area-inset-bottom));
          background:
            radial-gradient(circle at 50% 38%, rgba(0,255,170,0.14), transparent 34%),
            radial-gradient(circle at 50% 64%, rgba(0,200,255,0.10), transparent 36%),
            #050607;
        }

        .mobile-logo-intro-stage {
          width: min(100%, 320px);
          display: grid;
          justify-items: center;
          gap: 14px;
          border: 0;
          color: #f7fff9;
          background: transparent;
          font: inherit;
          cursor: pointer;
        }

        .mobile-logo-intro-mark {
          position: relative;
          width: 126px;
          height: 126px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(140,255,220,0.18);
          border-radius: 38px;
          background:
            radial-gradient(circle at 28% 18%, rgba(0,255,180,0.18), transparent 40%),
            rgba(255,255,255,0.04);
          box-shadow:
            0 28px 90px rgba(0,0,0,0.44),
            0 0 44px rgba(0,255,170,0.10),
            inset 0 1px 0 rgba(255,255,255,0.10);
          animation: stitchraIntroGlow 1050ms ease-out both;
        }

        .mobile-logo-intro-mark i {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 26px;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, #18ff9a, #00c8ff, transparent);
          transform-origin: left center;
          animation: stitchraIntroThread 720ms ease-out 120ms both;
        }

        .mobile-logo-intro-mark b,
        .mobile-logo-intro-mark em {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #18ff9a;
          box-shadow: 0 0 18px rgba(0,255,170,0.5);
          opacity: 0;
          animation: stitchraIntroDot 520ms ease-out 360ms both;
        }

        .mobile-logo-intro-mark b {
          right: 26px;
          top: 34px;
        }

        .mobile-logo-intro-mark em {
          left: 30px;
          bottom: 38px;
          animation-delay: 460ms;
        }

        .mobile-logo-intro-word {
          color: #f7fff9;
          font-size: 34px;
          font-weight: 950;
          letter-spacing: 0;
          animation: stitchraIntroReveal 780ms ease-out 220ms both;
        }

        .mobile-logo-intro-action {
          color: rgba(246,255,249,0.58);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          animation: stitchraIntroReveal 780ms ease-out 360ms both;
        }

        @keyframes stitchraIntroGlow {
          0% { transform: scale(0.94); filter: brightness(0.9); }
          58% { transform: scale(1.035); filter: brightness(1.18); }
          100% { transform: scale(1); filter: brightness(1); }
        }

        @keyframes stitchraIntroThread {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }

        @keyframes stitchraIntroDot {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes stitchraIntroReveal {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (min-width: 769px) {
          .mobile-logo-intro {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mobile-logo-intro,
          .mobile-logo-intro * {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
