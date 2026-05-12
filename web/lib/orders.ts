export const ORDER_STATUSES = [
  'new',
  'needs_review',
  'approved',
  'sent_to_production',
  'declined',
  'completed',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderRecord = {
  id: string;
  created_at: string;
  updated_at: string;
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
  cost_breakdown: Record<string, number>;
  status: OrderStatus;
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
  customer_price_eur: number | null;
  pricing_tier: string;
  manual_quote: boolean;
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d\s()-]+$/;

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

function parseOrder(row: SupabaseOrderRow): OrderRecord {
  const productionNotes = row.production_notes;

  return {
    id: String(row.id),
    created_at: new Date(String(row.created_at)).toISOString(),
    updated_at: new Date(
      String(row.updated_at ?? row.created_at)
    ).toISOString(),
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
    cost_breakdown:
      row.cost_breakdown &&
      typeof row.cost_breakdown === 'object' &&
      !Array.isArray(row.cost_breakdown)
        ? (row.cost_breakdown as Record<string, number>)
        : {},
    status: ORDER_STATUSES.includes(row.status as OrderStatus)
      ? (row.status as OrderStatus)
      : 'new',
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

export async function createOrder(input: CreateOrderInput) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const status: OrderStatus = input.manual_quote ? 'needs_review' : 'new';
  const rows = await supabaseRequest<SupabaseOrderRow[]>(
    'orders?select=*',
    {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        customer_name: input.customer_name,
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
        customer_price_eur: input.customer_price_eur,
        pricing_tier: input.pricing_tier,
        manual_quote: input.manual_quote,
        warnings: input.warnings ?? [],
        recommendations: input.recommendations ?? [],
        production_notes: '',
        cost_breakdown: {},
        status,
      }),
    }
  );

  return rows[0] ? parseOrder(rows[0]) : null;
}

export async function listOrders(status?: string | null) {
  if (!isDatabaseConfigured()) {
    return null;
  }

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

  return rows.map(parseOrder);
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
  }
) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.status) {
    updates.status = input.status;
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

  return rows[0] ? parseOrder(rows[0]) : null;
}
