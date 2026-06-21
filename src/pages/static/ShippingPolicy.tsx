import React from 'react';

export const ShippingPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="glass-card p-8 sm:p-12 rounded-2xl border border-white/5">
        <h1 className="text-3xl font-extrabold text-white mb-6">Shipping Policy</h1>
        <p className="text-xs text-gray-500 mb-6">Last Updated: June 20, 2026</p>
        
        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Payment Verification Timeline</h2>
            <p>
              Since we use a manual UPI payment system, orders are only processed after we verify the payment. Verification occurs within 12 to 24 hours of screenshot upload. Once approved, the order status changes to 'PAID' and enters the packaging phase.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Processing Time</h2>
            <p>
              Orders are packaged and dispatched within 1-2 business days after payment verification is completed. Dispatches do not occur on Sundays or public holidays.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Delivery Timelines</h2>
            <p>
              We deliver nationwide. Standard delivery usually takes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Metro Cities: 3 - 5 business days</li>
              <li>Non-Metro Cities: 5 - 7 business days</li>
              <li>Remote Regions: 7 - 10 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Shipping Charges</h2>
            <p>
              Shipping is free for all orders above ₹999. For orders below ₹999, a flat shipping charge of ₹79 will be added at checkout.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Tracking Your Order</h2>
            <p>
              As soon as your order is shipped, a tracking number and courier link will be updated in your User Dashboard under the 'My Orders' section. You can check the shipping status directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
