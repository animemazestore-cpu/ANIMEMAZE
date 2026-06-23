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

export const PrivacyPolicy: React.FC = () => (
  <PolicyPage title="Privacy Policy">
    <Section title="1. Information We Collect">
      <p>
        We collect information you provide directly to us when creating an account, placing an order, subscribing to our newsletter, or contacting customer support. This includes your name, email address, phone number, physical address, and payment confirmation screenshots.
      </p>
    </Section>
    <Section title="2. How We Use Your Information">
      <p>
        We use your information to process and fulfill your orders, verify manual UPI payments, manage user accounts, send newsletters (if subscribed), and resolve support issues. We do not sell or lease your personal information to third parties.
      </p>
    </Section>
    <Section title="3. Storage & Security">
      <p>
        Our application uses Supabase Auth and Supabase Database (PostgreSQL) for user data storing and authentication. File uploads, such as payment confirmation screenshots and review images, are stored securely on Supabase Storage. We follow industry standard guidelines to protect your data.
      </p>
    </Section>
    <Section title="4. Cookies">
      <p>
        We use local storage and standard cookies to persist your login sessions, manage your shopping cart state, and save your wishlist preferences. You can disable cookies in your browser settings, but some features of the shop may not function properly.
      </p>
    </Section>
    <Section title="5. Updates to This Policy">
      <p>
        We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date.
      </p>
    </Section>
  </PolicyPage>
);
