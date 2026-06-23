import React from 'react';

const PolicyPage: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-sm">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">{title}</h1>
      <p className="text-xs text-gray-500 mb-6">Last Updated: June 20, 2026</p>
      <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
        {children}
      </div>
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
    {children}
  </section>
);

export const RefundPolicy: React.FC = () => (
  <PolicyPage title="Refund & Return Policy">
    <Section title="1. Refund Eligibility">
      <p>We offer refunds or replacements under the following conditions:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>The product received is damaged, broken, or has paint defects.</li>
        <li>The incorrect item or size was shipped.</li>
        <li>The order is cancelled before it has been shipped.</li>
      </ul>
    </Section>
    <Section title="2. Unboxing Video Requirement">
      <p>
        To claim a refund or replacement for damaged items, you must record a continuous unboxing video of the parcel starting from the sealed outer box label showing the shipping details. This ensures complete transparency and speeds up verification.
      </p>
    </Section>
    <Section title="3. Claim Window">
      <p>
        All refund or exchange claims must be submitted to our customer support within 7 days of order delivery. Claims made after this 7-day period will not be accepted.
      </p>
    </Section>
    <Section title="4. Refund Processing Time">
      <p>
        Once a refund claim is approved by our support team, the refund amount will be credited back manually to your original UPI account or bank account. The process takes about 2-3 business days.
      </p>
    </Section>
    <Section title="5. Return Shipping">
      <p>
        If a return of the item is required, we will arrange a reverse pickup from your address at no additional cost. If reverse pickup is unavailable in your area, you may self-ship, and we will reimburse standard shipping costs up to ₹100.
      </p>
    </Section>
  </PolicyPage>
);
