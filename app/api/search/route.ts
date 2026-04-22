import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';

    const result = await pool.query(
      `SELECT t.id, t.amount, t.description, t.type, t.date,
              u.username
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       WHERE t.description ILIKE $1
       ORDER BY t.date DESC
       LIMIT 20`,
      [`%${q}%`]
    );

    return NextResponse.json({ results: result.rows, query: q });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
