import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        amount NUMERIC(12,2) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(10) CHECK (type IN ('credit','debit')),
        date DATE DEFAULT CURRENT_DATE
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        author VARCHAR(80) NOT NULL,
        content TEXT NOT NULL,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const adminHash  = await bcrypt.hash('Admin@123', 10);
    const johnHash   = await bcrypt.hash('Pass@456', 10);
    const janeHash   = await bcrypt.hash('Secret@789', 10);

    await pool.query(`
      INSERT INTO users (username, email, password_hash, role) VALUES
        ('admin',      'admin@vaultbank.io',     $1, 'admin'),
        ('john_smith', 'john@vaultbank.io',       $2, 'customer'),
        ('jane_doe',   'jane@vaultbank.io',        $3, 'customer')
      ON CONFLICT (username) DO NOTHING;
    `, [adminHash, johnHash, janeHash]);

    const usersRes = await pool.query('SELECT id FROM users ORDER BY id LIMIT 3');
    const [adminId, johnId, janeId] = usersRes.rows.map((r: { id: number }) => r.id);

    await pool.query(`
      INSERT INTO transactions (user_id, amount, description, type, date) VALUES
        ($1, 12500.00, 'Salary deposit - April 2025',         'credit', '2025-04-01'),
        ($1,  3200.50, 'Rent payment - Green Valley Apts',    'debit',  '2025-04-03'),
        ($1,   420.00, 'Amazon Prime subscription',           'debit',  '2025-04-05'),
        ($1,  8000.00, 'Freelance project payment',           'credit', '2025-04-10'),
        ($1,  1100.00, 'Grocery shopping - Whole Foods',      'debit',  '2025-04-12'),
        ($2, 15000.00, 'Monthly salary transfer',             'credit', '2025-04-01'),
        ($2,  2900.00, 'Mortgage payment - April',            'debit',  '2025-04-02'),
        ($2,   650.00, 'Electric & gas bill',                 'debit',  '2025-04-07'),
        ($2,   980.00, 'Investment dividend received',        'credit', '2025-04-15'),
        ($3,  9500.00, 'Consulting fee payment',              'credit', '2025-04-01'),
        ($3,  1800.00, 'Car insurance premium',               'debit',  '2025-04-04'),
        ($3,   300.00, 'Netflix & Spotify bundle',            'debit',  '2025-04-06'),
        ($3,  5000.00, 'Transfer from savings account',       'credit', '2025-04-18')
      ON CONFLICT DO NOTHING;
    `, [adminId, johnId, janeId]);

    await pool.query(`
      INSERT INTO reviews (author, content, rating) VALUES
        ('Michael T.', 'VaultBank has completely changed how I manage my finances. The interface is clean, fast, and incredibly secure. 10/10 would recommend!', 5),
        ('Sarah K.',   'Excellent customer service and a beautifully designed platform. My transfers are always instant and I feel completely safe.', 5),
        ('David R.',   'Great bank overall. The mobile app is smooth and the transaction history is detailed. Minor wait times on support but overall solid.', 4),
        ('Priya M.',   'Love the security features. Two-factor auth and instant fraud alerts give me real peace of mind. VaultBank earns my trust!', 5),
        ('Carlos E.',  'Switched from my old bank 6 months ago and haven\'t looked back. Zero fees and great interest rates on savings.', 4)
      ON CONFLICT DO NOTHING;
    `);

    return NextResponse.json({ success: true, message: 'Database seeded with users, transactions, and reviews.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
