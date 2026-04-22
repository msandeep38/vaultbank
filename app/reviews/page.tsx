'use client';
import { useState, useEffect } from 'react';

type Review = {
  id: number;
  author: string;
  content: string;
  rating: number;
  created_at: string;
};

const XSS_EXAMPLES = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert("hacked")',
];

export default function ReviewsPage() {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [loading, setLoading]   = useState(true);
  const [author, setAuthor]     = useState('');
  const [content, setContent]   = useState('');
  const [rating, setRating]     = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState('');
  const [submitOk, setSubmitOk]     = useState(false);

  async function fetchReviews() {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReviews(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content, rating }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitOk(true);
        setSubmitMsg('Review submitted successfully!');
        setAuthor(''); setContent(''); setRating(5);
        fetchReviews();
      } else {
        setSubmitOk(false);
        setSubmitMsg(data.error ?? 'Submission failed.');
      }
    } catch {
      setSubmitOk(false);
      setSubmitMsg('Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Customer Reviews</h1>
        <p className="text-gray-500 text-sm">
          Real reviews from real customers. CyberShield protects this form from XSS attacks.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_380px] gap-8">
        {/* Reviews list */}
        <div>
          {loading ? (
            <div className="text-gray-600 py-10 text-center">Loading reviews…</div>
          ) : reviews.length === 0 ? (
            <div className="text-gray-600 py-10 text-center">No reviews yet.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-[#0d1526] border border-[#1a2744] rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-semibold text-white">{r.author}</span>
                      <span className="text-gray-600 text-xs ml-3">
                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-yellow-400 text-sm">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit form */}
        <div className="space-y-5">
          <div className="bg-[#0d1526] border border-[#1a2744] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-5">Leave a Review</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Your Name</label>
                <input
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="John Smith"
                  required
                  className="w-full bg-[#060c1a] border border-[#1a2744] focus:border-blue-600 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl outline-none text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Rating</label>
                <select
                  value={rating}
                  onChange={e => setRating(Number(e.target.value))}
                  className="w-full bg-[#060c1a] border border-[#1a2744] focus:border-blue-600 text-white px-3 py-2.5 rounded-xl outline-none text-sm"
                >
                  {[5,4,3,2,1].map(n => (
                    <option key={n} value={n}>{'★'.repeat(n)} ({n}/5)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Review</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Share your experience with VaultBank…"
                  required
                  rows={4}
                  className="w-full bg-[#060c1a] border border-[#1a2744] focus:border-blue-600 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl outline-none text-sm resize-none transition-colors"
                />
              </div>

              {submitMsg && (
                <div className={`rounded-xl p-3 text-sm ${
                  submitOk
                    ? 'bg-green-900/20 border border-green-700/40 text-green-400'
                    : 'bg-red-900/20 border border-red-700/40 text-red-400'
                }`}>
                  {submitOk ? '✅' : '⚠️'} {submitMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </div>

          {/* XSS demo panel */}
          <div className="bg-orange-900/10 border border-orange-800/30 rounded-2xl p-5">
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider mb-3">
              🎯 XSS Demo — paste into the Name or Review field
            </p>
            <div className="space-y-2">
              {XSS_EXAMPLES.map(ex => (
                <code
                  key={ex}
                  className="block text-xs bg-[#060c1a] text-orange-300 px-3 py-2 rounded-lg cursor-pointer hover:bg-orange-900/20 transition-colors"
                  onClick={() => setContent(ex)}
                  title="Click to paste into review field"
                >
                  {ex}
                </code>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Click any payload to paste it. When submitted through CyberShield proxy, it will be blocked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
