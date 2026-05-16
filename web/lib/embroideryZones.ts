export const MIN_LOGO_WIDTH_MM = 20;

export const embroideryZones = {
  left_chest: {
    label: 'Left chest',
    maxWidthMm: 90,
    maxHeightMm: 60,
    defaultWidthMm: 70,
    defaultHeightMm: 45,
    priceTier: 'left_chest',
  },
  center_front: {
    label: 'Center front',
    maxWidthMm: 250,
    maxHeightMm: 200,
    defaultWidthMm: 180,
    defaultHeightMm: 140,
    priceTier: 'center_front',
  },
} as const;

// These limits are temporary and must be adjusted to the final embroidery machine hoop/frame limits.

export type EmbroideryZoneId = keyof typeof embroideryZones;

export type LogoPlacementConfig = {
  placement_zone: EmbroideryZoneId;
  logo_position_x: number;
  logo_position_y: number;
  logo_width_mm: number;
  logo_height_mm: number;
  logo_scale: number;
  shirt_color: 'black' | 'white';
};

export function getEmbroideryZone(zoneId: EmbroideryZoneId) {
  return embroideryZones[zoneId];
}

export function isEmbroideryZoneId(value: unknown): value is EmbroideryZoneId {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(embroideryZones, value)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSafeAspectRatio(aspectRatio: number) {
  return Number.isFinite(aspectRatio) && aspectRatio > 0
    ? aspectRatio
    : 70 / 45;
}

export function getMaxLogoWidthForAspect(
  zoneId: EmbroideryZoneId,
  aspectRatio: number
) {
  const zone = getEmbroideryZone(zoneId);
  const safeAspectRatio = getSafeAspectRatio(aspectRatio);

  return Math.max(
    MIN_LOGO_WIDTH_MM,
    Math.min(zone.maxWidthMm, zone.maxHeightMm * safeAspectRatio)
  );
}

export function fitLogoSizeToZone(
  zoneId: EmbroideryZoneId,
  preferredWidthMm: number,
  aspectRatio: number
) {
  const zone = getEmbroideryZone(zoneId);
  const safeAspectRatio = getSafeAspectRatio(aspectRatio);
  const maxWidthMm = getMaxLogoWidthForAspect(zoneId, safeAspectRatio);
  let widthMm = clamp(
    preferredWidthMm,
    Math.min(MIN_LOGO_WIDTH_MM, maxWidthMm),
    maxWidthMm
  );
  let heightMm = widthMm / safeAspectRatio;

  if (heightMm > zone.maxHeightMm) {
    heightMm = zone.maxHeightMm;
    widthMm = heightMm * safeAspectRatio;
  }

  return {
    widthMm: Number(widthMm.toFixed(1)),
    heightMm: Number(heightMm.toFixed(1)),
  };
}

export function clampLogoPlacementConfig(
  config: LogoPlacementConfig,
  aspectRatio: number
): LogoPlacementConfig {
  const zone = getEmbroideryZone(config.placement_zone);
  const size = fitLogoSizeToZone(
    config.placement_zone,
    config.logo_width_mm,
    aspectRatio
  );
  const halfWidth = size.widthMm / zone.maxWidthMm / 2;
  const halfHeight = size.heightMm / zone.maxHeightMm / 2;

  return {
    ...config,
    logo_position_x: Number(
      clamp(config.logo_position_x, halfWidth, 1 - halfWidth).toFixed(4)
    ),
    logo_position_y: Number(
      clamp(config.logo_position_y, halfHeight, 1 - halfHeight).toFixed(4)
    ),
    logo_width_mm: size.widthMm,
    logo_height_mm: size.heightMm,
    logo_scale: Number((size.widthMm / zone.maxWidthMm).toFixed(4)),
  };
}

export function getDefaultLogoPlacementConfig(
  zoneId: EmbroideryZoneId,
  shirtColor: 'black' | 'white',
  aspectRatio = 70 / 45
): LogoPlacementConfig {
  const zone = getEmbroideryZone(zoneId);
  const size = fitLogoSizeToZone(
    zoneId,
    zone.defaultWidthMm,
    aspectRatio || zone.defaultWidthMm / zone.defaultHeightMm
  );

  return clampLogoPlacementConfig(
    {
      placement_zone: zoneId,
      logo_position_x: 0.5,
      logo_position_y: 0.5,
      logo_width_mm: size.widthMm,
      logo_height_mm: size.heightMm,
      logo_scale: Number((size.widthMm / zone.maxWidthMm).toFixed(4)),
      shirt_color: shirtColor,
    },
    aspectRatio || zone.defaultWidthMm / zone.defaultHeightMm
  );
}

export function formatLogoSize(config: LogoPlacementConfig) {
  return `${Math.round(config.logo_width_mm)} × ${Math.round(
    config.logo_height_mm
  )} mm`;
}
