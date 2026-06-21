import React from 'react';

export const TermsConditions: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="glass-card p-8 sm:p-12 rounded-2xl border border-white/5">
        <h1 className="text-3xl font-extrabold text-white mb-6">Terms & Conditions</h1>
        <p className="text-xs text-gray-500 mb-6">Last Updated: June 20, 2026</p>
        
        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Terms of Service</h2>
            <p>
              By accessing and placing orders on AnimeMaze, you confirm that you are at least 18 years of age or are accessing the site under the supervision of a parent or guardian. You agree to comply with all local laws and terms listed on this page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Product Descriptions & Stock</h2>
            <p>
              We endeavor to be as accurate as possible with our product images, description, pricing, and stock specifications. However, we do not warrant that product descriptions or other content are error-free. If a product is listed with incorrect details due to typographical error, we reserve the right to cancel any orders placed for that product.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Manual Payments & Screenshot Upload</h2>
            <p>
              Orders placed on AnimeMaze require manual payment via UPI to our designated UPI ID (8445619079@fam). You must upload a valid, unaltered screenshot of the successful transaction. Uploading fraudulent, fake, or reused screenshots is strictly prohibited. We reserve the right to ban users and cancel orders if fraudulent screenshots are uploaded.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Decorative Props & Katanas</h2>
            <p>
              All katanas, knives, or weapon replicas sold on AnimeMaze are blunt display props or cosplay accessories. They are not weapons. The customer assumes full responsibility for complying with their local state and national regulations regarding ownership and display of cosplay replicas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Account Termination</h2>
            <p>
              We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion, including but not limited to, if we believe user behavior violates applicable law or is harmful to the interests of AnimeMaze.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
