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

export const TermsConditions: React.FC = () => (
  <PolicyPage title="Terms & Conditions">
    <Section title="1. Terms of Service">
      <p>
        By accessing and placing orders on AnimeMaze, you confirm that you are at least 18 years of age or are accessing the site under the supervision of a parent or guardian. You agree to comply with all local laws and terms listed on this page.
      </p>
    </Section>
    <Section title="2. Product Descriptions & Stock">
      <p>
        We endeavor to be as accurate as possible with our product images, description, pricing, and stock specifications. However, we do not warrant that product descriptions or other content are error-free. If a product is listed with incorrect details due to typographical error, we reserve the right to cancel any orders placed for that product.
      </p>
    </Section>
    <Section title="3. Manual Payments & Screenshot Upload">
      <p>
        Orders placed on AnimeMaze require manual payment via UPI to our designated UPI ID (8445619079@fam). You must upload a valid, unaltered screenshot of the successful transaction. Uploading fraudulent, fake, or reused screenshots is strictly prohibited. We reserve the right to ban users and cancel orders if fraudulent screenshots are uploaded.
      </p>
    </Section>
    <Section title="4. Decorative Props & Katanas">
      <p>
        All katanas, knives, or weapon replicas sold on AnimeMaze are blunt display props or cosplay accessories. They are not weapons. The customer assumes full responsibility for complying with their local state and national regulations regarding ownership and display of cosplay replicas.
      </p>
    </Section>
    <Section title="5. Account Termination">
      <p>
        We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion, including but not limited to, if we believe user behavior violates applicable law or is harmful to the interests of AnimeMaze.
      </p>
    </Section>
  </PolicyPage>
);
