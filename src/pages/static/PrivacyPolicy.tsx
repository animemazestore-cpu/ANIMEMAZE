import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="glass-card p-8 sm:p-12 rounded-2xl border border-white/5">
        <h1 className="text-3xl font-extrabold text-white mb-6">Privacy Policy</h1>
        <p className="text-xs text-gray-500 mb-6">Last Updated: June 20, 2026</p>
        
        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when creating an account, placing an order, subscribing to our newsletter, or contacting customer support. This includes your name, email address, phone number, physical address, and payment confirmation screenshots.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. How We Use Your Information</h2>
            <p>
              We use your information to process and fulfill your orders, verify manual UPI payments, manage user accounts, send newsletters (if subscribed), and resolve support issues. We do not sell or lease your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Storage & Security</h2>
            <p>
              Our application uses Supabase Auth and Supabase Database (PostgreSQL) for user data storing and authentication. File uploads, such as payment confirmation screenshots and review images, are stored securely on Supabase Storage. We follow industry standard guidelines to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Cookies</h2>
            <p>
              We use local storage and standard cookies to persist your login sessions, manage your shopping cart state, and save your wishlist preferences. You can disable cookies in your browser settings, but some features of the shop may not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
