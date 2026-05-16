'use client';

import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import {
  clampLogoPlacementConfig,
  formatLogoSize,
  getEmbroideryZone,
  getPlacementSideLabel,
} from '@/lib/embroideryZones';
import type { ShirtConfiguratorProps } from './types';

type ZoneLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotate?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getZoneLayout(zoneId: ShirtConfiguratorProps['placementZone']): ZoneLayout {
  const layouts: Record<ShirtConfiguratorProps['placementZone'], ZoneLayout> = {
    left_chest: { left: 64, top: 42, width: 22, height: 15 },
    right_chest: { left: 36, top: 42, width: 22, height: 15 },
    center_chest: { left: 50, top: 40, width: 34, height: 18 },
    center_front: { left: 50, top: 54, width: 48, height: 35 },
    lower_front: { left: 50, top: 68, width: 38, height: 21 },
    front_left_bottom: { left: 38, top: 70, width: 31, height: 18 },
    front_right_bottom: { left: 62, top: 70, width: 31, height: 18 },
    upper_back: { left: 50, top: 32, width: 42, height: 20 },
    center_back: { left: 50, top: 54, width: 52, height: 38 },
    lower_back: { left: 50, top: 73, width: 50, height: 32 },
    back_left_shoulder: { left: 38, top: 31, width: 31, height: 18 },
    back_right_shoulder: { left: 62, top: 31, width: 31, height: 18 },
    back_left_bottom: { left: 36, top: 76, width: 31, height: 18 },
    back_right_bottom: { left: 64, top: 76, width: 31, height: 18 },
    left_sleeve: { left: 18, top: 47, width: 22, height: 24, rotate: 7 },
    right_sleeve: { left: 82, top: 47, width: 22, height: 24, rotate: -7 },
  };

  return layouts[zoneId];
}

export default function ShirtPlacementMockup({
  logoUrl,
  shirtColor,
  placementZone,
  config,
  logoAspectRatio,
  onConfigChange,
}: ShirtConfiguratorProps) {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    active: false,
  });
  const zone = getEmbroideryZone(placementZone);
  const layout = getZoneLayout(placementZone);
  const sideLabel = getPlacementSideLabel(placementZone);
  const isWhite = shirtColor === 'white';
  const logoLoadFailed = Boolean(logoUrl && failedLogoUrl === logoUrl);
  const logoWidthPercent = (config.logo_width_mm / zone.maxWidthMm) * 100;
  const logoHeightPercent = (config.logo_height_mm / zone.maxHeightMm) * 100;
  const logoLeftPercent = config.logo_position_x * 100 - logoWidthPercent / 2;
  const logoTopPercent = config.logo_position_y * 100 - logoHeightPercent / 2;
  const rotateX = mouse.active ? mouse.y * -4 : 0;
  const rotateY = mouse.active ? mouse.x * 6 : 0;
  const lightX = mouse.active ? 50 + mouse.x * 18 : 50;
  const lightY = mouse.active ? 32 + mouse.y * 12 : 32;
  const shirtSurface = isWhite
    ? 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.95), transparent 18%), linear-gradient(145deg,#fffdf7 0%,#dedbd2 46%,#f7f3ea 100%)'
    : 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.16), transparent 18%), linear-gradient(145deg,#172224 0%,#101716 46%,#060808 100%)';
  const sleeveSurface = isWhite
    ? 'linear-gradient(145deg,#fbf7ec,#d6d2c8 54%,#f5f1e8)'
    : 'linear-gradient(145deg,#101719,#1a2423 55%,#050707)';
  const seamColor = isWhite
    ? 'rgba(35,31,26,0.14)'
    : 'rgba(255,255,255,0.10)';
  const labelText = useMemo(
    () =>
      `T-shirt ${sideLabel} · ${zone.label} · ${zone.maxWidthMm} × ${zone.maxHeightMm} mm`,
    [sideLabel, zone]
  );

  const updateFromPointer = (event: PointerEvent<HTMLElement>) => {
    const rect = zoneRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const nextX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const nextY = clamp((event.clientY - rect.top) / rect.height, 0, 1);

    onConfigChange(
      clampLogoPlacementConfig(
        {
          ...config,
          placement_zone: placementZone,
          shirt_color: shirtColor,
          logo_position_x: nextX,
          logo_position_y: nextY,
        },
        logoAspectRatio
      )
    );
  };

  return (
    <div
      className="designer-preview-card shirt-placement-preview-card"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        setMouse({ x, y, active: true });
      }}
      onMouseLeave={() => setMouse({ x: 0, y: 0, active: false })}
      style={{
        ...stage,
        background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(124,240,212,0.22), transparent 18%), linear-gradient(145deg,rgba(3,5,7,0.98),rgba(8,15,17,0.94) 48%,rgba(2,3,5,0.98))`,
      }}
    >
      {/* Future upgrade: 3D FBX shirt preview with React Three Fiber. */}
      <style>
        {`
          @keyframes stitchraTorsoFloat {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(0, -6px, 0) scale(1.01); }
          }

          @keyframes stitchraBreath {
            0%, 100% { transform: translateX(-50%) translateZ(58px) scale3d(1, 1, 1); filter: brightness(1); }
            50% { transform: translateX(-50%) translateZ(58px) scale3d(1.004, 1.003, 1); filter: brightness(1.025); }
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

          @media (prefers-reduced-motion: reduce) {
            .shirt-placement-preview-card .shirt-preview-motion,
            .shirt-placement-preview-card .shirt-preview-breath,
            .shirt-placement-preview-card .shirt-preview-glow,
            .shirt-placement-preview-card .shirt-preview-thread,
            .shirt-placement-preview-card .shirt-preview-fabric {
              animation: none !important;
            }
          }
        `}
      </style>
      <div
        style={{
          ...gridOverlay,
          transform: `translate3d(${mouse.x * -10}px, ${mouse.y * -10}px, 0)`,
        }}
      />
      <div className="shirt-preview-glow" style={glowField} />

      <div className="designer-preview-label" style={previewLabel}>
        {labelText}
      </div>

      <div
        className="designer-preview-torso"
        style={{
          ...torsoRig,
          transform: `translateX(-50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        <div className="shirt-preview-motion" style={torsoFloat}>
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
            className="shirt-preview-breath"
            style={{
              ...shirtBody,
              background: shirtSurface,
              boxShadow: isWhite
                ? 'inset 24px 22px 38px rgba(255,255,255,0.70), inset -36px -42px 60px rgba(120,112,98,0.34), 0 56px 115px rgba(0,0,0,0.48), 0 0 74px rgba(124,240,212,0.13)'
                : 'inset 24px 22px 42px rgba(255,255,255,0.07), inset -38px -48px 66px rgba(0,0,0,0.66), 0 56px 115px rgba(0,0,0,0.58), 0 0 78px rgba(124,240,212,0.13)',
            }}
          >
            <div
              className="shirt-preview-fabric"
              style={{
                ...fabricTexture,
                opacity: isWhite ? 0.44 : 0.3,
              }}
            />
            <div style={collar} />
            <div
              style={{
                ...neckSeam,
                background: seamColor,
                boxShadow:
                  sideLabel === 'back'
                    ? `0 30px 0 ${seamColor}, 0 62px 0 ${seamColor}`
                    : `0 22px 0 ${seamColor}`,
              }}
            />
            {sideLabel === 'back' && <div style={backYoke} />}
          </div>

          <div
            ref={zoneRef}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
              updateFromPointer(event);
            }}
            onPointerMove={(event) => {
              if (dragging) {
                updateFromPointer(event);
              }
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
              setDragging(false);
            }}
            onPointerCancel={() => setDragging(false)}
            style={{
              ...placementBox,
              left: `${layout.left}%`,
              top: `${layout.top}%`,
              width: `${layout.width}%`,
              height: `${layout.height}%`,
              transform: `translate(-50%, -50%) rotate(${layout.rotate ?? 0}deg)`,
              border: logoUrl
                ? '1px solid rgba(124,240,212,0.34)'
                : '1px solid rgba(124,240,212,0.86)',
              boxShadow: logoUrl
                ? '0 0 18px rgba(124,240,212,0.22), 0 0 58px rgba(0,200,255,0.10), inset 0 0 16px rgba(124,240,212,0.08)'
                : '0 0 28px rgba(124,240,212,0.58), 0 0 80px rgba(0,200,255,0.18), inset 0 0 26px rgba(124,240,212,0.14)',
              animation: logoUrl
                ? 'none'
                : 'stitchraGlow 3.2s ease-in-out infinite',
            }}
          >
            <div
              className="shirt-preview-thread"
              style={{
                ...threadGrid,
                opacity: logoUrl ? (isWhite ? 0.1 : 0.13) : 0.32,
              }}
            />
            {logoUrl && !logoLoadFailed ? (
              <div
                aria-label="Design preview on shirt"
                style={{
                  ...logoFrame,
                  left: `${logoLeftPercent}%`,
                  top: `${logoTopPercent}%`,
                  width: `${logoWidthPercent}%`,
                  height: `${logoHeightPercent}%`,
                  background: isWhite
                    ? 'rgba(255,255,255,0.02)'
                    : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0.07) 58%, rgba(124,240,212,0.08) 100%)',
                  boxShadow: isWhite
                    ? '0 1px 8px rgba(0,0,0,0.18)'
                    : '0 0 0 1px rgba(255,255,255,0.18), 0 0 18px rgba(124,240,212,0.28)',
                }}
              >
                {/* Native img is intentional for immediate blob: upload previews. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Uploaded embroidery logo"
                  draggable={false}
                  onError={() => setFailedLogoUrl(logoUrl)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    zIndex: 3,
                    opacity: 0.98,
                    pointerEvents: 'none',
                    filter: isWhite
                      ? 'contrast(1.18) saturate(0.95) brightness(0.98) drop-shadow(0 1px 2px rgba(0,0,0,0.20))'
                      : 'contrast(1.2) saturate(1.06) brightness(1.08) drop-shadow(0 0 1px rgba(255,255,255,0.90)) drop-shadow(0 0 10px rgba(124,240,212,0.34))',
                  }}
                />
              </div>
            ) : (
              <span
                style={{
                  ...(logoUrl ? previewUnavailableText : placeholderText),
                  color: isWhite
                    ? 'rgba(8,12,14,0.48)'
                    : 'rgba(224,255,244,0.74)',
                }}
              >
                {logoUrl ? 'Preview unavailable' : 'Logo'}
              </span>
            )}
          </div>

          <div style={bottomGlow} />
        </div>
      </div>

      <div style={footerHint}>
        Drag inside the highlighted zone · Logo size {formatLogoSize(config)}
      </div>
    </div>
  );
}

const stage: CSSProperties = {
  position: 'relative',
  minHeight: 650,
  borderRadius: 36,
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
    'radial-gradient(ellipse at center, rgba(124,240,212,0.22), transparent 55%)',
  filter: 'blur(28px)',
  opacity: 0.76,
  animation: 'stitchraGlow 4.6s ease-in-out infinite',
};

const previewLabel: CSSProperties = {
  position: 'absolute',
  top: 20,
  left: 20,
  right: 20,
  padding: '10px 16px',
  borderRadius: 16,
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 13,
  textAlign: 'center',
  zIndex: 4,
  boxShadow: '0 18px 45px rgba(0,0,0,0.32)',
};

const torsoRig: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 72,
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
  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.66), transparent 68%)',
  filter: 'blur(12px)',
  opacity: 0.9,
};

const leftSleeve: CSSProperties = {
  position: 'absolute',
  left: 20,
  top: 122,
  width: 128,
  height: 255,
  borderRadius: '52px 22px 44px 68px',
  clipPath: 'polygon(42% 0, 100% 15%, 78% 100%, 18% 91%, 0 24%)',
  boxShadow:
    'inset 18px 22px 32px rgba(255,255,255,0.08), inset -24px -30px 46px rgba(0,0,0,0.42), 0 34px 70px rgba(0,0,0,0.42)',
  transform: 'rotate(7deg) translateZ(18px)',
};

const rightSleeve: CSSProperties = {
  ...leftSleeve,
  left: 'auto',
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

const backYoke: CSSProperties = {
  position: 'absolute',
  left: '18%',
  right: '18%',
  top: 116,
  height: 1,
  background:
    'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)',
};

const placementBox: CSSProperties = {
  position: 'absolute',
  zIndex: 6,
  borderRadius: 18,
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, rgba(124,240,212,0.12), rgba(0,0,0,0.06))',
  cursor: 'grab',
  touchAction: 'none',
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

const logoFrame: CSSProperties = {
  position: 'absolute',
  minWidth: 20,
  minHeight: 20,
  borderRadius: 12,
  overflow: 'hidden',
  isolation: 'isolate',
  zIndex: 3,
};

const placeholderText: CSSProperties = {
  fontSize: 13,
  fontWeight: 850,
  letterSpacing: 0,
  textTransform: 'uppercase',
  zIndex: 1,
};

const previewUnavailableText: CSSProperties = {
  ...placeholderText,
  maxWidth: '80%',
  textAlign: 'center',
  textTransform: 'none',
  lineHeight: 1.25,
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

const footerHint: CSSProperties = {
  position: 'absolute',
  left: 22,
  right: 22,
  bottom: 18,
  zIndex: 8,
  margin: 0,
  padding: '10px 14px',
  borderRadius: 14,
  background: 'rgba(0,0,0,0.38)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(245,247,248,0.68)',
  fontSize: 13,
  textAlign: 'center',
};
