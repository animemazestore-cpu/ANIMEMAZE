import React from 'react';
import { ShieldCheck, Heart, Sparkles, Truck } from 'lucide-react';

export const AboutUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
        About AnimeMaze
      </h1>
      <p className="text-gray-400 text-center text-lg max-w-xl mx-auto mb-12">
        AnimeMaze is a premium anime merchandise marketplace where anime fans can find authentic, high-quality merchandise to express their fandom.
      </p>

      <div className="space-y-12">
        {/* Our Mission */}
        <div className="glass-card p-8 rounded-2xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span>Our Mission</span>
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Founded by hardcore anime fans, our mission is simple: to make high-quality, authentic anime merchandise accessible to otakus worldwide without breaking the bank. We curate products from trusted sources and guarantee excellent craftsmanship for every item we list.
          </p>
        </div>

        {/* Why Choose Us Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white text-center mb-8">Why AnimeMaze?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-xl border border-white/5 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-white mb-2">Premium Curation</h3>
              <p className="text-xs text-gray-400">
                From action figures to prop katanas and accessories, we verify details and paint quality.
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl border border-white/5 text-center">
              <div className="mx-auto w-12 h-12 bg-secondary/10 border border-secondary/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-bold text-white mb-2">Trustworthy Ordering</h3>
              <p className="text-xs text-gray-400">
                Secure manual UPI screenshot verification prevents gateway failures and fraud.
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl border border-white/5 text-center">
              <div className="mx-auto w-12 h-12 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-bold text-white mb-2">Fast Logistics</h3>
              <p className="text-xs text-gray-400">
                Fully tracked delivery service straight to your doorstep within 5-7 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Our Catalog */}
        <div className="glass-card p-8 rounded-2xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-4">Our Extensive Merchandise</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            We feature a huge variety of products, including:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-300 font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Anime Action Figures</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Anime Keychains</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Posters & Wall Decor</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Decorative Katanas</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Anime Hoodies & Shirts</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span>Watches & Stickers</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-6 italic">
            *Please note that our decorative katanas are blunt display props only. They are not weapons and must be handled responsibly.
          </p>
        </div>
      </div>
    </div>
  );
};
