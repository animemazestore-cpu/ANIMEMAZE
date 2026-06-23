import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CreditCard } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="text-2xl font-extrabold tracking-wider text-primary">
              AnimeMaze
            </Link>
            <p className="mt-4 text-gray-600 text-sm leading-relaxed max-w-sm">
              The premium marketplace for anime action figures, keychains, posters, wall decor, display prop katanas, hoodies, watches, and accessories. Experience the ultimate shopping experience for Otakus.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-500 hover:text-primary transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/animemaze.store" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors" aria-label="GitHub">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                  <path d="M9 18c-4.51 2-5-2-7-2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/shop" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link to="/shop?category=action-figures" className="hover:text-primary transition-colors">Action Figures</Link></li>
              <li><Link to="/shop?category=hoodies" className="hover:text-primary transition-colors">Anime Hoodies</Link></li>
              <li><Link to="/shop?category=katanas" className="hover:text-primary transition-colors">Display Katanas</Link></li>
              <li><Link to="/shop?category=accessories" className="hover:text-primary transition-colors">Accessories</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/track" className="hover:text-primary transition-colors">Track Order</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-primary transition-colors">Shipping Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
            </ul>
            <div className="mt-6 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-700 mb-1">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                <span>UPI Payments</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">
                Secure manual payment validation. Upload screenshot after checking out.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2026 AnimeMaze. All rights reserved. Built for Anime Fans globally.</p>
          <div className="flex items-center space-x-1.5 mt-4 md:mt-0">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>Secure 256-bit Database Authentication</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
