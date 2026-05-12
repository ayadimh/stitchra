'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';

type ShirtColor = 'black' | 'white' | string;

export function OrderMannequinPreview({
  logoUrl,
  shirtColor,
  placement,
  placementSize,
  minHeight = 540,
}: {
  logoUrl: string | null;
  shirtColor: ShirtColor;
  placement: string;
  placementSize?: string;
  minHeight?: number | string;
}) {
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    active: false,
  });
  const normalizedPlacement = placement.toLowerCase().includes('center')
    ? 'center'
    : 'left';
  const normalizedShirtColor = shirtColor.toLowerCase().includes('white')
    ? 'white'
    : 'black';
  const isWhite = normalizedShirtColor === 'white';
  const rotateX = mouse.active ? mouse.y * -4 : 0;
  const rotateY = mouse.active ? mouse.x * 6 : 0;
  const lightX = mouse.active ? 50 + mouse.x * 18 : 50;
  const lightY = mouse.active ? 32 + mouse.y * 12 : 32;
  const placementLabel =
    normalizedPlacement === 'center' ? 'Center front' : 'Left chest';
  const sizeLabel =
    placementSize ??
    (normalizedPlacement === 'center' ? '250 x 200 mm' : '90 x 60 mm');
  const placementLeft =
    normalizedPlacement === 'center' ? '50%' : '60%';
  const placementTop = normalizedPlacement === 'center' ? 185 : 124;
  const placementWidth = normalizedPlacement === 'center' ? 190 : 112;
  const placementHeight = normalizedPlacement === 'center' ? 148 : 72;
  const shirtSurface = isWhite
    ? 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.95), transparent 18%), linear-gradient(145deg,#fffdf7 0%,#dedbd2 46%,#f7f3ea 100%)'
    : 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.12), transparent 18%), linear-gradient(145deg,#101719 0%,#111514 45%,#030404 100%)';
  const sleeveSurface = isWhite
    ? 'linear-gradient(145deg,#fbf7ec,#d6d2c8 54%,#f5f1e8)'
    : 'linear-gradient(145deg,#0b1011,#18201f 55%,#030404)';
  const seamColor = isWhite
    ? 'rgba(35,31,26,0.14)'
    : 'rgba(255,255,255,0.10)';
  const logoBlend: CSSProperties['mixBlendMode'] = isWhite
    ? 'multiply'
    : 'screen';

  return (
    <div
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        setMouse({ x, y, active: true });
      }}
      onMouseLeave={() => setMouse({ x: 0, y: 0, active: false })}
      style={{
        ...stage,
        minHeight,
        background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(124,240,212,0.20), transparent 18%), linear-gradient(145deg,rgba(3,5,7,0.98),rgba(8,15,17,0.94) 48%,rgba(2,3,5,0.98))`,
      }}
    >
      <style>
        {`
          @keyframes stitchraTorsoFloat {
            0%, 100% { transform: translate3d(0, 0, 0); }
            50% { transform: translate3d(0, -12px, 0); }
          }

          @keyframes stitchraBreath {
            0%, 100% { transform: translateX(-50%) translateZ(58px) scale3d(1, 1, 1); filter: brightness(1); }
            50% { transform: translateX(-50%) translateZ(58px) scale3d(1.012, 1.006, 1); filter: brightness(1.04); }
          }

          @keyframes stitchraGlow {
            0%, 100% { opacity: 0.52; transform: scale(1); }
            50% { opacity: 0.92; transform: scale(1.04); }
          }

          @keyframes stitchraThread {
            0% { background-position: 0 0; }
            100% { background-position: 72px 72px; }
          }

          @keyframes stitchraFabric {
            0%, 100% { opacity: 0.27; transform: translateX(-10px); }
            50% { opacity: 0.38; transform: translateX(10px); }
          }
        `}
      </style>

      <div
        style={{
          ...gridOverlay,
          transform: `translate3d(${mouse.x * -10}px, ${
            mouse.y * -10
          }px, 0)`,
        }}
      />

      <div style={glowField} />

      <div style={previewLabel}>
        T-shirt chest - {placementLabel} - {sizeLabel}
      </div>

      <div
        style={{
          ...torsoRig,
          transform: `translateX(-50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        <div style={torsoFloat}>
          <div style={shadow} />
          <div
            style={{
              ...leftSleeve,
              background: sleeveSurface,
            }}
          />
          <div
            style={{
              ...rightSleeve,
              background: sleeveSurface,
            }}
          />
          <div
            style={{
              ...shirtBody,
              background: shirtSurface,
              boxShadow: isWhite
                ? 'inset 24px 22px 38px rgba(255,255,255,0.70), inset -36px -42px 60px rgba(120,112,98,0.34), 0 56px 115px rgba(0,0,0,0.48), 0 0 74px rgba(124,240,212,0.13)'
                : 'inset 24px 22px 42px rgba(255,255,255,0.055), inset -38px -48px 66px rgba(0,0,0,0.66), 0 56px 115px rgba(0,0,0,0.58), 0 0 78px rgba(124,240,212,0.13)',
            }}
          >
            <div
              style={{
                ...fabricTexture,
                opacity: isWhite ? 0.44 : 0.26,
              }}
            />
            <div style={collar} />
            <div
              style={{
                ...neckSeam,
                background: seamColor,
                boxShadow: `0 22px 0 ${seamColor}`,
              }}
            />
            <div
              style={{
                ...placementBox,
                left: placementLeft,
                top: placementTop,
                width: placementWidth,
                height: placementHeight,
                border: logoUrl
                  ? '1px solid rgba(124,240,212,0.30)'
                  : '1px solid rgba(124,240,212,0.86)',
                boxShadow: logoUrl
                  ? '0 0 18px rgba(124,240,212,0.22), 0 0 58px rgba(0,200,255,0.10), inset 0 0 16px rgba(124,240,212,0.08)'
                  : '0 0 28px rgba(124,240,212,0.58), 0 0 80px rgba(0,200,255,0.18), inset 0 0 26px rgba(124,240,212,0.14)',
                background: logoUrl
                  ? 'transparent'
                  : 'linear-gradient(135deg, rgba(124,240,212,0.13), rgba(0,0,0,0.08))',
                animation: logoUrl
                  ? 'none'
                  : 'stitchraGlow 3.2s ease-in-out infinite',
              }}
            >
              <div
                style={{
                  ...threadGrid,
                  opacity: logoUrl
                    ? isWhite
                      ? 0.1
                      : 0.12
                    : isWhite
                      ? 0.24
                      : 0.34,
                }}
              />
              {logoUrl ? (
                <div
                  aria-label="Design preview on shirt"
                  style={{
                    ...logoOnShirt,
                    backgroundImage: `url(${logoUrl})`,
                    mixBlendMode: logoBlend,
                    opacity: isWhite ? 0.86 : 0.82,
                    filter: isWhite
                      ? 'contrast(1.18) saturate(0.95) brightness(0.98) drop-shadow(0 1px 2px rgba(0,0,0,0.20))'
                      : 'contrast(1.55) saturate(1.20) brightness(0.78) drop-shadow(0 0 10px rgba(124,240,212,0.36))',
                  }}
                />
              ) : (
                <span
                  style={{
                    ...placeholderText,
                    color: isWhite
                      ? 'rgba(8,12,14,0.48)'
                      : 'rgba(224,255,244,0.72)',
                  }}
                >
                  Logo
                </span>
              )}
            </div>
          </div>
          <div style={bottomGlow} />
        </div>
      </div>
    </div>
  );
}

const stage: CSSProperties = {
  position: 'relative',
  borderRadius: 30,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow:
    '0 44px 130px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08)',
  isolation: 'isolate',
  perspective: 1100,
  transition: 'background 180ms ease, box-shadow 180ms ease',
};

const gridOverlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
  backgroundSize: '44px 44px',
  maskImage: 'radial-gradient(circle at 50% 45%, black, transparent 78%)',
  transition: 'transform 120ms ease',
};

const glowField: CSSProperties = {
  position: 'absolute',
  inset: '14% 5% 7%',
  background:
    'radial-gradient(ellipse at center, rgba(124,240,212,0.20), transparent 55%)',
  filter: 'blur(28px)',
  opacity: 0.72,
  animation: 'stitchraGlow 4.6s ease-in-out infinite',
};

const previewLabel: CSSProperties = {
  position: 'absolute',
  top: 18,
  right: 18,
  padding: '10px 14px',
  borderRadius: 16,
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#f5f7f8',
  fontSize: 13,
  zIndex: 4,
  boxShadow: '0 18px 45px rgba(0,0,0,0.32)',
};

const torsoRig: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 50,
  width: 420,
  height: 520,
  transformStyle: 'preserve-3d',
  transition: 'transform 140ms ease-out',
};

const torsoFloat: CSSProperties = {
  position: 'absolute',
  inset: 0,
  animation: 'stitchraTorsoFloat 6s ease-in-out infinite',
  transformStyle: 'preserve-3d',
};

const shadow: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 10,
  transform: 'translateX(-50%) translateZ(-42px)',
  width: 320,
  height: 58,
  borderRadius: '50%',
  background:
    'radial-gradient(ellipse at center, rgba(0,0,0,0.66), transparent 68%)',
  filter: 'blur(12px)',
  opacity: 0.9,
};

const sleeveBase: CSSProperties = {
  position: 'absolute',
  top: 122,
  width: 128,
  height: 255,
  boxShadow:
    'inset 18px 22px 32px rgba(255,255,255,0.08), inset -24px -30px 46px rgba(0,0,0,0.42), 0 34px 70px rgba(0,0,0,0.42)',
};

const leftSleeve: CSSProperties = {
  ...sleeveBase,
  left: 20,
  borderRadius: '52px 22px 44px 68px',
  clipPath: 'polygon(42% 0, 100% 15%, 78% 100%, 18% 91%, 0 24%)',
  transform: 'rotate(7deg) translateZ(18px)',
};

const rightSleeve: CSSProperties = {
  ...sleeveBase,
  right: 20,
  borderRadius: '22px 52px 68px 44px',
  clipPath: 'polygon(0 15%, 58% 0, 100% 24%, 82% 91%, 22% 100%)',
  transform: 'rotate(-7deg) translateZ(18px)',
};

const shirtBody: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 62,
  transform: 'translateX(-50%) translateZ(58px)',
  width: 340,
  height: 440,
  borderRadius: '92px 92px 42px 42px / 86px 86px 34px 34px',
  clipPath:
    'polygon(17% 0, 35% 0, 42% 12%, 58% 12%, 65% 0, 83% 0, 98% 22%, 87% 100%, 13% 100%, 2% 22%)',
  animation: 'stitchraBreath 5.8s ease-in-out infinite',
  overflow: 'hidden',
};

const fabricTexture: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.18) 18%, transparent 34%), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 7px), repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 9px)',
  animation: 'stitchraFabric 8s ease-in-out infinite',
  pointerEvents: 'none',
};

const collar: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 0,
  transform: 'translateX(-50%)',
  width: 112,
  height: 64,
  borderRadius: '0 0 999px 999px',
  background:
    'linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.34))',
  boxShadow:
    '0 10px 24px rgba(0,0,0,0.38), inset 0 -9px 16px rgba(255,255,255,0.05)',
};

const neckSeam: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 46,
  transform: 'translateX(-50%)',
  width: 152,
  height: 1,
};

const placementBox: CSSProperties = {
  position: 'absolute',
  transform: 'translateX(-50%)',
  borderRadius: 18,
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
};

const threadGrid: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'linear-gradient(45deg, rgba(124,240,212,0.18) 25%, transparent 25%, transparent 50%, rgba(124,240,212,0.18) 50%, rgba(124,240,212,0.18) 75%, transparent 75%, transparent)',
  backgroundSize: '18px 18px',
  animation: 'stitchraThread 7s linear infinite',
  pointerEvents: 'none',
  zIndex: 0,
};

const logoOnShirt: CSSProperties = {
  position: 'absolute',
  inset: 7,
  zIndex: 1,
  borderRadius: 14,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'contain',
};

const placeholderText: CSSProperties = {
  fontSize: 13,
  fontWeight: 850,
  letterSpacing: 0,
  textTransform: 'uppercase',
  zIndex: 1,
};

const bottomGlow: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: -2,
  transform: 'translateX(-50%) translateZ(40px)',
  width: 285,
  height: 30,
  borderRadius: '50%',
  background:
    'linear-gradient(90deg, transparent, rgba(124,240,212,0.24), transparent)',
  filter: 'blur(20px)',
  opacity: 0.8,
};
