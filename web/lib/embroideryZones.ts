export const MIN_LOGO_WIDTH_MM = 20;

export const embroideryZones = {
  left_chest: {
    label: 'Left chest',
    group: 'front',
    side: 'front',
    sizeTier: 'small',
    maxWidthMm: 90,
    maxHeightMm: 60,
    defaultWidthMm: 70,
    defaultHeightMm: 45,
    priceTier: 'small',
  },
  right_chest: {
    label: 'Right chest',
    group: 'front',
    side: 'front',
    sizeTier: 'small',
    maxWidthMm: 90,
    maxHeightMm: 60,
    defaultWidthMm: 70,
    defaultHeightMm: 45,
    priceTier: 'small',
  },
  center_chest: {
    label: 'Center chest',
    group: 'front',
    side: 'front',
    sizeTier: 'medium',
    maxWidthMm: 120,
    maxHeightMm: 90,
    defaultWidthMm: 92,
    defaultHeightMm: 70,
    priceTier: 'medium',
  },
  center_front: {
    label: 'Center front',
    group: 'front',
    side: 'front',
    sizeTier: 'large',
    maxWidthMm: 220,
    maxHeightMm: 280,
    defaultWidthMm: 165,
    defaultHeightMm: 210,
    priceTier: 'large',
  },
  lower_front: {
    label: 'Lower front',
    group: 'front',
    side: 'front',
    sizeTier: 'bottom',
    maxWidthMm: 140,
    maxHeightMm: 100,
    defaultWidthMm: 105,
    defaultHeightMm: 75,
    priceTier: 'medium',
  },
  front_left_bottom: {
    label: 'Front left bottom',
    group: 'front',
    side: 'front',
    sizeTier: 'bottom',
    maxWidthMm: 140,
    maxHeightMm: 100,
    defaultWidthMm: 105,
    defaultHeightMm: 75,
    priceTier: 'medium',
  },
  front_right_bottom: {
    label: 'Front right bottom',
    group: 'front',
    side: 'front',
    sizeTier: 'bottom',
    maxWidthMm: 140,
    maxHeightMm: 100,
    defaultWidthMm: 105,
    defaultHeightMm: 75,
    priceTier: 'medium',
  },
  upper_back: {
    label: 'Upper back',
    group: 'back',
    side: 'back',
    sizeTier: 'medium',
    maxWidthMm: 120,
    maxHeightMm: 90,
    defaultWidthMm: 92,
    defaultHeightMm: 70,
    priceTier: 'medium',
  },
  center_back: {
    label: 'Center back',
    group: 'back',
    side: 'back',
    sizeTier: 'large',
    maxWidthMm: 220,
    maxHeightMm: 280,
    defaultWidthMm: 165,
    defaultHeightMm: 210,
    priceTier: 'large',
  },
  lower_back: {
    label: 'Lower back',
    group: 'back',
    side: 'back',
    sizeTier: 'large',
    maxWidthMm: 220,
    maxHeightMm: 280,
    defaultWidthMm: 165,
    defaultHeightMm: 210,
    priceTier: 'large',
  },
  back_left_shoulder: {
    label: 'Back left shoulder',
    group: 'back',
    side: 'back',
    sizeTier: 'medium',
    maxWidthMm: 120,
    maxHeightMm: 90,
    defaultWidthMm: 92,
    defaultHeightMm: 70,
    priceTier: 'medium',
  },
  back_right_shoulder: {
    label: 'Back right shoulder',
    group: 'back',
    side: 'back',
    sizeTier: 'medium',
    maxWidthMm: 120,
    maxHeightMm: 90,
    defaultWidthMm: 92,
    defaultHeightMm: 70,
    priceTier: 'medium',
  },
  back_left_bottom: {
    label: 'Back left bottom',
    group: 'back',
    side: 'back',
    sizeTier: 'bottom',
    maxWidthMm: 140,
    maxHeightMm: 100,
    defaultWidthMm: 105,
    defaultHeightMm: 75,
    priceTier: 'medium',
  },
  back_right_bottom: {
    label: 'Back right bottom',
    group: 'back',
    side: 'back',
    sizeTier: 'bottom',
    maxWidthMm: 140,
    maxHeightMm: 100,
    defaultWidthMm: 105,
    defaultHeightMm: 75,
    priceTier: 'medium',
  },
  left_sleeve: {
    label: 'Left sleeve',
    group: 'sleeves',
    side: 'sleeve',
    sizeTier: 'small',
    maxWidthMm: 90,
    maxHeightMm: 60,
    defaultWidthMm: 70,
    defaultHeightMm: 45,
    priceTier: 'small',
  },
  right_sleeve: {
    label: 'Right sleeve',
    group: 'sleeves',
    side: 'sleeve',
    sizeTier: 'small',
    maxWidthMm: 90,
    maxHeightMm: 60,
    defaultWidthMm: 70,
    defaultHeightMm: 45,
    priceTier: 'small',
  },
} as const;

// These limits are temporary and must be adjusted to the final embroidery machine hoop/frame limits.

export type EmbroideryZoneId = keyof typeof embroideryZones;
export type EmbroideryPlacementGroup = 'front' | 'back' | 'sleeves';

export const placementGroups: Array<{
  id: EmbroideryPlacementGroup;
  label: string;
  zones: EmbroideryZoneId[];
}> = [
  {
    id: 'front',
    label: 'Front',
    zones: [
      'left_chest',
      'right_chest',
      'center_chest',
      'center_front',
      'lower_front',
      'front_left_bottom',
      'front_right_bottom',
    ],
  },
  {
    id: 'back',
    label: 'Back',
    zones: [
      'upper_back',
      'center_back',
      'lower_back',
      'back_left_shoulder',
      'back_right_shoulder',
      'back_left_bottom',
      'back_right_bottom',
    ],
  },
  {
    id: 'sleeves',
    label: 'Sleeves',
    zones: ['left_sleeve', 'right_sleeve'],
  },
];

export type LogoPlacementConfig = {
  placement_zone: EmbroideryZoneId;
  logo_position_x: number;
  logo_position_y: number;
  logo_width_mm: number;
  logo_height_mm: number;
  logo_scale: number;
  logo_offset_x: number;
  logo_offset_y: number;
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

export function getEmbroideryZoneByLabel(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[_\s-]+/g, '_');

  return (
    (Object.keys(embroideryZones) as EmbroideryZoneId[]).find(
      (zoneId) =>
        zoneId === normalized ||
        embroideryZones[zoneId].label
          .toLowerCase()
          .replace(/[_\s-]+/g, '_') === normalized
    ) ?? null
  );
}

export function formatPlacementLabel(value: string) {
  const zoneId = getEmbroideryZoneByLabel(value);

  if (zoneId) {
    return embroideryZones[zoneId].label;
  }

  if (value === 'left') {
    return embroideryZones.left_chest.label;
  }

  if (value === 'center') {
    return embroideryZones.center_front.label;
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getPlacementSideLabel(zoneId: EmbroideryZoneId) {
  const side = embroideryZones[zoneId].side;

  if (side === 'back') {
    return 'back';
  }

  if (side === 'sleeve') {
    return 'sleeve';
  }

  return 'front';
}

export function getPricingPlacementValue(zoneId: EmbroideryZoneId) {
  return embroideryZones[zoneId].priceTier === 'small' ? 'left' : 'center';
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
  const logoPositionX = clamp(config.logo_position_x, halfWidth, 1 - halfWidth);
  const logoPositionY = clamp(config.logo_position_y, halfHeight, 1 - halfHeight);

  return {
    ...config,
    logo_position_x: Number(logoPositionX.toFixed(4)),
    logo_position_y: Number(logoPositionY.toFixed(4)),
    logo_width_mm: size.widthMm,
    logo_height_mm: size.heightMm,
    logo_scale: Number((size.widthMm / zone.maxWidthMm).toFixed(4)),
    logo_offset_x: Number((logoPositionX * 100).toFixed(2)),
    logo_offset_y: Number((logoPositionY * 100).toFixed(2)),
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
      logo_offset_x: 50,
      logo_offset_y: 50,
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
