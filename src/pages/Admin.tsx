import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCatalogStore } from '../store/useCatalogStore';
import { supabase } from '../lib/supabase';
import type { Product, Category, Order, ProductQuestion, Review, NewsletterSubscriber, ReplacementRequest } from '../types/database';
import { sanitizeSlug } from '../lib/persistence';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ShieldCheck, Plus, Edit, Trash2, Check, X, CreditCard, ShoppingBag, List, MessageSquare, Star, Mail, Download, AlertTriangle, Eye, RefreshCcw, Tag, Megaphone } from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, initialized } = useAuthStore();
  const fetchCategories = useCatalogStore((s) => s.fetchCategories);

  // Tabs
  const [activeTab, setActiveTab] = useState<'verification' | 'products' | 'categories' | 'orders' | 'inventory' | 'questions' | 'reviews' | 'subscribers' | 'replacements' | 'coupons' | 'announcement'>('verification');

  // Database Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [replacementRequests, setReplacementRequests] = useState<ReplacementRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Forms / Modals States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    stock: 0,
    featured: false,
    category_id: '',
    main_image_url: '',
    additional_images: '' // comma-separated strings
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    image_url: '',
    size_enabled: false
  });

  // Selected Order for screenshot view
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);

  // Tracking Modal States
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingTargetStatus, setTrackingTargetStatus] = useState('');

  // Coupon Management States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [couponForm, setCouponForm] = useState({ code: '', type: 'PERCENT' as 'PERCENT' | 'FIXED', value: 0, minOrder: 0, active: true });

  // Announcement State
  const [announcementText, setAnnouncementText] = useState('🎉 Special Launch Offer: Use code ANIME20 for 20% discount! 🚚 FREE Shipping on orders above ₹999!');

  // Verification checks for admin role
  useEffect(() => {
    if (initialized) {
      if (!user) {
        navigate('/auth');
      } else if (profile && profile.role !== 'admin') {
        navigate('/');
      } else {
        loadAdminData();
        loadReplacementsData();
        loadAnnouncement();
      }
    }
  }, [user, profile, initialized, navigate]);

  // --- Coupon Management ---
  const loadCoupons = useCallback(async () => {
    try {
      const { data: dbCoupons, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      const mappedCoupons = dbCoupons ? dbCoupons.map((c: any) => ({
        id: c.id,
        code: c.code,
        type: c.discount_type || c.type,
        value: Number(c.discount_value !== undefined ? c.discount_value : c.value),
        minOrder: Number(c.min_order_amount !== undefined ? c.min_order_amount : c.min_order),
        active: c.active,
        created_at: c.created_at
      })) : [];
      setCoupons(mappedCoupons);
    } catch (err) {
      console.warn('Failed to load coupons from DB:', err);
      setCoupons([]);
    }
  }, []);

  // Fetch / sync replacement requests from database
  const loadReplacementsData = useCallback(async () => {
    try {
      const { data: dbReplacements } = await supabase
        .from('replacement_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      setReplacementRequests(dbReplacements || []);
    } catch (err) {
      console.warn('Failed to fetch replacement requests from database:', err);
      setReplacementRequests([]);
    }
  }, []);

  // Load Data
  const loadAdminData = async () => {
    setLoadingData(true);

    try {
      // 1. Fetch categories
      try {
        const { data: dbCats } = await supabase.from('categories').select('*');
        setCategories(dbCats || []);
      } catch (err) {
        console.error('Error loading categories:', err);
        setCategories([]);
      }

      // 2. Fetch products
      try {
        const { data: dbProds } = await supabase.from('products').select('*, category:categories(*)');
        const parsedProds = dbProds ? dbProds.map((p: any) => ({
          ...p,
          price: Number(p.price),
          slug: sanitizeSlug(p.slug, p.name)
        })) : [];
        setProducts(parsedProds);
      } catch (err) {
        console.error('Error loading products:', err);
        setProducts([]);
      }

      // 3. Fetch orders
      try {
        const { data: dbOrders } = await supabase.from('orders').select(`
          *,
          payment_proof:payment_proof (screenshot_url),
          items:order_items (
            *,
            product:products (*)
          )
        `).order('created_at', { ascending: false });

        const dbOrdersList = dbOrders || [];

        // Map the selected variant from shipping_address JSON and convert payment proof array to object
        const ordersWithVariantsMapped = dbOrdersList.map((order: any) => {
          const itemVariants = order.shipping_address?.item_variants || [];
          const proof = Array.isArray(order.payment_proof)
            ? order.payment_proof[0]
            : order.payment_proof;
          return {
            ...order,
            payment_proof: proof || null,
            items: order.items?.map((item: any) => {
              const matchedVariant = itemVariants.find((iv: any) => iv.product_id === item.product_id);
              return {
                ...item,
                selected_variant: item.selected_variant || matchedVariant?.selected_variant || null
              };
            })
          };
        });

        setOrders(ordersWithVariantsMapped as Order[]);
      } catch (err) {
        console.error('Error loading orders:', err);
        setOrders([]);
      }

      // 4. Fetch questions
      try {
        const { data: dbQuestions, error: qnaError } = await supabase.from('product_questions').select('*').order('created_at', { ascending: false });
        if (qnaError) throw qnaError;
        setQuestions(dbQuestions as ProductQuestion[] || []);
      } catch (err) {
        console.error('Error loading questions:', err);
        setQuestions([]);
      }

      // 5. Fetch reviews
      try {
        const { data: dbReviews, error: revError } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (revError) throw revError;
        setReviews(dbReviews as Review[] || []);
      } catch (err) {
        console.error('Error loading reviews:', err);
        setReviews([]);
      }

      // 6. Fetch subscribers
      try {
        const { data: dbSubs } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
        if (dbSubs) setSubscribers(dbSubs as NewsletterSubscriber[]);
      } catch (err) {
        console.error('Error loading subscribers:', err);
      }

      // 7. Fetch replacement requests
      await loadReplacementsData();

      // Load coupons
      loadCoupons();

      // Load announcement
      loadAnnouncement();

    } catch (err) {
      console.error('Error loading admin dashboard details:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadAdminData();
    }
  }, [user, profile]);

  // Auto-refresh replacement requests when on the replacements tab
  useEffect(() => {
    if (activeTab !== 'replacements') return;
    loadReplacementsData(); // immediate refresh on tab switch
    const interval = setInterval(loadReplacementsData, 3000);
    return () => clearInterval(interval);
  }, [activeTab, loadReplacementsData]);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponForm.code.trim().toUpperCase();
    if (!code) return;
    
    try {
      if (editingCoupon) {
        // Update in DB
        const { error } = await supabase
          .from('coupons')
          .update({ 
            code, 
            discount_type: couponForm.type, 
            discount_value: couponForm.value, 
            min_order_amount: couponForm.minOrder, 
            active: couponForm.active 
          })
          .eq('code', editingCoupon.code);
        if (error) throw error;
      } else {
        // Check duplicate
        if (coupons.some(c => c.code === code)) {
          alert('Coupon code already exists!');
          return;
        }
        // Insert in DB
        const { error } = await supabase
          .from('coupons')
          .insert({ 
            code, 
            discount_type: couponForm.type, 
            discount_value: couponForm.value, 
            min_order_amount: couponForm.minOrder, 
            active: couponForm.active 
          });
        if (error) throw error;
      }
      alert(editingCoupon ? 'Coupon updated!' : 'Coupon created!');
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      loadCoupons();
    } catch (err: any) {
      console.error('Coupon submit failed:', err);
      alert('Failed to save coupon: ' + (err.message || err));
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('code', code);
      if (error) throw error;
      alert('Coupon deleted!');
      loadCoupons();
    } catch (err: any) {
      console.error('Coupon delete failed:', err);
      alert('Failed to delete coupon: ' + (err.message || err));
    }
  };

  const handleToggleCoupon = async (code: string) => {
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) return;
    try {
      const { error } = await supabase.from('coupons').update({ active: !coupon.active }).eq('code', code);
      if (error) throw error;
      loadCoupons();
    } catch (err: any) {
      console.error('Coupon toggle failed:', err);
      alert('Failed to toggle coupon status: ' + (err.message || err));
    }
  };

  // --- Announcement Management ---
  const loadAnnouncement = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_announcements')
        .select('message')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setAnnouncementText(data[0].message);
        localStorage.setItem('animemaze_announcement', data[0].message);
        return;
      }
    } catch (err) {
      console.warn('Failed to load announcement from DB:', err);
    }
    // Fallback to localStorage
    setAnnouncementText(localStorage.getItem('animemaze_announcement') || '🎉 Special Launch Offer: Use code ANIME20 for 20% discount! 🚚 FREE Shipping on orders above ₹999!');
  }, []);

  const handleSaveAnnouncement = async () => {
    try {
      // Deactivate all previous announcements first to keep a single active one
      await supabase
        .from('site_announcements')
        .update({ active: false })
        .eq('active', true);

      const { error } = await supabase
        .from('site_announcements')
        .insert({ message: announcementText, active: true });

      if (error) throw error;
      alert('Announcement updated! (synced to database)');
    } catch (err) {
      console.warn('Supabase announcement save failed:', err);
      alert('Announcement updated locally only');
    }
    localStorage.setItem('animemaze_announcement', announcementText);
    window.dispatchEvent(new Event('announcement_updated'));
  };

  const handleClearAnnouncement = async () => {
    setAnnouncementText('');
    try {
      await supabase
        .from('site_announcements')
        .update({ active: false })
        .eq('active', true);
    } catch (err) {
      console.warn('Supabase announcement clear failed:', err);
    }
    localStorage.setItem('animemaze_announcement', '');
    window.dispatchEvent(new Event('announcement_updated'));
    alert('Announcement cleared!');
  };

  // --- CRUD: Products ---
  const handleProductSubmit = async (e: React.FormEvent) => {
    if (submittingProduct) return;
    e.preventDefault();
    setSubmittingProduct(true);
    try {
      const addImgs = productForm.additional_images
        ? productForm.additional_images.split(',').map(img => img.trim()).filter(Boolean)
        : [];

      // Always sanitize slug: strip URLs and special chars
      const rawSlug = productForm.slug.trim();
      const isValidSlug = rawSlug && !rawSlug.includes('://') && !rawSlug.includes('.com') && /^[a-z0-9-]+$/.test(rawSlug.toLowerCase());
      const finalSlug = isValidSlug
        ? rawSlug.toLowerCase()
        : productForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const payload = {
        name: productForm.name,
        slug: finalSlug,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        featured: productForm.featured,
        category_id: productForm.category_id || null,
        main_image_url: productForm.main_image_url,
        additional_images: addImgs
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(payload);
        
        if (error) throw error;
      }

      alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadAdminData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Product action failed.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      slug: prod.slug,
      description: prod.description || '',
      price: prod.price,
      stock: prod.stock,
      featured: prod.featured,
      category_id: prod.category_id || '',
      main_image_url: prod.main_image_url,
      additional_images: Array.isArray(prod.additional_images) ? prod.additional_images.join(', ') : ''
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      alert('Product deleted successfully!');
      loadAdminData();
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product: ' + (err.message || err));
    }
  };

  // --- CRUD: Categories ---
  const handleCategorySubmit = async (e: React.FormEvent) => {
    if (submittingCategory) return;
    e.preventDefault();
    setSubmittingCategory(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        image_url: categoryForm.image_url.trim(),
        size_enabled: categoryForm.size_enabled
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(payload);
        
        if (error) throw error;
      }

      alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      loadAdminData();
      // Force refresh catalog store to sync category changes across the app
      void fetchCategories(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Category action failed.');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      image_url: cat.image_url,
      size_enabled: cat.size_enabled || false
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? (Products inside will set category to null)')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      alert('Category deleted successfully!');
      loadAdminData();
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      alert('Failed to delete category: ' + (err.message || err));
    }
  };

  // --- Actions: Order Payment Verification --- always try DB first
  const handleVerifyPayment = async (orderId: string, approve: boolean) => {
    const confirmation = window.confirm(`Are you sure you want to ${approve ? 'APPROVE' : 'REJECT'} payment for this order?`);
    if (!confirmation) return;

    const paymentStatus = approve ? 'PAID' : 'REJECTED';
    const orderStatus = approve ? 'PAID' : 'CANCELLED';

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          status: orderStatus
        })
        .eq('id', orderId);

      if (error) throw error;
      alert(`Order payment was successfully ${approve ? 'Approved' : 'Rejected'}.`);
      loadAdminData();
    } catch (err: any) {
      console.error('Order verify failed:', err);
      alert('Failed to verify payment: ' + (err.message || err));
    }
  };

  // --- Actions: Update Order Status --- always try DB first
  const performOrderStatusUpdate = async (orderId: string, status: string, trackingInfo?: { carrier: string; tracking_number: string; shipped_at: string }) => {
    try {
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('shipping_address')
        .eq('id', orderId)
        .single();
      
      if (fetchError) throw fetchError;

      const currentShipping = orderData?.shipping_address || {};
      const updatedShipping = {
        ...currentShipping,
        ...(trackingInfo ? { tracking_info: trackingInfo } : {})
      };

      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          shipping_address: updatedShipping
        })
        .eq('id', orderId);

      if (error) throw error;
      alert('Order status updated successfully!');
      loadAdminData();
    } catch (err: any) {
      console.error('Order status update failed:', err);
      alert('Failed to update order status: ' + (err.message || err));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (status === 'SHIPPED') {
      const order = orders.find(o => o.id === orderId);
      const tracking = (order?.shipping_address as any)?.tracking_info || {};
      setTrackingOrderId(orderId);
      setTrackingCarrier(tracking.carrier || '');
      setTrackingNumber(tracking.tracking_number || '');
      setTrackingTargetStatus(status);
      setIsTrackingModalOpen(true);
      return;
    }
    await performOrderStatusUpdate(orderId, status);
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCarrier.trim() || !trackingNumber.trim()) {
      alert('Please fill in both carrier and tracking number.');
      return;
    }
    const trackingInfo = {
      carrier: trackingCarrier.trim(),
      tracking_number: trackingNumber.trim(),
      shipped_at: new Date().toISOString()
    };
    setIsTrackingModalOpen(false);
    await performOrderStatusUpdate(trackingOrderId, trackingTargetStatus || 'SHIPPED', trackingInfo);
  };

  // --- Actions: Q&A --- always try DB first
  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!answer.trim()) return;

    try {
      const { error } = await supabase
        .from('product_questions')
        .update({ answer: answer.trim() })
        .eq('id', questionId);

      if (error) throw error;
      alert('Answer submitted successfully!');
      loadAdminData();
    } catch (err: any) {
      console.error('Answer submit failed:', err);
      alert('Failed to submit answer: ' + (err.message || err));
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;

    try {
      const { error } = await supabase.from('product_questions').delete().eq('id', id);
      if (error) throw error;
      alert('Question deleted successfully!');
      loadAdminData();
    } catch (err: any) {
      console.error('Delete question failed:', err);
      alert('Failed to delete question: ' + (err.message || err));
    }
  };

  // --- Actions: Review Moderation --- always try DB first
  const handleModerateReview = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status })
        .eq('id', reviewId);

      if (error) throw error;
      alert(`Review status updated to ${status}.`);
      loadAdminData();
    } catch (err: any) {
      console.error('Review moderation failed:', err);
      alert('Failed to update review status: ' + (err.message || err));
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      alert('Review deleted successfully!');
      loadAdminData();
    } catch (err: any) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review: ' + (err.message || err));
    }
  };

  // --- Export Subscribers CSV ---
  const exportSubscribersCSV = () => {
    if (subscribers.length === 0) return;
    const csvRows = [
      ['ID', 'Email', 'Subscribed At'],
      ...subscribers.map(sub => [sub.id, sub.email, new Date(sub.created_at).toLocaleString()])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-danger" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage payments, inventory, catalogs, Q&A, and reviews</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadAdminData}>
          Refresh Dashboard Data
        </Button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 overflow-x-auto pb-2 mb-8 gap-2">
        {(['verification', 'products', 'categories', 'orders', 'inventory', 'questions', 'reviews', 'subscribers', 'replacements', 'coupons', 'announcement'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 border ${
              activeTab === tab
                ? 'bg-danger/10 border-danger text-danger'
                : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* TAB 1: Payment Verification Panel */}
          {activeTab === 'verification' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <CreditCard className="h-5.5 w-5.5 text-secondary" />
                <span>UPI Screenshot Verification</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer Details</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-center">Payment Proof</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.filter(o => o.payment_status === 'PENDING_VERIFICATION').length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                          No orders pending payment verification.
                        </td>
                      </tr>
                    ) : (
                      orders
                        .filter(o => o.payment_status === 'PENDING_VERIFICATION')
                        .map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-bold text-xs truncate max-w-[120px]">{order.id}</td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">{order.shipping_address?.fullName}</p>
                              <p className="text-xs text-gray-500">{order.shipping_address?.phone}</p>
                              {order.shipping_address?.transactionId && (
                                <p className="text-xs text-amber-600 font-mono mt-1 select-all">TXID: {order.shipping_address.transactionId}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 font-extrabold text-gray-900">₹{order.total_amount}</td>
                            <td className="px-6 py-4 text-center">
                              {order.payment_proof?.screenshot_url || (order as any).screenshot_preview ? (
                                <button
                                  onClick={() => setViewScreenshotUrl(order.payment_proof?.screenshot_url || (order as any).screenshot_preview || null)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View Proof</span>
                                </button>
                              ) : (
                                <span className="text-xs text-danger font-medium flex items-center justify-center gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5" /> Missing
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => handleVerifyPayment(order.id, true)}
                                className="p-2 bg-success/20 border border-success/30 text-success rounded-lg hover:bg-success/35"
                                title="Approve Payment"
                              >
                                <Check className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(order.id, false)}
                                className="p-2 bg-danger/20 border border-danger/30 text-danger rounded-lg hover:bg-danger/35"
                                title="Reject Payment"
                              >
                                <X className="h-4.5 w-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Products Manager */}
          {activeTab === 'products' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <ShoppingBag className="h-5.5 w-5.5 text-secondary" />
                  <span>Products Library</span>
                </h2>
                <Button size="sm" onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '',
                    slug: '',
                    description: '',
                    price: 0,
                    stock: 0,
                    featured: false,
                    category_id: '',
                    main_image_url: '',
                    additional_images: ''
                  });
                  setIsProductModalOpen(true);
                }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Product
                </Button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Image</th>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <img src={prod.main_image_url} alt="" className="w-10 h-12 object-cover rounded bg-gray-100 border border-gray-200" />
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-bold text-gray-900 text-sm">{prod.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{prod.slug}</p>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-600">{prod.category?.name || 'Unassigned'}</td>
                        <td className="px-6 py-3 font-extrabold text-gray-900">₹{prod.price}</td>
                        <td className="px-6 py-3">
                          {prod.stock <= 5 ? (
                            <span className="text-xs font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded">
                              {prod.stock} (LOW)
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-600">{prod.stock}</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditProduct(prod)}
                            className="p-1.5 bg-gray-100 border border-gray-300 hover:border-primary text-primary rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 bg-gray-100 border border-gray-200 hover:border-danger/40 text-danger rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Categories Manager */}
          {activeTab === 'categories' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <List className="h-5.5 w-5.5 text-secondary" />
                  <span>Collections / Categories</span>
                </h2>
                <Button size="sm" onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: '', image_url: '', size_enabled: false });
                  setIsCategoryModalOpen(true);
                }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Category
                </Button>
              </div>

              {/* Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Image</th>
                      <th className="px-6 py-4">Category Name</th>
                      <th className="px-6 py-4">Sizes</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <img src={cat.image_url} alt="" className="w-12 h-12 object-cover rounded-xl bg-gray-100 border border-gray-200" />
                        </td>
                        <td className="px-6 py-3 font-bold text-gray-900">{cat.name}</td>
                        <td className="px-6 py-3">
                          {cat.size_enabled ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-bold">
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-gray-500 text-xs font-bold">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="p-1.5 bg-gray-100 border border-gray-300 text-primary rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 bg-gray-100 border border-gray-300 text-danger rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Orders Management */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <ShoppingBag className="h-5.5 w-5.5 text-secondary" />
                <span>Customer Orders</span>
              </h2>

              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Shipping Info</th>
                      <th className="px-6 py-4">Ordered Items</th>
                      <th className="px-6 py-4">Grand Total</th>
                      <th className="px-6 py-4">Fulfillment Status</th>
                      <th className="px-6 py-4">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold text-xs truncate max-w-[120px]">{order.id}</td>
                        <td className="px-6 py-4 text-xs">
                          <p className="font-bold text-gray-900">{order.shipping_address?.fullName}</p>
                          <p className="text-gray-500">{order.shipping_address?.phone}</p>
                          <p className="text-gray-500">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                          {order.shipping_address?.transactionId && (
                            <p className="text-[10px] text-amber-400 font-mono mt-1 select-all">TXID: {order.shipping_address.transactionId}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={item.id || `${order.id}-item-${idx}`} className="flex items-center space-x-2.5">
                              <div className="w-8 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                                <img
                                  src={item.product?.main_image_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 max-w-[150px] truncate leading-tight">{item.product?.name || 'Product'}</p>
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                                  <span className="text-gray-600">Qty: {item.quantity}</span>
                                  {item.selected_variant && (
                                    <span className="px-1 py-0.2 rounded bg-primary/10 border border-primary/20 text-primary font-extrabold text-[9px]">
                                      Size: {item.selected_variant}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-gray-900">₹{order.total_amount}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="bg-white border border-gray-300 text-xs text-gray-900 rounded-lg p-1 focus:outline-none focus:border-primary"
                            >
                              <option value="PENDING_VERIFICATION" className="bg-white">Pending Verification</option>
                              <option value="PAID" className="bg-white">Paid</option>
                              <option value="PROCESSING" className="bg-white">Processing</option>
                              <option value="SHIPPED" className="bg-white">Shipped</option>
                              <option value="DELIVERED" className="bg-white">Delivered</option>
                              <option value="CANCELLED" className="bg-white">Cancelled</option>
                            </select>
                            {(order.shipping_address as any)?.tracking_info && (
                              <button
                                onClick={() => {
                                  const tracking = (order.shipping_address as any).tracking_info;
                                  setTrackingOrderId(order.id);
                                  setTrackingCarrier(tracking.carrier || '');
                                  setTrackingNumber(tracking.tracking_number || '');
                                  setTrackingTargetStatus(order.status);
                                  setIsTrackingModalOpen(true);
                                }}
                                className="text-[10px] text-secondary-light hover:text-secondary font-bold flex items-center gap-1 mt-0.5"
                              >
                                <Edit className="h-3 w-3" /> Edit Tracking
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold">
                          <span className={`px-2 py-0.5 border rounded uppercase ${
                            order.payment_status === 'PAID' ? 'text-success bg-success/10 border-success/20' :
                            order.payment_status === 'REJECTED' ? 'text-danger bg-danger/10 border-danger/20' :
                            'text-amber-500 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Inventory Low stock Warning */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <AlertTriangle className="h-5.5 w-5.5 text-danger animate-bounce" />
                <span>Inventory & Low Stock Warnings</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Pricing</th>
                      <th className="px-6 py-4">Available Stock</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{prod.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{prod.slug}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">₹{prod.price}</td>
                        <td className="px-6 py-4 font-bold">{prod.stock}</td>
                        <td className="px-6 py-4 text-xs font-bold">
                          {prod.stock === 0 ? (
                            <span className="text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded uppercase">OUT OF STOCK</span>
                          ) : prod.stock <= 5 ? (
                            <span className="text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">LOW STOCK</span>
                          ) : (
                            <span className="text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded uppercase">HEALTHY</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Questions Panel */}
          {activeTab === 'questions' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <MessageSquare className="h-5.5 w-5.5 text-secondary" />
                <span>Customer Questions</span>
              </h2>

              <div className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No questions asked by customers yet.</p>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider text-secondary">Question Details:</p>
                          <p className="text-sm font-semibold text-gray-900">"{q.question}"</p>
                          <p className="text-[10px] text-gray-500">Asked on: {new Date(q.created_at).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-gray-500 hover:text-danger p-1"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      <div className="space-y-2 border-t border-gray-200 pt-3">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider text-primary">Answer Details:</p>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const val = (e.currentTarget.elements.namedItem('answerInput') as HTMLInputElement).value;
                            handleAnswerQuestion(q.id, val);
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            name="answerInput"
                            defaultValue={q.answer || ''}
                            placeholder="Type response answer..."
                            className="flex-grow px-3 py-1.5 rounded-lg text-xs bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-primary"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark"
                          >
                            Answer
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: Reviews Moderation */}
          {activeTab === 'reviews' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Star className="h-5.5 w-5.5 text-yellow-500 fill-current" />
                <span>Reviews Moderation</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Rating</th>
                      <th className="px-6 py-4">Comment</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-xs">
                          <p className="font-bold text-gray-900">{rev.user_name}</p>
                          {rev.verified_purchase && (
                            <span className="text-[9px] font-bold text-secondary">Verified Buyer</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-yellow-500 flex items-center gap-1">
                          {rev.rating} <Star className="h-3 w-3 fill-current" />
                        </td>
                        <td className="px-6 py-4 text-xs max-w-sm truncate">{rev.review_text}</td>
                        <td className="px-6 py-4 text-xs font-bold">
                          <span className={`px-2 py-0.5 border rounded uppercase ${
                            rev.status === 'APPROVED' ? 'text-success border-success/20 bg-success/5' :
                            rev.status === 'REJECTED' ? 'text-danger border-danger/20 bg-danger/5' :
                            'text-amber-500 border-amber-500/20 bg-amber-500/5'
                          }`}>
                            {rev.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleModerateReview(rev.id, 'APPROVED')}
                            className="p-1 bg-success/20 text-success rounded border border-success/30 hover:bg-success/35"
                            title="Approve Review"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleModerateReview(rev.id, 'REJECTED')}
                            className="p-1 bg-danger/20 text-danger rounded border border-danger/30 hover:bg-danger/35"
                            title="Reject Review"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-1 bg-gray-100 text-gray-500 hover:text-gray-900 rounded border border-gray-200"
                            title="Delete Permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: Subscribers List */}
          {activeTab === 'subscribers' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Mail className="h-5.5 w-5.5 text-secondary-light" />
                  <span>Newsletter Drops List ({subscribers.length})</span>
                </h2>
                <Button size="sm" variant="outline" onClick={exportSubscribersCSV}>
                  <Download className="mr-1.5 h-4 w-4" /> Export CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Subscriber Email</th>
                      <th className="px-6 py-4">Subscribed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold text-gray-900 text-sm">{sub.email}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(sub.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Replacement Requests */}
          {activeTab === 'replacements' && (() => {
            const handleUpdateReplacement = async (id: string, status: string, adminNotes?: string) => {
              // Try DB first
              try {
                const { error } = await supabase.from('replacement_requests').update({ status, admin_notes: adminNotes || null }).eq('id', id);
                if (error) throw error;
              } catch (_) {}
              // Always update localStorage
              const stored = JSON.parse(localStorage.getItem('animemaze_replacement_requests') || '[]');
              const updated = stored.map((r: any) => r.id === id ? { ...r, status, admin_notes: adminNotes || null } : r);
              localStorage.setItem('animemaze_replacement_requests', JSON.stringify(updated));
              setReplacementRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any, admin_notes: adminNotes || null } : r));
            };

            const statusColor = (s: string) => {
              switch (s) {
                case 'PENDING': return 'text-amber-400 bg-amber-400/10 border-amber-400/25';
                case 'APPROVED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25';
                case 'PROCESSING': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/25';
                case 'REJECTED': return 'text-red-400 bg-red-400/10 border-red-400/25';
                case 'RESOLVED': return 'text-green-400 bg-green-400/10 border-green-400/25';
                default: return 'text-gray-400 bg-gray-400/10 border-gray-400/25';
              }
            };

            return (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <RefreshCcw className="h-5 w-5 text-amber-400" />
                    <span>Replacement Requests</span>
                    {replacementRequests.filter(r => r.status === 'PENDING').length > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-extrabold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {replacementRequests.filter(r => r.status === 'PENDING').length} New
                      </span>
                    )}
                  </h2>
                </div>

                {replacementRequests.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 italic text-sm">
                    No replacement requests yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {replacementRequests.map((req) => (
                      <div key={req.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Request ID: <span className="font-bold text-gray-300">{req.id}</span></p>
                            <p className="text-xs text-gray-500">Order ID: <span className="font-bold text-gray-300">{req.order_id}</span></p>
                            <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleString()}</p>
                          </div>
                          <span className={`self-start text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${statusColor(req.status)}`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reason</p>
                            <p className="text-gray-900 font-medium">{req.reason}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                            <p className="text-gray-300 text-xs leading-relaxed">{req.description}</p>
                          </div>
                        </div>

                        {req.photo_url && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Attached Photo</p>
                            <a href={req.photo_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                              <img src={req.photo_url} alt="Replacement proof" className="w-24 h-24 object-cover rounded-xl border border-gray-200 hover:border-primary/50 transition-all" />
                            </a>
                          </div>
                        )}

                        {req.admin_notes && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Admin Notes</p>
                            <p className="text-sm text-gray-600">{req.admin_notes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200">
                          <select
                            value={req.status}
                            onChange={(e) => handleUpdateReplacement(req.id, e.target.value)}
                            className="bg-white border border-gray-300 text-xs text-gray-900 rounded-lg py-2 px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            {['PENDING', 'APPROVED', 'PROCESSING', 'RESOLVED', 'REJECTED'].map(s => (
                              <option key={s} value={s} className="bg-surface">{s}</option>
                            ))}
                          </select>

                          <button
                            onClick={() => {
                              const notes = window.prompt('Add admin note (optional):', req.admin_notes || '');
                              if (notes !== null) handleUpdateReplacement(req.id, req.status, notes);
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs text-gray-700 hover:text-gray-900 rounded-lg transition-all"
                          >
                            Add Note
                          </button>

                          <button
                            onClick={() => handleUpdateReplacement(req.id, 'APPROVED')}
                            className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs text-emerald-400 rounded-lg transition-all"
                          >
                            ✓ Approve
                          </button>

                          <button
                            onClick={() => handleUpdateReplacement(req.id, 'REJECTED')}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-400 rounded-lg transition-all"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: Coupon Management */}
          {activeTab === 'coupons' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-emerald-400" />
                  <span>Promo Coupons</span>
                  <span className="ml-2 text-xs text-gray-400 font-normal">({coupons.filter(c => c.active).length} active)</span>
                </h2>
                <Button size="sm" onClick={() => {
                  setEditingCoupon(null);
                  setCouponForm({ code: '', type: 'PERCENT', value: 0, minOrder: 0, active: true });
                  setIsCouponModalOpen(true);
                }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Coupon
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Min Order</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {coupons.map((coupon) => (
                      <tr key={coupon.code} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg text-xs tracking-wider">{coupon.code}</span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className={`px-2 py-0.5 rounded border font-bold uppercase ${
                            coupon.type === 'PERCENT' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                          }`}>
                            {coupon.type === 'PERCENT' ? 'Percentage' : 'Fixed Amount'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {coupon.type === 'PERCENT' ? `${coupon.value}%` : `₹${coupon.value}`}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {coupon.minOrder > 0 ? `₹${coupon.minOrder}` : 'None'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleCoupon(coupon.code)}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border cursor-pointer transition-all ${
                              coupon.active !== false
                                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25 hover:bg-emerald-400/20'
                                : 'text-red-400 bg-red-400/10 border-red-400/25 hover:bg-red-400/20'
                            }`}
                          >
                            {coupon.active !== false ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingCoupon(coupon);
                              setCouponForm({
                                code: coupon.code,
                                type: coupon.type,
                                value: coupon.value,
                                minOrder: coupon.minOrder || 0,
                                active: coupon.active !== false
                              });
                              setIsCouponModalOpen(true);
                            }}
                            className="p-1.5 bg-gray-100 border border-gray-300 hover:border-primary text-primary rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.code)}
                            className="p-1.5 bg-gray-100 border border-gray-200 hover:border-danger/40 text-danger rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-400 space-y-1">
                <p className="font-bold text-gray-300">How Coupons Work:</p>
                <p>• <strong>Percentage</strong> coupons apply a % discount on the cart subtotal (before shipping).</p>
                <p>• <strong>Fixed Amount</strong> coupons subtract a flat ₹ amount from the subtotal.</p>
                <p>• Coupons are separate from the Free Shipping logic (orders ≥₹999 ship free automatically).</p>
                <p>• Disable a coupon to stop it from being used without deleting it.</p>
              </div>
            </div>
          )}

          {/* TAB: Announcement Bar */}
          {activeTab === 'announcement' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-amber-400" />
                <span>Announcement Bar</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Announcement Message
                  </label>
                  <textarea
                    rows={3}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Enter the announcement text that appears at the top of the site..."
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Use emojis like 🎉 🚚 🔥 to make it eye-catching. Leave empty to hide the bar.
                  </p>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Live Preview
                  </label>
                  {announcementText ? (
                    <div className="bg-primary text-white text-center py-2.5 px-4 text-xs font-bold tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm">
                      <div className="animate-pulse w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
                      <span>{announcementText}</span>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 italic text-sm border border-dashed border-gray-200 rounded-xl">
                      Announcement bar is hidden (empty message)
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSaveAnnouncement}>
                    Save & Publish
                  </Button>
                  <Button variant="outline" onClick={handleClearAnnouncement}>
                    Clear Announcement
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-400 space-y-1">
                  <p className="font-bold text-gray-300">Tips:</p>
                  <p>• Keep announcements short and impactful (1-2 sentences max).</p>
                  <p>• Mention active coupon codes so customers see them immediately.</p>
                  <p>• The bar appears at the very top of every page, above the navigation.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* PRODUCT MODAL (Add/Edit) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingProduct ? 'Edit Merchandise Product' : 'Add New Merchandise Product'}
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Product Name"
                  type="text"
                  required
                  placeholder="Luffy Gear 5 PVC Figure"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />

                <Input
                  label="Product URL Slug (Auto-generated from name — leave blank)"
                  type="text"
                  placeholder="Leave blank to auto-generate from name"
                  value={productForm.slug}
                  onChange={(e) => setProductForm({ ...productForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                />

                <Input
                  label="Price (INR)"
                  type="number"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                />

                <Input
                  label="Stock Quantity"
                  type="number"
                  required
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Category Selection
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-primary"
                  >
                    <option value="">Unassigned</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-white text-gray-900">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-3 pt-6">
                  <input
                    type="checkbox"
                    id="featuredCheckbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    className="h-4.5 w-4.5 rounded border-gray-300 accent-primary"
                  />
                  <label htmlFor="featuredCheckbox" className="text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer">
                    Featured Merchandise Drop
                  </label>
                </div>
              </div>

              <Input
                label="Main Image URL"
                type="text"
                required
                placeholder="https://example.com/images/naruto.jpg"
                value={productForm.main_image_url}
                onChange={(e) => setProductForm({ ...productForm, main_image_url: e.target.value })}
              />

              <Input
                label="Additional Image URLs (Comma-separated)"
                type="text"
                placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                value={productForm.additional_images}
                onChange={(e) => setProductForm({ ...productForm, additional_images: e.target.value })}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write details about sizes, paint finishes, materials, and character traits..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button variant="outline" type="button" onClick={() => setIsProductModalOpen(false)} disabled={submittingProduct}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingProduct}>
                  {submittingProduct ? 'Saving...' : (editingProduct ? 'Save Product' : 'Add Product')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL (Add/Edit) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-5">
              <Input
                label="Category Name"
                type="text"
                required
                placeholder="e.g. Wall Decor"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />

              <Input
                label="Image URL"
                type="text"
                required
                placeholder="https://example.com/category.jpg"
                value={categoryForm.image_url}
                onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
              />

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="text-sm font-semibold text-gray-900 block">Enable Size Selection</label>
                  <p className="text-xs text-gray-500 mt-1">Products in this category will require size selection (S, M, L, XL)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoryForm({ ...categoryForm, size_enabled: !categoryForm.size_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    categoryForm.size_enabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      categoryForm.size_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button variant="outline" type="button" onClick={() => setIsCategoryModalOpen(false)} disabled={submittingCategory}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingCategory}>
                  {submittingCategory ? 'Saving...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}




      {viewScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="relative max-w-xl w-full bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center">
            <button
              onClick={() => setViewScreenshotUrl(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full border border-gray-300 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">Payment Screenshot Details</h3>
            <div className="w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 max-h-[70vh] flex justify-center items-center">
              <img src={viewScreenshotUrl} alt="UPI Payment screenshot proof" className="max-w-full h-auto object-contain max-h-[68vh]" />
            </div>
          </div>
        </div>
      )}

      {/* COURIER TRACKING DETAILS MODAL */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setIsTrackingModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full border border-gray-300 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Enter Courier Tracking Details
            </h3>

            <form onSubmit={handleSaveTracking} className="space-y-5">
              <Input
                label="Courier Carrier"
                type="text"
                required
                placeholder="e.g. Delhivery, Blue Dart, DTDC, India Post"
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
              />

              <Input
                label="Tracking Number / Waybill ID"
                type="text"
                required
                placeholder="e.g. 1234567890"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />

              <div className="flex gap-4 justify-end pt-4">
                <Button variant="outline" type="button" onClick={() => setIsTrackingModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save & Update Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON MODAL (Add/Edit) */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => {
                setIsCouponModalOpen(false);
                setEditingCoupon(null);
              }}
              className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full border border-gray-300 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
            </h3>

            <form onSubmit={handleCouponSubmit} className="space-y-5">
              <Input
                label="Coupon Code"
                type="text"
                required
                disabled={!!editingCoupon}
                placeholder="e.g. DISCOUNT20"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Coupon Type
                </label>
                <select
                  value={couponForm.type}
                  onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as 'PERCENT' | 'FIXED' })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              <Input
                label={couponForm.type === 'PERCENT' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                type="number"
                required
                min={1}
                max={couponForm.type === 'PERCENT' ? 100 : undefined}
                value={couponForm.value}
                onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
              />

              <Input
                label="Minimum Order Subtotal (₹)"
                type="number"
                min={0}
                value={couponForm.minOrder}
                onChange={(e) => setCouponForm({ ...couponForm, minOrder: Number(e.target.value) })}
              />

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="couponActiveCheckbox"
                  checked={couponForm.active}
                  onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                  className="h-4.5 w-4.5 rounded border-gray-200 accent-primary"
                />
                <label htmlFor="couponActiveCheckbox" className="text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer">
                  Coupon Active
                </label>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button variant="outline" type="button" onClick={() => {
                  setIsCouponModalOpen(false);
                  setEditingCoupon(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
