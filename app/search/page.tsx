'use client';
import { useState } from 'react';

type Transaction = {
  id: number;
  amount: string;
  description: string;
  type: 'credit' | 'debit';
  date: string;
  username: string;
};

const ATTACK_EXAMPLES = [
  { label: "Normal search", value: "salary", desc: "Returns real DB rows" },
  { label: "XSS attempt", value: "<script>alert('XSS')</script>", desc: "CyberShield blocks" },
  { label: "SQLi attempt", value: "' OR 1=1--", desc: "CyberShield blocks" },
  { label: "SQLi UNION", value: "' UNION SELECT * FROM users--", desc: "CyberShield blocks" },
];

export default function SearchPage() {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<Transaction[]>([]);
  const [searched, setSearched]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function doSearch(q: string) {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data.results ?? []);
      } else {
        setError(data.error ?? 'Search failed.');
        setResults([]);
      }
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Transaction Search</h1>
        <p className="text-gray-500 text-sm">
          Search across all customer transactions. CyberShield scans every query for malicious payloads.
        </p>
      </div>

      {/* Search box */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Search transactions (e.g. "salary", "rent", "Amazon")…'
          className="flex-1 bg-[#0d1526] border border-[#1a2744] focus:border-blue-600 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? 'Searching…' : '🔍 Search'}
        </button>
      </form>

      {/* Attack demo buttons */}
      <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl p-5 mb-8">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          🎯 Demo Attack Payloads — click to try
        </p>
        <div className="flex flex-wrap gap-2">
          {ATTACK_EXAMPLES.map(ex => (
            <button
              key={ex.label}
              onClick={() => { setQuery(ex.value); doSearch(ex.value); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#1a2744] hover:border-blue-700 text-gray-400 hover:text-white transition-colors"
              title={ex.desc}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          ⚡ Attack payloads are intercepted by CyberShield <em>before</em> reaching this server.
          Your browser will show a block page if running through the proxy.
        </p>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-red-400 text-sm mb-6">
          ⚠️ {error}
        </div>
      )}

      {searched && !loading && !error && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {results.length} result{results.length !== 1 ? 's' : ''} for &quot;<span className="text-white">{query}</span>&quot;
          </p>

          {results.length === 0 ? (
            <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl p-10 text-center text-gray-600">
              No transactions found matching your query.
            </div>
          ) : (
            <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1a2744] bg-[#060c1a]">
                    <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">ID</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Description</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">User</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Type</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((tx, i) => (
                    <tr
                      key={tx.id}
                      className={`border-b border-[#1a2744] hover:bg-white/[0.02] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                    >
                      <td className="px-5 py-4 text-gray-600 font-mono">#{tx.id}</td>
                      <td className="px-5 py-4 text-gray-200">{tx.description}</td>
                      <td className="px-5 py-4 text-blue-400">{tx.username}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          tx.type === 'credit'
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-red-900/40 text-red-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-right font-mono font-semibold ${
                        tx.type === 'credit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
