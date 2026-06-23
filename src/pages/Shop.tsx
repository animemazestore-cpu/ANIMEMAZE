import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import type { Product } from '../types/database';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { Button } from '../components/common/Button';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/product/ProductCardSkeleton';

export const Shop: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const categories = useCatalogStore((s) => s.categories);
  const products = useCatalogStore((s) => s.products);
  const productsLoading = useCatalogStore((s) => s.productsLoading);
  const initializeCatalog = useCatalogStore((s) => s.initializeCatalog);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('featured') === 'true');
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  const isInitialLoad = productsLoading && products.length === 0;

  useEffect(() => {
    void initializeCatalog();
  }, [initializeCatalog]);

  // Keep search input synced with searchParams
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearch(urlSearch);
  }, [searchParams]);

  // Sync category and featured state from URL
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
    setFeaturedOnly(searchParams.get('featured') === 'true');
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        if (featuredOnly && !prod.featured) return false;

        if (search.trim()) {
          const query = search.toLowerCase();
          const matchesName = prod.name.toLowerCase().includes(query);
          const matchesDesc = prod.description?.toLowerCase().includes(query) || false;
          if (!matchesName && !matchesDesc) return false;
        }

        if (selectedCategory !== 'All') {
          const categoryObj = categories.find(
            (c) => c.name === selectedCategory || c.id === selectedCategory
          );
          const catId = categoryObj?.id || selectedCategory;
          if (prod.category_id !== catId && prod.category?.name !== selectedCategory) return false;
        }

        if (prod.price > priceRange) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'popular') return b.featured === a.featured ? 0 : b.featured ? 1 : -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [products, search, selectedCategory, featuredOnly, priceRange, sortBy, categories]);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setFeaturedOnly(false);
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

  const handleProductNavigate = useCallback(
    (slug: string) => navigate(`/product/${slug}`),
    [navigate]
  );

  const handleToggleWishlist = useCallback(
    (product: Product) => {
      if (user) toggleWishlist(user.id, product);
    },
    [user, toggleWishlist]
  );

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
          {isInitialLoad ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
              <ProductCardSkeleton count={6} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
              <SlidersHorizontal className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">Try adjusting your filters, query search text, or reset filters to explore.</p>
              <Button onClick={clearAllFilters}>Reset All Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={handleProductNavigate}
                  showWishlist={Boolean(user)}
                  isWishlisted={user ? isInWishlist(product.id) : false}
                  onToggleWishlist={user ? handleToggleWishlist : undefined}
                  descriptionClassName="text-[10px] sm:text-xs"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
