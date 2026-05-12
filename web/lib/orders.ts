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
  'customer_accepted',
  'pre_production',
  'sent_to_production',
  'customer_declined',
  'team_declined',
  'completed',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CUSTOMER_DECISIONS = [
  'pending',
  'accepted',
  'declined',
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
  payment_status: PaymentStatus;
  payment_requested_at: string | null;
  payment_completed_at: string | null;
  payment_provider: string | null;
  payment_session_id: string | null;
  completed_at: string | null;
  archived_at: string | null;
  archive_reason: string | null;
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
  team_message: string | null;
  customer_decision: CustomerDecision;
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
  'team_message',
  'customer_decision',
  'payment_status',
].join(',');

const pricingSettingsSelect = [
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
  'round_mode',
].join(',');

const emailPattern =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const phonePattern = /^[+\d\s()-]+$/;
const publicSiteUrl = 'https://stitchra.com';

function getResendApiKey() {
  return process.env.RESEND_API_KEY ?? '';
}

function getFromEmail() {
  return process.env.FROM_EMAIL ?? '';
}

function getReplyToEmail() {
  return process.env.REPLY_TO_EMAIL ?? '';
}

function getTeamEmail() {
  return process.env.TEAM_EMAIL ?? '';
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

function parsePaymentStatus(value: unknown): PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : 'unpaid';
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
      pricingSettings
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
    public_token: String(row.public_token),
    status: parseStatus(row),
    logo_preview_url: row.logo_preview_url
      ? String(row.logo_preview_url)
      : null,
    placement: String(row.placement),
    shirt_color: String(row.shirt_color),
    quantity:
      row.quantity === null || row.quantity === undefined
        ? null
        : Number(row.quantity),
    customer_price_eur: parseNumber(row.customer_price_eur),
    revised_price_eur: parseNumber(row.revised_price_eur),
    team_message: row.team_message
      ? String(row.team_message)
      : null,
    customer_decision: parseCustomerDecision(row.customer_decision),
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
  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    'orders?select=*',
    {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
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
      }),
    }
  );

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

function formatEmailValue(value: string | null | undefined) {
  const text = value?.trim();

  return text ? text : 'Not provided';
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
  }).customer_price_eur;
}

function getEffectiveOrderPrice(
  order: OrderRecord,
  settings: PricingSettings = defaultPricingSettings
) {
  return (
    order.revised_price_eur ??
    order.customer_price_eur ??
    getSuggestedOrderPrice(order, settings)
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

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  const resendApiKey = getResendApiKey();
  const fromEmail = getFromEmail();

  if (!resendApiKey || !fromEmail) {
    throw new Error('Email not configured.');
  }

  const body: Record<string, unknown> = {
    from: fromEmail,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  };

  if (input.replyTo) {
    body.reply_to = input.replyTo;
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

  if (!response.ok) {
    throw new Error(getResendErrorMessage(payload));
  }
}

function buildEmailDetailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 10px 0; color: #8c9a96; font-size: 13px;">${label}</td>
      <td style="padding: 10px 0; color: #f5f7f8; font-size: 14px; font-weight: 700; text-align: right;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function buildCustomerOfferText(input: {
  order: OrderRecord;
  price: string;
  customerLink: string;
  teamMessage: string;
}) {
  return [
    `Hi ${input.order.customer_name},`,
    '',
    'Your Stitchra embroidery quote is ready.',
    '',
    `Price: ${input.price}`,
    `Placement: ${formatPlacement(input.order.placement)}`,
    `Shirt color: ${formatOrderValue(input.order.shirt_color)}`,
    `Quantity: ${input.order.quantity ?? 1}`,
    '',
    `Message from the studio: ${input.teamMessage}`,
    '',
    `Review your secure offer: ${input.customerLink}`,
    '',
    'This offer was prepared by the Stitchra studio.',
  ].join('\n');
}

function buildCustomerOfferHtml(input: {
  order: OrderRecord;
  price: string;
  customerLink: string;
  teamMessage: string;
}) {
  const safeName = escapeHtml(input.order.customer_name);
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
    .map(([label, value]) => buildEmailDetailRow(label, value))
    .join('');

  return `
    <!doctype html>
    <html>
      <body style="margin: 0; padding: 0; background: #050607; font-family: Arial, Helvetica, sans-serif;">
        <div style="display: none; max-height: 0; overflow: hidden;">
          Your Stitchra embroidery quote is ready.
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #050607; padding: 34px 14px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; border: 1px solid rgba(255,255,255,0.12); border-radius: 28px; background: #0b0f0e; box-shadow: 0 28px 80px rgba(0,0,0,0.45); overflow: hidden;">
                <tr>
                  <td style="padding: 32px 30px 24px; background: radial-gradient(circle at 20% 10%, rgba(0,255,136,0.18), transparent 28%), radial-gradient(circle at 82% 22%, rgba(0,200,255,0.16), transparent 30%), #0b0f0e;">
                    <div style="display: inline-block; padding: 8px 11px; border-radius: 999px; background: rgba(0,255,136,0.10); color: #9dffc4; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;">Stitchra studio</div>
                    <h1 style="margin: 22px 0 12px; color: #f5f7f8; font-size: 34px; line-height: 1.02;">Your Stitchra embroidery quote is ready</h1>
                    <p style="margin: 0; color: #b8c5c1; font-size: 16px; line-height: 1.55;">Hi ${safeName}, your custom embroidery offer is ready to review.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 30px 30px;">
                    <div style="margin: 0 0 22px; padding: 22px; border-radius: 22px; background: linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,200,255,0.10)); border: 1px solid rgba(157,255,196,0.24);">
                      <div style="color: #8c9a96; font-size: 13px; font-weight: 700;">Customer price</div>
                      <div style="margin-top: 8px; color: #f5f7f8; font-size: 42px; font-weight: 900; letter-spacing: 0;">${safePrice}</div>
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 22px; border-collapse: collapse; border-top: 1px solid rgba(255,255,255,0.10); border-bottom: 1px solid rgba(255,255,255,0.10);">
                      ${details}
                    </table>
                    <div style="margin: 0 0 24px; padding: 18px; border-radius: 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10);">
                      <div style="color: #8c9a96; font-size: 13px; font-weight: 800;">Message from the studio</div>
                      <p style="margin: 9px 0 0; color: #e6fff0; font-size: 15px; line-height: 1.6;">${safeTeamMessage}</p>
                    </div>
                    <a href="${safeLink}" style="display: block; width: 100%; box-sizing: border-box; padding: 16px 20px; border-radius: 18px; background: linear-gradient(135deg, #00ff88, #00c8ff); color: #03100d; text-align: center; text-decoration: none; font-size: 16px; font-weight: 900;">Review secure offer</a>
                    <p style="margin: 18px 0 0; color: #8c9a96; font-size: 12px; line-height: 1.5;">If the button does not work, open this secure link:<br /><a href="${safeLink}" style="color: #9dffc4; word-break: break-all;">${safeLink}</a></p>
                    <p style="margin: 26px 0 0; color: #68746f; font-size: 12px;">This offer was prepared by the Stitchra studio.</p>
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

  const pricingSettings = await getPricingSettings();
  const customerLink = `${publicSiteUrl}/order/${order.public_token}`;
  const price = formatEmailPrice(
    getEffectiveOrderPrice(order, pricingSettings)
  );
  const teamMessage = order.team_message?.trim() || '';
  const emailTeamMessage = teamMessage || 'No message added.';

  await sendResendEmail({
    to: order.customer_email,
    subject: 'Your Stitchra embroidery quote',
    replyTo: getReplyToEmail() || undefined,
    text: buildCustomerOfferText({
      order,
      price,
      customerLink,
      teamMessage: emailTeamMessage,
    }),
    html: buildCustomerOfferHtml({
      order,
      price,
      customerLink,
      teamMessage: emailTeamMessage,
    }),
  });
}

function buildTeamDecisionText(
  order: OrderRecord,
  settings: PricingSettings = defaultPricingSettings
) {
  const decision = order.customer_decision;
  const customerLink = order.public_token
    ? `${publicSiteUrl}/order/${order.public_token}`
    : 'No customer link available';

  return [
    `Customer decision: ${decision}`,
    '',
    `Customer name: ${order.customer_name}`,
    `Customer email: ${order.customer_email}`,
    `Customer phone: ${formatEmailValue(order.customer_phone)}`,
    `Price: ${formatEmailPrice(getEffectiveOrderPrice(order, settings))}`,
    `Placement: ${formatPlacement(order.placement)}`,
    `Shirt color: ${formatOrderValue(order.shirt_color)}`,
    `Quantity: ${order.quantity ?? 1}`,
    `Customer note: ${formatEmailValue(order.note)}`,
    `Team message: ${formatEmailValue(order.team_message)}`,
    '',
    `Studio: ${publicSiteUrl}/studio`,
    `Customer order: ${customerLink}`,
  ].join('\n');
}

function buildTeamDecisionHtml(
  order: OrderRecord,
  settings: PricingSettings = defaultPricingSettings
) {
  const decision = order.customer_decision;
  const customerLink = order.public_token
    ? `${publicSiteUrl}/order/${order.public_token}`
    : '';
  const rows = [
    ['Customer name', order.customer_name],
    ['Customer email', order.customer_email],
    ['Customer phone', formatEmailValue(order.customer_phone)],
    ['Decision', decision],
    ['Price', formatEmailPrice(getEffectiveOrderPrice(order, settings))],
    ['Placement', formatPlacement(order.placement)],
    ['Shirt color', formatOrderValue(order.shirt_color)],
    ['Quantity', String(order.quantity ?? 1)],
    ['Customer note', formatEmailValue(order.note)],
    ['Team message', formatEmailValue(order.team_message)],
  ]
    .map(([label, value]) => buildEmailDetailRow(label, value))
    .join('');
  const safeCustomerLink = customerLink ? escapeHtml(customerLink) : '';

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background: #050607; color: #f5f7f8; padding: 28px;">
      <div style="max-width: 640px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.12); border-radius: 22px; background: #0b0f0e; padding: 28px;">
        <p style="margin: 0 0 10px; color: #9dffc4; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;">Stitchra order response</p>
        <h1 style="margin: 0 0 18px; font-size: 28px; line-height: 1.1;">Order ${escapeHtml(decision)}: ${escapeHtml(order.customer_name)}</h1>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid rgba(255,255,255,0.10); border-bottom: 1px solid rgba(255,255,255,0.10);">
          ${rows}
        </table>
        <p style="margin: 22px 0 0;">
          <a href="${publicSiteUrl}/studio" style="color: #03100d; background: #00ff88; padding: 12px 16px; border-radius: 12px; text-decoration: none; font-weight: 800;">Open studio</a>
        </p>
        ${
          safeCustomerLink
            ? `<p style="margin: 18px 0 0; color: #8c9a96; font-size: 13px;">Customer order link:<br /><a href="${safeCustomerLink}" style="color: #9dffc4; word-break: break-all;">${safeCustomerLink}</a></p>`
            : ''
        }
      </div>
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
    await sendResendEmail({
      to: getTeamEmail(),
      subject: `Stitchra order ${order.customer_decision}: ${order.customer_name}`,
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

  const params = new URLSearchParams({
    public_token: `eq.${token}`,
    select: publicOrderSelect,
  });

  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    `orders?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        customer_viewed_at: new Date().toISOString(),
      }),
    }
  );

  return rows[0] ? parsePublicOrder(rows[0]) : null;
}

export async function updatePublicOrderDecision(
  token: string,
  decision: Exclude<CustomerDecision, 'pending'>
) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const pricingSettings = await getPricingSettings();
  const params = new URLSearchParams({
    public_token: `eq.${token}`,
    select: '*',
  });

  const decidedAt = new Date().toISOString();
  const nextStatus: OrderStatus =
    decision === 'accepted' ? 'customer_accepted' : 'customer_declined';
  const decisionUpdates: Record<string, unknown> = {
    customer_decision: decision,
    customer_decision_at: decidedAt,
    status: nextStatus,
    updated_at: decidedAt,
  };

  if (decision === 'declined') {
    decisionUpdates.archived_at = decidedAt;
    decisionUpdates.archive_reason = 'customer_declined';
  }

  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    `orders?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(decisionUpdates),
    }
  );

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

    if (input.status === 'team_declined') {
      updates.archived_at = new Date().toISOString();
      updates.archive_reason = 'team_declined';
    }

    if (input.status === 'needs_review') {
      updates.archived_at = null;
      updates.archive_reason = null;

      if (
        existingOrder.status === 'customer_declined' ||
        existingOrder.customer_decision === 'declined'
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
      ? normalizeCostBreakdown(input.cost_breakdown, pricingSettings)
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
    if (pricing.manual_quote && !input.status) {
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
