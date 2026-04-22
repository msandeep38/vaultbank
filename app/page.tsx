import Link from 'next/link';

const stats = [
  { label: 'Active Customers', value: '2.4M+' },
  { label: 'Daily Transactions', value: '$180M+' },
  { label: 'Countries Served', value: '42' },
  { label: 'Uptime SLA', value: '99.99%' },
];

const features = [
  {
    icon: '🔐',
    title: 'Military-Grade Encryption',
    desc: 'All data encrypted at rest and in transit using AES-256 and TLS 1.3.',
  },
  {
    icon: '🛡️',
    title: 'WAF Protection',
    desc: 'Real-time Web Application Firewall blocks XSS, SQL injection, and DoS attacks.',
  },
  {
    icon: '⚡',
    title: 'Instant Transfers',
    desc: 'Send and receive money globally in seconds with zero hidden fees.',
  },
  {
    icon: '📊',
    title: 'Smart Analytics',
    desc: 'AI-powered spending insights and fraud detection on every transaction.',
  },
  {
    icon: '🌐',
    title: 'Global Coverage',
    desc: 'Banking in 42 countries with multi-currency accounts and local IBANs.',
  },
  {
    icon: '🤝',
    title: '24/7 Support',
    desc: 'Live agents available around the clock via chat, phone, or video.',
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 fade-in">
      {/* Hero */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-700/40 text-blue-400 text-xs px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full pulse-dot inline-block" />
          CyberShield WAF Active · All requests monitored
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          Banking That Puts<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Security First
          </span>
        </h1>

        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          VaultBank combines cutting-edge financial tools with enterprise-grade security.
          Every request is scanned by our AI-powered WAF before it reaches your account.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            Sign In to Your Account
          </Link>
          <Link
            href="/search"
            className="px-8 py-3 border border-[#1a2744] hover:border-blue-700 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors"
          >
            View Transactions
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        {stats.map(s => (
          <div key={s.label} className="bg-[#0d1526] border border-[#1a2744] rounded-2xl p-6 text-center">
            <div className="text-3xl font-extrabold text-blue-400 mb-1">{s.value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <h2 className="text-2xl font-bold text-white text-center mb-10">
        Why 2.4 Million Customers Trust VaultBank
      </h2>
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {features.map(f => (
          <div
            key={f.title}
            className="bg-[#0d1526] border border-[#1a2744] rounded-2xl p-6 hover:border-blue-700/50 transition-colors"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Security banner */}
      <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/10 border border-blue-800/30 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">🛡️</div>
        <h3 className="text-xl font-bold text-white mb-2">Protected by CyberShield WAF</h3>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Every request to VaultBank passes through the CyberShield Web Application Firewall, which
          detects and blocks XSS, SQL Injection, Brute Force, DoS, and Port Scan attacks in real time.
        </p>
      </div>
    </div>
  );
}
