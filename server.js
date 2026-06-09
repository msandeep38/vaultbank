'use strict';

const express = require('express');
const initSqlJs = require('sql.js');
const path = require('path');
const http = require('http');
const fs = require('fs');

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const PORT = 8080;
const DB_PATH = path.join(__dirname, 'vaultbank.db');

let db; // set in startServer() after sql.js wasm loads
let requestCount = 0;
const startTime = Date.now();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  requestCount++;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ─── Database Helpers ─────────────────────────────────────────────────────────

// Persist in-memory sql.js database to disk after every write
function persist() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

// Parameterized single-row query (safe — used for normal reads)
function dbGet(sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params || []);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

// Parameterized multi-row query
function dbAll(sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params || []);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Parameterized write
function dbRun(sql, params) {
  db.run(sql, params || []);
  persist();
}

// ⚠️  VULNERABLE single-row query — no params, runs raw concatenated SQL
// Used only for the SQL injection demo on /api/login
function dbGetRaw(sql) {
  const stmt = db.prepare(sql);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

// ⚠️  VULNERABLE multi-row query — no params, runs raw concatenated SQL
// Used only for the SQL injection demo on /api/search
function dbAllRaw(sql) {
  const stmt = db.prepare(sql);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// ─── Database Seed ────────────────────────────────────────────────────────────

function setupDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    username       TEXT    UNIQUE NOT NULL,
    password       TEXT    NOT NULL,
    email          TEXT,
    full_name      TEXT,
    balance        REAL    DEFAULT 0,
    account_number TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    description TEXT,
    amount      REAL,
    type        TEXT,
    date        TEXT,
    recipient   TEXT
  )`);

  // Only seed once
  if (dbGet('SELECT 1 FROM users WHERE username = ?', ['admin'])) return;

  db.run(`INSERT INTO users (username,password,email,full_name,balance,account_number)
          VALUES (?,?,?,?,?,?)`,
    ['admin', 'password123', 'admin@vaultbank.com', 'Arjun Sharma', 245000, 'VB00100001']
  );

  [
    ['Salary Credit — April 2024',        85000, 'credit', '2024-04-01'],
    ['Amazon Shopping',                     3499, 'debit',  '2024-04-03'],
    ['Electricity Bill — BESCOM',           2100, 'debit',  '2024-04-05'],
    ['Netflix Subscription',                 649, 'debit',  '2024-04-07'],
    ['Freelance Payment — TechCorp',       15000, 'credit', '2024-04-10'],
    ['Rent — Koramangala Apt',             25000, 'debit',  '2024-04-15'],
    ['Zomato Food Order',                    450, 'debit',  '2024-04-18'],
    ['Savings Interest Credit',             1250, 'credit', '2024-04-20'],
    ['DMart Grocery',                       3200, 'debit',  '2024-04-22'],
    ['ATM Withdrawal — Indiranagar',        5000, 'debit',  '2024-04-25'],
    ['Salary Credit — May 2024',           85000, 'credit', '2024-05-01'],
    ['Swiggy Order',                         380, 'debit',  '2024-05-04'],
    ['Mobile Recharge — Airtel',             599, 'debit',  '2024-05-08'],
    ['Stock Dividend Credit',               4500, 'credit', '2024-05-12'],
    ['LIC Premium Payment',                12000, 'debit',  '2024-05-15'],
  ].forEach(([desc, amt, type, date]) => {
    db.run(
      'INSERT INTO transactions (user_id,description,amount,type,date) VALUES (1,?,?,?,?)',
      [desc, amt, type, date]
    );
  });

  persist();
  console.log('  ✅  Database seeded: admin / password123');
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// ┌─────────────────────────────────────────────────────────────────────────────
// │ VULNERABILITY 2 — SQL INJECTION
// │ VULNERABILITY 4 — BRUTE FORCE (no lockout, no delay, clear JSON responses)
// └─────────────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username = '', password = '' } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  try {
    // ⚠️  INTENTIONALLY VULNERABLE — string concatenation, NOT parameterized
    // Payload: username = ' OR 1=1--    password = (anything)
    const sql =
      "SELECT * FROM users WHERE username='" + username +
      "' AND password='" + password + "'";

    const user = dbGetRaw(sql);

    if (user) {
      return res.json({
        success: true,
        user: {
          id:            user.id,
          username:      user.username,
          email:         user.email,
          fullName:      user.full_name,
          balance:       user.balance,
          accountNumber: user.account_number,
        },
      });
    }

    // Clear failure — trivial for brute-force scripts to detect
    return res.status(401).json({ success: false, error: 'Invalid credentials.' });

  } catch (err) {
    // Expose raw SQL error — helps attacker confirm injection point
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Dashboard data (no auth check)
app.get('/api/dashboard', (req, res) => {
  const user = dbGet('SELECT * FROM users WHERE id = 1', []);
  const txns = dbAll(
    'SELECT * FROM transactions WHERE user_id = 1 ORDER BY date DESC LIMIT 10', []
  );
  return res.json({ user, transactions: txns });
});

// ┌─────────────────────────────────────────────────────────────────────────────
// │ VULNERABILITY 1 — XSS  (frontend search.html injects raw query via innerHTML)
// │ VULNERABILITY 2b — SQL INJECTION on search (same string-concatenation flaw)
// │   ' OR 1=1--  → returns ALL transactions
// │   ' UNION SELECT … FROM users--  → dumps credentials into results
// └─────────────────────────────────────────────────────────────────────────────
app.get('/api/search', (req, res) => {
  const q = (req.query.q ?? '').toString();

  try {
    // ⚠️  INTENTIONALLY VULNERABLE — string concatenation, NOT parameterized
    // Real DB work so flooding causes measurable slowdown (DoS demo)
    const sql =
      `SELECT t.id, t.description, t.amount, t.type, t.date, u.username, u.full_name
       FROM   transactions t
       JOIN   users        u ON u.id = t.user_id
       WHERE  t.description LIKE '%` + q + `%'
       ORDER  BY t.date DESC
       LIMIT  50`;

    const results = dbAllRaw(sql);

    // ⚠️  query echoed back raw — search.html must NOT sanitize it for XSS to fire
    return res.json({ results, query: q });
  } catch (err) {
    return res.status(500).json({ error: err.message, query: q });
  }
});

// Transfer endpoint
app.post('/api/transfer', (req, res) => {
  const { recipient, amount, note } = req.body;

  if (!recipient || !amount) {
    return res.status(400).json({ success: false, error: 'Recipient and amount are required.' });
  }

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount.' });
  }

  const user = dbGet('SELECT * FROM users WHERE id = 1', []);
  if (user.balance < amt) {
    return res.status(400).json({ success: false, error: 'Insufficient balance.' });
  }

  dbRun('UPDATE users SET balance = balance - ? WHERE id = 1', [amt]);
  dbRun(
    `INSERT INTO transactions (user_id,description,amount,type,date,recipient)
     VALUES (1,?,?,'debit',date('now'),?)`,
    [note || `Transfer to ${recipient}`, amt, recipient]
  );

  const updated = dbGet('SELECT balance FROM users WHERE id = 1', []);
  return res.json({ success: true, newBalance: updated.balance, recipient, amount: amt });
});

// ┌─────────────────────────────────────────────────────────────────────────────
// │ VULNERABILITY 3 — DoS
// │ /status exposes request count + rate so flood impact is measurable.
// │ Every call also hits the DB (no caching), making the endpoint itself costly.
// └─────────────────────────────────────────────────────────────────────────────
app.get('/status', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const ratePerMin = uptime > 0 ? ((requestCount / uptime) * 60).toFixed(2) : '0.00';

  const userCount = dbGet('SELECT COUNT(*) AS c FROM users', []).c;
  const txnCount  = dbGet('SELECT COUNT(*) AS c FROM transactions', []).c;

  return res.json({
    status:           'online',
    uptime_seconds:   uptime,
    uptime_formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    total_requests:   requestCount,
    requests_per_min: parseFloat(ratePerMin),
    db_users:         userCount,
    db_transactions:  txnCount,
    port:             PORT,
    timestamp:        new Date().toISOString(),
  });
});

// Page routes
app.get('/',          (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login',     (_req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/transfer',  (_req, res) => res.sendFile(path.join(__dirname, 'public', 'transfer.html')));
app.get('/search',    (_req, res) => res.sendFile(path.join(__dirname, 'public', 'search.html')));

// ─── Server Init ──────────────────────────────────────────────────────────────

async function startServer() {
  // sql.js loads its WASM module asynchronously
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('  📂  Loaded existing database from vaultbank.db');
  } else {
    db = new SQL.Database();
  }

  setupDatabase();

  app.listen(PORT, () => {
    console.log(`\n🏦  VaultBank running  →  http://localhost:${PORT}`);
    console.log('    ⚠️  INTENTIONALLY VULNERABLE — educational demo only\n');
  });

  // ┌───────────────────────────────────────────────────────────────────────────
  // │ VULNERABILITY 5 — PORT SCAN
  // │ Three extra HTTP listeners simulate exposed internal services that a port
  // │ scanner (nmap, masscan) would discover alongside the main app on 8080.
  // └───────────────────────────────────────────────────────────────────────────
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('VaultBank Admin Panel v1.2 — Internal Use Only\n');
  }).listen(3001, () => console.log('📡  Admin Panel      →  port 3001'));

  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('VaultBank Internal API v2.0 — Restricted Access\n');
  }).listen(3002, () => console.log('📡  Internal API     →  port 3002'));

  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('VaultBank Database Monitor — Authorized Personnel Only\n');
  }).listen(3003, () => console.log('📡  Database Monitor →  port 3003'));
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
