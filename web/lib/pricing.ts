export type RoundMode = 'ceil_to_whole_euro';

export type PricingSettings = {
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
  round_mode: RoundMode;
};

type NumericPricingSettingKey = Exclude<keyof PricingSettings, 'round_mode'>;

export type CostBreakdown = Pick<
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

export type CostBreakdownKey = keyof CostBreakdown;

export const defaultPricingSettings: PricingSettings = {
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
  round_mode: 'ceil_to_whole_euro',
};

export const costBreakdownLabels: Array<[CostBreakdownKey, string]> = [
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
  settings: PricingSettings = defaultPricingSettings
): CostBreakdown {
  return {
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
  };
}

export function normalizeCostBreakdown(
  value: unknown,
  settings: PricingSettings = defaultPricingSettings
): CostBreakdown {
  const fallback = getDefaultCostBreakdown(settings);

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

  return costKeys.reduce((next, key) => {
    const direct = parseFiniteNumber(source[key]);
    const legacy = getLegacyCostValue(source, key);

    return {
      ...next,
      [key]: roundCurrency(direct ?? legacy ?? fallback[key]),
    };
  }, {} as CostBreakdown);
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

  const targetMargin = parseFiniteNumber(source.target_margin_percent);

  return {
    blank_shirt_eur: parseSetting('blank_shirt_eur'),
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
    target_margin_percent:
      targetMargin !== null && targetMargin > 0 && targetMargin < 100
        ? roundCurrency(targetMargin)
        : defaultPricingSettings.target_margin_percent,
    min_price_left_chest_eur: parseSetting('min_price_left_chest_eur'),
    min_price_center_front_eur: parseSetting(
      'min_price_center_front_eur'
    ),
    round_mode: 'ceil_to_whole_euro',
  };
}

export function normalizePlacement(value: string) {
  return value.toLowerCase().includes('center') ? 'center' : 'left';
}

export function getInternalCost(costBreakdown: CostBreakdown) {
  return roundCurrency(
    costKeys.reduce((sum, key) => sum + costBreakdown[key], 0)
  );
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

  return (
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
  const placement = normalizePlacement(input.placement);
  const costBreakdown =
    input.costBreakdown ?? getDefaultCostBreakdown(input.settings);
  const internalCost = getInternalCost(costBreakdown);
  const manualQuote = isManualQuoteRequired(input);
  const marginRate = input.settings.target_margin_percent / 100;
  const rawCustomerPrice =
    marginRate >= 1 ? internalCost : internalCost / (1 - marginRate);
  const suggestedPrice = manualQuote
    ? null
    : roundCustomerPrice(rawCustomerPrice, input.settings.round_mode);
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
    internal_cost_eur: internalCost,
    raw_customer_price_eur: manualQuote
      ? null
      : roundCurrency(rawCustomerPrice),
    customer_price_eur:
      suggestedPrice === null ? null : roundCurrency(suggestedPrice),
    estimated_profit_eur: estimatedProfit,
    profit_margin_percent: profitMarginPercent,
    manual_quote: manualQuote,
    pricing_tier: manualQuote
      ? 'Manual quote'
      : `${placement === 'center' ? 'Center front' : 'Left chest'} calculated`,
  };
}
