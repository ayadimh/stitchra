import { randomUUID } from 'crypto';
import { Pool } from 'pg';

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
  internal_cost_eur: number | null;
  estimated_profit_eur: number | null;
  profit_margin_percent: number | null;
  pricing_tier: string;
  manual_quote: boolean;
  warnings: string[];
  recommendations: string[];
  production_notes: string[];
  cost_breakdown: Record<string, number>;
  status: OrderStatus;
};

export type CreateOrderInput = {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  quantity?: number;
  note?: string;
  prompt?: string;
  placement: string;
  shirt_color: string;
  logo_preview_url?: string;
  stitches: number;
  colors: number;
  coverage: number;
  customer_price_eur: number | null;
  internal_cost_eur?: number | null;
  estimated_profit_eur?: number | null;
  profit_margin_percent?: number | null;
  pricing_tier: string;
  manual_quote: boolean;
  warnings?: string[];
  recommendations?: string[];
  production_notes?: string[];
  cost_breakdown?: Record<string, number>;
};

let pool: Pool | null = null;
let initialized = false;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL.includes('localhost') ||
        process.env.DATABASE_URL.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false },
    });
  }

  return pool;
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

async function ensureOrdersTable() {
  const db = getPool();

  if (!db) {
    return null;
  }

  if (!initialized) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS stitchra_orders (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        quantity INTEGER,
        note TEXT,
        prompt TEXT,
        placement TEXT NOT NULL,
        shirt_color TEXT NOT NULL,
        logo_preview_url TEXT,
        stitches INTEGER NOT NULL,
        colors INTEGER NOT NULL,
        coverage DOUBLE PRECISION NOT NULL,
        customer_price_eur NUMERIC(10, 2),
        internal_cost_eur NUMERIC(10, 2),
        estimated_profit_eur NUMERIC(10, 2),
        profit_margin_percent NUMERIC(8, 2),
        pricing_tier TEXT NOT NULL,
        manual_quote BOOLEAN NOT NULL,
        warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
        recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
        production_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
        cost_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'new',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    initialized = true;
  }

  return db;
}

function parseOrder(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id),
    created_at: new Date(String(row.created_at)).toISOString(),
    customer_name: String(row.customer_name),
    customer_email: String(row.customer_email),
    customer_phone: row.customer_phone ? String(row.customer_phone) : null,
    quantity: row.quantity === null ? null : Number(row.quantity),
    note: row.note ? String(row.note) : null,
    prompt: row.prompt ? String(row.prompt) : null,
    placement: String(row.placement),
    shirt_color: String(row.shirt_color),
    logo_preview_url: row.logo_preview_url
      ? String(row.logo_preview_url)
      : null,
    stitches: Number(row.stitches),
    colors: Number(row.colors),
    coverage: Number(row.coverage),
    customer_price_eur:
      row.customer_price_eur === null
        ? null
        : Number(row.customer_price_eur),
    internal_cost_eur:
      row.internal_cost_eur === null
        ? null
        : Number(row.internal_cost_eur),
    estimated_profit_eur:
      row.estimated_profit_eur === null
        ? null
        : Number(row.estimated_profit_eur),
    profit_margin_percent:
      row.profit_margin_percent === null
        ? null
        : Number(row.profit_margin_percent),
    pricing_tier: String(row.pricing_tier),
    manual_quote: Boolean(row.manual_quote),
    warnings: Array.isArray(row.warnings) ? row.warnings.map(String) : [],
    recommendations: Array.isArray(row.recommendations)
      ? row.recommendations.map(String)
      : [],
    production_notes: Array.isArray(row.production_notes)
      ? row.production_notes.map(String)
      : [],
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

export async function createOrder(input: CreateOrderInput) {
  const db = await ensureOrdersTable();

  if (!db) {
    return null;
  }

  const status: OrderStatus = input.manual_quote ? 'needs_review' : 'new';

  const result = await db.query(
    `
      INSERT INTO stitchra_orders (
        id,
        customer_name,
        customer_email,
        customer_phone,
        quantity,
        note,
        prompt,
        placement,
        shirt_color,
        logo_preview_url,
        stitches,
        colors,
        coverage,
        customer_price_eur,
        internal_cost_eur,
        estimated_profit_eur,
        profit_margin_percent,
        pricing_tier,
        manual_quote,
        warnings,
        recommendations,
        production_notes,
        cost_breakdown,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24
      )
      RETURNING *
    `,
    [
      randomUUID(),
      input.customer_name,
      input.customer_email,
      input.customer_phone || null,
      input.quantity || null,
      input.note || null,
      input.prompt || null,
      input.placement,
      input.shirt_color,
      input.logo_preview_url || null,
      input.stitches,
      input.colors,
      input.coverage,
      input.customer_price_eur,
      input.internal_cost_eur ?? null,
      input.estimated_profit_eur ?? null,
      input.profit_margin_percent ?? null,
      input.pricing_tier,
      input.manual_quote,
      JSON.stringify(input.warnings ?? []),
      JSON.stringify(input.recommendations ?? []),
      JSON.stringify(input.production_notes ?? []),
      JSON.stringify(input.cost_breakdown ?? {}),
      status,
    ]
  );

  return parseOrder(result.rows[0]);
}

export async function listOrders(status?: string | null) {
  const db = await ensureOrdersTable();

  if (!db) {
    return null;
  }

  const hasStatus =
    status && ORDER_STATUSES.includes(status as OrderStatus);

  const result = await db.query(
    `
      SELECT *
      FROM stitchra_orders
      ${hasStatus ? 'WHERE status = $1' : ''}
      ORDER BY created_at DESC
      LIMIT 100
    `,
    hasStatus ? [status] : []
  );

  return result.rows.map(parseOrder);
}

export async function updateOrder(
  id: string,
  input: {
    status?: OrderStatus;
    production_notes?: string[];
  }
) {
  const db = await ensureOrdersTable();

  if (!db) {
    return null;
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.status) {
    updates.push(`status = $${updates.length + 1}`);
    values.push(input.status);
  }

  if (input.production_notes) {
    updates.push(`production_notes = $${updates.length + 1}`);
    values.push(JSON.stringify(input.production_notes));
  }

  if (updates.length === 0) {
    const existing = await db.query(
      'SELECT * FROM stitchra_orders WHERE id = $1',
      [id]
    );
    return existing.rows[0] ? parseOrder(existing.rows[0]) : null;
  }

  values.push(id);

  const result = await db.query(
    `
      UPDATE stitchra_orders
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `,
    values
  );

  return result.rows[0] ? parseOrder(result.rows[0]) : null;
}
