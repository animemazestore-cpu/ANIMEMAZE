import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag, TrendingUp, Gift, ArrowRight, ShieldCheck, Check, Send, Star, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types/database';
import { getLocalProducts, getLocalCategories, MOCK_PRODUCTS, MOCK_CATEGORIES, sanitizeSlug } from '../lib/persistence';
import { Button } from '../components/common/Button';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const isMock = localStorage.getItem('animemaze_mock_session') === 'true';
      if (isMock) {
        setCategories(getLocalCategories().length > 0 ? getLocalCategories().slice(0, 6) : MOCK_CATEGORIES);
        setFeaturedProducts(getLocalProducts().filter(p => p.featured).length > 0 ? getLocalProducts().filter(p => p.featured).slice(0, 4) : MOCK_PRODUCTS);
        return;
      }

      const withTimeout = <T extends any>(promise: PromiseLike<T>, ms = 4000): Promise<T> => {
        return Promise.race([
          Promise.resolve(promise),
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);
      };

      try {
        // Fetch categories
        const { data: dbCategories, error: catError } = await withTimeout(
          supabase.from('categories').select('*').limit(6),
          4000
        );
        if (catError) throw catError;

        const localCats = getLocalCategories();
        const mergedCats = [...localCats];
        if (dbCategories) {
          dbCategories.forEach((c: any) => {
            if (!mergedCats.some(mc => mc.id === c.id)) {
              mergedCats.push(c);
            }
          });
        }
        setCategories(mergedCats.length > 0 ? mergedCats.slice(0, 6) : MOCK_CATEGORIES);

        // Fetch featured products
        const { data: dbProducts, error: prodError } = await withTimeout(
          supabase.from('products').select('*').eq('featured', true).limit(4),
          4000
        );
        if (prodError) throw prodError;

        const localProds = getLocalProducts().filter(p => p.featured);
        const mergedProds = [...localProds];
        if (dbProducts) {
          dbProducts.forEach((p: any) => {
            const sanitizedProd = {
              ...p,
              price: Number(p.price),
              slug: sanitizeSlug(p.slug, p.name)
            };
            if (!mergedProds.some(mp => mp.id === p.id)) {
              mergedProds.push(sanitizedProd);
            }
          });
        }
        setFeaturedProducts(mergedProds.length > 0 ? mergedProds.slice(0, 4) : MOCK_PRODUCTS);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        const localCats = getLocalCategories();
        const localProds = getLocalProducts().filter(p => p.featured);
        setCategories(localCats.length > 0 ? localCats.slice(0, 6) : MOCK_CATEGORIES);
        setFeaturedProducts(localProds.length > 0 ? localProds.slice(0, 4) : MOCK_PRODUCTS);
      }
    };
    fetchData();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: newsletterEmail.trim() });
      
      if (error) throw error;
      
      // If error is code 23505 (unique violation), it means already subscribed.
      // We will handle either as success to the user
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    } catch (err) {
      console.error('Error subscribing to newsletter:', err);
      // Fallback local success
      setNewsletterSubscribed(true);
    }
  };

  return (
    <div className="space-y-24 pb-16">
      {/* 1. Hero Banner */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Deep layered background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#070B14]" />
          {/* Dramatic purple aurora top-left */}
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-primary/25 rounded-full blur-[120px]" />
          {/* Cyan/teal glow bottom-right */}
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[100px]" />
          {/* Center grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
        </div>

        {/* Floating animated particles */}
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full z-10 pointer-events-none"
            style={{
              width: `${3 + (i % 4) * 2}px`,
              height: `${3 + (i % 4) * 2}px`,
              background: i % 3 === 0 ? 'rgba(139,92,246,0.8)' : i % 3 === 1 ? 'rgba(6,182,212,0.7)' : 'rgba(236,72,153,0.7)',
              left: `${5 + (i * 7) % 90}%`,
              top: `${10 + (i * 11) % 80}%`,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
          />
        ))}

        {/* Horizontal scanline accent */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full grid lg:grid-cols-2 gap-8 items-center py-16 lg:py-0">
          {/* LEFT: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-7"
          >
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-primary relative" />
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary-light text-xs font-bold uppercase tracking-widest">India's #1 Anime Store</span>
            </motion.div>

            {/* Main heading */}
            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05]"
              >
                Your Anime{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(139,92,246,0.8)]">
                    Universe
                  </span>
                  {/* Underline glow */}
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 blur-sm" />
                </span>
                <br />
                <span className="text-white">Awaits</span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-gray-300 text-base sm:text-lg max-w-md leading-relaxed"
            >
              Premium action figures, katanas, apparel, keychains & collector accessories — all from your favourite anime.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <button
                onClick={() => navigate('/shop')}
                className="group relative flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white overflow-hidden shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6, #6d28d9)' }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg,#8b5cf6,#a78bfa,#7c3aed)' }} />
                <ShoppingBag className="h-5 w-5 relative z-10" />
                <span className="relative z-10">Shop Now</span>
                <ArrowRight className="h-4 w-4 relative z-10 -translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-200" />
              </button>
              <button
                onClick={() => navigate('/shop')}
                className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-white border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02]"
              >
                <Sparkles className="h-5 w-5 text-primary-light" />
                Browse Categories
              </button>
            </motion.div>

            {/* Social proof stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="flex items-center gap-6 pt-2"
            >
              <div className="text-center">
                <p className="text-white font-extrabold text-xl">500+</p>
                <p className="text-gray-500 text-xs">Products</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-white font-extrabold text-xl">10K+</p>
                <p className="text-gray-500 text-xs">Happy Fans</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-gray-400 text-xs ml-1">4.9/5</span>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT: Anime Characters PNG */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="hidden lg:flex items-end justify-center relative"
            style={{ minHeight: '580px' }}
          >
            {/* Dramatic halo behind characters */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full blur-[80px] opacity-60" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(6,182,212,0.2) 60%, transparent 100%)' }} />
            </div>
            {/* Ground glow reflection */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-16 blur-2xl opacity-50" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.5) 0%, transparent 70%)' }} />
            {/* Character image with mix-blend-mode for seamless dark blending */}
            <img
              src="/hero_bg.png"
              alt="Anime Characters"
              className="relative z-10 w-full max-w-lg object-bottom"
              style={{
                objectFit: 'contain',
                height: '540px',
                filter: 'drop-shadow(0 0 40px rgba(139,92,246,0.6)) drop-shadow(0 0 80px rgba(6,182,212,0.2)) brightness(1.05) contrast(1.05)',
              }}
            />
            {/* Floating tag badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-16 right-0 glass-card rounded-2xl px-4 py-3 border border-primary/20 shadow-lg shadow-primary/10 z-20"
            >
              <p className="text-xs text-gray-400 font-medium">Latest Drop</p>
              <p className="text-white text-sm font-bold">Bleach Action Figure</p>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-24 left-0 glass-card rounded-2xl px-4 py-3 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 z-20"
            >
              <p className="text-xs text-gray-400 font-medium">Free Shipping</p>
              <p className="text-white text-sm font-bold">Orders ₹899+</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070B14] to-transparent z-10 pointer-events-none" />
      </section>

      {/* 2. Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Popular Categories</h2>
            <p className="text-gray-400 text-sm mt-1">Browse our handpicked anime collections</p>
          </div>
          <Link to="/shop" className="text-primary hover:text-primary-light text-sm font-semibold flex items-center space-x-1.5 transition-colors">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id || idx}
              whileHover={{ y: -6 }}
              onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
              className="glass-card rounded-2xl overflow-hidden border border-white/5 cursor-pointer flex flex-col group"
            >
              <div className="aspect-square w-full relative overflow-hidden bg-surface">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              </div>
              <div className="p-4 text-center mt-auto">
                <h3 className="font-bold text-sm text-gray-200 group-hover:text-white transition-colors">{cat.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="flex items-center space-x-2 text-secondary text-xs font-semibold uppercase tracking-wider mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>Trending Items</span>
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Featured Collectibles</h2>
          </div>
          <Link to="/shop?featured=true" className="text-secondary hover:text-secondary-light text-sm font-semibold flex items-center space-x-1.5 transition-colors">
            <span>Shop Hot Items</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {featuredProducts.map((product, idx) => (
            <motion.div
              key={product.id || idx}
              whileHover={{ y: -4 }}
              className="glass-card rounded-xl border border-white/5 overflow-hidden flex flex-col relative group cursor-pointer"
              onClick={() => navigate(`/product/${product.slug}`)}
            >
              {/* Badge */}
              <span className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-secondary text-background font-extrabold text-[9px] sm:text-[10px] uppercase rounded-md tracking-wider">
                Featured
              </span>

              {/* Product Image */}
              <div className="aspect-[4/5] bg-surface relative overflow-hidden">
                <img
                  src={product.main_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Details */}
              <div className="p-2.5 sm:p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-xs sm:text-base text-white group-hover:text-primary-light transition-colors line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-2 leading-relaxed flex-grow hidden sm:block">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-2 sm:mt-5 pt-2 sm:pt-3 border-t border-white/5">
                  <span className="font-bold text-sm sm:text-lg text-white">₹{product.price}</span>
                  <span className="text-[9px] sm:text-xs font-medium text-success bg-success/10 border border-success/20 px-1.5 sm:px-2 py-0.5 rounded">
                    In Stock
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Trust Banner */}
      <section className="bg-surface/50 border-y border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Manual UPI Safety</h4>
                <p className="text-xs text-gray-400 mt-1">Verify payment via QR screenshot. Zero payment gateway failures or hidden fees.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl">
                <Gift className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Cosplay Display Props</h4>
                <p className="text-xs text-gray-400 mt-1">Safety-blunt collection swords, accessories, and sturdy figures optimized for otakus.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-success/10 border border-success/20 rounded-xl">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Verified Product Reviews</h4>
                <p className="text-xs text-gray-400 mt-1">Real ratings, comments, and image uploads from certified buyers only.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white">What Anime Fans Say</h2>
          <p className="text-gray-400 text-sm mt-1">Trusted by thousands of collectors and cosplayers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-6 rounded-2xl border border-white/5 relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                R
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Rohan Sharma</h4>
                <p className="text-xs text-gray-500">Verified Buyer</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed italic">
              "The Zoro Shusui katana is absolutely gorgeous! It's solid, has a great weight, and looks epic on my wall setup. The UPI verification was super quick."
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/5 relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-secondary/20 border border-secondary/40 rounded-full flex items-center justify-center text-secondary font-bold text-sm">
                P
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Priya Patel</h4>
                <p className="text-xs text-gray-500">Verified Buyer</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed italic">
              "Honestly, the hoodie embroidery is high quality! It survived five washes already, and the red cloud still looks brand new. Highly recommend AnimeMaze."
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/5 relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-success/20 border border-success/40 rounded-full flex items-center justify-center text-success font-bold text-sm">
                A
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Arjun Varma</h4>
                <p className="text-xs text-gray-500">Verified Buyer</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed italic">
              "Awesome figure detailing! Packed with double layers of bubble wrap so it arrived without a single scratch. Five stars for the service."
            </p>
          </div>
        </div>
      </section>

      {/* 6. Newsletter Signup */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-white/5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
          
          <div className="max-w-xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl font-extrabold text-white">Join the AnimeMaze Club</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Subscribe to get notified about new figure drops, exclusive cosplay props, flash sales, and special otaku discount coupons!
            </p>

            {newsletterSubscribed ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center space-x-2 text-success bg-success/10 border border-success/20 px-6 py-3 rounded-full font-medium"
              >
                <Check className="h-5 w-5" />
                <span>You are now subscribed to drops list!</span>
              </motion.div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl text-sm glass-input placeholder-gray-500 focus:outline-none"
                />
                <Button type="submit" size="lg" className="w-full sm:w-auto flex-shrink-0">
                  <Send className="mr-2 h-4 w-4" />
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
