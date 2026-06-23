import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown, X, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types/database';
import { sanitizeSlug } from '../lib/persistence';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { Button } from '../components/common/Button';

export const Shop: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  // Keep search input synced with searchParams
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearch(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    const fetchShopData = async () => {
      const withTimeout = <T extends any>(promise: PromiseLike<T>, ms = 5000): Promise<T> => {
        return Promise.race([
          Promise.resolve(promise),
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);
      };

      try {
        // Always try Supabase first with cache-busting
        const { data: dbCategories, error: catError } = await withTimeout(
          supabase.from('categories').select('*'),
          5000
        );
        if (catError) throw catError;
        setCategories(dbCategories || []);

        // Fetch products from DB with cache-busting
        const { data: dbProducts, error: prodError } = await withTimeout(
          supabase.from('products').select(`
            *,
            category:categories (*)
          `),
          5000
        );
        if (prodError) throw prodError;

        const parsedProds = dbProducts ? dbProducts.map((p: any) => ({
          ...p,
          price: Number(p.price),
          slug: sanitizeSlug(p.slug, p.name)
        })) : [];
        setProducts(parsedProds);
      } catch (err) {
        console.error('Error fetching shop details:', err);
        setCategories([]);
        setProducts([]);
      }
    };

    fetchShopData();
  }, []);

  // Sync category state from URL if changed
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Apply filters and sorting locally
  const filteredProducts = products
    .filter((prod) => {
      // 1. Search Query Match
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesDesc = prod.description?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesDesc) return false;
      }

      // 2. Category Match
      if (selectedCategory !== 'All') {
        const categoryObj = categories.find((c) => c.name === selectedCategory || c.id === selectedCategory);
        const catId = categoryObj?.id || selectedCategory;
        if (prod.category_id !== catId && prod.category?.name !== selectedCategory) return false;
      }

      // 3. Price Limit
      if (prod.price > priceRange) return false;

      return true;
    })
    .sort((a, b) => {
      // 4. Sort
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'popular') return b.featured === a.featured ? 0 : b.featured ? 1 : -1;
      // Newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setPriceRange(5000);
    setSortBy('newest');
    setSearchParams({});
  };

  const handleCategoryClick = (catName: string) => {
    setSelectedCategory(catName);
    if (catName === 'All') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('category');
      setSearchParams(params.toString());
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('category', catName);
      setSearchParams(params.toString());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900">Anime merchandise</h1>
        <p className="text-sm text-gray-600 mt-1">Browse, filter, and find your favorite anime collectibles</p>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary text-gray-900"
          />
          <Search className="absolute right-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsFilterSidebarOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center space-x-2 relative w-full sm:w-auto">
            <ArrowUpDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 rounded-lg py-2 px-3 focus:outline-none focus:border-primary cursor-pointer w-full sm:w-auto"
            >
              <option value="newest" className="bg-white text-gray-900">Newest Arrivals</option>
              <option value="price-low" className="bg-white text-gray-900">Price: Low to High</option>
              <option value="price-high" className="bg-white text-gray-900">Price: High to Low</option>
              <option value="popular" className="bg-white text-gray-900">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-8 relative">
        {/* Filters Sidebar (Large screens) */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-8 bg-white border border-gray-200 p-6 rounded-2xl h-fit sticky top-24 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 text-base">Filters</h3>
            <button onClick={clearAllFilters} className="text-xs text-primary hover:underline">
              Clear All
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Categories</h4>
            <div className="flex flex-col space-y-1.5">
              <button
                onClick={() => handleCategoryClick('All')}
                className={`text-left text-sm py-1.5 px-2.5 rounded-lg transition-all font-medium ${
                  selectedCategory === 'All'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`text-left text-sm py-1.5 px-2.5 rounded-lg transition-all font-medium truncate ${
                    selectedCategory === cat.name || selectedCategory === cat.id
                      ? 'bg-primary/10 text-primary border-l-4 border-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Max Price</h4>
              <span className="text-sm font-bold text-gray-900">₹{priceRange}</span>
            </div>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>₹100</span>
              <span>₹10,000</span>
            </div>
          </div>
        </aside>

        {/* Mobile Filters Drawer */}
        {isFilterSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFilterSidebarOpen(false)} />
            <div className="relative w-80 bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-gray-200">
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-base">Filters</h3>
                  <button onClick={() => setIsFilterSidebarOpen(false)} className="text-gray-500 hover:text-gray-900">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Categories</h4>
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => {
                        handleCategoryClick('All');
                        setIsFilterSidebarOpen(false);
                      }}
                      className={`text-left text-sm py-2 px-3 rounded-lg ${
                        selectedCategory === 'All' ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          handleCategoryClick(cat.name);
                          setIsFilterSidebarOpen(false);
                        }}
                        className={`text-left text-sm py-2 px-3 rounded-lg ${
                          selectedCategory === cat.name || selectedCategory === cat.id
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'text-gray-600'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Max Price</h4>
                    <span className="text-sm font-bold text-gray-900">₹{priceRange}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 flex gap-4">
                <Button variant="outline" fullWidth onClick={clearAllFilters}>
                  Reset
                </Button>
                <Button fullWidth onClick={() => setIsFilterSidebarOpen(false)}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid Area */}
        <div className="flex-grow">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
              <SlidersHorizontal className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">Try adjusting your filters, query search text, or reset filters to explore.</p>
              <Button onClick={clearAllFilters}>Reset All Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
              {filteredProducts.map((product) => {
                const liked = user ? isInWishlist(product.id) : false;
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.slug}`)}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col group cursor-pointer hover:border-primary transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
                  >
                    {/* Image */}
                    <div className="aspect-square sm:aspect-[4/5] bg-gray-50 relative overflow-hidden">
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Wishlist Button */}
                      {user && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(user.id, product);
                          }}
                          className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2.5 rounded-full backdrop-blur-md border border-gray-200 hover:scale-110 transition-all ${
                            liked ? 'bg-danger/10 text-danger border-danger/20' : 'bg-white text-gray-400 hover:text-gray-900'
                          }`}
                        >
                          <Heart className={`h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 ${liked ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-2.5 sm:p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start gap-1 sm:gap-2 mb-1">
                        <h3 className="font-bold text-xs sm:text-base text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-gray-500 text-[10px] sm:text-xs line-clamp-2 leading-relaxed flex-grow hidden sm:block">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2 sm:mt-5 pt-2 sm:pt-3 border-t border-gray-100">
                        <span className="font-extrabold text-sm sm:text-lg text-gray-900">₹{product.price}</span>
                        {product.stock > 0 ? (
                          <span className="text-[8px] sm:text-[10px] font-bold text-success bg-success/10 border border-success/20 px-1.5 sm:px-2 py-0.5 rounded uppercase">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-[8px] sm:text-[10px] font-bold text-danger bg-danger/10 border border-danger/20 px-1.5 sm:px-2 py-0.5 rounded uppercase">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
