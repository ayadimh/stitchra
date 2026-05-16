export type RoundMode = 'ceil_to_whole_euro';

export type PricingSettings = {
  stitch_cost_per_1000_eur: number;
  blank_shirt_eur: number;
  backing_eur: number;
  thread_and_bobbin_base_eur: number;
  needle_wear_eur: number;
  electricity_eur: number;
  packaging_eur: number;
  waste_buffer_eur: number;
  studio_payback_eur: number;
  labor_base_eur: number;
  color_complexity_eur: number;
  target_margin_percent: number;
  min_price_left_chest_eur: number;
  min_price_center_front_eur: number;
  manual_quote_review_fee_eur: number;
  round_mode: RoundMode;
};

type NumericPricingSettingKey = Exclude<keyof PricingSettings, 'round_mode'>;

type BaseCostBreakdown = Pick<
  PricingSettings,
  | 'blank_shirt_eur'
  | 'backing_eur'
  | 'thread_and_bobbin_base_eur'
  | 'needle_wear_eur'
  | 'electricity_eur'
  | 'packaging_eur'
  | 'waste_buffer_eur'
  | 'studio_payback_eur'
  | 'labor_base_eur'
  | 'color_complexity_eur'
>;

export type CostBreakdown = BaseCostBreakdown & {
  stitch_cost_eur: number;
  manual_quote_review_fee_eur: number;
  target_margin_percent?: number;
};

export type CostBreakdownKey = Exclude<
  keyof CostBreakdown,
  'target_margin_percent'
>;

export const defaultPricingSettings: PricingSettings = {
  stitch_cost_per_1000_eur: 0.05,
  blank_shirt_eur: 2.5,
  backing_eur: 0.15,
  thread_and_bobbin_base_eur: 0.35,
  needle_wear_eur: 0.05,
  electricity_eur: 0.03,
  packaging_eur: 0.3,
  waste_buffer_eur: 0.5,
  studio_payback_eur: 0.75,
  labor_base_eur: 2.5,
  color_complexity_eur: 1.2,
  target_margin_percent: 30,
  min_price_left_chest_eur: 9,
  min_price_center_front_eur: 13,
  manual_quote_review_fee_eur: 0,
  round_mode: 'ceil_to_whole_euro',
};

export const costBreakdownLabels: Array<[CostBreakdownKey, string]> = [
  ['stitch_cost_eur', 'Stitch cost'],
  ['blank_shirt_eur', 'Blank shirt'],
  ['backing_eur', 'Backing'],
  ['thread_and_bobbin_base_eur', 'Thread and bobbin'],
  ['needle_wear_eur', 'Needle wear'],
  ['electricity_eur', 'Electricity'],
  ['packaging_eur', 'Packaging'],
  ['waste_buffer_eur', 'Waste buffer'],
  ['studio_payback_eur', 'Studio payback'],
  ['labor_base_eur', 'Labor'],
  ['color_complexity_eur', 'Color complexity'],
  ['manual_quote_review_fee_eur', 'Manual quote review fee'],
];

const costKeys = costBreakdownLabels.map(([key]) => key);

function parseFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function getStitchCost(stitches: number, settings: PricingSettings) {
  return roundCurrency(
    (Math.max(0, stitches) / 1000) *
      settings.stitch_cost_per_1000_eur
  );
}

function normalizeTargetMarginPercent(
  value: unknown,
  fallback: number = defaultPricingSettings.target_margin_percent
) {
  const parsed = parseFiniteNumber(value);

  return parsed !== null && parsed > 0 && parsed < 90
    ? roundCurrency(parsed)
    : fallback;
}

function getLegacyCostValue(
  value: Record<string, unknown>,
  key: CostBreakdownKey
) {
  const legacyKeys: Partial<Record<CostBreakdownKey, string>> = {
    blank_shirt_eur: 'blank_tshirt_eur',
    thread_and_bobbin_base_eur: 'thread_and_bobbin_eur',
    studio_payback_eur: 'machine_payback_eur',
    labor_base_eur: 'labor_eur',
    color_complexity_eur: 'color_complexity_fee_eur',
  };
  const legacyKey = legacyKeys[key];

  return legacyKey ? parseFiniteNumber(value[legacyKey]) : null;
}

export function getDefaultCostBreakdown(
  settings: PricingSettings = defaultPricingSettings,
  input: { stitches?: number; manualQuote?: boolean } = {}
): CostBreakdown {
  return {
    stitch_cost_eur: getStitchCost(input.stitches ?? 0, settings),
    blank_shirt_eur: settings.blank_shirt_eur,
    backing_eur: settings.backing_eur,
    thread_and_bobbin_base_eur: settings.thread_and_bobbin_base_eur,
    needle_wear_eur: settings.needle_wear_eur,
    electricity_eur: settings.electricity_eur,
    packaging_eur: settings.packaging_eur,
    waste_buffer_eur: settings.waste_buffer_eur,
    studio_payback_eur: settings.studio_payback_eur,
    labor_base_eur: settings.labor_base_eur,
    color_complexity_eur: settings.color_complexity_eur,
    manual_quote_review_fee_eur: input.manualQuote
      ? settings.manual_quote_review_fee_eur
      : 0,
    target_margin_percent: settings.target_margin_percent,
  };
}

export function normalizeCostBreakdown(
  value: unknown,
  settings: PricingSettings = defaultPricingSettings,
  input: { stitches?: number; manualQuote?: boolean } = {}
): CostBreakdown {
  const fallback = getDefaultCostBreakdown(settings, input);

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }

  const source = value as Record<string, unknown>;
  const hasAnyKnownCost = costKeys.some(
    (key) =>
      parseFiniteNumber(source[key]) !== null ||
      getLegacyCostValue(source, key) !== null
  );

  if (!hasAnyKnownCost) {
    return fallback;
  }

  const knownValues = costKeys
    .map(
      (key) =>
        parseFiniteNumber(source[key]) ?? getLegacyCostValue(source, key)
    )
    .filter((amount): amount is number => amount !== null);

  if (
    knownValues.length > 0 &&
    knownValues.every((amount) => amount === 0)
  ) {
    return fallback;
  }

  const normalized = costKeys.reduce((next, key) => {
    const direct = parseFiniteNumber(source[key]);
    const legacy = getLegacyCostValue(source, key);

    return {
      ...next,
      [key]: roundCurrency(Math.max(0, direct ?? legacy ?? fallback[key])),
    };
  }, {} as CostBreakdown);

  normalized.target_margin_percent = normalizeTargetMarginPercent(
    source.target_margin_percent,
    fallback.target_margin_percent
  );

  return normalized;
}

export function normalizePricingSettings(value: unknown): PricingSettings {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const parseSetting = (key: NumericPricingSettingKey) => {
    const parsed = parseFiniteNumber(source[key]);
    const fallback = defaultPricingSettings[key];

    return roundCurrency(Math.max(0, parsed ?? fallback));
  };

  const targetMargin = normalizeTargetMarginPercent(
    source.target_margin_percent
  );

  return {
    blank_shirt_eur: parseSetting('blank_shirt_eur'),
    stitch_cost_per_1000_eur: parseSetting(
      'stitch_cost_per_1000_eur'
    ),
    backing_eur: parseSetting('backing_eur'),
    thread_and_bobbin_base_eur: parseSetting(
      'thread_and_bobbin_base_eur'
    ),
    needle_wear_eur: parseSetting('needle_wear_eur'),
    electricity_eur: parseSetting('electricity_eur'),
    packaging_eur: parseSetting('packaging_eur'),
    waste_buffer_eur: parseSetting('waste_buffer_eur'),
    studio_payback_eur: parseSetting('studio_payback_eur'),
    labor_base_eur: parseSetting('labor_base_eur'),
    color_complexity_eur: parseSetting('color_complexity_eur'),
    target_margin_percent: targetMargin,
    min_price_left_chest_eur: parseSetting('min_price_left_chest_eur'),
    min_price_center_front_eur: parseSetting(
      'min_price_center_front_eur'
    ),
    manual_quote_review_fee_eur: parseSetting(
      'manual_quote_review_fee_eur'
    ),
    round_mode: 'ceil_to_whole_euro',
  };
}

function getPlacementPricingGroup(value: string) {
  const normalized = value.toLowerCase().replace(/[\s-]+/g, '_');

  if (
    normalized === 'left' ||
    normalized.includes('left_chest') ||
    normalized.includes('right_chest') ||
    normalized.includes('sleeve')
  ) {
    return 'small';
  }

  if (
    normalized.includes('center_chest') ||
    normalized.includes('upper_back') ||
    normalized.includes('shoulder')
  ) {
    return 'medium';
  }

  if (
    normalized === 'center' ||
    normalized.includes('center_front') ||
    normalized.includes('center_back') ||
    normalized.includes('lower_back')
  ) {
    return 'large';
  }

  if (
    normalized.includes('lower_front') ||
    normalized.includes('front_left_bottom') ||
    normalized.includes('front_right_bottom') ||
    normalized.includes('back_left_bottom') ||
    normalized.includes('back_right_bottom')
  ) {
    return 'medium';
  }

  return 'unknown';
}

export function normalizePlacement(value: string) {
  return getPlacementPricingGroup(value) === 'small' ? 'left' : 'center';
}

export function getCostBreakdownTotal(costBreakdown: CostBreakdown) {
  return roundCurrency(
    costKeys.reduce((sum, key) => sum + costBreakdown[key], 0)
  );
}

export function getInternalCost(costBreakdown: CostBreakdown) {
  return getCostBreakdownTotal(costBreakdown);
}

export function roundCustomerPrice(value: number, mode: RoundMode) {
  if (mode === 'ceil_to_whole_euro') {
    return Math.ceil(value);
  }

  return Math.ceil(value);
}

export function isManualQuoteRequired(input: {
  stitches: number;
  colors: number;
  placement: string;
}) {
  const placement = normalizePlacement(input.placement);
  const placementGroup = getPlacementPricingGroup(input.placement);

  return (
    placementGroup === 'unknown' ||
    input.colors > 15 ||
    input.stitches >= 90000 ||
    (placement === 'left' && input.stitches > 25000) ||
    (placement === 'center' && input.stitches > 50000)
  );
}

export function calculatePricing(input: {
  stitches: number;
  colors: number;
  placement: string;
  settings: PricingSettings;
  costBreakdown?: CostBreakdown;
  revisedPrice?: number | null;
}) {
  const placementGroup = getPlacementPricingGroup(input.placement);
  const manualQuote = isManualQuoteRequired(input);
  const costBreakdown =
    input.costBreakdown ??
    getDefaultCostBreakdown(input.settings, {
      stitches: input.stitches,
      manualQuote,
    });
  const internalCost = getInternalCost(costBreakdown);
  const targetMarginPercent =
    costBreakdown.target_margin_percent ??
    input.settings.target_margin_percent;
  const marginRate = targetMarginPercent / 100;
  const rawCustomerPrice =
    marginRate >= 1 ? internalCost : internalCost / (1 - marginRate);
  const suggestedPrice = roundCustomerPrice(
    rawCustomerPrice,
    input.settings.round_mode
  );
  const effectivePrice = input.revisedPrice ?? suggestedPrice;
  const estimatedProfit =
    effectivePrice === null
      ? null
      : roundCurrency(effectivePrice - internalCost);
  const profitMarginPercent =
    effectivePrice && estimatedProfit !== null
      ? roundCurrency((estimatedProfit / effectivePrice) * 100)
      : null;

  return {
    cost_breakdown: costBreakdown,
    stitch_cost_eur: costBreakdown.stitch_cost_eur,
    manual_quote_review_fee_eur:
      costBreakdown.manual_quote_review_fee_eur,
    internal_cost_eur: internalCost,
    raw_customer_price_eur: roundCurrency(rawCustomerPrice),
    suggested_customer_price_eur: roundCurrency(suggestedPrice),
    customer_price_eur:
      manualQuote ? null : roundCurrency(suggestedPrice),
    estimated_profit_eur: estimatedProfit,
    profit_margin_percent: profitMarginPercent,
    manual_quote: manualQuote,
    pricing_tier: manualQuote
      ? 'Manual quote'
      : `${placementGroup === 'small' ? 'Small placement' : placementGroup === 'medium' ? 'Medium placement' : 'Large placement'} calculated`,
  };
}
