import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, author, content, rating, created_at FROM reviews ORDER BY created_at DESC LIMIT 20'
    );
    return NextResponse.json({ reviews: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { author, content, rating } = await request.json();

    if (!author || !content || !rating) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO reviews (author, content, rating) VALUES ($1, $2, $3) RETURNING *',
      [author, content, Number(rating)]
    );

    return NextResponse.json({ review: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
