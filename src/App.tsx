import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Import Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';
import { TrackOrder } from './pages/TrackOrder';

// Import Static Pages
import { AboutUs } from './pages/static/AboutUs';
import { FAQ } from './pages/static/FAQ';
import { PrivacyPolicy } from './pages/static/PrivacyPolicy';
import { TermsConditions } from './pages/static/TermsConditions';
import { ShippingPolicy } from './pages/static/ShippingPolicy';
import { RefundPolicy } from './pages/static/RefundPolicy';

// Scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  const checkSession = useAuthStore((state) => state.checkSession);

  // Initialize session state on startup
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/track" element={<TrackOrder />} />

            {/* Static pages routes */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;
