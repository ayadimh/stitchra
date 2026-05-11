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

function getDatabaseUrl() {
  return (
    process.env.SUPABASE_POSTGRES_URL ??
    process.env.SUPABASE_POSTGRES_PRISMA_URL ??
    process.env.DATABASE_URL ??
    ''
  );
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

function getPool() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl:
        databaseUrl.includes('localhost') ||
        databaseUrl.includes('127.0.0.1')
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
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        quantity INTEGER DEFAULT 1,
        customer_note TEXT,
        prompt TEXT,
        placement TEXT NOT NULL,
        shirt_color TEXT NOT NULL,
        logo_preview_url TEXT,
        stitches INTEGER NOT NULL,
        colors INTEGER NOT NULL,
        coverage NUMERIC NOT NULL,
        customer_price_eur NUMERIC(10, 2),
        internal_cost_eur NUMERIC(10, 2),
        estimated_profit_eur NUMERIC(10, 2),
        profit_margin_percent NUMERIC(8, 2),
        pricing_tier TEXT NOT NULL,
        manual_quote BOOLEAN NOT NULL,
        warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
        recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
        production_notes TEXT NOT NULL DEFAULT '',
        cost_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'new' CHECK (
          status IN (
            'new',
            'needs_review',
            'approved',
            'sent_to_production',
            'declined',
            'completed'
          )
        )
      );

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_note TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cost_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);
    initialized = true;
  }

  return db;
}

function parseOrder(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id),
    created_at: new Date(String(row.created_at)).toISOString(),
    updated_at: new Date(
      String(row.updated_at ?? row.created_at)
    ).toISOString(),
    customer_name: String(row.customer_name),
    customer_email: String(row.customer_email),
    customer_phone: row.customer_phone ? String(row.customer_phone) : null,
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
      : typeof row.production_notes === 'string' &&
          row.production_notes.trim().length > 0
        ? row.production_notes
            .split('\n')
            .map((note) => note.trim())
            .filter(Boolean)
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
      INSERT INTO orders (
        customer_name,
        customer_email,
        customer_phone,
        quantity,
        customer_note,
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
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING *
    `,
    [
      input.customer_name,
      input.customer_email,
      input.customer_phone || null,
      input.quantity || 1,
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
      (input.production_notes ?? []).join('\n'),
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
      FROM orders
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
    values.push(input.production_notes.join('\n'));
  }

  if (updates.length === 0) {
    const existing = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    return existing.rows[0] ? parseOrder(existing.rows[0]) : null;
  }

  values.push(id);

  const result = await db.query(
    `
      UPDATE orders
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `,
    values
  );

  return result.rows[0] ? parseOrder(result.rows[0]) : null;
}
