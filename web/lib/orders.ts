import {
  calculatePricing,
  defaultPricingSettings,
  normalizeCostBreakdown,
  normalizePricingSettings,
  type CostBreakdown,
  type PricingSettings,
} from './pricing';

export const ORDER_STATUSES = [
  'new',
  'needs_review',
  'approved',
  'offer_sent',
  'change_requested',
  'customer_accepted',
  'pre_production',
  'sent_to_production',
  'customer_declined',
  'customer_cancelled',
  'team_declined',
  'completed',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CUSTOMER_DECISIONS = [
  'pending',
  'accepted',
  'declined',
  'change_requested',
  'cancelled',
] as const;

export type CustomerDecision = (typeof CUSTOMER_DECISIONS)[number];

export const PAYMENT_STATUSES = [
  'unpaid',
  'pending',
  'paid',
  'failed',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type OrderRecord = {
  id: string;
  created_at: string;
  updated_at: string;
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
  design_config: OrderDesignConfig | null;
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
  customer_decision: CustomerDecision;
  customer_decision_at: string | null;
  customer_viewed_at: string | null;
  offer_sent_at: string | null;
  team_notified_at: string | null;
  team_notification_error: string | null;
  proposed_price_eur: number | null;
  requested_quantity: number | null;
  customer_change_note: string | null;
  wants_logo_change: boolean;
  change_requested_at: string | null;
  cancelled_at: string | null;
  payment_status: PaymentStatus;
  payment_requested_at: string | null;
  payment_completed_at: string | null;
  payment_provider: string | null;
  payment_session_id: string | null;
  completed_at: string | null;
  archived_at: string | null;
  archive_reason: string | null;
};

export type OrderDesignConfig = {
  placement?: string;
  placement_zone?: string;
  logo_position_x?: number;
  logo_position_y?: number;
  logo_width_mm?: number;
  logo_height_mm?: number;
  logo_scale?: number;
  shirt_color?: string;
};

export type CreateOrderInput = {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  quantity: number;
  note?: string;
  prompt?: string;
  placement: string;
  shirt_color: string;
  logo_preview_url?: string;
  design_config?: OrderDesignConfig | null;
  stitches: number;
  colors: number;
  coverage: number;
  customer_price_eur?: number | null;
  pricing_tier?: string;
  manual_quote?: boolean;
  warnings?: string[];
  recommendations?: string[];
};

export type PublicOrderValidationErrors = Partial<
  Record<
    | 'customer_name'
    | 'customer_email'
    | 'customer_phone'
    | 'quantity',
    string
  >
>;

export type PublicOrderRecord = {
  public_token: string;
  status: OrderStatus;
  logo_preview_url: string | null;
  placement: string;
  shirt_color: string;
  quantity: number | null;
  customer_price_eur: number | null;
  revised_price_eur: number | null;
  manual_quote: boolean;
  team_message: string | null;
  customer_decision: CustomerDecision;
  proposed_price_eur: number | null;
  requested_quantity: number | null;
  customer_change_note: string | null;
  wants_logo_change: boolean;
  payment_status: PaymentStatus;
};

const publicOrderSelect = [
  'public_token',
  'status',
  'logo_preview_url',
  'placement',
  'shirt_color',
  'quantity',
  'customer_price_eur',
  'revised_price_eur',
  'manual_quote',
  'team_message',
  'customer_decision',
  'proposed_price_eur',
  'requested_quantity',
  'customer_change_note',
  'wants_logo_change',
  'payment_status',
].join(',');

const publicOrderSelectFallbacks = [
  publicOrderSelect,
  [
    'public_token',
    'status',
    'logo_preview_url',
    'placement',
    'shirt_color',
    'quantity',
    'customer_price_eur',
    'revised_price_eur',
    'manual_quote',
    'team_message',
    'customer_decision',
    'payment_status',
  ].join(','),
  [
    'public_token',
    'status',
    'logo_preview_url',
    'placement',
    'shirt_color',
    'quantity',
    'customer_price_eur',
    'revised_price_eur',
    'manual_quote',
    'team_message',
    'customer_decision',
  ].join(','),
  [
    'public_token',
    'status',
    'logo_preview_url',
    'placement',
    'shirt_color',
    'quantity',
    'customer_price_eur',
    'customer_decision',
  ].join(','),
];

const pricingSettingsSelect = [
  'stitch_cost_per_1000_eur',
  'blank_shirt_eur',
  'backing_eur',
  'thread_and_bobbin_base_eur',
  'needle_wear_eur',
  'electricity_eur',
  'packaging_eur',
  'waste_buffer_eur',
  'studio_payback_eur',
  'labor_base_eur',
  'color_complexity_eur',
  'target_margin_percent',
  'min_price_left_chest_eur',
  'min_price_center_front_eur',
  'manual_quote_review_fee_eur',
  'round_mode',
].join(',');

const emailPattern =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const phonePattern = /^[+\d\s()-]+$/;
const publicSiteUrl = 'https://stitchra.com';

function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim() ?? '';
}

function getFromEmail() {
  return process.env.FROM_EMAIL?.trim() ?? '';
}

function getReplyToEmail() {
  return process.env.REPLY_TO_EMAIL?.trim() ?? '';
}

function getTeamEmail() {
  return process.env.TEAM_EMAIL?.trim() ?? '';
}

export function isOfferEmailConfigured() {
  return Boolean(getResendApiKey() && getFromEmail());
}

function hasOwn(
  value: object,
  key: string
): value is Record<string, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function validatePublicOrderFields(value: {
  customer_name?: unknown;
  customer_email?: unknown;
  customer_phone?: unknown;
  quantity?: unknown;
}) {
  const errors: PublicOrderValidationErrors = {};
  const name =
    typeof value.customer_name === 'string'
      ? value.customer_name.trim()
      : '';
  const email =
    typeof value.customer_email === 'string'
      ? value.customer_email.trim()
      : '';
  const phone =
    typeof value.customer_phone === 'string'
      ? value.customer_phone.trim()
      : '';
  const quantityValue = value.quantity;
  const quantity =
    typeof quantityValue === 'number'
      ? quantityValue
      : typeof quantityValue === 'string' &&
          quantityValue.trim().length > 0
        ? Number(quantityValue)
        : null;

  if (!name) {
    errors.customer_name = 'Customer name is required.';
  }

  if (!email) {
    errors.customer_email = 'Customer email is required.';
  } else if (!emailPattern.test(email)) {
    errors.customer_email = 'Enter a valid email address.';
  }

  if (
    value.customer_phone !== undefined &&
    value.customer_phone !== null &&
    typeof value.customer_phone !== 'string'
  ) {
    errors.customer_phone = 'Enter a valid phone number.';
  } else if (phone) {
    const digitCount = phone.replace(/\D/g, '').length;

    if (!phonePattern.test(phone) || digitCount < 7) {
      errors.customer_phone =
        'Enter a valid phone number with at least 7 digits.';
    }
  }

  if (quantity === null) {
    errors.quantity = 'Quantity is required.';
  } else if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = 'Quantity must be at least 1.';
  }

  return errors;
}

type SupabaseOrderRow = Record<string, unknown>;

function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ''
  ).replace(/\/+$/, '');
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
}

export function isDatabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export function getStudioPasscode() {
  return (
    process.env.NEXT_PUBLIC_STUDIO_PASSCODE ??
    (process.env.NODE_ENV === 'development' ? 'stitchra-dev' : '')
  );
}

export function isStudioRequest(request: Request) {
  const passcode = getStudioPasscode();

  if (!passcode) {
    return false;
  }

  return request.headers.get('x-studio-passcode') === passcode;
}

export function getOrderErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown order storage error.';
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      return value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function parseOrderDesignConfig(value: unknown): OrderDesignConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const config: OrderDesignConfig = {};

  if (typeof source.placement_zone === 'string') {
    config.placement_zone = source.placement_zone;
  }

  if (typeof source.placement === 'string') {
    config.placement = source.placement;
  }

  if (typeof source.shirt_color === 'string') {
    config.shirt_color = source.shirt_color;
  }

  for (const key of [
    'logo_position_x',
    'logo_position_y',
    'logo_width_mm',
    'logo_height_mm',
    'logo_scale',
  ] as const) {
    const parsedValue = parseNumber(source[key]);

    if (parsedValue !== null) {
      config[key] = parsedValue;
    }
  }

  return Object.keys(config).length > 0 ? config : null;
}

function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseDate(value: unknown) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseCustomerDecision(value: unknown): CustomerDecision {
  return CUSTOMER_DECISIONS.includes(value as CustomerDecision)
    ? (value as CustomerDecision)
    : 'pending';
}

function parseStatus(row: SupabaseOrderRow): OrderStatus {
  const status = row.status;

  if (ORDER_STATUSES.includes(status as OrderStatus)) {
    return status as OrderStatus;
  }

  if (status === 'declined') {
    return parseCustomerDecision(row.customer_decision) === 'declined'
      ? 'customer_declined'
      : 'team_declined';
  }

  return 'new';
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return Boolean(value);
}

function parsePaymentStatus(value: unknown): PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : 'unpaid';
}

function getTokenPrefix(token: string) {
  return token.slice(0, 8);
}

function getMissingOrderColumn(error: unknown) {
  const message = getOrderErrorMessage(error);
  const quotedColumn = message.match(/'([A-Za-z0-9_]+)' column/);

  if (quotedColumn?.[1]) {
    return quotedColumn[1];
  }

  const qualifiedColumn = message.match(
    /orders\.([A-Za-z0-9_]+)\s+(?:does not exist|not found)/i
  );

  if (qualifiedColumn?.[1]) {
    return qualifiedColumn[1];
  }

  const plainColumn = message.match(
    /column\s+["']?([A-Za-z0-9_]+)["']?\s+(?:does not exist|not found)/i
  );

  return plainColumn?.[1] ?? null;
}

function isMissingOrderColumnError(error: unknown) {
  return Boolean(getMissingOrderColumn(error));
}

function createPublicToken() {
  return globalThis.crypto.randomUUID().replace(/-/g, '');
}

function parsePricingSettings(row: SupabaseOrderRow): PricingSettings {
  return normalizePricingSettings(row);
}

function parseOrder(
  row: SupabaseOrderRow,
  pricingSettings: PricingSettings = defaultPricingSettings
): OrderRecord {
  const productionNotes = row.production_notes;

  return {
    id: String(row.id),
    created_at: new Date(String(row.created_at)).toISOString(),
    updated_at: new Date(
      String(row.updated_at ?? row.created_at)
    ).toISOString(),
    public_token: row.public_token
      ? String(row.public_token)
      : null,
    customer_name: String(row.customer_name),
    customer_email: String(row.customer_email),
    customer_phone: row.customer_phone
      ? String(row.customer_phone)
      : null,
    quantity:
      row.quantity === null || row.quantity === undefined
        ? null
        : Number(row.quantity),
    note:
      row.customer_note || row.note
        ? String(row.customer_note ?? row.note)
        : null,
    prompt: row.prompt ? String(row.prompt) : null,
    placement: String(row.placement),
    shirt_color: String(row.shirt_color),
    logo_preview_url: row.logo_preview_url
      ? String(row.logo_preview_url)
      : null,
    design_config: parseOrderDesignConfig(row.design_config),
    stitches: Number(row.stitches),
    colors: Number(row.colors),
    coverage: Number(row.coverage),
    customer_price_eur: parseNumber(row.customer_price_eur),
    revised_price_eur: parseNumber(row.revised_price_eur),
    internal_cost_eur: parseNumber(row.internal_cost_eur),
    estimated_profit_eur: parseNumber(row.estimated_profit_eur),
    profit_margin_percent: parseNumber(row.profit_margin_percent),
    pricing_tier: String(row.pricing_tier),
    manual_quote: Boolean(row.manual_quote),
    warnings: parseJsonArray(row.warnings),
    recommendations: parseJsonArray(row.recommendations),
    production_notes:
      typeof productionNotes === 'string' &&
      productionNotes.trim().length > 0
        ? productionNotes
            .split('\n')
            .map((note) => note.trim())
            .filter(Boolean)
        : parseJsonArray(productionNotes),
    team_message: row.team_message
      ? String(row.team_message)
      : null,
    cost_breakdown: normalizeCostBreakdown(
      row.cost_breakdown,
      pricingSettings,
      {
        stitches: Number(row.stitches),
        manualQuote: Boolean(row.manual_quote),
      }
    ),
    status: parseStatus(row),
    customer_decision: parseCustomerDecision(row.customer_decision),
    customer_decision_at: parseDate(row.customer_decision_at),
    customer_viewed_at: parseDate(row.customer_viewed_at),
    offer_sent_at: parseDate(row.offer_sent_at),
    team_notified_at: parseDate(row.team_notified_at),
    team_notification_error: row.team_notification_error
      ? String(row.team_notification_error)
      : null,
    proposed_price_eur: parseNumber(row.proposed_price_eur),
    requested_quantity:
      row.requested_quantity === null ||
      row.requested_quantity === undefined
        ? null
        : Number(row.requested_quantity),
    customer_change_note: row.customer_change_note
      ? String(row.customer_change_note)
      : null,
    wants_logo_change: parseBoolean(row.wants_logo_change),
    change_requested_at: parseDate(row.change_requested_at),
    cancelled_at: parseDate(row.cancelled_at),
    payment_status: parsePaymentStatus(row.payment_status),
    payment_requested_at: parseDate(row.payment_requested_at),
    payment_completed_at: parseDate(row.payment_completed_at),
    payment_provider: row.payment_provider
      ? String(row.payment_provider)
      : null,
    payment_session_id: row.payment_session_id
      ? String(row.payment_session_id)
      : null,
    completed_at: parseDate(row.completed_at),
    archived_at: parseDate(row.archived_at),
    archive_reason: row.archive_reason
      ? String(row.archive_reason)
      : null,
  };
}

function parsePublicOrder(row: SupabaseOrderRow): PublicOrderRecord {
  return {
    public_token: row.public_token ? String(row.public_token) : '',
    status: parseStatus(row),
    logo_preview_url: row.logo_preview_url
      ? String(row.logo_preview_url)
      : null,
    placement: row.placement ? String(row.placement) : 'left_chest',
    shirt_color: row.shirt_color ? String(row.shirt_color) : 'black',
    quantity:
      row.quantity === null || row.quantity === undefined
        ? null
        : Number(row.quantity),
    customer_price_eur: parseNumber(row.customer_price_eur),
    revised_price_eur: parseNumber(row.revised_price_eur),
    manual_quote: Boolean(row.manual_quote),
    team_message: row.team_message
      ? String(row.team_message)
      : null,
    customer_decision: parseCustomerDecision(row.customer_decision),
    proposed_price_eur: parseNumber(row.proposed_price_eur),
    requested_quantity:
      row.requested_quantity === null ||
      row.requested_quantity === undefined
        ? null
        : Number(row.requested_quantity),
    customer_change_note: row.customer_change_note
      ? String(row.customer_change_note)
      : null,
    wants_logo_change: parseBoolean(row.wants_logo_change),
    payment_status: parsePaymentStatus(row.payment_status),
  };
}

function formatSupabaseError(status: number, payload: unknown) {
  if (payload && typeof payload === 'object') {
    const body = payload as {
      code?: string;
      message?: string;
      details?: string;
      hint?: string;
      error?: string;
    };

    return [
      `Supabase orders request failed (${status})`,
      body.code ? `code: ${body.code}` : '',
      body.message ? `message: ${body.message}` : '',
      body.details ? `details: ${body.details}` : '',
      body.hint ? `hint: ${body.hint}` : '',
      body.error ? `error: ${body.error}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
  }

  return `Supabase orders request failed (${status})`;
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {}
) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Database not configured. Missing Supabase URL or service role key.'
    );
  }

  const headers = new Headers(init.headers);
  headers.set('apikey', serviceRoleKey);
  headers.set('Authorization', `Bearer ${serviceRoleKey}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new Error(formatSupabaseError(response.status, payload));
  }

  return payload as T;
}

export async function getPricingSettings() {
  if (!isDatabaseConfigured()) {
    return defaultPricingSettings;
  }

  try {
    const params = new URLSearchParams({
      id: 'eq.default',
      select: pricingSettingsSelect,
    });
    const rows = await supabaseRequest<SupabaseOrderRow[]>(
      `pricing_settings?${params.toString()}`
    );

    return rows[0]
      ? parsePricingSettings(rows[0])
      : defaultPricingSettings;
  } catch {
    return defaultPricingSettings;
  }
}

export async function savePricingSettings(input: PricingSettings) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const settings = normalizePricingSettings(input);
  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    `pricing_settings?on_conflict=id&select=${pricingSettingsSelect}`,
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id: 'default',
        ...settings,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  return rows[0] ? parsePricingSettings(rows[0]) : settings;
}

export async function createOrder(input: CreateOrderInput) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const pricingSettings = await getPricingSettings();
  const pricing = calculatePricing({
    stitches: input.stitches,
    colors: input.colors,
    placement: input.placement,
    settings: pricingSettings,
  });
  const status: OrderStatus = pricing.manual_quote
    ? 'needs_review'
    : 'new';
  const insertBody: Record<string, unknown> = {
    customer_name: input.customer_name,
    public_token: createPublicToken(),
    customer_email: input.customer_email,
    customer_phone: input.customer_phone || null,
    quantity: input.quantity,
    customer_note: input.note || null,
    prompt: input.prompt || null,
    placement: input.placement,
    shirt_color: input.shirt_color,
    logo_preview_url: input.logo_preview_url || null,
    design_config: input.design_config ?? null,
    stitches: input.stitches,
    colors: input.colors,
    coverage: input.coverage,
    customer_price_eur: pricing.customer_price_eur,
    internal_cost_eur: pricing.internal_cost_eur,
    estimated_profit_eur: pricing.estimated_profit_eur,
    profit_margin_percent: pricing.profit_margin_percent,
    pricing_tier: pricing.pricing_tier,
    manual_quote: pricing.manual_quote,
    warnings: input.warnings ?? [],
    recommendations: input.recommendations ?? [],
    production_notes: '',
    cost_breakdown: pricing.cost_breakdown,
    customer_decision: 'pending',
    payment_status: 'unpaid',
    status,
  };
  let rows: SupabaseOrderRow[];

  try {
    rows = await supabaseRequest<SupabaseOrderRow[]>('orders?select=*', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(insertBody),
    });
  } catch (error) {
    if (getMissingOrderColumn(error) === 'design_config') {
      delete insertBody.design_config;
      console.error('[orders.createOrder] optional column unavailable', {
        column: 'design_config',
        error_message: getOrderErrorMessage(error),
      });
      rows = await supabaseRequest<SupabaseOrderRow[]>('orders?select=*', {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify(insertBody),
      });
    } else {
      throw error;
    }
  }

  return rows[0] ? parseOrder(rows[0], pricingSettings) : null;
}

export async function listOrders(status?: string | null) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const pricingSettings = await getPricingSettings();
  const params = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
    limit: '100',
  });

  if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
    params.set('status', `eq.${status}`);
  }

  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    `orders?${params.toString()}`
  );

  return rows.map((row) => parseOrder(row, pricingSettings));
}

export async function getOrderById(id: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const pricingSettings = await getPricingSettings();
  const params = new URLSearchParams({
    id: `eq.${id}`,
    select: '*',
  });

  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    `orders?${params.toString()}`
  );

  return rows[0] ? parseOrder(rows[0], pricingSettings) : null;
}

export async function getOrderByPublicToken(token: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const pricingSettings = await getPricingSettings();
  const params = new URLSearchParams({
    public_token: `eq.${token}`,
    select: '*',
  });

  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    `orders?${params.toString()}`
  );

  return rows[0] ? parseOrder(rows[0], pricingSettings) : null;
}

export function getStripeCheckoutPrice(order: OrderRecord) {
  return (
    order.revised_price_eur ??
    (order.manual_quote ? null : order.customer_price_eur)
  );
}

async function updateOrderPaymentByPublicToken(
  token: string,
  input: {
    payment_status: PaymentStatus;
    payment_provider?: string | null;
    payment_session_id?: string | null;
    payment_requested_at?: string | null;
    payment_completed_at?: string | null;
  }
) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const existingOrder = await getOrderByPublicToken(token);

  if (!existingOrder) {
    return null;
  }

  if (
    existingOrder.payment_status === 'paid' &&
    input.payment_status !== 'paid'
  ) {
    return existingOrder;
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    payment_status: input.payment_status,
    updated_at: now,
  };

  if (hasOwn(input, 'payment_provider')) {
    updates.payment_provider = input.payment_provider;
  }

  if (hasOwn(input, 'payment_session_id')) {
    updates.payment_session_id = input.payment_session_id;
  }

  if (hasOwn(input, 'payment_requested_at')) {
    updates.payment_requested_at = input.payment_requested_at;
  }

  if (hasOwn(input, 'payment_completed_at')) {
    updates.payment_completed_at = input.payment_completed_at;
  }

  if (input.payment_status === 'paid') {
    updates.payment_completed_at =
      input.payment_completed_at ?? now;

    if (
      existingOrder.status === 'customer_accepted' ||
      existingOrder.status === 'pre_production'
    ) {
      updates.status = 'pre_production';
    }
  }

  const params = new URLSearchParams({
    public_token: `eq.${token}`,
    select: '*',
  });
  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    `orders?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
    }
  );
  const pricingSettings = await getPricingSettings();

  return rows[0] ? parseOrder(rows[0], pricingSettings) : null;
}

export async function markStripeCheckoutPending(input: {
  public_token: string;
  session_id: string;
}) {
  return updateOrderPaymentByPublicToken(input.public_token, {
    payment_status: 'pending',
    payment_provider: 'stripe',
    payment_session_id: input.session_id,
    payment_requested_at: new Date().toISOString(),
  });
}

export async function markStripeCheckoutPaid(input: {
  public_token: string;
  session_id: string;
}) {
  return updateOrderPaymentByPublicToken(input.public_token, {
    payment_status: 'paid',
    payment_provider: 'stripe',
    payment_session_id: input.session_id,
    payment_completed_at: new Date().toISOString(),
  });
}

export async function markStripeCheckoutFailed(input: {
  public_token: string;
  session_id?: string | null;
}) {
  const updates: {
    payment_status: PaymentStatus;
    payment_provider: string;
    payment_session_id?: string;
  } = {
    payment_status: 'failed',
    payment_provider: 'stripe',
  };

  if (input.session_id) {
    updates.payment_session_id = input.session_id;
  }

  return updateOrderPaymentByPublicToken(input.public_token, updates);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEmailPrice(value: number | null) {
  return value === null ? 'Manual quote' : `€${value.toFixed(2)}`;
}

function getCustomerFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'there';
}

function getCleanEmailAddress(value: string) {
  return value.trim();
}

function assertValidEmailRecipient(value: string) {
  const email = getCleanEmailAddress(value);

  if (!emailPattern.test(email)) {
    throw new Error('Enter a valid customer email before sending.');
  }

  return email;
}

function formatOrderValue(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPlacement(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === 'left' || normalized.includes('left')) {
    return 'Left chest';
  }

  if (normalized === 'center' || normalized.includes('center')) {
    return 'Center front';
  }

  return formatOrderValue(value);
}

function getSuggestedOrderPrice(
  order: OrderRecord,
  settings: PricingSettings = defaultPricingSettings
) {
  return calculatePricing({
    stitches: order.stitches,
    colors: order.colors,
    placement: order.placement,
    settings,
    costBreakdown: order.cost_breakdown,
  }).suggested_customer_price_eur;
}

function getEffectiveOrderPrice(
  order: OrderRecord,
  settings: PricingSettings = defaultPricingSettings
) {
  return (
    order.revised_price_eur ??
    order.customer_price_eur ??
    (order.manual_quote ? null : getSuggestedOrderPrice(order, settings))
  );
}

function getResendErrorMessage(payload: unknown) {
  const text = JSON.stringify(payload).toLowerCase();

  if (text.includes('invalid_api_key')) {
    return 'Resend API key is invalid. Check RESEND_API_KEY in Vercel and redeploy.';
  }

  if (payload && typeof payload === 'object') {
    const body = payload as {
      message?: string;
      error?: string | { message?: string; name?: string };
    };

    if (typeof body.error === 'object' && body.error?.message) {
      return body.error.message;
    }

    if (typeof body.error === 'string') {
      return body.error;
    }

    if (body.message) {
      return body.message;
    }
  }

  return 'Could not send offer email.';
}

function getResendEmailId(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const body = payload as {
    id?: unknown;
    data?: {
      id?: unknown;
    };
  };

  if (typeof body.id === 'string') {
    return body.id;
  }

  if (typeof body.data?.id === 'string') {
    return body.data.id;
  }

  return null;
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  const resendApiKey = getResendApiKey();
  const fromEmail = getFromEmail();
  const to = getCleanEmailAddress(input.to);
  const replyTo = input.replyTo?.trim();

  if (!resendApiKey || !fromEmail) {
    throw new Error('Email not configured.');
  }

  const body: Record<string, unknown> = {
    from: fromEmail,
    to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  };

  if (replyTo) {
    body.reply_to = replyTo;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;
  const sentAt = new Date().toISOString();

  if (!response.ok) {
    const errorMessage = getResendErrorMessage(payload);

    console.warn('[orders] Resend email failed', {
      to,
      subject: input.subject,
      resend_error_message: errorMessage,
      sent_at: sentAt,
    });

    throw new Error(errorMessage);
  }

  console.info('[orders] Resend email sent', {
    email_id: getResendEmailId(payload),
    to,
    subject: input.subject,
    sent_at: sentAt,
  });
}

function buildCustomerEmailDetailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 11px 0; color: #9caeaa; font-size: 13px; line-height: 18px;">${label}</td>
      <td align="right" style="padding: 11px 0; color: #f4fffb; font-size: 14px; line-height: 18px; font-weight: 700;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function buildTrustRow(text: string) {
  return `
    <tr>
      <td width="26" valign="top" style="padding: 7px 0;">
        <span style="display: inline-block; width: 18px; height: 18px; border-radius: 9px; background-color: #143a2a; color: #8ff5bd; font-size: 12px; line-height: 18px; text-align: center;">&#10003;</span>
      </td>
      <td style="padding: 7px 0; color: #d7e7e2; font-size: 13px; line-height: 19px;">${escapeHtml(text)}</td>
    </tr>
  `;
}

function buildCustomerOfferText(input: {
  order: OrderRecord;
  price: string;
  customerLink: string;
  teamMessage: string;
}) {
  const firstName = getCustomerFirstName(input.order.customer_name);
  const lines = [
    `Hi ${firstName},`,
    '',
    'Your custom embroidery quote is ready to review.',
    '',
    `Final offer price: ${input.price}`,
    `Placement: ${formatPlacement(input.order.placement)}`,
    `Shirt color: ${formatOrderValue(input.order.shirt_color)}`,
    `Quantity: ${input.order.quantity ?? 1}`,
  ];

  if (input.teamMessage) {
    lines.push('', `Message from the studio: ${input.teamMessage}`);
  }

  lines.push(
    '',
    `Review your secure offer: ${input.customerLink}`,
    '',
    'Stitchra Studio',
    'You received this because you requested an embroidery quote on stitchra.com.',
    'Questions? Reply to this email and our studio team will help you.'
  );

  return lines.join('\n');
}

function buildCustomerOfferHtml(input: {
  order: OrderRecord;
  price: string;
  customerLink: string;
  teamMessage: string;
}) {
  const safeName = escapeHtml(getCustomerFirstName(input.order.customer_name));
  const safePrice = escapeHtml(input.price);
  const safeTeamMessage = escapeHtml(input.teamMessage).replace(
    /\n/g,
    '<br />'
  );
  const safeLink = escapeHtml(input.customerLink);
  const details = [
    ['Placement', formatPlacement(input.order.placement)],
    ['Shirt color', formatOrderValue(input.order.shirt_color)],
    ['Quantity', String(input.order.quantity ?? 1)],
  ]
    .map(([label, value]) => buildCustomerEmailDetailRow(label, value))
    .join('');
  const trustRows = [
    'No production before your approval',
    'Secure private review link',
    'Final price shown before stitching',
  ]
    .map((text) => buildTrustRow(text))
    .join('');
  const messageBlock = input.teamMessage
    ? `
                    <tr>
                      <td style="padding: 0 30px 24px 30px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; background-color: #111b18; border: 1px solid #263b35; border-radius: 16px;">
                          <tr>
                            <td style="padding: 18px 18px 16px 18px;">
                              <p style="margin: 0 0 8px 0; color: #8ff5bd; font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Message from the studio</p>
                              <p style="margin: 0; color: #edf7f3; font-size: 15px; line-height: 24px;">${safeTeamMessage}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
      `
    : '';

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="dark light" />
        <title>Your Stitchra embroidery quote is ready</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #050807; font-family: Arial, Helvetica, sans-serif; color: #eef7f4; -webkit-text-size-adjust: 100%; text-size-adjust: 100%;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">
          Review your secure Stitchra offer before production starts.
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background-color: #050807; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 32px 16px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 600px; border-collapse: separate; border-spacing: 0; background-color: #0b1110; border: 1px solid #1f302c; border-radius: 22px; overflow: hidden;">
                <tr>
                  <td style="padding: 26px 30px 24px 30px; background-color: #07120f; border-bottom: 1px solid #1f302c;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                      <tr>
                        <td width="42" valign="top" style="padding: 0 12px 0 0;">
                          <span style="display: inline-block; width: 38px; height: 38px; border-radius: 13px; background-color: #0e1d19; border: 1px solid #245448; color: #8ff5bd; font-size: 20px; line-height: 38px; text-align: center; font-weight: 800;">S</span>
                        </td>
                        <td valign="top">
                          <p style="margin: 0; color: #f5fffb; font-size: 16px; line-height: 21px; font-weight: 800;">Stitchra Studio</p>
                          <p style="margin: 2px 0 0 0; color: #91a39e; font-size: 12px; line-height: 18px;">Custom embroidery quote</p>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin: 24px 0 10px 0; color: #f5fffb; font-size: 27px; line-height: 33px; font-weight: 800;">Your Stitchra embroidery quote is ready</h1>
                    <p style="margin: 0; color: #b9c8c3; font-size: 15px; line-height: 23px;">Hi ${safeName}, your custom embroidery quote is ready to review before production starts.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px 30px 22px 30px;">
                    <p style="margin: 0 0 18px 0; color: #d9e8e3; font-size: 15px; line-height: 24px;">Your quote details are below. Review the secure offer page when you are ready.</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; background-color: #101916; border: 1px solid #2b423b; border-radius: 16px;">
                      <tr>
                        <td style="padding: 22px 20px;">
                          <p style="margin: 0 0 8px 0; color: #9fb0aa; font-size: 13px; line-height: 18px; font-weight: 700;">Final offer price</p>
                          <p style="margin: 0; color: #f7fffb; font-size: 34px; line-height: 40px; font-weight: 800;">${safePrice}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 30px 24px 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border-top: 1px solid #22332f; border-bottom: 1px solid #22332f;">
${details}
                    </table>
                  </td>
                </tr>
${messageBlock}
                <tr>
                  <td style="padding: 0 30px 24px 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background-color: #0d1513; border: 1px solid #21332e; border-radius: 15px;">
                      <tr>
                        <td style="padding: 16px 18px;">
                          <p style="margin: 0 0 6px 0; color: #8ff5bd; font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Quote review</p>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
${trustRows}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%;">
                      <tr>
                        <td align="center" style="border-radius: 14px; background-color: #29e58c;">
                          <a href="${safeLink}" style="display: block; padding: 15px 20px; color: #04100b; font-size: 16px; line-height: 22px; font-weight: 800; text-align: center; text-decoration: none; border-radius: 14px;">Review secure offer</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 18px 0 0 0; color: #9fb0aa; font-size: 13px; line-height: 20px;">If the button does not open, copy this secure link:</p>
                    <p style="margin: 4px 0 0 0; color: #9fb0aa; font-size: 13px; line-height: 20px; word-break: break-all;"><a href="${safeLink}" style="color: #8ff5bd; text-decoration: underline;">${safeLink}</a></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 22px 30px 26px 30px; background-color: #070c0b; border-top: 1px solid #1f302c;">
                    <p style="margin: 0 0 6px 0; color: #d9e7e2; font-size: 13px; line-height: 20px; font-weight: 700;">Stitchra Studio</p>
                    <p style="margin: 0 0 4px 0; color: #899a94; font-size: 12px; line-height: 18px;">You received this email because you requested an embroidery quote on stitchra.com.</p>
                    <p style="margin: 0; color: #899a94; font-size: 12px; line-height: 18px;">Questions? Reply to this email and our studio team will help you.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendOfferEmail(order: OrderRecord) {
  if (!order.public_token) {
    throw new Error('Order is missing a customer link.');
  }

  if (
    order.manual_quote &&
    (order.revised_price_eur === null || order.revised_price_eur <= 0)
  ) {
    throw new Error(
      'Enter a final customer price before sending this manual quote.'
    );
  }

  const pricingSettings = await getPricingSettings();
  const customerLink = `${publicSiteUrl}/order/${order.public_token}`;
  const price = formatEmailPrice(
    getEffectiveOrderPrice(order, pricingSettings)
  );
  const teamMessage = order.team_message?.trim() || '';
  const recipientEmail = assertValidEmailRecipient(order.customer_email);

  await sendResendEmail({
    to: recipientEmail,
    subject: 'Your Stitchra embroidery quote is ready',
    replyTo: getReplyToEmail() || undefined,
    text: buildCustomerOfferText({
      order,
      price,
      customerLink,
      teamMessage,
    }),
    html: buildCustomerOfferHtml({
      order,
      price,
      customerLink,
      teamMessage,
    }),
  });
}

function buildTeamDecisionText(
  order: OrderRecord,
  settings: PricingSettings = defaultPricingSettings
) {
  const decision =
    order.customer_decision === 'pending'
      ? 'Pending'
      : formatOrderValue(order.customer_decision);

  return [
    `Customer name: ${order.customer_name}`,
    `Customer email: ${order.customer_email}`,
    `Order status: ${formatOrderValue(order.status)}`,
    `Final price: ${formatEmailPrice(getEffectiveOrderPrice(order, settings))}`,
    `Customer decision: ${decision}`,
    '',
    `Studio: ${publicSiteUrl}/studio`,
  ].join('\n');
}

function buildTeamDecisionHtml(
  order: OrderRecord,
  settings: PricingSettings = defaultPricingSettings
) {
  const text = buildTeamDecisionText(order, settings)
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br />');

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.5;">
      <p style="margin: 0 0 12px 0; font-weight: 700;">Stitchra order update</p>
      <p style="margin: 0;">${text}</p>
    </div>
  `;
}

async function updateTeamNotificationStatus(input: {
  id: string;
  team_notified_at: string | null;
  team_notification_error: string | null;
}) {
  const params = new URLSearchParams({
    id: `eq.${input.id}`,
    select: 'id',
  });

  await supabaseRequest<SupabaseOrderRow[]>(
    `orders?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        team_notified_at: input.team_notified_at,
        team_notification_error: input.team_notification_error,
        updated_at: new Date().toISOString(),
      }),
    }
  );
}

async function recordTeamNotificationStatus(input: {
  id: string;
  team_notified_at: string | null;
  team_notification_error: string | null;
}) {
  try {
    await updateTeamNotificationStatus(input);
  } catch (error) {
    console.warn(
      `[orders] Could not record team notification status for order ${input.id}: ${getOrderErrorMessage(error)}`
    );
  }
}

async function notifyTeamOfCustomerDecision(order: OrderRecord) {
  const missing = [
    getResendApiKey() ? '' : 'RESEND_API_KEY',
    getFromEmail() ? '' : 'FROM_EMAIL',
    getTeamEmail() ? '' : 'TEAM_EMAIL',
  ].filter(Boolean);

  if (missing.length > 0) {
    const message = `Team notification skipped. Missing ${missing.join(', ')}.`;
    console.warn(`[orders] ${message}`);
    await recordTeamNotificationStatus({
      id: order.id,
      team_notified_at: null,
      team_notification_error: message,
    });
    return;
  }

  try {
    const pricingSettings = await getPricingSettings();
    const statusLabel = formatOrderValue(order.status);
    await sendResendEmail({
      to: getTeamEmail(),
      subject: `Stitchra order update: ${statusLabel}`,
      text: buildTeamDecisionText(order, pricingSettings),
      html: buildTeamDecisionHtml(order, pricingSettings),
    });
    await recordTeamNotificationStatus({
      id: order.id,
      team_notified_at: new Date().toISOString(),
      team_notification_error: null,
    });
  } catch (error) {
    const message = getOrderErrorMessage(error);
    console.warn(
      `[orders] Team notification failed for order ${order.id}: ${message}`
    );
    await recordTeamNotificationStatus({
      id: order.id,
      team_notified_at: null,
      team_notification_error: message,
    });
  }
}

export async function getPublicOrderByToken(token: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  let rows: SupabaseOrderRow[] | null = null;
  let lastError: unknown = null;

  for (const select of publicOrderSelectFallbacks) {
    const params = new URLSearchParams({
      public_token: `eq.${token}`,
      select,
    });

    try {
      rows = await supabaseRequest<SupabaseOrderRow[]>(
        `orders?${params.toString()}`
      );
      break;
    } catch (error) {
      lastError = error;

      if (!isMissingOrderColumnError(error)) {
        throw error;
      }

      console.error('[orders.getPublicOrderByToken] public select failed', {
        token_prefix: getTokenPrefix(token),
        error_message: getOrderErrorMessage(error),
      });
    }
  }

  if (!rows) {
    throw lastError instanceof Error
      ? lastError
      : new Error('Public order lookup failed.');
  }

  if (!rows[0]) {
    return null;
  }

  const viewParams = new URLSearchParams({
    public_token: `eq.${token}`,
    select: 'public_token',
  });

  try {
    await supabaseRequest<SupabaseOrderRow[]>(
      `orders?${viewParams.toString()}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          customer_viewed_at: new Date().toISOString(),
        }),
      }
    );
  } catch (error) {
    console.error('[orders.getPublicOrderByToken] mark viewed failed', {
      token_prefix: getTokenPrefix(token),
      error_message: getOrderErrorMessage(error),
    });
  }

  return parsePublicOrder(rows[0]);
}

export async function updatePublicOrderDecision(
  token: string,
  input: {
    decision: Exclude<CustomerDecision, 'pending'>;
    proposed_price_eur?: number | null;
    requested_quantity?: number | null;
    customer_change_note?: string | null;
    wants_logo_change?: boolean;
  }
) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const decision = input.decision;
  const pricingSettings = await getPricingSettings();
  const params = new URLSearchParams({
    public_token: `eq.${token}`,
    select: '*',
  });

  const decidedAt = new Date().toISOString();
  const nextStatus: OrderStatus =
    decision === 'accepted'
      ? 'customer_accepted'
      : decision === 'declined'
        ? 'customer_declined'
        : decision === 'cancelled'
          ? 'customer_cancelled'
          : 'change_requested';
  const decisionUpdates: Record<string, unknown> = {
    customer_decision: decision,
    customer_decision_at: decidedAt,
    status: nextStatus,
    updated_at: decidedAt,
  };

  if (decision === 'change_requested') {
    decisionUpdates.proposed_price_eur =
      input.proposed_price_eur ?? null;
    decisionUpdates.requested_quantity =
      input.requested_quantity ?? null;
    decisionUpdates.customer_change_note =
      input.customer_change_note?.trim() || null;
    decisionUpdates.wants_logo_change = Boolean(input.wants_logo_change);
    decisionUpdates.change_requested_at = decidedAt;
    decisionUpdates.archived_at = null;
    decisionUpdates.archive_reason = null;
  }

  if (decision === 'declined') {
    decisionUpdates.archived_at = decidedAt;
    decisionUpdates.archive_reason = 'customer_declined';
  }

  if (decision === 'cancelled') {
    decisionUpdates.cancelled_at = decidedAt;
    decisionUpdates.archived_at = decidedAt;
    decisionUpdates.archive_reason = 'customer_cancelled';
  }

  if (decision === 'accepted') {
    decisionUpdates.archived_at = null;
    decisionUpdates.archive_reason = null;
  }

  const optionalDecisionColumns = new Set([
    'proposed_price_eur',
    'requested_quantity',
    'customer_change_note',
    'wants_logo_change',
    'change_requested_at',
    'cancelled_at',
    'archived_at',
    'archive_reason',
  ]);
  const safeDecisionUpdates = { ...decisionUpdates };
  let rows: SupabaseOrderRow[] | null = null;

  for (let attempt = 0; attempt < 9; attempt += 1) {
    try {
      rows = await supabaseRequest<SupabaseOrderRow[]>(
        `orders?${params.toString()}`,
        {
          method: 'PATCH',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify(safeDecisionUpdates),
        }
      );
      break;
    } catch (error) {
      const missingColumn = getMissingOrderColumn(error);

      if (
        missingColumn &&
        optionalDecisionColumns.has(missingColumn) &&
        hasOwn(safeDecisionUpdates, missingColumn)
      ) {
        delete safeDecisionUpdates[missingColumn];
        console.error(
          '[orders.updatePublicOrderDecision] optional column unavailable',
          {
            token_prefix: getTokenPrefix(token),
            column: missingColumn,
            error_message: getOrderErrorMessage(error),
          }
        );
        continue;
      }

      throw error;
    }
  }

  if (!rows) {
    throw new Error('Public order decision update failed.');
  }

  if (!rows[0]) {
    return null;
  }

  const order = parseOrder(rows[0], pricingSettings);
  await notifyTeamOfCustomerDecision(order);

  return parsePublicOrder(rows[0]);
}

export async function updateOrder(
  id: string,
  input: {
    status?: OrderStatus;
    production_notes?: string[];
    team_message?: string | null;
    revised_price_eur?: number | null;
    customer_price_eur?: number | null;
    quantity?: number;
    offer_sent_at?: string;
    cost_breakdown?: CostBreakdown;
  }
) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const pricingSettings = await getPricingSettings();
  const existingParams = new URLSearchParams({
    id: `eq.${id}`,
    select: '*',
  });
  const existingRows = await supabaseRequest<SupabaseOrderRow[]>(
    `orders?${existingParams.toString()}`
  );
  const existingOrder = existingRows[0]
    ? parseOrder(existingRows[0], pricingSettings)
    : null;

  if (!existingOrder) {
    return null;
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.status) {
    updates.status = input.status;

    if (input.status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.archived_at = updates.completed_at;
      updates.archive_reason = 'completed';
    }

    if (input.status === 'customer_declined') {
      updates.archived_at = new Date().toISOString();
      updates.archive_reason = 'customer_declined';
    }

    if (input.status === 'customer_cancelled') {
      updates.cancelled_at = new Date().toISOString();
      updates.archived_at = updates.cancelled_at;
      updates.archive_reason = 'customer_cancelled';
    }

    if (input.status === 'team_declined') {
      updates.archived_at = new Date().toISOString();
      updates.archive_reason = 'team_declined';
    }

    if (input.status === 'offer_sent') {
      updates.customer_decision = 'pending';
      updates.customer_decision_at = null;
      updates.archived_at = null;
      updates.archive_reason = null;
    }

    if (input.status === 'needs_review') {
      updates.archived_at = null;
      updates.archive_reason = null;

      if (
        existingOrder.status === 'customer_declined' ||
        existingOrder.status === 'customer_cancelled' ||
        existingOrder.status === 'team_declined' ||
        existingOrder.status === 'change_requested' ||
        existingOrder.customer_decision === 'declined' ||
        existingOrder.customer_decision === 'cancelled' ||
        existingOrder.customer_decision === 'change_requested'
      ) {
        updates.customer_decision = 'pending';
        updates.customer_decision_at = null;
      }
    }
  }

  if (hasOwn(input, 'production_notes') && Array.isArray(input.production_notes)) {
    updates.production_notes = input.production_notes.join('\n');
  }

  if (hasOwn(input, 'team_message')) {
    updates.team_message = input.team_message || null;
  }

  if (hasOwn(input, 'revised_price_eur')) {
    updates.revised_price_eur = input.revised_price_eur;
  }

  if (hasOwn(input, 'customer_price_eur')) {
    updates.customer_price_eur = input.customer_price_eur;
  }

  if (hasOwn(input, 'quantity')) {
    updates.quantity = input.quantity;
  }

  if (hasOwn(input, 'offer_sent_at')) {
    updates.offer_sent_at = input.offer_sent_at;
  }

  if (hasOwn(input, 'cost_breakdown') || hasOwn(input, 'revised_price_eur')) {
    const costBreakdown = hasOwn(input, 'cost_breakdown')
      ? normalizeCostBreakdown(input.cost_breakdown, pricingSettings, {
          stitches: existingOrder.stitches,
          manualQuote: existingOrder.manual_quote,
        })
      : existingOrder.cost_breakdown;
    const revisedPrice = hasOwn(input, 'revised_price_eur')
      ? input.revised_price_eur
      : existingOrder.revised_price_eur;
    const pricing = calculatePricing({
      stitches: existingOrder.stitches,
      colors: existingOrder.colors,
      placement: existingOrder.placement,
      settings: pricingSettings,
      costBreakdown,
      revisedPrice,
    });

    updates.cost_breakdown = costBreakdown;
    updates.internal_cost_eur = pricing.internal_cost_eur;
    updates.estimated_profit_eur = pricing.estimated_profit_eur;
    updates.profit_margin_percent = pricing.profit_margin_percent;
    updates.pricing_tier = pricing.pricing_tier;
    updates.manual_quote = pricing.manual_quote;
    if (
      pricing.manual_quote &&
      !input.status &&
      existingOrder.status === 'new'
    ) {
      updates.status = 'needs_review';
    }
  }

  const params = new URLSearchParams({
    id: `eq.${id}`,
    select: '*',
  });

  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    `orders?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
    }
  );

  return rows[0] ? parseOrder(rows[0], pricingSettings) : null;
}
