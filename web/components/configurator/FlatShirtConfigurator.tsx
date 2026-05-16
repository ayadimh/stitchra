'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import {
  clampLogoPlacementConfig,
  formatLogoSize,
  getEmbroideryZone,
} from '@/lib/embroideryZones';
import type { ShirtConfiguratorProps } from './types';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function FlatShirtConfigurator({
  logoUrl,
  shirtColor,
  placementZone,
  config,
  logoAspectRatio,
  onConfigChange,
}: ShirtConfiguratorProps) {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const zone = getEmbroideryZone(placementZone);
  const isWhite = shirtColor === 'white';
  const zoneLayout =
    placementZone === 'left_chest'
      ? {
          left: 58,
          top: 33,
          width: 26,
          height: 17,
        }
      : {
          left: 50,
          top: 52,
          width: 62,
          height: 43,
        };
  const logoWidthPercent =
    (config.logo_width_mm / zone.maxWidthMm) * 100;
  const logoHeightPercent =
    (config.logo_height_mm / zone.maxHeightMm) * 100;
  const logoLeftPercent =
    config.logo_position_x * 100 - logoWidthPercent / 2;
  const logoTopPercent =
    config.logo_position_y * 100 - logoHeightPercent / 2;

  const updateFromPointer = (
    event: PointerEvent<HTMLElement>
  ) => {
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
    <div className="shirt-configurator-card" style={cardStyle}>
      <div style={topBarStyle}>
        <span style={badgeStyle}>Fallback preview</span>
        <span style={metaStyle}>
          Placement: {zone.label} · Logo size: {formatLogoSize(config)}
        </span>
      </div>

      <div style={stageStyle}>
        <div style={glowStyle} />
        <div
          style={{
            ...shirtStyle,
            background: isWhite
              ? 'linear-gradient(145deg,#fffdf7,#dedbd2 54%,#f7f3ea)'
              : 'linear-gradient(145deg,#151f20,#070909 62%,#020303)',
            boxShadow: isWhite
              ? 'inset 18px 22px 36px rgba(255,255,255,0.8), inset -28px -42px 56px rgba(126,116,98,0.34), 0 34px 90px rgba(0,0,0,0.45)'
              : 'inset 20px 24px 40px rgba(255,255,255,0.055), inset -34px -48px 62px rgba(0,0,0,0.72), 0 34px 90px rgba(0,0,0,0.58)',
          }}
        >
          <div style={collarStyle} />
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
              ...placementZoneStyle,
              left: `${zoneLayout.left}%`,
              top: `${zoneLayout.top}%`,
              width: `${zoneLayout.width}%`,
              height: `${zoneLayout.height}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {logoUrl ? (
              <div
                style={{
                  ...logoFrameStyle,
                  left: `${logoLeftPercent}%`,
                  top: `${logoTopPercent}%`,
                  width: `${logoWidthPercent}%`,
                  height: `${logoHeightPercent}%`,
                }}
              >
                <Image
                  src={logoUrl}
                  alt="Uploaded embroidery logo"
                  fill
                  unoptimized
                  sizes="180px"
                  style={{
                    objectFit: 'contain',
                    mixBlendMode: isWhite ? 'multiply' : 'screen',
                    filter: isWhite
                      ? 'contrast(1.1) saturate(0.95)'
                      : 'contrast(1.35) saturate(1.18) brightness(0.9)',
                  }}
                />
              </div>
            ) : (
              <span style={placeholderTextStyle}>Logo</span>
            )}
          </div>
        </div>
      </div>

      <p style={hintStyle}>Drag the logo within the highlighted embroidery zone.</p>
    </div>
  );
}

const cardStyle: CSSProperties = {
  position: 'relative',
  minHeight: 650,
  borderRadius: 36,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.10)',
  background:
    'radial-gradient(circle at 50% 12%, rgba(0,255,136,0.18), transparent 30%), linear-gradient(145deg,rgba(3,5,7,0.98),rgba(8,15,17,0.94) 48%,rgba(2,3,5,0.98))',
  boxShadow:
    '0 44px 130px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const topBarStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 4,
  top: 20,
  left: 20,
  right: 20,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  padding: '10px 14px',
  borderRadius: 16,
  background: 'rgba(0,0,0,0.46)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 18px 45px rgba(0,0,0,0.32)',
};

const badgeStyle: CSSProperties = {
  color: '#9dffc4',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const metaStyle: CSSProperties = {
  color: 'rgba(245,247,248,0.72)',
  fontSize: 13,
  fontWeight: 750,
};

const stageStyle: CSSProperties = {
  position: 'absolute',
  inset: '72px 0 42px',
  display: 'grid',
  placeItems: 'center',
};

const glowStyle: CSSProperties = {
  position: 'absolute',
  width: '72%',
  height: '70%',
  borderRadius: '50%',
  background:
    'radial-gradient(ellipse at center, rgba(124,240,212,0.20), transparent 62%)',
  filter: 'blur(28px)',
};

const shirtStyle: CSSProperties = {
  position: 'relative',
  width: 'min(420px, 86%)',
  aspectRatio: '0.72',
  clipPath:
    'polygon(17% 0, 35% 0, 42% 12%, 58% 12%, 65% 0, 83% 0, 98% 22%, 87% 100%, 13% 100%, 2% 22%)',
  borderRadius: '92px 92px 42px 42px / 86px 86px 34px 34px',
  overflow: 'hidden',
};

const collarStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 0,
  transform: 'translateX(-50%)',
  width: '32%',
  height: '15%',
  borderRadius: '0 0 999px 999px',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.74), rgba(0,0,0,0.34))',
};

const placementZoneStyle: CSSProperties = {
  position: 'absolute',
  border: '1px solid rgba(124,240,212,0.62)',
  borderRadius: 18,
  background:
    'linear-gradient(135deg, rgba(124,240,212,0.10), rgba(0,0,0,0.02))',
  boxShadow:
    '0 0 24px rgba(124,240,212,0.32), inset 0 0 18px rgba(124,240,212,0.09)',
  cursor: 'grab',
  touchAction: 'none',
  overflow: 'hidden',
};

const logoFrameStyle: CSSProperties = {
  position: 'absolute',
  minWidth: 18,
  minHeight: 18,
  borderRadius: 10,
  overflow: 'hidden',
  filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
};

const placeholderTextStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: 'rgba(224,255,244,0.68)',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
};

const hintStyle: CSSProperties = {
  position: 'absolute',
  left: 22,
  right: 22,
  bottom: 18,
  margin: 0,
  color: 'rgba(245,247,248,0.58)',
  fontSize: 13,
  textAlign: 'center',
};
