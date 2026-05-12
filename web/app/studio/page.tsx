'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  calculatePricing,
  costBreakdownLabels,
  defaultPricingSettings,
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
  | 'sent_to_production'
  | 'declined'
  | 'completed';

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
};

type OrderEditForm = {
  revised_price_eur: string;
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

const pricingSettingLabels: Array<[PricingSettingKey, string]> = [
  ['blank_shirt_eur', 'Blank shirt cost'],
  ['backing_eur', 'Backing'],
  ['thread_and_bobbin_base_eur', 'Thread and bobbin'],
  ['needle_wear_eur', 'Needle wear'],
  ['electricity_eur', 'Electricity'],
  ['packaging_eur', 'Packaging'],
  ['waste_buffer_eur', 'Waste buffer'],
  ['studio_payback_eur', 'Studio payback'],
  ['labor_base_eur', 'Labor'],
  ['color_complexity_eur', 'Color complexity'],
  ['target_margin_percent', 'Target margin percent'],
  ['min_price_left_chest_eur', 'Minimum left chest price'],
  ['min_price_center_front_eur', 'Minimum center front price'],
];

const orderStatuses: Array<{
  value: OrderStatus | 'all';
  label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent_to_production', label: 'Production' },
  { value: 'declined', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
];

const statusLabels: Record<OrderStatus, string> = {
  new: 'New',
  needs_review: 'Needs review',
  approved: 'Approved',
  sent_to_production: 'Sent to production',
  declined: 'Declined',
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

const statusToastLabels: Record<OrderStatus, string> = {
  new: 'Order updated',
  needs_review: 'Order updated',
  approved: 'Order approved',
  sent_to_production: 'Sent to production',
  declined: 'Order declined',
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

function getEffectiveCustomerPrice(order: OrderRecord) {
  return order.revised_price_eur ?? order.customer_price_eur;
}

function formatOrderCustomerPrice(order: OrderRecord) {
  const price = getEffectiveCustomerPrice(order);

  return order.manual_quote && price === null
    ? 'Manual quote'
    : formatMoney(price);
}

function getCustomerOrderLink(publicToken: string) {
  return `${publicSiteUrl}/order/${publicToken}`;
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
  return pricingSettingLabels.reduce((form, [key]) => {
    form[key] = String(settings[key]);
    return form;
  }, {} as PricingSettingsForm);
}

const emptyOrderEditForm: OrderEditForm = {
  revised_price_eur: '',
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

  return {
    revised_price_eur:
      order.revised_price_eur === null
        ? ''
        : String(order.revised_price_eur),
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

function parseCostBreakdownForm(form: CostBreakdownForm) {
  const parsed = {} as CostBreakdown;

  for (const key of costBreakdownKeys) {
    const raw = form[key]?.trim() ?? '';
    const value = Number(raw);

    if (!raw || !Number.isFinite(value) || value < 0) {
      return null;
    }

    parsed[key] = Number(value.toFixed(2));
  }

  return parsed;
}

function parsePricingSettingsForm(form: PricingSettingsForm) {
  const parsed: Partial<Record<PricingSettingKey, number>> = {};

  for (const [key] of pricingSettingLabels) {
    const raw = form[key]?.trim() ?? '';
    const value = Number(raw);

    if (!raw || !Number.isFinite(value) || value < 0) {
      return null;
    }

    parsed[key] = value;
  }

  const targetMargin = parsed.target_margin_percent;

  if (
    targetMargin === undefined ||
    targetMargin <= 0 ||
    targetMargin >= 100
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
  const [orderStatusFilter, setOrderStatusFilter] =
    useState<OrderStatus | 'all'>('all');
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
    setOfferEmailStatus('');
    setOfferEmailError('');
  };

  const loadOrders = async (
    filter: OrderStatus | 'all' = orderStatusFilter
  ) => {
    setOrdersLoading(true);
    setOrdersError('');

    try {
      const query = filter === 'all' ? '' : `?status=${filter}`;
      const response = await fetch(`/api/orders${query}`, {
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
      const nextSelected = selectedOrder
        ? (nextOrders.find(
            (order) => order.id === selectedOrder.id
          ) ?? nextOrders[0] ?? null)
        : (nextOrders[0] ?? null);

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

  const changeOrderStatus = async (
    order: OrderRecord,
    nextStatus: OrderStatus
  ) => {
    setOrdersError('');

    if (
      nextStatus === 'declined' &&
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

      selectOrder(updatedOrder);
      updateStoredOrder(updatedOrder);
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
        'Pricing settings must be non-negative numbers and margin must be between 0 and 100.';
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
    const costBreakdown = parseCostBreakdownForm(
      orderEditForm.cost_breakdown
    );

    if (revisedPrice === undefined) {
      const message =
        'Revised price must be a non-negative number.';
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
        revised_price_eur: number | null;
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

      setOrderEditStatus('Order details saved.');
      setSelectedOrder(updatedOrder);
      setOrderEditForm(
        getOrderEditForm(updatedOrder, pricingSettings)
      );
      updateStoredOrder(updatedOrder);
      showToast('Saved');
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
    } catch {
      setCustomerLinkStatus('Could not copy the customer link.');
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

      updateStoredOrder(payload.order);
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
          statusFilter={orderStatusFilter}
          loading={ordersLoading}
          error={ordersError}
          orderEditForm={orderEditForm}
          orderEditError={orderEditError}
          orderEditStatus={orderEditStatus}
          savingOrder={isSavingOrder}
          statusActionLoading={statusActionLoading}
          customerLinkStatus={customerLinkStatus}
          emailConfigured={emailConfigured}
          sendingOfferId={sendingOfferId}
          offerEmailStatus={offerEmailStatus}
          offerEmailError={offerEmailError}
          pricingSettings={pricingSettings}
          onOrderEditChange={updateOrderEditField}
          onOrderCostBreakdownChange={updateOrderCostBreakdownField}
          onSaveOrderDetails={saveOrderDetails}
          onCopyCustomerLink={copyCustomerLink}
          onSendOfferToCustomer={sendOfferToCustomer}
          onFilterChange={(nextFilter) => {
            setOrderStatusFilter(nextFilter);
            void loadOrders(nextFilter);
          }}
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
                  : `€${publicQuote.price_eur}`
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
  onRefresh,
}: {
  form: PricingSettingsForm;
  loading: boolean;
  saving: boolean;
  status: string;
  error: string;
  onChange: (field: PricingSettingKey, value: string) => void;
  onSave: () => void;
  onRefresh: () => void;
}) {
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

      <div style={panel}>
        <p style={mutedText}>
          These values are used for new public orders and studio
          quote calculations. Saved orders keep their own pricing
          snapshot until the team edits their cost breakdown.
        </p>
        {loading && <p style={successText}>Loading settings...</p>}
        <div style={controlGrid}>
          {pricingSettingLabels.map(([key, label]) => (
            <label key={key} style={fieldLabel}>
              {label}
              <input
                value={form[key]}
                onChange={(event) =>
                  onChange(key, event.target.value)
                }
                inputMode="decimal"
                style={inputStyle}
              />
            </label>
          ))}
        </div>
        <div style={orderActions}>
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
        </div>
        {error && <p style={errorText}>{error}</p>}
        {status && <p style={successText}>{status}</p>}
      </div>
    </section>
  );
}

function OrdersDashboard({
  orders,
  selectedOrder,
  statusFilter,
  loading,
  error,
  orderEditForm,
  orderEditError,
  orderEditStatus,
  savingOrder,
  statusActionLoading,
  customerLinkStatus,
  emailConfigured,
  sendingOfferId,
  offerEmailStatus,
  offerEmailError,
  pricingSettings,
  onOrderEditChange,
  onOrderCostBreakdownChange,
  onSaveOrderDetails,
  onCopyCustomerLink,
  onSendOfferToCustomer,
  onFilterChange,
  onSelectOrder,
  onRefresh,
  onChangeStatus,
}: {
  orders: OrderRecord[];
  selectedOrder: OrderRecord | null;
  statusFilter: OrderStatus | 'all';
  loading: boolean;
  error: string;
  orderEditForm: OrderEditForm;
  orderEditError: string;
  orderEditStatus: string;
  savingOrder: boolean;
  statusActionLoading: OrderStatus | null;
  customerLinkStatus: string;
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
  onCopyCustomerLink: (order: OrderRecord) => void;
  onSendOfferToCustomer: (order: OrderRecord) => void;
  onFilterChange: (value: OrderStatus | 'all') => void;
  onSelectOrder: (order: OrderRecord) => void;
  onRefresh: () => void;
  onChangeStatus: (
    order: OrderRecord,
    status: OrderStatus
  ) => void;
}) {
  const parsedCostBreakdown = parseCostBreakdownForm(
    orderEditForm.cost_breakdown
  );
  const parsedRevisedPrice = parseEditableMoney(
    orderEditForm.revised_price_eur
  );
  const previewPricing =
    selectedOrder &&
    parsedCostBreakdown &&
    parsedRevisedPrice !== undefined
      ? calculatePricing({
          stitches: selectedOrder.stitches,
          colors: selectedOrder.colors,
          placement: selectedOrder.placement,
          settings: pricingSettings,
          costBreakdown: parsedCostBreakdown,
          revisedPrice: parsedRevisedPrice,
        })
      : null;
  const previewCustomerPrice =
    previewPricing && parsedRevisedPrice !== undefined
      ? parsedRevisedPrice ?? previewPricing.customer_price_eur
      : selectedOrder
        ? getEffectiveCustomerPrice(selectedOrder)
        : null;
  const previewManualQuote =
    previewPricing?.manual_quote ?? selectedOrder?.manual_quote ?? false;

  return (
    <section style={ordersShell}>
      <div style={ordersToolbar}>
        <div>
          <p style={eyebrow}>Orders</p>
          <h2 style={panelTitle}>Customer requests</h2>
        </div>
        <div style={headerActions}>
          <select
            value={statusFilter}
            onChange={(event) =>
              onFilterChange(
                event.target.value as OrderStatus | 'all'
              )
            }
            style={{
              ...inputStyle,
              width: 190,
            }}
          >
            {orderStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRefresh}
            style={secondaryButton}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <p style={warningCard}>{error}</p>}
      {emailConfigured === false && (
        <p style={warningCard}>
          Email not configured. Copy customer link manually.
        </p>
      )}
      {loading && <p style={successText}>Loading orders...</p>}

      {!loading && !error && orders.length === 0 && (
        <div style={panel}>
          <p style={mutedText}>
            No orders yet. New customer requests will appear here
            after the database is configured and customers submit the
            request form.
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div style={ordersGrid}>
          <div style={ordersList}>
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order)}
                style={{
                  ...orderCard,
                  borderColor:
                    selectedOrder?.id === order.id
                      ? 'rgba(0,255,136,0.42)'
                      : 'rgba(255,255,255,0.10)',
                }}
              >
                <div style={orderCardHeader}>
                  <span style={statusBadge(order.status)}>
                    {statusLabels[order.status]}
                  </span>
                  <span style={tinyText}>
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                <strong style={{ color: '#f5f7f8' }}>
                  {order.customer_name}
                </strong>
                <span style={mutedText}>{order.customer_email}</span>
                <div style={orderMiniGrid}>
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
                  <Meta label="Colors" value={String(order.colors)} />
                  <Meta
                    label="Customer price"
                    value={formatOrderCustomerPrice(order)}
                  />
                  <Meta
                    label="Profit"
                    value={formatMoney(order.estimated_profit_eur)}
                  />
                </div>
              </button>
            ))}
          </div>

          {selectedOrder && (
            <div style={panel}>
              <div style={orderDetailHeader}>
                <div>
                  <p style={eyebrow}>Order detail</p>
                  <h2 style={panelTitle}>
                    {selectedOrder.customer_name}
                  </h2>
                  <p style={mutedText}>
                    {selectedOrder.customer_email}
                    {selectedOrder.customer_phone
                      ? ` · ${selectedOrder.customer_phone}`
                      : ''}
                  </p>
                </div>
                <span style={statusBadge(selectedOrder.status)}>
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>

              <div style={orderDetailGrid}>
                <div style={previewBox}>
                  {selectedOrder.logo_preview_url ? (
                    <div
                      style={{
                        ...logoPreview,
                        backgroundImage: `url(${selectedOrder.logo_preview_url})`,
                      }}
                    />
                  ) : (
                    <span style={mutedText}>No logo preview</span>
                  )}
                </div>
                <div style={noteStack}>
                  <Meta
                    label="Placement"
                    value={formatPlacement(selectedOrder.placement)}
                  />
                  <Meta
                    label="Shirt"
                    value={formatOrderValue(selectedOrder.shirt_color)}
                  />
                  <Meta
                    label="Quantity"
                    value={String(selectedOrder.quantity ?? 1)}
                  />
                  <Meta
                    label="Manual quote"
                    value={selectedOrder.manual_quote ? 'Yes' : 'No'}
                  />
                  <Meta
                    label="Customer response"
                    value={
                      customerDecisionLabels[
                        selectedOrder.customer_decision
                      ]
                    }
                  />
                  <Meta
                    label="Responded at"
                    value={
                      selectedOrder.customer_decision_at
                        ? new Date(
                            selectedOrder.customer_decision_at
                          ).toLocaleString()
                        : 'Pending'
                    }
                  />
                  <Meta
                    label="Offer sent"
                    value={
                      selectedOrder.offer_sent_at
                        ? new Date(
                            selectedOrder.offer_sent_at
                          ).toLocaleString()
                        : 'Not sent'
                    }
                  />
                  <Meta
                    label="Team notified"
                    value={
                      selectedOrder.team_notified_at
                        ? new Date(
                            selectedOrder.team_notified_at
                          ).toLocaleString()
                        : 'Not sent'
                    }
                  />
                </div>
              </div>

              {selectedOrder.prompt && (
                <p style={recommendationCard}>
                  Design idea: {selectedOrder.prompt}
                </p>
              )}
              {selectedOrder.note && (
                <p style={recommendationCard}>
                  Customer note: {selectedOrder.note}
                </p>
              )}
              {selectedOrder.team_notification_error && (
                <p style={warningCard}>
                  Team notification warning:
                  {' '}
                  {selectedOrder.team_notification_error}
                </p>
              )}

              <section style={metricGrid}>
                <Metric
                  label="Stitches"
                  value={selectedOrder.stitches.toLocaleString()}
                />
                <Metric label="Colors" value={selectedOrder.colors} />
                <Metric
                  label="Coverage"
                  value={`${(selectedOrder.coverage * 100).toFixed(1)}%`}
                />
                <Metric
                  label="Customer price"
                  value={
                    previewManualQuote && previewCustomerPrice === null
                      ? 'Manual quote'
                      : formatMoney(previewCustomerPrice)
                  }
                />
                <Metric
                  label="Internal cost"
                  value={formatMoney(
                    previewPricing?.internal_cost_eur ??
                      selectedOrder.internal_cost_eur
                  )}
                />
                <Metric
                  label="Profit"
                  value={formatMoney(
                    previewPricing
                      ? previewPricing.estimated_profit_eur
                      : selectedOrder.estimated_profit_eur
                  )}
                />
                <Metric
                  label="Margin"
                  value={
                    (previewPricing
                      ? previewPricing.profit_margin_percent
                      : selectedOrder.profit_margin_percent) === null
                      ? 'Pending'
                      : `${
                          previewPricing
                            ? previewPricing.profit_margin_percent
                            : selectedOrder.profit_margin_percent
                        }%`
                  }
                />
              </section>

              <div style={editPanel}>
                <h3 style={panelTitle}>Offer details</h3>
                {selectedOrder.public_token ? (
                  <div style={customerLinkBox}>
                    <span style={mutedText}>
                      {getCustomerOrderLink(
                        selectedOrder.public_token
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onCopyCustomerLink(selectedOrder)
                      }
                      style={secondaryButton}
                    >
                      Copy link
                    </button>
                    {customerLinkStatus && (
                      <span style={tinyText}>
                        {customerLinkStatus}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onSendOfferToCustomer(selectedOrder)
                      }
                      disabled={
                        emailConfigured !== true ||
                        sendingOfferId === selectedOrder.id
                      }
                      style={{
                        ...primaryButton,
                        opacity:
                          emailConfigured !== true ||
                          sendingOfferId === selectedOrder.id
                            ? 0.68
                            : 1,
                      }}
                    >
                      {sendingOfferId === selectedOrder.id
                        ? 'Sending...'
                        : 'Send offer to customer'}
                    </button>
                  </div>
                ) : (
                  <p style={warningCard}>
                    Customer link unavailable. Apply the public token
                    database migration for existing orders.
                  </p>
                )}
                {emailConfigured === false && (
                  <p style={warningCard}>
                    Email not configured. Copy customer link manually.
                  </p>
                )}
                {offerEmailStatus && (
                  <p style={successText}>{offerEmailStatus}</p>
                )}
                {offerEmailError && (
                  <p style={errorText}>{offerEmailError}</p>
                )}
                <div style={controlGrid}>
                  <label style={fieldLabel}>
                    Revised price EUR
                    <input
                      value={orderEditForm.revised_price_eur}
                      onChange={(event) =>
                        onOrderEditChange(
                          'revised_price_eur',
                          event.target.value
                        )
                      }
                      placeholder="Leave empty to use customer price"
                      inputMode="decimal"
                      style={inputStyle}
                    />
                  </label>
                  <div style={metaCard}>
                    <span style={mutedText}>
                      Suggested customer price:
                    </span>
                    <strong>
                      {previewManualQuote &&
                      previewPricing?.customer_price_eur === null
                        ? 'Manual quote'
                        : formatMoney(
                            previewPricing?.customer_price_eur ??
                              selectedOrder.customer_price_eur
                          )}
                    </strong>
                  </div>
                  <label style={fieldLabel}>
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
                </div>
                <div style={editSubsection}>
                  <h4 style={sectionMiniTitle}>
                    Internal cost breakdown
                  </h4>
                  <div style={controlGrid}>
                    {costBreakdownLabels.map(([key, label]) => (
                      <label key={key} style={fieldLabel}>
                        {label}
                        <input
                          value={orderEditForm.cost_breakdown[key]}
                          onChange={(event) =>
                            onOrderCostBreakdownChange(
                              key,
                              event.target.value
                            )
                          }
                          inputMode="decimal"
                          style={inputStyle}
                        />
                      </label>
                    ))}
                  </div>
                </div>
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
                    placeholder="Message for the team"
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={onSaveOrderDetails}
                  disabled={savingOrder}
                  style={{
                    ...primaryButton,
                    opacity: savingOrder ? 0.68 : 1,
                  }}
                >
                  {savingOrder ? 'Saving...' : 'Save details'}
                </button>
                {orderEditError && (
                  <p style={errorText}>{orderEditError}</p>
                )}
                {orderEditStatus && (
                  <p style={successText}>{orderEditStatus}</p>
                )}
              </div>

              <div style={workspaceGrid}>
                <div style={panel}>
                  <h3 style={panelTitle}>Warnings</h3>
                  <div style={noteStack}>
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

                <div style={panel}>
                  <h3 style={panelTitle}>Recommendations</h3>
                  <div style={noteStack}>
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

              <div style={panel}>
                <h3 style={panelTitle}>Cost breakdown</h3>
                <div style={breakdownTable}>
                  {costBreakdownLabels.map(([key, label]) => (
                    <div key={key} style={breakdownRow}>
                      <span>{label}</span>
                      <strong>
                        €
                        {(
                          parsedCostBreakdown?.[key] ??
                          selectedOrder.cost_breakdown[key]
                        ).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={orderActions}>
                <button
                  type="button"
                  onClick={() =>
                    onChangeStatus(selectedOrder, 'approved')
                  }
                  disabled={statusActionLoading !== null}
                  style={{
                    ...primaryButton,
                    opacity: statusActionLoading ? 0.68 : 1,
                  }}
                >
                  {statusActionLoading === 'approved'
                    ? 'Approving...'
                    : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeStatus(selectedOrder, 'sent_to_production')
                  }
                  disabled={statusActionLoading !== null}
                  style={{
                    ...secondaryButton,
                    opacity: statusActionLoading ? 0.68 : 1,
                  }}
                >
                  {statusActionLoading === 'sent_to_production'
                    ? 'Sending...'
                    : 'Send to production'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeStatus(selectedOrder, 'declined')
                  }
                  disabled={statusActionLoading !== null}
                  style={{
                    ...secondaryButton,
                    opacity: statusActionLoading ? 0.68 : 1,
                  }}
                >
                  {statusActionLoading === 'declined'
                    ? 'Declining...'
                    : 'Decline'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeStatus(selectedOrder, 'completed')
                  }
                  disabled={statusActionLoading !== null}
                  style={{
                    ...secondaryButton,
                    opacity: statusActionLoading ? 0.68 : 1,
                  }}
                >
                  {statusActionLoading === 'completed'
                    ? 'Marking...'
                    : 'Mark completed'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
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

const panel: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 28,
  padding: 'clamp(22px, 3vw, 32px)',
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))',
  boxShadow: '0 30px 90px rgba(0,0,0,0.34)',
};

const editPanel: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 22,
  padding: 20,
  background: 'rgba(0,0,0,0.22)',
  marginBottom: 20,
};

const editSubsection: CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.08)',
  marginTop: 4,
  paddingTop: 18,
};

const customerLinkBox: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(255,255,255,0.04)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 16,
};

const panelTitle: CSSProperties = {
  margin: '0 0 18px',
  fontSize: 22,
};

const sectionMiniTitle: CSSProperties = {
  margin: '0 0 14px',
  fontSize: 16,
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

const orderMiniGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 10,
};

const orderDetailHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 18,
  flexWrap: 'wrap',
  marginBottom: 18,
};

const orderDetailGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: 16,
  marginBottom: 18,
};

const orderActions: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 16,
};

function statusBadge(status: OrderStatus): CSSProperties {
  const color =
    status === 'declined'
      ? '#ff9d9d'
      : status === 'completed'
        ? '#00c8ff'
        : status === 'needs_review'
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
