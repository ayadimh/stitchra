import {
  getEmbroideryZone,
  type EmbroideryZoneId,
} from './embroideryZones';

export const machineLimits = {
  maxColors: 15,
  recommendedColors: 6,
  leftChestMax: {
    widthMm: 90,
    heightMm: 60,
  },
  centerFrontMax: {
    widthMm: 250,
    heightMm: 200,
  },
  maxStitchesBeforeReview: 60000,
  absoluteMaxStitches: 90000,
} as const;

export type MachineCapabilityResult = {
  blocked: boolean;
  reviewRequired: boolean;
  message: string | null;
};

export function getMachineLimitForZone(zoneId: EmbroideryZoneId) {
  const zone = getEmbroideryZone(zoneId);

  return {
    widthMm: zone.maxWidthMm,
    heightMm: zone.maxHeightMm,
  };
}

export function evaluateMachineCapability({
  zoneId,
  widthMm,
  heightMm,
  colors,
  stitches,
}: {
  zoneId: EmbroideryZoneId;
  widthMm: number;
  heightMm: number;
  colors: number;
  stitches?: number | null;
}): MachineCapabilityResult {
  const limit = getMachineLimitForZone(zoneId);

  if (widthMm > limit.widthMm || heightMm > limit.heightMm) {
    return {
      blocked: true,
      reviewRequired: false,
      message:
        'This design is too large for the selected placement. Reduce size or choose another placement.',
    };
  }

  if (stitches && stitches > machineLimits.absoluteMaxStitches) {
    return {
      blocked: true,
      reviewRequired: false,
      message:
        'This design is too large for the selected placement. Reduce size or choose another placement.',
    };
  }

  const reviewRequired =
    colors > machineLimits.recommendedColors ||
    Boolean(stitches && stitches > machineLimits.maxStitchesBeforeReview);

  if (reviewRequired) {
    return {
      blocked: false,
      reviewRequired: true,
      message:
        'Studio review recommended for this design size, color count or stitch count.',
    };
  }

  return {
    blocked: false,
    reviewRequired: false,
    message: null,
  };
}
