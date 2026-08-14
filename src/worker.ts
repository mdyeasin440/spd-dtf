/**
 * Cloudflare Worker Handler for Spidey Jersey DTF Pro
 * Integrates with Cloudflare D1 database (Binding: env.MY_DB)
 */

export interface Env {
  MY_DB: D1Database;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: any;
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// Utility: JSON Response
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function buildUpsertStatement(env: Env, body: any) {
  const id = body.id || `preset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const code = (body.code || '').trim().toUpperCase();
  const teamName = body.teamName || 'Custom Team';
  const league = body.league || 'Custom';
  const season = body.season || '2024-25';
  const fontFamily = body.fontFamily || 'Oswald';
  const customFontDataUrl = body.customFontDataUrl || null;
  const textColor = body.textColor || '#FFFFFF';
  const strokeColor = body.strokeColor || '#000000';
  const strokeWidth = Number(body.strokeWidth ?? 4);
  const hasInnerOutline = body.hasInnerOutline ? 1 : 0;
  const innerOutlineColor = body.innerOutlineColor || null;
  const textEffect = body.textEffect || 'none';
  const arcAmount = Number(body.arcAmount ?? 0);
  const letterSpacing = Number(body.letterSpacing ?? 3);
  const numberStyle = body.numberStyle ? JSON.stringify(body.numberStyle) : null;
  const numberAssets = body.numberAssets ? JSON.stringify(body.numberAssets) : null;
  const letterAssets = body.letterAssets ? JSON.stringify(body.letterAssets) : null;
  const defaultNameWidthInches = Number(body.defaultNameWidthInches ?? 12.0);
  const defaultNameHeightInches = Number(body.defaultNameHeightInches ?? 2.2);
  const defaultNumberHeightInches = Number(body.defaultNumberHeightInches ?? 9.5);
  const notes = body.notes || '';
  const updatedAt = new Date().toISOString();

  return env.MY_DB.prepare(
    `INSERT INTO design_presets (
      id, code, teamName, league, season, fontFamily, customFontDataUrl,
      textColor, strokeColor, strokeWidth, hasInnerOutline, innerOutlineColor,
      textEffect, arcAmount, letterSpacing, numberStyle, numberAssets, letterAssets,
      defaultNameWidthInches, defaultNameHeightInches, defaultNumberHeightInches, notes, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      code=excluded.code,
      teamName=excluded.teamName,
      league=excluded.league,
      season=excluded.season,
      fontFamily=excluded.fontFamily,
      customFontDataUrl=excluded.customFontDataUrl,
      textColor=excluded.textColor,
      strokeColor=excluded.strokeColor,
      strokeWidth=excluded.strokeWidth,
      hasInnerOutline=excluded.hasInnerOutline,
      innerOutlineColor=excluded.innerOutlineColor,
      textEffect=excluded.textEffect,
      arcAmount=excluded.arcAmount,
      letterSpacing=excluded.letterSpacing,
      numberStyle=excluded.numberStyle,
      numberAssets=excluded.numberAssets,
      letterAssets=excluded.letterAssets,
      defaultNameWidthInches=excluded.defaultNameWidthInches,
      defaultNameHeightInches=excluded.defaultNameHeightInches,
      defaultNumberHeightInches=excluded.defaultNumberHeightInches,
      notes=excluded.notes,
      updatedAt=excluded.updatedAt`
  ).bind(
    id, code, teamName, league, season, fontFamily, customFontDataUrl,
    textColor, strokeColor, strokeWidth, hasInnerOutline, innerOutlineColor,
    textEffect, arcAmount, letterSpacing, numberStyle, numberAssets, letterAssets,
    defaultNameWidthInches, defaultNameHeightInches, defaultNumberHeightInches, notes, updatedAt
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      // 1. Health check
      if (path === '/api/health' && method === 'GET') {
        return jsonResponse({
          status: 'ok',
          service: 'Spidey Jersey DTF API (Cloudflare D1)',
          database: 'spd-dtf (MY_DB)',
          timestamp: new Date().toISOString(),
        });
      }

      // 2. GET /api/presets - Fetch all presets from D1
      if (path === '/api/presets' && method === 'GET') {
        const { results } = await env.MY_DB.prepare(
          `SELECT * FROM design_presets ORDER BY updatedAt DESC`
        ).all<any>();

        const formatted = (results || []).map((row) => ({
          ...row,
          hasInnerOutline: Boolean(row.hasInnerOutline),
          numberStyle: row.numberStyle ? JSON.parse(row.numberStyle) : undefined,
          numberAssets: row.numberAssets ? JSON.parse(row.numberAssets) : undefined,
          letterAssets: row.letterAssets ? JSON.parse(row.letterAssets) : undefined,
        }));

        return jsonResponse({ success: true, presets: formatted, count: formatted.length });
      }

      // 3. POST /api/presets - Save single or array of presets
      if (path === '/api/presets' && method === 'POST') {
        const body: any = await request.json();
        if (!body) {
          return jsonResponse({ success: false, error: 'Request body is required' }, 400);
        }

        // Handle batch array
        if (Array.isArray(body)) {
          if (body.length === 0) {
            return jsonResponse({ success: true, count: 0, presets: [] });
          }
          const statements = body.map((item) => buildUpsertStatement(env, item));
          await env.MY_DB.batch(statements);
          return jsonResponse({
            success: true,
            message: `${body.length} design presets saved to Cloudflare D1`,
            count: body.length,
          });
        }

        // Handle single preset
        if (!body.code) {
          return jsonResponse({ success: false, error: 'Preset code is required' }, 400);
        }

        const stmt = buildUpsertStatement(env, body);
        await stmt.run();

        return jsonResponse({
          success: true,
          message: 'Design preset saved to Cloudflare D1',
          preset: {
            ...body,
            id: body.id || `preset-${Date.now()}`,
            code: (body.code || '').trim().toUpperCase(),
            updatedAt: new Date().toISOString(),
          },
        });
      }

      // 4. DELETE /api/presets/:id
      if (path.startsWith('/api/presets/') && method === 'DELETE') {
        const id = path.split('/')[3];
        if (!id) {
          return jsonResponse({ success: false, error: 'Preset ID is required' }, 400);
        }

        await env.MY_DB.prepare(`DELETE FROM design_presets WHERE id = ?`).bind(id).run();
        return jsonResponse({ success: true, message: 'Preset deleted from Cloudflare D1' });
      }

      // 5. POST /api/orders/bulk - Save parsed orders
      if (path === '/api/orders/bulk' && method === 'POST') {
        const { orders } = (await request.json()) as { orders: any[] };
        if (!Array.isArray(orders) || orders.length === 0) {
          return jsonResponse({ success: false, error: 'No orders provided' }, 400);
        }

        const statements = orders.map((ord) => {
          const id = ord.id || `ord-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const orderNumber = ord.orderNumber || '';
          const customerName = ord.customerName || '';
          const jerseyName = ord.jerseyName || customerName;
          const jerseyNumber = ord.number || ord.jerseyNumber || '';
          const garmentSize = ord.garmentSize || 'Adult';
          const designCode = ord.designCode || '';
          const quantity = Number(ord.quantity || 1);
          const nameWidthInches = Number(ord.nameWidthInches || 12);
          const nameHeightInches = Number(ord.nameHeightInches || 2.2);
          const numberHeightInches = Number(ord.numberHeightInches || 9.5);
          const numberWidthInches = Number(ord.numberWidthInches || 6);
          const status = ord.status || 'pending';
          const createdAt = new Date().toISOString();

          return env.MY_DB.prepare(
            `INSERT OR REPLACE INTO orders (
              id, orderNumber, customerName, jerseyName, jerseyNumber, garmentSize,
              designCode, quantity, nameWidthInches, nameHeightInches, numberHeightInches,
              numberWidthInches, status, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id, orderNumber, customerName, jerseyName, jerseyNumber, garmentSize,
            designCode, quantity, nameWidthInches, nameHeightInches, numberHeightInches,
            numberWidthInches, status, createdAt
          );
        });

        await env.MY_DB.batch(statements);
        return jsonResponse({ success: true, message: `${orders.length} orders saved to Cloudflare D1` });
      }

      return jsonResponse({ error: 'Not Found' }, 404);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message || 'Internal Server Error' }, 500);
    }
  },
};
