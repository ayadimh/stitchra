import Image from 'next/image';
import type { CSSProperties } from 'react';
import {
  formatPlacementLabel,
  getEmbroideryZone,
  getEmbroideryZoneByLabel,
  getPlacementSideLabel,
  isEmbroideryZoneId,
  type EmbroideryZoneId,
} from '@/lib/embroideryZones';
import type { OrderDesignConfig } from '@/lib/orders';

type PublicShirtPreviewProps = {
  logoUrl: string | null;
  shirtColor: string;
  placement: string;
  designConfig?: OrderDesignConfig | null;
  minHeight?: number | string;
  compact?: boolean;
};

type ShirtColor = 'black' | 'white';
type PreviewSide = 'front' | 'back' | 'side';
type ZoneLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotate?: number;
};
type StaticPlacementLayout = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotate?: number;
};

const SHIRT_RENDER_PATHS: Record<ShirtColor, Record<'front' | 'back', string>> = {
  white: {
    front: '/mockups/shirts/shirt-front-white.png',
    back: '/mockups/shirts/shirt-back-white.png',
  },
  black: {
    front: '/mockups/shirts/shirt-front-black.png',
    back: '/mockups/shirts/shirt-back-black.png',
  },
};

const STATIC_RENDER_SHIRT_BOUNDS: Record<PreviewSide, ZoneLayout> = {
  front: { left: 31, top: 26, width: 38, height: 58 },
  back: { left: 31, top: 26, width: 38, height: 58 },
  side: { left: 36, top: 26, width: 28, height: 58 },
};

const STATIC_RENDER_PLACEMENTS: Record<
  PreviewSide,
  Partial<Record<EmbroideryZoneId, StaticPlacementLayout>>
> = {
  front: {
    left_chest: { centerX: 0.38, centerY: 0.32, width: 0.24, height: 0.15 },
    right_chest: { centerX: 0.62, centerY: 0.32, width: 0.24, height: 0.15 },
    center_chest: { centerX: 0.5, centerY: 0.33, width: 0.4, height: 0.17 },
    center_front: { centerX: 0.5, centerY: 0.54, width: 0.44, height: 0.48 },
    lower_front: { centerX: 0.5, centerY: 0.7, width: 0.4, height: 0.22 },
    front_left_bottom: { centerX: 0.38, centerY: 0.7, width: 0.26, height: 0.19 },
    front_right_bottom: { centerX: 0.62, centerY: 0.7, width: 0.26, height: 0.19 },
  },
  back: {
    upper_back: { centerX: 0.5, centerY: 0.3, width: 0.4, height: 0.17 },
    center_back: { centerX: 0.5, centerY: 0.54, width: 0.44, height: 0.48 },
    lower_back: { centerX: 0.5, centerY: 0.7, width: 0.4, height: 0.22 },
    back_left_shoulder: { centerX: 0.38, centerY: 0.3, width: 0.26, height: 0.17 },
    back_right_shoulder: { centerX: 0.62, centerY: 0.3, width: 0.26, height: 0.17 },
    back_left_bottom: { centerX: 0.38, centerY: 0.7, width: 0.26, height: 0.19 },
    back_right_bottom: { centerX: 0.62, centerY: 0.7, width: 0.26, height: 0.19 },
  },
  side: {
    left_sleeve: { centerX: 0.42, centerY: 0.46, width: 0.34, height: 0.18, rotate: 7 },
    right_sleeve: { centerX: 0.58, centerY: 0.46, width: 0.34, height: 0.18, rotate: -7 },
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeShirtColor(value: string): ShirtColor {
  return value.toLowerCase().includes('white') ? 'white' : 'black';
}

function getZoneId(placement: string, designConfig?: OrderDesignConfig | null) {
  if (
    designConfig?.placement_zone &&
    isEmbroideryZoneId(designConfig.placement_zone)
  ) {
    return designConfig.placement_zone;
  }

  return (
    getEmbroideryZoneByLabel(placement) ??
    (placement.toLowerCase().includes('center')
      ? 'center_front'
      : 'left_chest')
  );
}

function getPreviewSide(zoneId: EmbroideryZoneId): PreviewSide {
  const side = getPlacementSideLabel(zoneId);

  if (side === 'back') {
    return 'back';
  }

  if (side === 'sleeve') {
    return 'side';
  }

  return 'front';
}

function getRenderSide(side: PreviewSide): 'front' | 'back' {
  return side === 'back' ? 'back' : 'front';
}

function getStaticRenderZoneLayout(zoneId: EmbroideryZoneId, side: PreviewSide): ZoneLayout {
  const bounds = STATIC_RENDER_SHIRT_BOUNDS[side];
  const placement = STATIC_RENDER_PLACEMENTS[side][zoneId];

  if (!placement) {
    const zone = getEmbroideryZone(zoneId);
    return getStaticRenderZoneLayoutFromPlacement(bounds, {
      centerX: 0.5,
      centerY: side === 'side' ? 0.46 : 0.54,
      width: zone.maxWidthMm >= 200 ? 0.44 : zone.maxWidthMm >= 120 ? 0.34 : 0.24,
      height:
        zone.maxHeightMm >= 200 ? 0.48 : zone.maxHeightMm >= 90 ? 0.22 : 0.15,
    });
  }

  return getStaticRenderZoneLayoutFromPlacement(bounds, placement);
}

function getStaticRenderZoneLayoutFromPlacement(
  bounds: ZoneLayout,
  placement: StaticPlacementLayout
): ZoneLayout {
  const width = clamp(bounds.width * placement.width, 1, bounds.width);
  const height = clamp(bounds.height * placement.height, 1, bounds.height);
  const left = clamp(
    bounds.left + bounds.width * placement.centerX,
    bounds.left + width / 2,
    bounds.left + bounds.width - width / 2
  );
  const top = clamp(
    bounds.top + bounds.height * placement.centerY,
    bounds.top + height / 2,
    bounds.top + bounds.height - height / 2
  );

  return {
    left: Number(left.toFixed(2)),
    top: Number(top.toFixed(2)),
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
    rotate: placement.rotate,
  };
}

function getLogoLayout(
  zoneId: EmbroideryZoneId,
  side: PreviewSide,
  designConfig?: OrderDesignConfig | null
): ZoneLayout {
  const zone = getEmbroideryZone(zoneId);
  const bounds = STATIC_RENDER_SHIRT_BOUNDS[side];
  const zoneLayout = getStaticRenderZoneLayout(zoneId, side);
  const customX = designConfig?.custom_placement_x;
  const customY = designConfig?.custom_placement_y;
  const useCustom =
    Boolean(designConfig?.custom_placement) &&
    typeof customX === 'number' &&
    typeof customY === 'number';

  const widthMm = designConfig?.logo_width_mm ?? zone.defaultWidthMm;
  const heightMm = designConfig?.logo_height_mm ?? zone.defaultHeightMm;
  const width = clamp(
    zoneLayout.width * (widthMm / zone.maxWidthMm),
    3,
    Math.min(zoneLayout.width, bounds.width)
  );
  const height = clamp(
    zoneLayout.height * (heightMm / zone.maxHeightMm),
    3,
    Math.min(zoneLayout.height, bounds.height)
  );

  if (useCustom) {
    return {
      left: Number(
        clamp(
          bounds.left + bounds.width * customX,
          bounds.left + width / 2,
          bounds.left + bounds.width - width / 2
        ).toFixed(2)
      ),
      top: Number(
        clamp(
          bounds.top + bounds.height * customY,
          bounds.top + height / 2,
          bounds.top + bounds.height - height / 2
        ).toFixed(2)
      ),
      width,
      height,
      rotate: zoneLayout.rotate,
    };
  }

  const x = designConfig?.logo_position_x ?? 0.5;
  const y = designConfig?.logo_position_y ?? 0.5;
  const zoneLeftEdge = zoneLayout.left - zoneLayout.width / 2;
  const zoneTopEdge = zoneLayout.top - zoneLayout.height / 2;

  return {
    left: Number(
      clamp(
        zoneLeftEdge + zoneLayout.width * x,
        bounds.left + width / 2,
        bounds.left + bounds.width - width / 2
      ).toFixed(2)
    ),
    top: Number(
      clamp(
        zoneTopEdge + zoneLayout.height * y,
        bounds.top + height / 2,
        bounds.top + bounds.height - height / 2
      ).toFixed(2)
    ),
    width,
    height,
    rotate: zoneLayout.rotate,
  };
}

export default function PublicShirtPreview({
  logoUrl,
  shirtColor,
  placement,
  designConfig,
  minHeight = 420,
  compact = false,
}: PublicShirtPreviewProps) {
  const zoneId = getZoneId(placement, designConfig);
  const zone = getEmbroideryZone(zoneId);
  const color = normalizeShirtColor(designConfig?.shirt_color ?? shirtColor);
  const previewSide = getPreviewSide(zoneId);
  const renderSide = getRenderSide(previewSide);
  const renderPath = SHIRT_RENDER_PATHS[color][renderSide];
  const zoneLayout = getStaticRenderZoneLayout(zoneId, previewSide);
  const logoLayout = getLogoLayout(zoneId, previewSide, designConfig);
  const placementLabel = formatPlacementLabel(placement);
  const sizeLabel =
    designConfig?.logo_width_mm && designConfig.logo_height_mm
      ? `${Math.round(designConfig.logo_width_mm)} × ${Math.round(
          designConfig.logo_height_mm
        )} mm`
      : `${zone.defaultWidthMm} × ${zone.defaultHeightMm} mm`;

  return (
    <div
      style={{
        ...previewShell,
        minHeight,
        borderRadius: compact ? 22 : 28,
      }}
    >
      <div style={previewGrid} />
      <div style={previewTopLabel}>
        {renderSide === 'back' ? 'Back' : previewSide === 'side' ? 'Sleeve' : 'Front'} ·{' '}
        {placementLabel} · {sizeLabel}
      </div>
      <div style={shirtStage}>
        <Image
          src={renderPath}
          alt={`${color} T-shirt ${renderSide} preview`}
          fill
          sizes="(max-width: 760px) 94vw, 640px"
          priority={false}
          style={{
            objectFit: 'contain',
            filter:
              color === 'white'
                ? 'drop-shadow(0 34px 72px rgba(0,0,0,0.42))'
                : 'drop-shadow(0 34px 72px rgba(0,0,0,0.58))',
          }}
        />
        <div
          style={{
            ...placementGuide,
            left: `${zoneLayout.left}%`,
            top: `${zoneLayout.top}%`,
            width: `${zoneLayout.width}%`,
            height: `${zoneLayout.height}%`,
            transform: `translate(-50%, -50%) rotate(${zoneLayout.rotate ?? 0}deg)`,
          }}
        />
        {logoUrl ? (
          <div
            style={{
              ...logoLayer,
              left: `${logoLayout.left}%`,
              top: `${logoLayout.top}%`,
              width: `${logoLayout.width}%`,
              height: `${logoLayout.height}%`,
              transform: `translate(-50%, -50%) rotate(${logoLayout.rotate ?? 0}deg)`,
            }}
          >
            <Image
              src={logoUrl}
              alt="Design preview on shirt"
              fill
              unoptimized
              sizes="(max-width: 760px) 180px, 240px"
              style={{
                objectFit: 'contain',
                filter:
                  color === 'white'
                    ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.28))'
                    : 'drop-shadow(0 0 1px rgba(255,255,255,0.82)) drop-shadow(0 0 8px rgba(255,255,255,0.24))',
              }}
            />
          </div>
        ) : (
          <span style={noLogoLabel}>No logo preview</span>
        )}
      </div>
    </div>
  );
}

const previewShell: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  border: '1px solid rgba(255,255,255,0.10)',
  background:
    'radial-gradient(circle at 50% 38%, rgba(0,255,136,0.14), transparent 24%), linear-gradient(145deg, rgba(3,5,7,0.98), rgba(8,15,17,0.94) 48%, rgba(2,3,5,0.98))',
  boxShadow: '0 24px 80px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.08)',
  isolation: 'isolate',
};

const previewGrid: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
  backgroundSize: '44px 44px',
  maskImage: 'radial-gradient(circle at 50% 45%, black, transparent 78%)',
};

const previewTopLabel: CSSProperties = {
  position: 'absolute',
  top: 14,
  left: 14,
  right: 14,
  zIndex: 5,
  minHeight: 38,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 999,
  color: 'rgba(245,247,248,0.78)',
  background: 'rgba(0,0,0,0.42)',
  fontSize: 13,
  fontWeight: 800,
  textAlign: 'center',
  padding: '0 12px',
};

const shirtStage: CSSProperties = {
  position: 'absolute',
  inset: '46px 0 16px',
};

const placementGuide: CSSProperties = {
  position: 'absolute',
  zIndex: 3,
  border: '1px solid rgba(124,240,212,0.24)',
  borderRadius: 14,
  background: 'rgba(124,240,212,0.035)',
  boxShadow: '0 0 18px rgba(124,240,212,0.16)',
  pointerEvents: 'none',
};

const logoLayer: CSSProperties = {
  position: 'absolute',
  zIndex: 4,
  pointerEvents: 'none',
};

const noLogoLabel: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '52%',
  zIndex: 4,
  transform: 'translate(-50%, -50%)',
  color: 'rgba(245,247,248,0.58)',
  fontSize: 13,
  fontWeight: 850,
};
