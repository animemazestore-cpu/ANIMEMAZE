import React from 'react';

export const RefundPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="glass-card p-8 sm:p-12 rounded-2xl border border-white/5">
        <h1 className="text-3xl font-extrabold text-white mb-6">Refund & Return Policy</h1>
        <p className="text-xs text-gray-500 mb-6">Last Updated: June 20, 2026</p>
        
        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Refund Eligibility</h2>
            <p>
              We offer refunds or replacements under the following conditions:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>The product received is damaged, broken, or has paint defects.</li>
              <li>The incorrect item or size was shipped.</li>
              <li>The order is cancelled before it has been shipped.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Unboxing Video Requirement</h2>
            <p>
              To claim a refund or replacement for damaged items, you must record a continuous unboxing video of the parcel starting from the sealed outer box label showing the shipping details. This ensures complete transparency and speeds up verification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Claim Window</h2>
            <p>
              All refund or exchange claims must be submitted to our customer support within 7 days of order delivery. Claims made after this 7-day period will not be accepted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Refund Processing Time</h2>
            <p>
              Once a refund claim is approved by our support team, the refund amount will be credited back manually to your original UPI account or bank account. The process takes about 2-3 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Return Shipping</h2>
            <p>
              If a return of the item is required, we will arrange a reverse pickup from your address at no additional cost. If reverse pickup is unavailable in your area, you may self-ship, and we will reimburse standard shipping costs up to ₹100.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
