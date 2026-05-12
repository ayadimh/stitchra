'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  calculatePricing,
  costBreakdownLabels,
  defaultPricingSettings,
  getDefaultCostBreakdown,
  normalizePricingSettings,
  type CostBreakdown,
  type CostBreakdownKey,
  type PricingSettings,
} from '@/lib/pricing';

const API =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://stitchra-production.up.railway.app';

type Placement = 'left' | 'center';
type ShirtColor = 'black' | 'white';

type PublicQuote = {
  stitches: number;
  colors: number;
  coverage: number;
  price_eur: number | null;
  manual_quote: boolean;
  pricing_tier: string;
  customer_warnings: string[];
  customer_recommendations: string[];
};

type InternalQuote = {
  internal_cost_eur: number;
  estimated_profit_eur: number | null;
  profit_margin_percent: number | null;
  cost_breakdown: CostBreakdown;
  technical_warnings: string[];
  production_notes: string[];
};

type EstimateResponse = {
  stitches: number;
  colors: number;
  coverage: number;
  price_eur: number | null;
  manual_quote: boolean;
  pricing_tier: string;
  warnings: string[];
  recommendations: string[];
  internal_cost_eur: number;
  estimated_profit_eur: number | null;
  cost_breakdown: CostBreakdown;
  public_quote?: PublicQuote;
  internal_quote?: InternalQuote;
};

type OrderStatus =
  | 'new'
  | 'needs_review'
  | 'approved'
  | 'offer_sent'
  | 'customer_accepted'
  | 'pre_production'
  | 'sent_to_production'
  | 'customer_declined'
  | 'team_declined'
  | 'completed';

type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

type OrderRecord = {
  id: string;
  created_at: string;
  public_token: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  quantity: number | null;
  note: string | null;
  prompt: string | null;
  placement: string;
  shirt_color: string;
  logo_preview_url: string | null;
  stitches: number;
  colors: number;
  coverage: number;
  customer_price_eur: number | null;
  revised_price_eur: number | null;
  internal_cost_eur: number | null;
  estimated_profit_eur: number | null;
  profit_margin_percent: number | null;
  pricing_tier: string;
  manual_quote: boolean;
  warnings: string[];
  recommendations: string[];
  production_notes: string[];
  team_message: string | null;
  cost_breakdown: CostBreakdown;
  status: OrderStatus;
  customer_decision: 'pending' | 'accepted' | 'declined';
  customer_decision_at: string | null;
  customer_viewed_at: string | null;
  offer_sent_at: string | null;
  team_notified_at: string | null;
  team_notification_error: string | null;
  payment_status: PaymentStatus;
  payment_requested_at: string | null;
  payment_completed_at: string | null;
  payment_provider: string | null;
  payment_session_id: string | null;
  completed_at: string | null;
  archived_at: string | null;
  archive_reason: string | null;
};

type PipelineStage =
  | 'new'
  | 'waiting_customer'
  | 'pre_production'
  | 'production'
  | 'archive';

type ArchiveFilter =
  | 'all'
  | 'completed'
  | 'customer_declined'
  | 'team_declined';

type OrderDetailSection =
  | 'overview'
  | 'pricing'
  | 'workflow'
  | 'notes';

type OrderEditForm = {
  revised_price_eur: string;
  target_margin_percent: string;
  quantity: string;
  production_notes: string;
  team_message: string;
  cost_breakdown: CostBreakdownForm;
};

type LogoAnalysis = {
  processed_png: string;
  colors_count: number;
  contrast_score: number;
  warnings: string[];
  recommendations: string[];
};

type CostBreakdownForm = Record<CostBreakdownKey, string>;
type PricingSettingKey = Exclude<keyof PricingSettings, 'round_mode'>;
type PricingSettingsForm = Record<PricingSettingKey, string>;
type OrderEditTextField = Exclude<
  keyof OrderEditForm,
  'cost_breakdown'
>;
type StudioToast = {
  id: number;
  tone: 'success' | 'error';
  message: string;
};

const placementSize = {
  left: { width: 90, height: 60, label: 'Left chest' },
  center: { width: 250, height: 200, label: 'Center front' },
} as const;

const costBreakdownKeys: CostBreakdownKey[] =
  costBreakdownLabels.map(([key]) => key);

const calculatorCostNotes: Record<CostBreakdownKey, string> = {
  stitch_cost_eur: 'Stitch estimate for this artwork',
  blank_shirt_eur: 'Garment base cost',
  backing_eur: 'Stabilizer material',
  thread_and_bobbin_base_eur: 'Thread and bobbin use',
  needle_wear_eur: 'Needle wear allowance',
  electricity_eur: 'Machine electricity',
  packaging_eur: 'Customer-ready packaging',
  waste_buffer_eur: 'Waste and test allowance',
  studio_payback_eur: 'Machine and studio payback',
  labor_base_eur: 'Handling and setup labor',
  color_complexity_eur: 'Color complexity handling',
  manual_quote_review_fee_eur: 'Internal review for complex designs',
};

const pricingSettingLabels: Record<PricingSettingKey, string> = {
  stitch_cost_per_1000_eur: 'Stitch cost per 1,000',
  blank_shirt_eur: 'Blank shirt cost',
  backing_eur: 'Backing',
  thread_and_bobbin_base_eur: 'Thread and bobbin',
  needle_wear_eur: 'Needle wear',
  electricity_eur: 'Electricity',
  packaging_eur: 'Packaging',
  waste_buffer_eur: 'Waste buffer',
  studio_payback_eur: 'Studio payback',
  labor_base_eur: 'Labor',
  color_complexity_eur: 'Color complexity',
  target_margin_percent: 'Target margin percent',
  min_price_left_chest_eur: 'Minimum left chest price',
  min_price_center_front_eur: 'Minimum center front price',
  manual_quote_review_fee_eur: 'Manual quote review fee',
};

const pricingSettingGroups: Array<{
  title: string;
  text: string;
  fields: PricingSettingKey[];
}> = [
  {
    title: 'Garment',
    text: 'Base shirt and customer-ready packout costs.',
    fields: ['blank_shirt_eur', 'packaging_eur'],
  },
  {
    title: 'Embroidery materials',
    text: 'Consumables used directly by the embroidery process.',
    fields: [
      'stitch_cost_per_1000_eur',
      'backing_eur',
      'thread_and_bobbin_base_eur',
      'needle_wear_eur',
      'electricity_eur',
    ],
  },
  {
    title: 'Handling & labor',
    text: 'Studio time, operating payback, complexity and buffer.',
    fields: [
      'labor_base_eur',
      'color_complexity_eur',
      'waste_buffer_eur',
      'studio_payback_eur',
      'manual_quote_review_fee_eur',
    ],
  },
  {
    title: 'Business margin',
    text: 'Margin target used to calculate the suggested customer price.',
    fields: [
      'target_margin_percent',
      'min_price_left_chest_eur',
      'min_price_center_front_eur',
    ],
  },
];

const pipelineTabs: Array<{
  value: PipelineStage;
  label: string;
}> = [
  { value: 'new', label: 'New' },
  { value: 'waiting_customer', label: 'Waiting customer' },
  { value: 'pre_production', label: 'Pre-production' },
  { value: 'production', label: 'Production' },
  { value: 'archive', label: 'Archive' },
];

const archiveFilters: Array<{
  value: ArchiveFilter;
  label: string;
}> = [
  { value: 'all', label: 'All archived' },
  { value: 'completed', label: 'Completed' },
  { value: 'customer_declined', label: 'Customer declined' },
  { value: 'team_declined', label: 'Team declined' },
];

const orderDetailSections: Array<{
  value: OrderDetailSection;
  label: string;
}> = [
  { value: 'overview', label: 'Overview' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'notes', label: 'Notes' },
];

const statusLabels: Record<OrderStatus, string> = {
  new: 'New request',
  needs_review: 'Needs review',
  approved: 'Approved',
  offer_sent: 'Offer sent',
  customer_accepted: 'Customer accepted',
  pre_production: 'Pre-production',
  sent_to_production: 'In production',
  customer_declined: 'Customer declined',
  team_declined: 'Team declined',
  completed: 'Completed',
};

const customerDecisionLabels: Record<
  OrderRecord['customer_decision'],
  string
> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

const statusToastLabels: Record<OrderStatus, string> = {
  new: 'Order updated',
  needs_review: 'Order updated',
  approved: 'Order approved',
  offer_sent: 'Offer sent',
  customer_accepted: 'Customer accepted',
  pre_production: 'Moved to pre-production',
  sent_to_production: 'Sent to production',
  customer_declined: 'Customer declined',
  team_declined: 'Order declined',
  completed: 'Marked completed',
};

const publicSiteUrl = 'https://stitchra.com';

function formatMoney(value: number | null) {
  return value === null ? 'Pending' : `€${value.toFixed(2)}`;
}

function formatOrderValue(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPlacement(value: string) {
  if (value === 'left') {
    return 'Left chest';
  }

  if (value === 'center') {
    return 'Center front';
  }

  return formatOrderValue(value);
}

function getEffectiveCustomerPrice(
  order: OrderRecord,
  settings: PricingSettings = defaultPricingSettings
) {
  return getEditableFinalPrice(order, settings);
}

function getCustomerOrderLink(publicToken: string) {
  return `${publicSiteUrl}/order/${publicToken}`;
}

function getPaymentLink(publicToken: string) {
  return `${publicSiteUrl}/pay/${publicToken}`;
}

function getDeclinedStatus(order: OrderRecord) {
  if (order.status === 'customer_declined') {
    return 'customer_declined';
  }

  if (order.status === 'team_declined') {
    return 'team_declined';
  }

  if (order.customer_decision === 'declined') {
    return 'customer_declined';
  }

  return null;
}

function getOrderPipelineStage(order: OrderRecord): PipelineStage {
  if (
    order.status === 'completed' ||
    getDeclinedStatus(order) !== null
  ) {
    return 'archive';
  }

  if (order.status === 'sent_to_production') {
    return 'production';
  }

  if (
    order.status === 'customer_accepted' ||
    order.status === 'pre_production' ||
    order.customer_decision === 'accepted'
  ) {
    return 'pre_production';
  }

  if (
    order.status === 'offer_sent' ||
    (order.offer_sent_at && order.customer_decision === 'pending')
  ) {
    return 'waiting_customer';
  }

  return 'new';
}

function getPipelineStageLabel(order: OrderRecord) {
  const stage = getOrderPipelineStage(order);

  if (stage === 'waiting_customer') {
    return 'Waiting customer';
  }

  if (stage === 'pre_production') {
    return 'Pre-production';
  }

  if (stage === 'production') {
    return 'Production';
  }

  if (stage === 'archive') {
    const declinedStatus = getDeclinedStatus(order);

    if (order.status === 'completed') {
      return 'Archive / Completed';
    }

    if (declinedStatus === 'customer_declined') {
      return 'Archive / Customer declined';
    }

    return 'Archive / Team declined';
  }

  return 'New';
}

function getOrderBadgeLabel(order: OrderRecord) {
  const declinedStatus = getDeclinedStatus(order);

  if (declinedStatus) {
    return statusLabels[declinedStatus];
  }

  if (order.status === 'completed') {
    return 'Completed';
  }

  if (order.status === 'sent_to_production') {
    return 'In production';
  }

  if (order.status === 'pre_production') {
    return 'Pre-production';
  }

  if (
    order.status === 'customer_accepted' ||
    order.customer_decision === 'accepted'
  ) {
    return 'Customer accepted';
  }

  if (order.status === 'offer_sent' || order.offer_sent_at) {
    return 'Offer sent';
  }

  if (order.status === 'needs_review') {
    return 'Needs review';
  }

  if (order.status === 'approved') {
    return 'Approved';
  }

  return 'New request';
}

function getPipelineOrders(
  orders: OrderRecord[],
  stage: PipelineStage,
  archiveFilter: ArchiveFilter
) {
  return orders.filter((order) => {
    if (getOrderPipelineStage(order) !== stage) {
      return false;
    }

    if (stage !== 'archive' || archiveFilter === 'all') {
      return true;
    }

    if (archiveFilter === 'completed') {
      return order.status === 'completed';
    }

    return getDeclinedStatus(order) === archiveFilter;
  });
}

function getOrderForPipeline(
  orders: OrderRecord[],
  stage: PipelineStage,
  archiveFilter: ArchiveFilter,
  preferredId?: string | null
) {
  const visibleOrders = getPipelineOrders(
    orders,
    stage,
    archiveFilter
  );

  return (
    visibleOrders.find((order) => order.id === preferredId) ??
    visibleOrders[0] ??
    null
  );
}

function getCostBreakdownForm(
  costBreakdown: CostBreakdown
): CostBreakdownForm {
  return costBreakdownKeys.reduce((form, key) => {
    form[key] = String(costBreakdown[key]);
    return form;
  }, {} as CostBreakdownForm);
}

function getPricingSettingsForm(
  settings: PricingSettings
): PricingSettingsForm {
  return Object.keys(pricingSettingLabels).reduce((form, key) => {
    const settingKey = key as PricingSettingKey;

    form[settingKey] = String(settings[settingKey]);
    return form;
  }, {} as PricingSettingsForm);
}

function getOrderPricing(
  order: OrderRecord,
  settings: PricingSettings,
  revisedPrice: number | null = order.revised_price_eur
) {
  return calculatePricing({
    stitches: order.stitches,
    colors: order.colors,
    placement: order.placement,
    settings,
    costBreakdown: order.cost_breakdown,
    revisedPrice,
  });
}

function getEditableFinalPrice(
  order: OrderRecord,
  settings: PricingSettings
) {
  return (
    order.revised_price_eur ??
    order.customer_price_eur ??
    (order.manual_quote
      ? null
      : getOrderPricing(order, settings).customer_price_eur)
  );
}

function getPricingPreview(form: PricingSettingsForm) {
  const settings = parsePricingSettingsForm(form);

  if (!settings) {
    return null;
  }

  return calculatePricing({
    stitches: 1,
    colors: 1,
    placement: 'left',
    settings,
  });
}

function getSuggestedCustomerPriceLabel(value: number | null) {
  return value === null ? 'Manual quote' : formatCustomerMoney(value);
}

function formatCustomerMoney(value: number | null) {
  if (value === null) {
    return 'Pending';
  }

  return Number.isInteger(value)
    ? `€${value}`
    : `€${value.toFixed(2)}`;
}

function formatMargin(value: number | null | undefined) {
  return value === null || value === undefined ? 'Pending' : `${value}%`;
}

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : 'Not set';
}

function formatCoverage(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function getPricingSettingSuffix(key: PricingSettingKey) {
  return key === 'target_margin_percent' ? '%' : '€';
}

function getPricingSettingStep(key: PricingSettingKey) {
  return key === 'target_margin_percent' ? '1' : '0.01';
}

function getPricingSettingInputMode(key: PricingSettingKey) {
  return key === 'target_margin_percent' ? 'numeric' : 'decimal';
}

const emptyOrderEditForm: OrderEditForm = {
  revised_price_eur: '',
  target_margin_percent: String(
    defaultPricingSettings.target_margin_percent
  ),
  quantity: '1',
  production_notes: '',
  team_message: '',
  cost_breakdown: getCostBreakdownForm(
    calculatePricing({
      stitches: 1,
      colors: 1,
      placement: 'left',
      settings: defaultPricingSettings,
    }).cost_breakdown
  ),
};

function getOrderEditForm(
  order: OrderRecord | null,
  settings: PricingSettings = defaultPricingSettings
): OrderEditForm {
  if (!order) {
    return {
      ...emptyOrderEditForm,
      target_margin_percent: String(settings.target_margin_percent),
      cost_breakdown: getCostBreakdownForm(
        calculatePricing({
          stitches: 1,
          colors: 1,
          placement: 'left',
          settings,
        }).cost_breakdown
      ),
    };
  }

  const finalPrice = getEditableFinalPrice(order, settings);

  return {
    revised_price_eur:
      finalPrice === null ? '' : String(finalPrice),
    target_margin_percent: String(
      order.cost_breakdown.target_margin_percent ??
        settings.target_margin_percent
    ),
    quantity: String(order.quantity ?? 1),
    production_notes: order.production_notes.join('\n'),
    team_message: order.team_message ?? '',
    cost_breakdown: getCostBreakdownForm(order.cost_breakdown),
  };
}

function parseEditableMoney(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseProductionNotes(value: string) {
  return value
    .split('\n')
    .map((note) => note.trim())
    .filter(Boolean);
}

function parseTargetMargin(value: string) {
  const parsed = Number(value.trim());

  return Number.isFinite(parsed) && parsed > 0 && parsed < 90
    ? Number(parsed.toFixed(2))
    : null;
}

function parseCostBreakdownForm(
  form: CostBreakdownForm,
  targetMarginPercent: number
) {
  const parsed = {} as CostBreakdown;

  for (const key of costBreakdownKeys) {
    const raw = form[key]?.trim() ?? '';
    const value = Number(raw);

    if (!raw || !Number.isFinite(value) || value < 0) {
      return null;
    }

    parsed[key] = Number(value.toFixed(2));
  }

  parsed.target_margin_percent = targetMarginPercent;

  return parsed;
}

function parsePricingSettingsForm(form: PricingSettingsForm) {
  const parsed: Partial<Record<PricingSettingKey, number>> = {};

  for (const key of Object.keys(pricingSettingLabels)) {
    const settingKey = key as PricingSettingKey;
    const raw = form[settingKey]?.trim() ?? '';
    const value = Number(raw);

    if (!raw || !Number.isFinite(value) || value < 0) {
      return null;
    }

    parsed[settingKey] = value;
  }

  const targetMargin = parsed.target_margin_percent;

  if (
    targetMargin === undefined ||
    targetMargin <= 0 ||
    targetMargin >= 90
  ) {
    return null;
  }

  return normalizePricingSettings({
    ...parsed,
    round_mode: 'ceil_to_whole_euro',
  });
}

function applyPricingToEstimate(
  estimate: EstimateResponse,
  settings: PricingSettings,
  placement: Placement
): EstimateResponse {
  const pricing = calculatePricing({
    stitches: estimate.stitches,
    colors: estimate.colors,
    placement,
    settings,
  });
  const publicQuote = getPublicQuote(estimate);
  const internalQuote = estimate.internal_quote;

  return {
    ...estimate,
    price_eur: pricing.customer_price_eur,
    internal_cost_eur: pricing.internal_cost_eur,
    estimated_profit_eur: pricing.estimated_profit_eur,
    manual_quote: pricing.manual_quote,
    pricing_tier: pricing.pricing_tier,
    cost_breakdown: pricing.cost_breakdown,
    public_quote: {
      ...publicQuote,
      price_eur: pricing.customer_price_eur,
      manual_quote: pricing.manual_quote,
      pricing_tier: pricing.pricing_tier,
    },
    internal_quote: {
      internal_cost_eur: pricing.internal_cost_eur,
      estimated_profit_eur: pricing.estimated_profit_eur,
      profit_margin_percent: pricing.profit_margin_percent,
      cost_breakdown: pricing.cost_breakdown,
      technical_warnings:
        internalQuote?.technical_warnings ?? estimate.warnings,
      production_notes: internalQuote?.production_notes ?? [],
    },
  };
}

async function dataUrlToFile(dataUrl: string, name: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], name, {
    type: 'image/png',
  });
}

function getPublicQuote(estimate: EstimateResponse): PublicQuote {
  return (
    estimate.public_quote ?? {
      stitches: estimate.stitches,
      colors: estimate.colors,
      coverage: estimate.coverage,
      price_eur: estimate.price_eur,
      manual_quote: estimate.manual_quote,
      pricing_tier: estimate.pricing_tier,
      customer_warnings: estimate.warnings,
      customer_recommendations: estimate.recommendations,
    }
  );
}

function getInternalQuote(estimate: EstimateResponse): InternalQuote {
  return (
    estimate.internal_quote ?? {
      internal_cost_eur: estimate.internal_cost_eur,
      estimated_profit_eur: estimate.estimated_profit_eur,
      profit_margin_percent:
        estimate.price_eur && estimate.estimated_profit_eur
          ? Number(
              (
                (estimate.estimated_profit_eur / estimate.price_eur) *
                100
              ).toFixed(1)
            )
          : null,
      cost_breakdown: estimate.cost_breakdown,
      technical_warnings: estimate.warnings,
      production_notes: [],
    }
  );
}

export default function StudioPage() {
  const expectedPasscode =
    process.env.NEXT_PUBLIC_STUDIO_PASSCODE ??
    (process.env.NODE_ENV === 'development'
      ? 'stitchra-dev'
      : '');

  const [passcode, setPasscode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [gateError, setGateError] = useState('');
  const [activeView, setActiveView] = useState<
    'quote' | 'orders' | 'pricing'
  >('quote');

  const [placement, setPlacement] = useState<Placement>('left');
  const [shirtColor, setShirtColor] = useState<ShirtColor>('black');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LogoAnalysis | null>(null);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(
    null
  );
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] =
    useState<OrderRecord | null>(null);
  const [orderPipelineStage, setOrderPipelineStage] =
    useState<PipelineStage>('new');
  const [archiveFilter, setArchiveFilter] =
    useState<ArchiveFilter>('all');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [orderEditForm, setOrderEditForm] =
    useState<OrderEditForm>(emptyOrderEditForm);
  const [orderEditError, setOrderEditError] = useState('');
  const [orderEditStatus, setOrderEditStatus] = useState('');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [statusActionLoading, setStatusActionLoading] =
    useState<OrderStatus | null>(null);
  const [customerLinkStatus, setCustomerLinkStatus] = useState('');
  const [paymentLinkStatus, setPaymentLinkStatus] = useState('');
  const [emailConfigured, setEmailConfigured] = useState<
    boolean | null
  >(null);
  const [sendingOfferId, setSendingOfferId] = useState<string | null>(
    null
  );
  const [offerEmailStatus, setOfferEmailStatus] = useState('');
  const [offerEmailError, setOfferEmailError] = useState('');
  const [pricingSettings, setPricingSettings] =
    useState<PricingSettings>(defaultPricingSettings);
  const [pricingForm, setPricingForm] =
    useState<PricingSettingsForm>(
      getPricingSettingsForm(defaultPricingSettings)
    );
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingStatus, setPricingStatus] = useState('');
  const [pricingError, setPricingError] = useState('');
  const [toast, setToast] = useState<StudioToast | null>(null);

  const publicQuote = estimate ? getPublicQuote(estimate) : null;
  const internalQuote = estimate ? getInternalQuote(estimate) : null;

  const productionLabels = useMemo(() => {
    const labels = new Set(
      internalQuote?.production_notes ?? []
    );

    if (analysis && analysis.contrast_score < 42) {
      labels.add('Low contrast');
    }

    return Array.from(labels);
  }, [analysis, internalQuote]);

  const triggerSuccessFeedback = () => {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate(20);
    }
  };

  const showToast = (
    message: string,
    tone: StudioToast['tone'] = 'success',
    vibrate = tone === 'success'
  ) => {
    const id = Date.now();
    setToast({ id, message, tone });

    if (vibrate) {
      triggerSuccessFeedback();
    }

    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  };

  const selectOrder = (order: OrderRecord | null) => {
    setSelectedOrder(order);
    setOrderEditForm(getOrderEditForm(order, pricingSettings));
    setOrderEditError('');
    setOrderEditStatus('');
    setCustomerLinkStatus('');
    setPaymentLinkStatus('');
    setOfferEmailStatus('');
    setOfferEmailError('');
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');

    try {
      const response = await fetch('/api/orders', {
        headers: {
          'x-studio-passcode': passcode,
        },
      });
      const payload = (await response
        .json()
        .catch(() => ({}))) as {
        orders?: OrderRecord[];
        emailConfigured?: boolean;
        message?: string;
        details?: string;
      };

      if (!response.ok) {
        setOrders([]);
        setSelectedOrder(null);
        setOrdersError(
          payload.details ??
            payload.message ??
            'Database not configured.'
        );
        return;
      }

      setEmailConfigured(Boolean(payload.emailConfigured));

      const nextOrders = payload.orders ?? [];
      const nextSelected = getOrderForPipeline(
        nextOrders,
        orderPipelineStage,
        archiveFilter,
        selectedOrder?.id
      );

      setOrders(nextOrders);
      selectOrder(nextSelected);
    } catch (error) {
      setOrdersError('Could not load orders.');
      console.error(error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPricingSettings = async () => {
    setPricingLoading(true);
    setPricingError('');

    try {
      const response = await fetch('/api/pricing-settings', {
        headers: {
          'x-studio-passcode': passcode,
        },
      });
      const payload = (await response
        .json()
        .catch(() => ({}))) as {
        settings?: PricingSettings;
        databaseConfigured?: boolean;
        message?: string;
        details?: string;
      };

      if (!response.ok || !payload.settings) {
        setPricingError(
          payload.details ??
            payload.message ??
            'Could not load pricing settings.'
        );
        return;
      }

      const settings = normalizePricingSettings(payload.settings);
      setPricingSettings(settings);
      setPricingForm(getPricingSettingsForm(settings));

      if (payload.databaseConfigured === false) {
        setPricingError(
          'Database not configured. Pricing settings are using defaults.'
        );
      }
    } catch (error) {
      setPricingError('Could not load pricing settings.');
      console.error(error);
    } finally {
      setPricingLoading(false);
    }
  };

  const updateStoredOrder = (updatedOrder: OrderRecord) => {
    setSelectedOrder(updatedOrder);
    setOrders((current) =>
      current.map((item) =>
        item.id === updatedOrder.id ? updatedOrder : item
      )
    );
  };

  const replaceStoredOrderForCurrentPipeline = (
    updatedOrder: OrderRecord
  ) => {
    const nextOrders = orders.map((item) =>
      item.id === updatedOrder.id ? updatedOrder : item
    );
    const nextSelected = getOrderForPipeline(
      nextOrders,
      orderPipelineStage,
      archiveFilter,
      updatedOrder.id
    );

    setOrders(nextOrders);
    selectOrder(nextSelected);
  };

  const changeOrderPipelineStage = (nextStage: PipelineStage) => {
    setOrderPipelineStage(nextStage);
    selectOrder(
      getOrderForPipeline(
        orders,
        nextStage,
        archiveFilter,
        selectedOrder?.id
      )
    );
  };

  const changeArchiveFilter = (nextFilter: ArchiveFilter) => {
    setArchiveFilter(nextFilter);
    selectOrder(
      getOrderForPipeline(
        orders,
        'archive',
        nextFilter,
        selectedOrder?.id
      )
    );
  };

  const changeOrderStatus = async (
    order: OrderRecord,
    nextStatus: OrderStatus
  ) => {
    setOrdersError('');

    if (
      nextStatus === 'team_declined' &&
      !window.confirm('Decline this order?')
    ) {
      return;
    }

    if (
      nextStatus === 'completed' &&
      !window.confirm('Mark this order as completed?')
    ) {
      return;
    }

    setStatusActionLoading(nextStatus);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-studio-passcode': passcode,
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });
      const payload = (await response
        .json()
        .catch(() => ({}))) as {
        order?: OrderRecord;
        message?: string;
        details?: string;
      };

      if (!response.ok || !payload.order) {
        const message =
          payload.details ??
          payload.message ??
          'Could not update order.';
        setOrdersError(message);
        showToast(message, 'error', false);
        return;
      }

      const updatedOrder = payload.order;

      replaceStoredOrderForCurrentPipeline(updatedOrder);
      showToast(statusToastLabels[nextStatus]);
    } catch (error) {
      const message = 'Could not update order.';
      setOrdersError(message);
      showToast(message, 'error', false);
      console.error(error);
    } finally {
      setStatusActionLoading(null);
    }
  };

  const updateOrderEditField = (
    field: OrderEditTextField,
    value: string
  ) => {
    setOrderEditForm((current) => ({
      ...current,
      [field]: value,
    }));
    setOrderEditError('');
    setOrderEditStatus('');
  };

  const updateOrderCostBreakdownField = (
    field: CostBreakdownKey,
    value: string
  ) => {
    setOrderEditForm((current) => ({
      ...current,
      cost_breakdown: {
        ...current.cost_breakdown,
        [field]: value,
      },
    }));
    setOrderEditError('');
    setOrderEditStatus('');
  };

  const resetOrderCalculator = () => {
    if (!selectedOrder) {
      return;
    }

    const defaults = getDefaultCostBreakdown(pricingSettings, {
      stitches: selectedOrder.stitches,
      manualQuote: selectedOrder.manual_quote,
    });

    setOrderEditForm((current) => ({
      ...current,
      target_margin_percent: String(pricingSettings.target_margin_percent),
      cost_breakdown: getCostBreakdownForm(defaults),
    }));
    setOrderEditError('');
    setOrderEditStatus('Default costs loaded. Save to apply them.');
    showToast('Default costs loaded');
  };

  const updatePricingFormField = (
    field: PricingSettingKey,
    value: string
  ) => {
    setPricingForm((current) => ({
      ...current,
      [field]: value,
    }));
    setPricingError('');
    setPricingStatus('');
  };

  const savePricingSettings = async () => {
    setPricingError('');
    setPricingStatus('');

    const parsedSettings = parsePricingSettingsForm(pricingForm);

    if (!parsedSettings) {
      const message =
        'Pricing settings must be non-negative numbers and margin must be greater than 0 and below 90.';
      setPricingError(message);
      showToast(message, 'error', false);
      return;
    }

    setPricingSaving(true);

    try {
      const response = await fetch('/api/pricing-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-studio-passcode': passcode,
        },
        body: JSON.stringify(parsedSettings),
      });
      const payload = (await response
        .json()
        .catch(() => ({}))) as {
        settings?: PricingSettings;
        message?: string;
        details?: string;
      };

      if (!response.ok || !payload.settings) {
        const message =
          payload.details ??
          payload.message ??
          'Could not save pricing settings.';
        setPricingError(message);
        showToast(message, 'error', false);
        return;
      }

      const settings = normalizePricingSettings(payload.settings);
      setPricingSettings(settings);
      setPricingForm(getPricingSettingsForm(settings));
      setPricingStatus('Pricing settings saved.');
      showToast('Saved');
    } catch (error) {
      const message = 'Could not save pricing settings.';
      setPricingError(message);
      showToast(message, 'error', false);
      console.error(error);
    } finally {
      setPricingSaving(false);
    }
  };

  const resetPricingSettings = () => {
    setPricingForm(getPricingSettingsForm(defaultPricingSettings));
    setPricingError('');
    setPricingStatus('Defaults loaded. Save to apply them.');
    showToast('Defaults loaded');
  };

  const saveOrderDetails = async () => {
    if (!selectedOrder) {
      return;
    }

    setOrderEditError('');
    setOrderEditStatus('');

    const revisedPrice = parseEditableMoney(
      orderEditForm.revised_price_eur
    );
    const quantity = Number(orderEditForm.quantity);
    const targetMargin = parseTargetMargin(
      orderEditForm.target_margin_percent
    );
    const costBreakdown = targetMargin
      ? parseCostBreakdownForm(
          orderEditForm.cost_breakdown,
          targetMargin
        )
      : null;

    if (
      revisedPrice === undefined ||
      revisedPrice === null ||
      revisedPrice <= 0
    ) {
      const message = 'Enter a valid customer price.';
      setOrderEditError(message);
      showToast(message, 'error', false);
      return;
    }

    if (targetMargin === null) {
      const message =
        'Target margin must be greater than 0 and below 90.';
      setOrderEditError(message);
      showToast(message, 'error', false);
      return;
    }

    if (!costBreakdown) {
      const message =
        'Cost breakdown values must be non-negative numbers.';
      setOrderEditError(message);
      showToast(message, 'error', false);
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      const message = 'Quantity must be at least 1.';
      setOrderEditError(message);
      showToast(message, 'error', false);
      return;
    }

    setIsSavingOrder(true);

    try {
      const payload: {
        revised_price_eur: number;
        quantity: number;
        production_notes: string[];
        team_message: string | null;
        cost_breakdown: CostBreakdown;
      } = {
        revised_price_eur: revisedPrice,
        quantity,
        production_notes: parseProductionNotes(
          orderEditForm.production_notes
        ),
        team_message: orderEditForm.team_message.trim() || null,
        cost_breakdown: costBreakdown,
      };

      const response = await fetch(
        `/api/orders/${selectedOrder.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-studio-passcode': passcode,
          },
          body: JSON.stringify(payload),
        }
      );
      const result = (await response
        .json()
        .catch(() => ({}))) as {
        order?: OrderRecord;
        message?: string;
        details?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !result.order) {
        const message =
          result.details ??
          Object.values(result.errors ?? {})[0] ??
          result.message ??
          'Could not save order details.';
        setOrderEditError(message);
        showToast(message, 'error', false);
        return;
      }

      const updatedOrder = result.order;

      setOrderEditStatus('Calculator and final price saved.');
      setSelectedOrder(updatedOrder);
      setOrderEditForm(
        getOrderEditForm(updatedOrder, pricingSettings)
      );
      updateStoredOrder(updatedOrder);
      showToast('Calculator saved');
    } catch (error) {
      const message = 'Could not save order details.';
      setOrderEditError(message);
      showToast(message, 'error', false);
      console.error(error);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const copyCustomerLink = async (order: OrderRecord) => {
    if (!order.public_token) {
      setCustomerLinkStatus('No customer link is available yet.');
      return;
    }

    try {
      await navigator.clipboard.writeText(
        getCustomerOrderLink(order.public_token)
      );
      setCustomerLinkStatus('Customer link copied.');
      showToast('Customer link copied');
    } catch {
      const message = 'Could not copy the customer link.';
      setCustomerLinkStatus(message);
      showToast(message, 'error', false);
    }
  };

  const copyPaymentLink = async (order: OrderRecord) => {
    if (!order.public_token) {
      setPaymentLinkStatus('No payment link is available yet.');
      return;
    }

    try {
      await navigator.clipboard.writeText(
        getPaymentLink(order.public_token)
      );
      setPaymentLinkStatus('Payment link copied.');
      showToast('Payment link copied');
    } catch {
      const message = 'Could not copy the payment link.';
      setPaymentLinkStatus(message);
      showToast(message, 'error', false);
    }
  };

  const sendOfferToCustomer = async (order: OrderRecord) => {
    setOfferEmailStatus('');
    setOfferEmailError('');

    if (!emailConfigured) {
      const message =
        'Email not configured. Copy customer link manually.';
      setOfferEmailError(message);
      showToast(message, 'error', false);
      return;
    }

    if (
      order.manual_quote &&
      (order.revised_price_eur === null || order.revised_price_eur <= 0)
    ) {
      const message =
        'Enter a final customer price before sending this manual quote.';
      setOfferEmailError(message);
      showToast(message, 'error', false);
      return;
    }

    setSendingOfferId(order.id);

    try {
      const response = await fetch(
        `/api/orders/${order.id}/send-offer`,
        {
          method: 'POST',
          headers: {
            'x-studio-passcode': passcode,
          },
        }
      );
      const payload = (await response
        .json()
        .catch(() => ({}))) as {
        order?: OrderRecord;
        emailConfigured?: boolean;
        message?: string;
        details?: string;
      };

      if (typeof payload.emailConfigured === 'boolean') {
        setEmailConfigured(payload.emailConfigured);
      }

      if (!response.ok || !payload.order) {
        const message =
          payload.details ??
          payload.message ??
          'Could not send offer email.';
        setOfferEmailError(message);
        showToast(message, 'error', false);
        return;
      }

      replaceStoredOrderForCurrentPipeline(payload.order);
      setOfferEmailStatus('Offer email sent.');
      showToast('Offer sent');
    } catch (error) {
      const message = 'Could not send offer email.';
      setOfferEmailError(message);
      showToast(message, 'error', false);
      console.error(error);
    } finally {
      setSendingOfferId(null);
    }
  };

  const unlock = () => {
    if (!expectedPasscode) {
      setGateError(
        'Studio passcode is not configured for this deployment.'
      );
      return;
    }

    if (passcode === expectedPasscode) {
      setUnlocked(true);
      setGateError('');
      void loadOrders();
      void loadPricingSettings();
      return;
    }

    setGateError('Wrong passcode.');
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;

    setFile(selected);
    setEstimate(null);
    setAnalysis(null);
    setError('');
    setStatus('');
    setPreview(selected ? URL.createObjectURL(selected) : null);
  };

  const runStudioQuote = async () => {
    if (!file) {
      setError('Upload a logo first.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Analyzing artwork...');

    try {
      let quoteFile = file;
      let colors = 3;

      const analysisData = new FormData();
      analysisData.append('file', file);
      analysisData.append('tee_color', shirtColor);

      const analysisResponse = await fetch(`${API}/analyze_logo`, {
        method: 'POST',
        body: analysisData,
      });

      if (analysisResponse.ok) {
        const result =
          (await analysisResponse.json()) as LogoAnalysis;
        setAnalysis(result);
        setPreview(result.processed_png);
        quoteFile = await dataUrlToFile(
          result.processed_png,
          'studio-logo.png'
        );
        colors = Math.max(1, result.colors_count);
      }

      setStatus('Calculating quote...');

      const size = placementSize[placement];
      const estimateData = new FormData();
      estimateData.append('file', quoteFile);
      estimateData.append('width_mm', String(size.width));
      estimateData.append('height_mm', String(size.height));
      estimateData.append('colors', String(colors));

      const estimateResponse = await fetch(`${API}/estimate`, {
        method: 'POST',
        body: estimateData,
      });

      if (!estimateResponse.ok) {
        throw new Error('Estimate failed');
      }

      const quote =
        (await estimateResponse.json()) as EstimateResponse;
      setEstimate(
        applyPricingToEstimate(quote, pricingSettings, placement)
      );
      setStatus('Studio quote ready.');
    } catch {
      setError('Could not calculate this studio quote.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  if (!unlocked) {
    return (
      <main className="studio-page" style={pageShell}>
        <StudioInteractionStyles />
        <section style={gateCard}>
          <div style={brandMark}>S</div>
          <p style={eyebrow}>Private studio</p>
          <h1 style={gateTitle}>Stitchra quote dashboard</h1>
          <p style={mutedText}>
            Internal pricing, production notes and profit visibility
            for the Stitchra team.
          </p>
          <div style={gateForm}>
            <input
              value={passcode}
              onChange={(event) =>
                setPasscode(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  unlock();
                }
              }}
              placeholder="Studio passcode"
              type="password"
              style={inputStyle}
            />
            <button onClick={unlock} style={primaryButton}>
              Enter studio
            </button>
          </div>
          {gateError && <p style={errorText}>{gateError}</p>}
          {process.env.NODE_ENV === 'development' && (
            <p style={tinyText}>
              Local fallback passcode for development:
              {' '}
              <strong>stitchra-dev</strong>
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="studio-page" style={pageShell}>
      <StudioInteractionStyles />
      {toast && (
        <div role="status" style={toastStyle(toast.tone)}>
          {toast.message}
        </div>
      )}
      <header style={studioHeader}>
        <div>
          <p style={eyebrow}>Private studio</p>
          <h1 style={studioTitle}>Quote command center</h1>
        </div>
        <div style={headerActions}>
          <button
            type="button"
            onClick={() => setActiveView('quote')}
            style={
              activeView === 'quote'
                ? primaryButton
                : secondaryButton
            }
          >
            Quote
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('orders');
              void loadOrders();
            }}
            style={
              activeView === 'orders'
                ? primaryButton
                : secondaryButton
            }
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('pricing');
              void loadPricingSettings();
            }}
            style={
              activeView === 'pricing'
                ? primaryButton
                : secondaryButton
            }
          >
            Pricing
          </button>
          <Link href="/" data-button="true" style={secondaryButton}>
            Public website
          </Link>
        </div>
      </header>

      {activeView === 'orders' && (
        <OrdersDashboard
          orders={orders}
          selectedOrder={selectedOrder}
          pipelineStage={orderPipelineStage}
          archiveFilter={archiveFilter}
          loading={ordersLoading}
          error={ordersError}
          orderEditForm={orderEditForm}
          orderEditError={orderEditError}
          orderEditStatus={orderEditStatus}
          savingOrder={isSavingOrder}
          statusActionLoading={statusActionLoading}
          customerLinkStatus={customerLinkStatus}
          paymentLinkStatus={paymentLinkStatus}
          emailConfigured={emailConfigured}
          sendingOfferId={sendingOfferId}
          offerEmailStatus={offerEmailStatus}
          offerEmailError={offerEmailError}
          pricingSettings={pricingSettings}
          onOrderEditChange={updateOrderEditField}
          onOrderCostBreakdownChange={updateOrderCostBreakdownField}
          onSaveOrderDetails={saveOrderDetails}
          onResetOrderCalculator={resetOrderCalculator}
          onCopyCustomerLink={copyCustomerLink}
          onCopyPaymentLink={copyPaymentLink}
          onSendOfferToCustomer={sendOfferToCustomer}
          onPipelineStageChange={changeOrderPipelineStage}
          onArchiveFilterChange={changeArchiveFilter}
          onSelectOrder={selectOrder}
          onRefresh={() => void loadOrders()}
          onChangeStatus={changeOrderStatus}
        />
      )}

      {activeView === 'pricing' && (
        <PricingSettingsPanel
          form={pricingForm}
          loading={pricingLoading}
          saving={pricingSaving}
          status={pricingStatus}
          error={pricingError}
          onChange={updatePricingFormField}
          onSave={savePricingSettings}
          onReset={resetPricingSettings}
          onRefresh={() => void loadPricingSettings()}
        />
      )}

      {activeView === 'quote' && (
        <>
      <section style={workspaceGrid}>
        <div style={panel}>
          <h2 style={panelTitle}>Artwork input</h2>
          <div style={controlGrid}>
            <label style={fieldLabel}>
              Placement
              <select
                value={placement}
                onChange={(event) =>
                  setPlacement(event.target.value as Placement)
                }
                style={inputStyle}
              >
                <option value="left">Left chest</option>
                <option value="center">Center front</option>
              </select>
            </label>
            <label style={fieldLabel}>
              Shirt color
              <select
                value={shirtColor}
                onChange={(event) =>
                  setShirtColor(event.target.value as ShirtColor)
                }
                style={inputStyle}
              >
                <option value="black">Black</option>
                <option value="white">White</option>
              </select>
            </label>
          </div>
          <label style={fieldLabel}>
            Upload logo
            <input
              type="file"
              accept="image/*"
              onChange={onFile}
              style={fileInputStyle}
            />
          </label>
          <button
            onClick={runStudioQuote}
            disabled={loading}
            style={{
              ...primaryButton,
              width: '100%',
              opacity: loading ? 0.68 : 1,
            }}
          >
            {loading ? 'Calculating...' : 'Analyze and price'}
          </button>
          {status && <p style={successText}>{status}</p>}
          {error && <p style={errorText}>{error}</p>}
        </div>

        <div style={panel}>
          <h2 style={panelTitle}>Preview</h2>
          <div
            style={{
              ...previewBox,
              background:
                shirtColor === 'white'
                  ? 'linear-gradient(135deg, #f7f5ef, #d6ddd9)'
                  : 'linear-gradient(135deg, #090d0c, #19201d)',
            }}
          >
            {preview ? (
              <div
                style={{
                  ...logoPreview,
                  backgroundImage: `url(${preview})`,
                }}
              />
            ) : (
              <span style={mutedText}>No logo uploaded</span>
            )}
          </div>
          <div style={metaGrid}>
            <Meta label="Placement" value={placementSize[placement].label} />
            <Meta label="Shirt" value={`${shirtColor} tee`} />
            <Meta
              label="Size"
              value={`${placementSize[placement].width} x ${placementSize[placement].height} mm`}
            />
          </div>
        </div>
      </section>

      {publicQuote && internalQuote && (
        <>
          <section style={metricGrid}>
            <Metric label="Stitches" value={publicQuote.stitches.toLocaleString()} />
            <Metric label="Colors" value={publicQuote.colors} />
            <Metric
              label="Coverage"
              value={`${(publicQuote.coverage * 100).toFixed(1)}%`}
            />
            <Metric
              label="Customer price"
              value={
                publicQuote.manual_quote
                  ? 'Manual quote'
                  : formatCustomerMoney(publicQuote.price_eur)
              }
            />
            <Metric
              label="Internal cost"
              value={`€${internalQuote.internal_cost_eur.toFixed(2)}`}
            />
            <Metric
              label="Profit"
              value={
                internalQuote.estimated_profit_eur === null
                  ? 'Pending'
                  : `€${internalQuote.estimated_profit_eur.toFixed(2)}`
              }
            />
            <Metric
              label="Margin"
              value={
                internalQuote.profit_margin_percent === null
                  ? 'Pending'
                  : `${internalQuote.profit_margin_percent}%`
              }
            />
            <Metric label="Tier" value={publicQuote.pricing_tier} />
          </section>

          <section style={workspaceGrid}>
            <div style={panel}>
              <h2 style={panelTitle}>Production decision</h2>
              <div style={labelWrap}>
                {productionLabels.map((label) => (
                  <span key={label} style={decisionLabel}>
                    {label}
                  </span>
                ))}
              </div>
              <div style={noteStack}>
                {internalQuote.technical_warnings.map((warning) => (
                  <p key={warning} style={warningCard}>
                    {warning}
                  </p>
                ))}
                {publicQuote.customer_recommendations.map((recommendation) => (
                  <p key={recommendation} style={recommendationCard}>
                    {recommendation}
                  </p>
                ))}
                {analysis && (
                  <p style={mutedText}>
                    Contrast score:
                    {' '}
                    <strong>{analysis.contrast_score}/100</strong>
                  </p>
                )}
              </div>
            </div>

            <div style={panel}>
              <h2 style={panelTitle}>Internal cost breakdown</h2>
              <div style={breakdownTable}>
                {costBreakdownLabels.map(([key, label]) => (
                  <div key={key} style={breakdownRow}>
                    <span>{label}</span>
                    <strong>
                      €{internalQuote.cost_breakdown[key].toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
        </>
      )}
    </main>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={metaCard}>
      <span>{label}: </span>
      <strong>{value}</strong>
    </div>
  );
}

function StudioInteractionStyles() {
  return (
    <style>{`
      .studio-page button,
      .studio-page a[data-button='true'] {
        transition: transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease, border-color 150ms ease;
      }

      .studio-page button:not(:disabled),
      .studio-page a[data-button='true'] {
        cursor: pointer;
      }

      .studio-page button:not(:disabled):hover,
      .studio-page a[data-button='true']:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 38px rgba(0, 255, 136, 0.16), 0 10px 28px rgba(0, 200, 255, 0.10);
      }

      .studio-page button:not(:disabled):active,
      .studio-page a[data-button='true']:active {
        transform: scale(0.98);
      }

      .studio-page button:disabled {
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }
    `}</style>
  );
}

function PricingSettingsPanel({
  form,
  loading,
  saving,
  status,
  error,
  onChange,
  onSave,
  onReset,
  onRefresh,
}: {
  form: PricingSettingsForm;
  loading: boolean;
  saving: boolean;
  status: string;
  error: string;
  onChange: (field: PricingSettingKey, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onRefresh: () => void;
}) {
  const previewPricing = getPricingPreview(form);

  return (
    <section style={ordersShell}>
      <div style={ordersToolbar}>
        <div>
          <p style={eyebrow}>Pricing</p>
          <h2 style={panelTitle}>Cost settings</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          style={secondaryButton}
        >
          Refresh
        </button>
      </div>

      <div style={pricingWorkspace}>
        <div style={pricingSettingsStack}>
          <div style={panel}>
            <p style={mutedText}>
              These values are used for new public orders and studio
              quote calculations. Saved orders keep their own pricing
              snapshot until the team edits their cost breakdown.
            </p>
            {loading && <p style={successText}>Loading settings...</p>}
          </div>

          {pricingSettingGroups.map((group) => (
            <div key={group.title} style={settingsSection}>
              <div>
                <h3 style={sectionMiniTitle}>{group.title}</h3>
                <p style={compactMutedText}>{group.text}</p>
              </div>
              <div style={settingsFieldGrid}>
                {group.fields.map((key) => (
                  <label key={key} style={fieldLabel}>
                    {pricingSettingLabels[key]}
                    <div style={inputWithSuffix}>
                      <span
                        style={
                          key === 'target_margin_percent'
                            ? inputSuffix
                            : inputPrefix
                        }
                      >
                        {getPricingSettingSuffix(key)}
                      </span>
                      <input
                        value={form[key]}
                        onChange={(event) =>
                          onChange(key, event.target.value)
                        }
                        type="number"
                        min="0"
                        step={getPricingSettingStep(key)}
                        inputMode={getPricingSettingInputMode(key)}
                        style={{
                          ...inputStyle,
                          paddingLeft:
                            key === 'target_margin_percent' ? 16 : 42,
                          paddingRight:
                            key === 'target_margin_percent' ? 42 : 16,
                        }}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div style={settingsActionBar}>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              style={{
                ...primaryButton,
                opacity: saving ? 0.68 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save pricing settings'}
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={saving}
              style={{
                ...secondaryButton,
                opacity: saving ? 0.68 : 1,
              }}
            >
              Reset to defaults
            </button>
          </div>
          {error && <p style={errorText}>{error}</p>}
          {status && <p style={successText}>{status}</p>}
        </div>

        <div style={pricingPreviewPanel}>
          <p style={eyebrow}>Live preview</p>
          <h3 style={panelTitle}>Margin model</h3>
          <p style={compactMutedText}>
            Preview uses one standard left-chest item and the current
            settings above.
          </p>
          <div style={pricingPreviewGrid}>
            <Metric
              label="Internal cost"
              value={formatMoney(
                previewPricing?.internal_cost_eur ?? null
              )}
            />
            <Metric
              label="Suggested price"
              value={getSuggestedCustomerPriceLabel(
                previewPricing?.suggested_customer_price_eur ?? null
              )}
            />
            <Metric
              label="Profit"
              value={formatMoney(
                previewPricing?.estimated_profit_eur ?? null
              )}
            />
            <Metric
              label="Margin"
              value={
                previewPricing?.profit_margin_percent === null ||
                previewPricing?.profit_margin_percent === undefined
                  ? 'Pending'
                  : `${previewPricing.profit_margin_percent}%`
              }
            />
          </div>
          <div style={formulaBox}>
            <span>Formula</span>
            <strong>
              ceil(internal cost / (1 - target margin))
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrdersDashboard({
  orders,
  selectedOrder,
  pipelineStage,
  archiveFilter,
  loading,
  error,
  orderEditForm,
  orderEditError,
  orderEditStatus,
  savingOrder,
  statusActionLoading,
  customerLinkStatus,
  paymentLinkStatus,
  emailConfigured,
  sendingOfferId,
  offerEmailStatus,
  offerEmailError,
  pricingSettings,
  onOrderEditChange,
  onOrderCostBreakdownChange,
  onSaveOrderDetails,
  onResetOrderCalculator,
  onCopyCustomerLink,
  onCopyPaymentLink,
  onSendOfferToCustomer,
  onPipelineStageChange,
  onArchiveFilterChange,
  onSelectOrder,
  onRefresh,
  onChangeStatus,
}: {
  orders: OrderRecord[];
  selectedOrder: OrderRecord | null;
  pipelineStage: PipelineStage;
  archiveFilter: ArchiveFilter;
  loading: boolean;
  error: string;
  orderEditForm: OrderEditForm;
  orderEditError: string;
  orderEditStatus: string;
  savingOrder: boolean;
  statusActionLoading: OrderStatus | null;
  customerLinkStatus: string;
  paymentLinkStatus: string;
  emailConfigured: boolean | null;
  sendingOfferId: string | null;
  offerEmailStatus: string;
  offerEmailError: string;
  pricingSettings: PricingSettings;
  onOrderEditChange: (
    field: OrderEditTextField,
    value: string
  ) => void;
  onOrderCostBreakdownChange: (
    field: CostBreakdownKey,
    value: string
  ) => void;
  onSaveOrderDetails: () => void;
  onResetOrderCalculator: () => void;
  onCopyCustomerLink: (order: OrderRecord) => void;
  onCopyPaymentLink: (order: OrderRecord) => void;
  onSendOfferToCustomer: (order: OrderRecord) => void;
  onPipelineStageChange: (value: PipelineStage) => void;
  onArchiveFilterChange: (value: ArchiveFilter) => void;
  onSelectOrder: (order: OrderRecord) => void;
  onRefresh: () => void;
  onChangeStatus: (
    order: OrderRecord,
    status: OrderStatus
  ) => void;
}) {
  const [orderSearch, setOrderSearch] = useState('');
  const [openSections, setOpenSections] = useState<
    Record<OrderDetailSection, boolean>
  >({
    overview: true,
    pricing: true,
    workflow: false,
    notes: false,
  });
  const targetMargin = parseTargetMargin(
    orderEditForm.target_margin_percent
  );
  const parsedCostBreakdown = targetMargin
    ? parseCostBreakdownForm(
        orderEditForm.cost_breakdown,
        targetMargin
      )
    : null;
  const parsedRevisedPrice = parseEditableMoney(
    orderEditForm.revised_price_eur
  );
  const suggestedPricing = selectedOrder
    ? parsedCostBreakdown
      ? calculatePricing({
          stitches: selectedOrder.stitches,
          colors: selectedOrder.colors,
          placement: selectedOrder.placement,
          settings: pricingSettings,
          costBreakdown: parsedCostBreakdown,
          revisedPrice: null,
        })
      : getOrderPricing(selectedOrder, pricingSettings, null)
    : null;
  const previewCustomerPrice =
    parsedRevisedPrice !== undefined
      ? parsedRevisedPrice
      : selectedOrder
        ? getEffectiveCustomerPrice(selectedOrder, pricingSettings)
        : null;
  const suggestedCustomerPrice =
    suggestedPricing?.suggested_customer_price_eur ?? null;
  const currentInternalCost =
    suggestedPricing?.internal_cost_eur ??
    selectedOrder?.internal_cost_eur ??
    null;
  const finalOfferProfit =
    previewCustomerPrice !== null && currentInternalCost !== null
      ? Number((previewCustomerPrice - currentInternalCost).toFixed(2))
      : null;
  const finalOfferMargin =
    previewCustomerPrice && finalOfferProfit !== null
      ? Number(
          ((finalOfferProfit / previewCustomerPrice) * 100).toFixed(2)
        )
      : null;
  const isBelowCost =
    previewCustomerPrice !== null &&
    currentInternalCost !== null &&
    previewCustomerPrice < currentInternalCost;
  const isBelowTargetMargin =
    finalOfferMargin !== null &&
    targetMargin !== null &&
    finalOfferMargin < targetMargin;
  const visibleOrders = getPipelineOrders(
    orders,
    pipelineStage,
    archiveFilter
  );
  const normalizedSearch = orderSearch.trim().toLowerCase();
  const searchedOrders = normalizedSearch
    ? visibleOrders.filter((order) =>
        [
          order.customer_name,
          order.customer_email,
          order.customer_phone ?? '',
          getOrderBadgeLabel(order),
          formatPlacement(order.placement),
          formatOrderValue(order.shirt_color),
          order.pricing_tier,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      )
    : visibleOrders;
  const pipelineCounts = pipelineTabs.reduce(
    (counts, tab) => ({
      ...counts,
      [tab.value]: getPipelineOrders(orders, tab.value, 'all')
        .length,
    }),
    {} as Record<PipelineStage, number>
  );
  const archiveCounts = archiveFilters.reduce(
    (counts, filter) => ({
      ...counts,
      [filter.value]: getPipelineOrders(
        orders,
        'archive',
        filter.value
      ).length,
    }),
    {} as Record<ArchiveFilter, number>
  );
  const selectedOrderPipelineStage = selectedOrder
    ? getOrderPipelineStage(selectedOrder)
    : null;
  const canSendOffer =
    selectedOrder?.customer_decision === 'pending' &&
    (selectedOrderPipelineStage === 'new' ||
      selectedOrderPipelineStage === 'waiting_customer');
  const statusActionInFlight = statusActionLoading !== null;

  const toggleSection = (section: OrderDetailSection) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const renderStatusButton = (
    label: string,
    loadingLabel: string,
    nextStatus: OrderStatus,
    variant: 'primary' | 'secondary' | 'danger' = 'secondary'
  ) => (
    <button
      type="button"
      onClick={() =>
        selectedOrder && onChangeStatus(selectedOrder, nextStatus)
      }
      disabled={!selectedOrder || statusActionInFlight}
      style={actionButtonStyle(variant, statusActionInFlight)}
    >
      {statusActionLoading === nextStatus ? loadingLabel : label}
    </button>
  );

  const workflowItems = selectedOrder
    ? [
        {
          label: 'Created',
          value: formatDateTime(selectedOrder.created_at),
          complete: true,
        },
        {
          label: 'Offer sent',
          value: selectedOrder.offer_sent_at
            ? formatDateTime(selectedOrder.offer_sent_at)
            : 'Not sent',
          complete: Boolean(selectedOrder.offer_sent_at),
        },
        {
          label: 'Customer responded',
          value: selectedOrder.customer_decision_at
            ? `${customerDecisionLabels[selectedOrder.customer_decision]} - ${formatDateTime(selectedOrder.customer_decision_at)}`
            : customerDecisionLabels[selectedOrder.customer_decision],
          complete: selectedOrder.customer_decision !== 'pending',
        },
        {
          label: 'Team notified',
          value: selectedOrder.team_notified_at
            ? formatDateTime(selectedOrder.team_notified_at)
            : 'Not sent',
          complete: Boolean(selectedOrder.team_notified_at),
        },
        {
          label: 'Payment status',
          value: paymentStatusLabels[selectedOrder.payment_status],
          complete: selectedOrder.payment_status === 'paid',
        },
        {
          label: 'Sent to production',
          value:
            selectedOrder.status === 'sent_to_production' ||
            selectedOrder.status === 'completed'
              ? statusLabels[selectedOrder.status]
              : 'Not sent',
          complete:
            selectedOrder.status === 'sent_to_production' ||
            selectedOrder.status === 'completed',
        },
        {
          label: 'Completed',
          value: selectedOrder.completed_at
            ? formatDateTime(selectedOrder.completed_at)
            : 'Not completed',
          complete: Boolean(selectedOrder.completed_at),
        },
        {
          label: 'Archived',
          value: selectedOrder.archived_at
            ? `${formatDateTime(selectedOrder.archived_at)}${
                selectedOrder.archive_reason
                  ? ` - ${formatOrderValue(selectedOrder.archive_reason)}`
                  : ''
              }`
            : 'Not archived',
          complete: Boolean(selectedOrder.archived_at),
        },
      ]
    : [];

  return (
    <section style={ordersShell}>
      <OrdersDashboardStyles />
      <div style={ordersDashboardHeader}>
        <div>
          <p style={eyebrow}>Orders</p>
          <h2 style={panelTitle}>Order management</h2>
        </div>
        <div style={ordersHeaderControls}>
          <label style={searchLabel}>
            Search orders
            <input
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              placeholder="Name, email, status, placement"
              style={searchInput}
            />
          </label>
          <button
            type="button"
            onClick={onRefresh}
            style={secondaryButton}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="studio-pipeline-tabs" style={pipelineTabsStyle}>
        {pipelineTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onPipelineStageChange(tab.value)}
            style={pipelineTabButtonStyle(
              tab.value,
              pipelineStage === tab.value
            )}
          >
            <span>{tab.label}</span>
            <span style={pipelineCount}>
              {pipelineCounts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {pipelineStage === 'archive' && (
        <div className="studio-pipeline-tabs" style={archiveFilterBar}>
          {archiveFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onArchiveFilterChange(filter.value)}
              style={archiveTabButtonStyle(
                filter.value,
                archiveFilter === filter.value
              )}
            >
              <span>{filter.label}</span>
              <span style={pipelineCount}>
                {archiveCounts[filter.value]}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && <p style={warningCard}>{error}</p>}
      {emailConfigured === false && (
        <p style={warningCard}>
          Email not configured. Copy customer link manually.
        </p>
      )}
      {loading && <p style={successText}>Loading orders...</p>}

      {!loading && !error && orders.length === 0 && (
        <div style={emptyStateCard}>
          <p style={mutedText}>
            No orders yet. New customer requests will appear here after
            customers submit the request form.
          </p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="studio-orders-layout" style={ordersGrid}>
          <aside style={orderQueuePanel}>
            <div style={queueHeader}>
              <div>
                <h3 style={sectionMiniTitle}>Order queue</h3>
                <p style={compactMutedText}>
                  {searchedOrders.length} shown in this stage
                </p>
              </div>
              <span style={queueCountBadge}>{visibleOrders.length}</span>
            </div>

            {searchedOrders.length === 0 ? (
              <div style={emptyStateCard}>
                <p style={mutedText}>
                  {visibleOrders.length === 0
                    ? 'No orders in this stage.'
                    : 'No orders match this search.'}
                </p>
              </div>
            ) : (
              <div style={ordersList}>
                {searchedOrders.map((order) => {
                  const orderPricing = getOrderPricing(
                    order,
                    pricingSettings
                  );
                  const orderCustomerPrice =
                    order.revised_price_eur ??
                    order.customer_price_eur ??
                    orderPricing.customer_price_eur;
                  const orderCustomerPriceLabel =
                    order.manual_quote && order.revised_price_eur !== null
                      ? `Final price: ${formatCustomerMoney(order.revised_price_eur)}`
                      : order.manual_quote
                        ? 'Manual quote'
                        : formatCustomerMoney(orderCustomerPrice);
                  const declinedStatus = getDeclinedStatus(order);

                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => onSelectOrder(order)}
                      style={{
                        ...orderCard,
                        borderColor:
                          selectedOrder?.id === order.id
                            ? 'rgba(0,255,136,0.54)'
                            : declinedStatus
                              ? 'rgba(255,143,179,0.22)'
                              : 'rgba(255,255,255,0.10)',
                        boxShadow:
                          selectedOrder?.id === order.id
                            ? '0 0 0 1px rgba(0,255,136,0.25), 0 22px 70px rgba(0,255,136,0.08)'
                            : 'none',
                      }}
                    >
                      <div style={orderCardHeader}>
                        <span
                          style={statusBadge(
                            declinedStatus ?? order.status
                          )}
                        >
                          {getOrderBadgeLabel(order)}
                        </span>
                        {order.manual_quote && (
                          <span style={manualQuoteBadge}>
                            Manual quote
                          </span>
                        )}
                      </div>
                      <div style={orderIdentityRow}>
                        <strong style={orderCustomerName}>
                          {order.customer_name}
                        </strong>
                        <span style={orderCreatedText}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span style={orderEmailText}>
                        {order.customer_email}
                      </span>
                      <div style={badgeRow}>
                        <span
                          style={customerDecisionBadge(
                            order.customer_decision
                          )}
                        >
                          Response: {customerDecisionLabels[order.customer_decision]}
                        </span>
                        <span style={paymentBadge(order.payment_status)}>
                          Payment: {paymentStatusLabels[order.payment_status]}
                        </span>
                      </div>
                      <div style={orderQuickFactsGrid}>
                        <Meta
                          label="Placement"
                          value={formatPlacement(order.placement)}
                        />
                        <Meta
                          label="Color"
                          value={formatOrderValue(order.shirt_color)}
                        />
                        <Meta
                          label="Stitches"
                          value={order.stitches.toLocaleString()}
                        />
                        <Meta
                          label="Colors"
                          value={String(order.colors)}
                        />
                        <Meta
                          label="Final price"
                          value={orderCustomerPriceLabel}
                        />
                        <Meta
                          label="Profit"
                          value={formatMoney(
                            orderPricing.estimated_profit_eur
                          )}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section style={orderWorkspacePanel}>
            {!selectedOrder ? (
              <div style={emptyDetailState}>
                <p style={eyebrow}>Order detail</p>
                <h3 style={panelTitle}>Select an order to review details.</h3>
                <p style={mutedText}>
                  Choose an order from the queue to view workflow,
                  notes, customer links and internal pricing.
                </p>
              </div>
            ) : (
              <>
                <div style={detailStickyHeader}>
                  <div style={detailHeaderTopline}>
                    <div>
                      <p style={eyebrow}>Selected order</p>
                      <h2 style={detailCustomerTitle}>
                        {selectedOrder.customer_name}
                      </h2>
                      <p style={mutedText}>
                        {selectedOrder.customer_email}
                        {selectedOrder.customer_phone
                          ? ` · ${selectedOrder.customer_phone}`
                          : ''}
                      </p>
                    </div>
                    <div style={detailHeaderBadges}>
                      <span
                        style={statusBadge(
                          getDeclinedStatus(selectedOrder) ??
                            selectedOrder.status
                        )}
                      >
                        {getOrderBadgeLabel(selectedOrder)}
                      </span>
                      <span style={workflowStageBadge}>
                        {getPipelineStageLabel(selectedOrder)}
                      </span>
                      <span
                        style={customerDecisionBadge(
                          selectedOrder.customer_decision
                        )}
                      >
                        Response: {customerDecisionLabels[selectedOrder.customer_decision]}
                      </span>
                      <span style={paymentBadge(selectedOrder.payment_status)}>
                        Payment: {paymentStatusLabels[selectedOrder.payment_status]}
                      </span>
                    </div>
                  </div>

                  <div style={actionGroupsShell}>
                    <div style={actionGroup}>
                      <span style={actionGroupLabel}>Primary</span>
                      {canSendOffer && (
                        <button
                          type="button"
                          onClick={() => onSendOfferToCustomer(selectedOrder)}
                          disabled={
                            emailConfigured !== true ||
                            sendingOfferId === selectedOrder.id
                          }
                          style={actionButtonStyle(
                            'primary',
                            emailConfigured !== true ||
                              sendingOfferId === selectedOrder.id
                          )}
                        >
                          {sendingOfferId === selectedOrder.id
                            ? 'Sending...'
                            : selectedOrderPipelineStage ===
                                'waiting_customer'
                              ? 'Send offer again'
                              : 'Send offer to customer'}
                        </button>
                      )}
                      {selectedOrderPipelineStage === 'new' &&
                        (selectedOrder.status === 'new' ||
                          selectedOrder.status === 'needs_review') &&
                        renderStatusButton(
                          'Approve',
                          'Approving...',
                          'approved',
                          'primary'
                        )}
                      {selectedOrderPipelineStage === 'pre_production' &&
                        selectedOrder.status !== 'pre_production' &&
                        renderStatusButton(
                          'Move to pre-production',
                          'Moving...',
                          'pre_production',
                          'primary'
                        )}
                      {selectedOrderPipelineStage === 'pre_production' &&
                        renderStatusButton(
                          'Send to production',
                          'Sending...',
                          'sent_to_production',
                          'primary'
                        )}
                      {selectedOrderPipelineStage === 'production' &&
                        renderStatusButton(
                          'Mark completed',
                          'Marking...',
                          'completed',
                          'primary'
                        )}
                    </div>

                    <div style={actionGroup}>
                      <span style={actionGroupLabel}>Secondary</span>
                      {selectedOrder.public_token && (
                        <>
                          <button
                            type="button"
                            onClick={() => onCopyCustomerLink(selectedOrder)}
                            style={secondaryButton}
                          >
                            Copy offer link
                          </button>
                          <button
                            type="button"
                            onClick={() => onCopyPaymentLink(selectedOrder)}
                            style={secondaryButton}
                          >
                            Copy payment link
                          </button>
                        </>
                      )}
                      {selectedOrderPipelineStage === 'archive' &&
                        selectedOrder.status !== 'completed' &&
                        renderStatusButton(
                          'Restore to review',
                          'Restoring...',
                          'needs_review',
                          'secondary'
                        )}
                    </div>

                    {(selectedOrderPipelineStage === 'new' ||
                      selectedOrderPipelineStage ===
                        'waiting_customer') && (
                      <div style={actionGroup}>
                        <span style={actionGroupLabel}>Danger</span>
                        {renderStatusButton(
                          'Decline',
                          'Declining...',
                          'team_declined',
                          'danger'
                        )}
                      </div>
                    )}
                  </div>

                  {(customerLinkStatus || paymentLinkStatus) && (
                    <div style={statusMessageRow}>
                      {customerLinkStatus && (
                        <span style={tinyInlineText}>{customerLinkStatus}</span>
                      )}
                      {paymentLinkStatus && (
                        <span style={tinyInlineText}>{paymentLinkStatus}</span>
                      )}
                    </div>
                  )}
                  {offerEmailStatus && (
                    <p style={successText}>{offerEmailStatus}</p>
                  )}
                  {offerEmailError && (
                    <p style={errorText}>{offerEmailError}</p>
                  )}
                </div>

                {selectedOrder.manual_quote && (
                  <div style={manualQuoteNotice}>
                    <span style={manualQuoteBadge}>Manual quote</span>
                    <span>
                      Customer sees manual quote. This calculator is
                      internal for the team.
                    </span>
                  </div>
                )}
                {selectedOrder.team_notification_error && (
                  <p style={warningCard}>
                    Team notification warning:{' '}
                    {selectedOrder.team_notification_error}
                  </p>
                )}

                <div style={detailSectionNav}>
                  {orderDetailSections.map((section) => (
                    <button
                      key={section.value}
                      type="button"
                      onClick={() => toggleSection(section.value)}
                      aria-expanded={openSections[section.value]}
                      style={detailSectionToggle(
                        openSections[section.value]
                      )}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>

                {openSections.overview && (
                  <section style={detailSectionCard}>
                    <div style={sectionHeadingRow}>
                      <div>
                        <p style={eyebrow}>Overview</p>
                        <h3 style={panelTitle}>Preview & order summary</h3>
                      </div>
                    </div>
                    <div className="studio-overview-grid" style={overviewGrid}>
                      <div style={previewBoxLarge}>
                        {selectedOrder.logo_preview_url ? (
                          <div
                            style={{
                              ...logoPreviewLarge,
                              backgroundImage: `url(${selectedOrder.logo_preview_url})`,
                            }}
                          />
                        ) : (
                          <span style={mutedText}>No artwork preview</span>
                        )}
                      </div>
                      <div style={summaryGridWide}>
                        <Meta
                          label="Placement"
                          value={formatPlacement(selectedOrder.placement)}
                        />
                        <Meta
                          label="Shirt color"
                          value={formatOrderValue(selectedOrder.shirt_color)}
                        />
                        <label style={fieldLabelCompact}>
                          Quantity
                          <input
                            value={orderEditForm.quantity}
                            onChange={(event) =>
                              onOrderEditChange(
                                'quantity',
                                event.target.value
                              )
                            }
                            type="number"
                            min="1"
                            step="1"
                            style={inputStyle}
                          />
                        </label>
                        <Meta
                          label="Stitches"
                          value={selectedOrder.stitches.toLocaleString()}
                        />
                        <Meta
                          label="Colors"
                          value={String(selectedOrder.colors)}
                        />
                        <Meta
                          label="Coverage"
                          value={formatCoverage(selectedOrder.coverage)}
                        />
                        <Meta
                          label="Manual quote"
                          value={selectedOrder.manual_quote ? 'Yes' : 'No'}
                        />
                        <Meta
                          label="Pricing tier"
                          value={selectedOrder.pricing_tier}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {openSections.pricing && (
                  <section style={detailSectionCardWide}>
                    <div style={sectionHeadingRow}>
                      <div>
                        <p style={eyebrow}>Pricing</p>
                        <h3 style={panelTitle}>
                          Internal pricing calculator
                        </h3>
                        <p style={compactMutedText}>
                          Internal only. Customer never sees these costs.
                        </p>
                      </div>
                    </div>

                    <div style={calculatorKpiGrid}>
                      <Metric
                        label="Total internal cost"
                        value={formatMoney(currentInternalCost)}
                      />
                      <Metric
                        label="Suggested price"
                        value={getSuggestedCustomerPriceLabel(
                          suggestedCustomerPrice
                        )}
                      />
                      <Metric
                        label="Final customer price"
                        value={
                          previewCustomerPrice === null
                            ? 'Pending'
                            : formatCustomerMoney(previewCustomerPrice)
                        }
                      />
                      <Metric
                        label="Actual profit"
                        value={formatMoney(finalOfferProfit)}
                      />
                      <Metric
                        label="Actual margin"
                        value={formatMargin(finalOfferMargin)}
                      />
                    </div>

                    <div style={pricingWarningsStack}>
                      {isBelowCost && (
                        <p style={warningCard}>This offer is below cost.</p>
                      )}
                      {isBelowTargetMargin && (
                        <p style={warningCard}>
                          Actual margin is below the target margin.
                        </p>
                      )}
                    </div>

                    <div style={calculatorControlRow}>
                      <label style={targetMarginField}>
                        Target margin percent
                        <input
                          value={orderEditForm.target_margin_percent}
                          onChange={(event) =>
                            onOrderEditChange(
                              'target_margin_percent',
                              event.target.value
                            )
                          }
                          inputMode="decimal"
                          style={inputStyle}
                        />
                      </label>
                      <label style={finalPriceFieldWide}>
                        Final customer price EUR
                        <input
                          value={orderEditForm.revised_price_eur}
                          onChange={(event) =>
                            onOrderEditChange(
                              'revised_price_eur',
                              event.target.value
                            )
                          }
                          placeholder="Enter final customer price"
                          inputMode="decimal"
                          style={finalPriceInput}
                        />
                        <span style={helperText}>
                          Edit this to override the customer offer price.
                        </span>
                      </label>
                    </div>

                    <div style={calculatorTableWrapWide}>
                      <table
                        className="studio-calculator-table"
                        style={calculatorTable}
                      >
                        <thead>
                          <tr>
                            <th style={calculatorTableHead}>Cost item</th>
                            <th style={calculatorTableHead}>EUR</th>
                            <th style={calculatorTableHead}>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {costBreakdownLabels.map(([key, label]) => (
                            <tr key={key}>
                              <td
                                data-label="Cost item"
                                style={calculatorTableCell}
                              >
                                <strong>{label}</strong>
                              </td>
                              <td
                                data-label="EUR"
                                style={calculatorTableCell}
                              >
                                <input
                                  value={
                                    orderEditForm.cost_breakdown[key]
                                  }
                                  onChange={(event) =>
                                    onOrderCostBreakdownChange(
                                      key,
                                      event.target.value
                                    )
                                  }
                                  inputMode="decimal"
                                  style={calculatorInput}
                                />
                              </td>
                              <td
                                data-label="Notes"
                                style={calculatorTableNote}
                              >
                                {calculatorCostNotes[key]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={calculatorActionsWide}>
                      {suggestedCustomerPrice !== null && (
                        <button
                          type="button"
                          onClick={() =>
                            onOrderEditChange(
                              'revised_price_eur',
                              String(suggestedCustomerPrice)
                            )
                          }
                          style={secondaryButton}
                        >
                          Use suggested price
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onResetOrderCalculator}
                        style={secondaryButton}
                      >
                        Reset to default costs
                      </button>
                      <button
                        type="button"
                        onClick={onSaveOrderDetails}
                        disabled={savingOrder}
                        style={actionButtonStyle('primary', savingOrder)}
                      >
                        {savingOrder
                          ? 'Saving...'
                          : 'Save calculator and final price'}
                      </button>
                    </div>
                  </section>
                )}

                {openSections.workflow && (
                  <section style={detailSectionCard}>
                    <div style={sectionHeadingRow}>
                      <div>
                        <p style={eyebrow}>Workflow</p>
                        <h3 style={panelTitle}>Status timeline</h3>
                      </div>
                    </div>
                    <div style={workflowTimelineGrid}>
                      {workflowItems.map((item) => (
                        <div key={item.label} style={workflowTimelineItem}>
                          <span
                            style={workflowDot(item.complete)}
                            aria-hidden="true"
                          />
                          <div>
                            <strong>{item.label}</strong>
                            <p style={compactMutedText}>{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {openSections.notes && (
                  <section style={detailSectionCard}>
                    <div style={sectionHeadingRow}>
                      <div>
                        <p style={eyebrow}>Notes</p>
                        <h3 style={panelTitle}>
                          Customer note and studio message
                        </h3>
                      </div>
                    </div>
                    <div className="studio-notes-grid" style={notesGrid}>
                      <div style={noteCardStrong}>
                        <span style={detailLabel}>Customer note</span>
                        <p style={messageText}>
                          {selectedOrder.note || 'No customer note.'}
                        </p>
                      </div>
                      <div style={noteCardStrong}>
                        <span style={detailLabel}>Design idea</span>
                        <p style={messageText}>
                          {selectedOrder.prompt || 'No design prompt.'}
                        </p>
                      </div>
                      <label style={fieldLabel}>
                        Team message
                        <textarea
                          value={orderEditForm.team_message}
                          onChange={(event) =>
                            onOrderEditChange(
                              'team_message',
                              event.target.value
                            )
                          }
                          placeholder="Message visible to the customer"
                          rows={4}
                          style={{
                            ...inputStyle,
                            resize: 'vertical',
                          }}
                        />
                      </label>
                      <label style={fieldLabel}>
                        Production notes
                        <textarea
                          value={orderEditForm.production_notes}
                          onChange={(event) =>
                            onOrderEditChange(
                              'production_notes',
                              event.target.value
                            )
                          }
                          placeholder="Internal production notes"
                          rows={4}
                          style={{
                            ...inputStyle,
                            resize: 'vertical',
                          }}
                        />
                      </label>
                    </div>

                    <div style={notesActionRow}>
                      <button
                        type="button"
                        onClick={onSaveOrderDetails}
                        disabled={savingOrder}
                        style={actionButtonStyle('primary', savingOrder)}
                      >
                        {savingOrder ? 'Saving...' : 'Save notes'}
                      </button>
                    </div>

                    {(selectedOrder.warnings.length > 0 ||
                      selectedOrder.recommendations.length > 0) && (
                      <div className="studio-notes-grid" style={notesGrid}>
                        <div style={noteCardStrong}>
                          <span style={detailLabel}>Warnings</span>
                          <div style={noteStackCompact}>
                            {selectedOrder.warnings.length > 0 ? (
                              selectedOrder.warnings.map((warning) => (
                                <p key={warning} style={warningCard}>
                                  {warning}
                                </p>
                              ))
                            ) : (
                              <p style={mutedText}>No warnings.</p>
                            )}
                          </div>
                        </div>
                        <div style={noteCardStrong}>
                          <span style={detailLabel}>Recommendations</span>
                          <div style={noteStackCompact}>
                            {selectedOrder.recommendations.length > 0 ? (
                              selectedOrder.recommendations.map((item) => (
                                <p key={item} style={recommendationCard}>
                                  {item}
                                </p>
                              ))
                            ) : (
                              <p style={mutedText}>No recommendations.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {orderEditError && (
                  <p style={errorText}>{orderEditError}</p>
                )}
                {orderEditStatus && (
                  <p style={successText}>{orderEditStatus}</p>
                )}

                {selectedOrderPipelineStage === 'archive' &&
                  selectedOrder.status === 'completed' && (
                  <p style={mutedText}>
                    Completed order archived. No production actions are
                    available.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function OrdersDashboardStyles() {
  return (
    <style>{`
      .studio-orders-layout {
        grid-template-columns: minmax(320px, 0.38fr) minmax(0, 0.62fr);
      }

      .studio-pipeline-tabs {
        overflow-x: auto;
        scrollbar-width: thin;
      }

      .studio-calculator-table {
        table-layout: fixed;
      }

      .studio-calculator-table th:first-child,
      .studio-calculator-table td:first-child {
        width: 30%;
      }

      .studio-calculator-table th:nth-child(2),
      .studio-calculator-table td:nth-child(2) {
        width: 190px;
      }

      @media (max-width: 1120px) {
        .studio-orders-layout {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .studio-pipeline-tabs {
          flex-wrap: nowrap !important;
          padding-bottom: 8px;
        }

        .studio-overview-grid,
        .studio-notes-grid {
          grid-template-columns: 1fr !important;
        }

        .studio-calculator-table,
        .studio-calculator-table thead,
        .studio-calculator-table tbody,
        .studio-calculator-table tr,
        .studio-calculator-table td {
          display: block;
          width: 100% !important;
        }

        .studio-calculator-table {
          min-width: 0 !important;
        }

        .studio-calculator-table thead {
          display: none;
        }

        .studio-calculator-table tr {
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          padding: 12px;
          margin-bottom: 12px;
          background: rgba(255,255,255,0.035);
        }

        .studio-calculator-table td {
          border-bottom: 0 !important;
          padding: 8px 0 !important;
        }

        .studio-calculator-table td::before {
          content: attr(data-label);
          display: block;
          color: rgba(245,247,248,0.52);
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 6px;
        }
      }
    `}</style>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={metricCard}>
      <span>{label}: </span>
      <strong>{value}</strong>
    </div>
  );
}

const pageShell: CSSProperties = {
  minHeight: '100vh',
  padding: '40px clamp(18px, 4vw, 64px)',
  background:
    'radial-gradient(circle at 18% 8%, rgba(0,255,136,0.15), transparent 30%), radial-gradient(circle at 86% 22%, rgba(0,200,255,0.12), transparent 32%), #050607',
  color: '#f5f7f8',
  fontFamily:
    'var(--font-geist-sans), Inter, "Helvetica Neue", Arial, sans-serif',
};

const brandMark: CSSProperties = {
  width: 64,
  height: 64,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 22,
  background: 'linear-gradient(135deg, #00ff88, #00c8ff)',
  color: '#03100d',
  fontSize: 34,
  fontWeight: 950,
  marginBottom: 22,
};

const gateCard: CSSProperties = {
  width: 'min(560px, 100%)',
  margin: '10vh auto',
  padding: '42px',
  borderRadius: 30,
  border: '1px solid rgba(255,255,255,0.12)',
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))',
  boxShadow: '0 40px 120px rgba(0,0,0,0.45)',
};

const studioHeader: CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'wrap',
};

const headerActions: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
};

const eyebrow: CSSProperties = {
  color: '#00ff88',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  margin: '0 0 10px',
};

const gateTitle: CSSProperties = {
  fontSize: 'clamp(34px, 6vw, 62px)',
  lineHeight: 0.95,
  margin: 0,
};

const studioTitle: CSSProperties = {
  fontSize: 'clamp(34px, 5vw, 58px)',
  lineHeight: 0.95,
  margin: 0,
};

const mutedText: CSSProperties = {
  color: 'rgba(245,247,248,0.62)',
  lineHeight: 1.55,
};

const tinyText: CSSProperties = {
  color: 'rgba(245,247,248,0.38)',
  fontSize: 12,
  marginTop: 16,
};

const gateForm: CSSProperties = {
  display: 'grid',
  gap: 12,
  marginTop: 24,
};

const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.13)',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.055)',
  color: '#f5f7f8',
  padding: '14px 16px',
  fontSize: 15,
  outline: 'none',
};

const finalPriceInput: CSSProperties = {
  ...inputStyle,
  border: '1px solid rgba(0,255,136,0.32)',
  background:
    'linear-gradient(135deg, rgba(0,255,136,0.11), rgba(0,200,255,0.075))',
  color: '#f5f7f8',
  padding: '18px 18px',
  fontSize: 26,
  fontWeight: 950,
};

const fileInputStyle: CSSProperties = {
  ...inputStyle,
  padding: 12,
};

const primaryButton: CSSProperties = {
  border: 0,
  borderRadius: 18,
  padding: '15px 20px',
  background: 'linear-gradient(135deg, #00ff88, #00c8ff)',
  color: '#03100d',
  fontSize: 15,
  fontWeight: 850,
  cursor: 'pointer',
};

const secondaryButton: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 18,
  padding: '13px 18px',
  color: '#f5f7f8',
  background: 'rgba(255,255,255,0.045)',
  textDecoration: 'none',
  fontWeight: 800,
  cursor: 'pointer',
};

function toastStyle(tone: StudioToast['tone']): CSSProperties {
  const color = tone === 'success' ? '#9dffc4' : '#ffb4b4';

  return {
    position: 'fixed',
    top: 22,
    right: 22,
    zIndex: 50,
    maxWidth: 'min(360px, calc(100vw - 32px))',
    border: `1px solid ${color}55`,
    borderRadius: 16,
    padding: '13px 16px',
    background: 'rgba(5,6,7,0.94)',
    color,
    boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
    fontSize: 14,
    fontWeight: 800,
  };
}

const workspaceGrid: CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
  gap: 20,
};

const pricingWorkspace: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
  gap: 20,
  alignItems: 'start',
};

const pricingSettingsStack: CSSProperties = {
  display: 'grid',
  gap: 16,
};

const panel: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 28,
  padding: 'clamp(22px, 3vw, 32px)',
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))',
  boxShadow: '0 30px 90px rgba(0,0,0,0.34)',
};

const settingsSection: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 22,
  padding: 20,
  background: 'rgba(255,255,255,0.045)',
  display: 'grid',
  gridTemplateColumns: 'minmax(170px, 0.34fr) minmax(0, 0.66fr)',
  gap: 18,
  alignItems: 'start',
};

const settingsFieldGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
};

const pricingPreviewPanel: CSSProperties = {
  ...panel,
  position: 'sticky',
  top: 22,
};

const pricingPreviewGrid: CSSProperties = {
  display: 'grid',
  gap: 12,
  marginTop: 18,
};

const formulaBox: CSSProperties = {
  border: '1px solid rgba(157,255,196,0.18)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(157,255,196,0.055)',
  display: 'grid',
  gap: 6,
  color: '#9dffc4',
  marginTop: 16,
};

const panelTitle: CSSProperties = {
  margin: '0 0 18px',
  fontSize: 22,
};

const sectionMiniTitle: CSSProperties = {
  margin: '0 0 14px',
  fontSize: 16,
};

const compactMutedText: CSSProperties = {
  ...mutedText,
  margin: 0,
  fontSize: 13,
};

const controlGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
};

const fieldLabel: CSSProperties = {
  display: 'grid',
  gap: 9,
  color: 'rgba(245,247,248,0.68)',
  fontWeight: 750,
  marginBottom: 16,
};

const helperText: CSSProperties = {
  color: 'rgba(157,255,196,0.72)',
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.45,
};

const inputWithSuffix: CSSProperties = {
  position: 'relative',
};

const inputPrefix: CSSProperties = {
  position: 'absolute',
  left: 15,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'rgba(245,247,248,0.42)',
  fontWeight: 850,
  pointerEvents: 'none',
};

const inputSuffix: CSSProperties = {
  ...inputPrefix,
  left: 'auto',
  right: 15,
};

const settingsActionBar: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const previewBox: CSSProperties = {
  minHeight: 300,
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.10)',
  display: 'grid',
  placeItems: 'center',
  boxShadow: 'inset 0 0 70px rgba(0,0,0,0.35)',
};

const logoPreview: CSSProperties = {
  width: 150,
  height: 100,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'contain',
  filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
};

const metaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 12,
  marginTop: 14,
};

const metaCard: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 18,
  padding: 14,
  background: 'rgba(0,0,0,0.26)',
};

const detailLabel: CSSProperties = {
  color: 'rgba(245,247,248,0.62)',
  fontSize: 13,
  fontWeight: 800,
};

const metricGrid: CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 14,
};

const metricCard: CSSProperties = {
  minHeight: 108,
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 22,
  padding: 18,
  background: 'rgba(255,255,255,0.045)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const labelWrap: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const decisionLabel: CSSProperties = {
  padding: '9px 12px',
  borderRadius: 999,
  border: '1px solid rgba(0,255,136,0.24)',
  background: 'rgba(0,255,136,0.08)',
  color: '#9dffc4',
  fontSize: 13,
  fontWeight: 800,
};

const manualQuoteBadge: CSSProperties = {
  padding: '8px 11px',
  borderRadius: 999,
  border: '1px solid rgba(255,190,92,0.36)',
  background: 'rgba(255,190,92,0.12)',
  color: '#ffcf7a',
  fontSize: 12,
  fontWeight: 900,
};

const manualQuoteNotice: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  border: '1px solid rgba(255,190,92,0.22)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(255,190,92,0.07)',
  color: '#ffdc9f',
  margin: '0 0 18px',
  fontWeight: 750,
};

const noteStack: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 18,
};

const warningCard: CSSProperties = {
  border: '1px solid rgba(255,224,131,0.22)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(255,224,131,0.065)',
  color: '#ffe083',
  margin: 0,
};

const recommendationCard: CSSProperties = {
  border: '1px solid rgba(157,255,196,0.20)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(157,255,196,0.06)',
  color: '#9dffc4',
  margin: 0,
};

const breakdownTable: CSSProperties = {
  display: 'grid',
  gap: 10,
};

const breakdownRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  padding: '10px 0',
};

const calculatorTableWrap: CSSProperties = {
  overflowX: 'auto',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 18,
  background: 'rgba(0,0,0,0.20)',
  marginBottom: 16,
};

const calculatorTable: CSSProperties = {
  width: '100%',
  minWidth: 680,
  borderCollapse: 'collapse',
};

const calculatorTableHead: CSSProperties = {
  padding: '12px 14px',
  textAlign: 'left',
  color: 'rgba(245,247,248,0.58)',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0,
  borderBottom: '1px solid rgba(255,255,255,0.10)',
};

const calculatorTableCell: CSSProperties = {
  padding: '11px 14px',
  borderBottom: '1px solid rgba(255,255,255,0.075)',
  color: '#f5f7f8',
};

const calculatorTableNote: CSSProperties = {
  ...calculatorTableCell,
  color: 'rgba(245,247,248,0.54)',
  fontSize: 13,
};

const calculatorInput: CSSProperties = {
  ...inputStyle,
  minWidth: 120,
  padding: '10px 12px',
  borderRadius: 12,
};

const successText: CSSProperties = {
  color: '#9dffc4',
  margin: '12px 0 0',
};

const errorText: CSSProperties = {
  color: '#ff9d9d',
  margin: '12px 0 0',
};

const ordersShell: CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto',
};

const ordersToolbar: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: 18,
};

const pipelineTabsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  margin: '0 0 14px',
};

const archiveFilterBar: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  margin: '0 0 18px',
};

const pipelineCount: CSSProperties = {
  minWidth: 24,
  height: 24,
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: 999,
  background: 'rgba(0,0,0,0.24)',
  color: 'inherit',
  fontSize: 12,
  fontWeight: 900,
};

const ordersGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
  gap: 20,
  alignItems: 'start',
};

const ordersList: CSSProperties = {
  display: 'grid',
  gap: 14,
};

const orderCard: CSSProperties = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 24,
  padding: 18,
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))',
  color: '#f5f7f8',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'grid',
  gap: 10,
};

const orderCardHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
};

const ordersDashboardHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  marginBottom: 18,
};

const ordersHeaderControls: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 12,
  flexWrap: 'wrap',
};

const searchLabel: CSSProperties = {
  display: 'grid',
  gap: 8,
  color: 'rgba(245,247,248,0.66)',
  fontWeight: 800,
  minWidth: 260,
};

const searchInput: CSSProperties = {
  ...inputStyle,
  minHeight: 48,
  padding: '12px 14px',
};

const emptyStateCard: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 22,
  padding: 20,
  background: 'rgba(255,255,255,0.045)',
};

const orderQueuePanel: CSSProperties = {
  ...panel,
  padding: 18,
};

const queueHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 14,
};

const queueCountBadge: CSSProperties = {
  minWidth: 34,
  height: 34,
  borderRadius: 12,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(0,255,136,0.10)',
  border: '1px solid rgba(0,255,136,0.22)',
  color: '#9dffc4',
  fontWeight: 900,
};

const orderIdentityRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'baseline',
};

const orderCustomerName: CSSProperties = {
  color: '#f5f7f8',
  fontSize: 18,
};

const orderCreatedText: CSSProperties = {
  color: 'rgba(245,247,248,0.46)',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

const orderEmailText: CSSProperties = {
  color: 'rgba(245,247,248,0.62)',
  fontSize: 14,
};

const badgeRow: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const orderQuickFactsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
  gap: 10,
};

const orderWorkspacePanel: CSSProperties = {
  display: 'grid',
  gap: 16,
  alignContent: 'start',
};

const emptyDetailState: CSSProperties = {
  ...panel,
  minHeight: 360,
  display: 'grid',
  alignContent: 'center',
};

const detailStickyHeader: CSSProperties = {
  ...panel,
  position: 'sticky',
  top: 16,
  zIndex: 3,
  padding: 18,
  backdropFilter: 'blur(18px)',
};

const detailHeaderTopline: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
};

const detailCustomerTitle: CSSProperties = {
  margin: '0 0 8px',
  fontSize: 'clamp(24px, 3vw, 34px)',
  lineHeight: 1.05,
};

const detailHeaderBadges: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  flexWrap: 'wrap',
  maxWidth: 520,
};

const workflowStageBadge: CSSProperties = {
  ...compactBadge('#9ee8ff'),
};

const actionGroupsShell: CSSProperties = {
  display: 'grid',
  gap: 12,
  marginTop: 16,
};

const actionGroup: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
};

const actionGroupLabel: CSSProperties = {
  color: 'rgba(245,247,248,0.46)',
  minWidth: 72,
  fontSize: 12,
  fontWeight: 850,
  textTransform: 'uppercase',
};

const dangerButton: CSSProperties = {
  border: '1px solid rgba(255,143,179,0.28)',
  borderRadius: 18,
  padding: '13px 18px',
  color: '#ffb4b4',
  background: 'rgba(255,143,179,0.08)',
  textDecoration: 'none',
  fontWeight: 850,
  cursor: 'pointer',
};

const statusMessageRow: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 10,
};

const tinyInlineText: CSSProperties = {
  color: 'rgba(245,247,248,0.50)',
  fontSize: 12,
};

const detailSectionNav: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const detailSectionCard: CSSProperties = {
  ...panel,
  padding: 22,
};

const detailSectionCardWide: CSSProperties = {
  ...detailSectionCard,
};

const sectionHeadingRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  marginBottom: 16,
};

const overviewGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 0.42fr) minmax(0, 0.58fr)',
  gap: 18,
  alignItems: 'stretch',
};

const previewBoxLarge: CSSProperties = {
  ...previewBox,
  minHeight: 360,
  background:
    'linear-gradient(145deg, rgba(0,255,136,0.055), rgba(0,0,0,0.28))',
};

const logoPreviewLarge: CSSProperties = {
  ...logoPreview,
  width: 'min(280px, 82%)',
  height: 190,
};

const summaryGridWide: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
};

const fieldLabelCompact: CSSProperties = {
  ...fieldLabel,
  marginBottom: 0,
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 18,
  padding: 14,
  background: 'rgba(0,0,0,0.26)',
};

const calculatorKpiGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
  marginBottom: 14,
};

const pricingWarningsStack: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginBottom: 14,
};

const calculatorControlRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(180px, 0.32fr) minmax(260px, 0.68fr)',
  gap: 14,
  alignItems: 'start',
  marginBottom: 16,
};

const targetMarginField: CSSProperties = {
  ...fieldLabel,
  marginBottom: 0,
};

const finalPriceFieldWide: CSSProperties = {
  ...fieldLabel,
  marginBottom: 0,
};

const calculatorTableWrapWide: CSSProperties = {
  ...calculatorTableWrap,
  overflowX: 'auto',
};

const calculatorActionsWide: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const workflowTimelineGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 12,
};

const workflowTimelineItem: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 18,
  padding: 14,
  background: 'rgba(0,0,0,0.22)',
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
};

const notesGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14,
};

const noteCardStrong: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 18,
  padding: 16,
  background: 'rgba(0,0,0,0.22)',
};

const messageText: CSSProperties = {
  color: 'rgba(245,247,248,0.78)',
  lineHeight: 1.55,
  margin: '8px 0 0',
};

const notesActionRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  margin: '14px 0',
};

const noteStackCompact: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 12,
};

function statusBadge(status: OrderStatus): CSSProperties {
  const color =
    status === 'customer_declined'
      ? '#ff8fb3'
      : status === 'team_declined'
        ? '#ff9f6e'
        : status === 'completed'
          ? '#00c8ff'
          : status === 'sent_to_production'
            ? '#7ed7ff'
            : status === 'offer_sent' ||
                status === 'needs_review' ||
                status === 'approved'
              ? '#ffe083'
              : '#9dffc4';

  return {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    border: `1px solid ${color}55`,
    borderRadius: 999,
    padding: '7px 10px',
    background: `${color}14`,
    color,
    fontSize: 12,
    fontWeight: 850,
  };
}

function customerDecisionBadge(
  decision: OrderRecord['customer_decision']
): CSSProperties {
  const color =
    decision === 'accepted'
      ? '#9dffc4'
      : decision === 'declined'
        ? '#ff8fb3'
        : '#ffe083';

  return compactBadge(color);
}

function paymentBadge(status: PaymentStatus): CSSProperties {
  const color =
    status === 'paid'
      ? '#9dffc4'
      : status === 'failed'
        ? '#ff8fb3'
        : status === 'refunded'
          ? '#7ed7ff'
          : status === 'pending'
            ? '#ffe083'
            : '#b9c4c0';

  return compactBadge(color);
}

function compactBadge(color: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    border: `1px solid ${color}55`,
    borderRadius: 999,
    padding: '7px 10px',
    background: `${color}14`,
    color,
    fontSize: 12,
    fontWeight: 850,
  };
}

function pipelineTabButtonStyle(
  stage: PipelineStage,
  active: boolean
): CSSProperties {
  const color =
    stage === 'waiting_customer'
      ? '#ffe083'
      : stage === 'production'
        ? '#7ed7ff'
        : stage === 'archive'
          ? '#b9c4c0'
          : '#9dffc4';

  return {
    ...secondaryButton,
    minWidth: stage === 'pre_production' ? 182 : 146,
    justifyContent: 'space-between',
    borderColor: active ? `${color}66` : 'rgba(255,255,255,0.14)',
    background: active ? `${color}18` : secondaryButton.background,
    color: active ? color : '#f5f7f8',
  };
}

function archiveTabButtonStyle(
  filter: ArchiveFilter,
  active: boolean
): CSSProperties {
  const color =
    filter === 'customer_declined'
      ? '#ff8fb3'
      : filter === 'team_declined'
        ? '#ff9f6e'
        : filter === 'completed'
          ? '#7ed7ff'
          : '#b9c4c0';

  return {
    ...secondaryButton,
    padding: '9px 12px',
    fontSize: 13,
    justifyContent: 'space-between',
    borderColor: active ? `${color}66` : 'rgba(255,255,255,0.14)',
    background: active ? `${color}18` : secondaryButton.background,
    color: active ? color : '#f5f7f8',
  };
}

function actionButtonStyle(
  variant: 'primary' | 'secondary' | 'danger',
  disabled: boolean
): CSSProperties {
  const base =
    variant === 'primary'
      ? primaryButton
      : variant === 'danger'
        ? dangerButton
        : secondaryButton;

  return {
    ...base,
    opacity: disabled ? 0.68 : 1,
  };
}

function detailSectionToggle(active: boolean): CSSProperties {
  return {
    ...secondaryButton,
    borderColor: active
      ? 'rgba(0,255,136,0.34)'
      : 'rgba(255,255,255,0.12)',
    background: active
      ? 'rgba(0,255,136,0.10)'
      : 'rgba(255,255,255,0.04)',
    color: active ? '#9dffc4' : '#f5f7f8',
    padding: '10px 14px',
    borderRadius: 14,
  };
}

function workflowDot(complete: boolean): CSSProperties {
  return {
    width: 13,
    height: 13,
    borderRadius: 999,
    marginTop: 4,
    background: complete ? '#9dffc4' : 'rgba(245,247,248,0.26)',
    boxShadow: complete
      ? '0 0 22px rgba(157,255,196,0.42)'
      : 'none',
    flex: '0 0 auto',
  };
}
