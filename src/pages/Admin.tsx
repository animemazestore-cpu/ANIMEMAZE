import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import type { Product, Category, Order, ProductQuestion, Review, NewsletterSubscriber, ReplacementRequest } from '../types/database';
import { getLocalProducts, saveLocalProduct, deleteLocalProduct, getLocalCategories, saveLocalCategory, deleteLocalCategory, sanitizeSlug } from '../lib/persistence';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ShieldCheck, Plus, Edit, Trash2, Check, X, CreditCard, ShoppingBag, List, MessageSquare, Star, Mail, Download, AlertTriangle, Eye, RefreshCcw, Tag, Megaphone } from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, initialized } = useAuthStore();

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
    image_url: ''
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
  const [announcementText, setAnnouncementText] = useState(() => localStorage.getItem('animemaze_announcement') || '🎉 Special Launch Offer: Use code ANIME20 for 20% discount! 🚚 FREE Shipping on orders above ₹999!');

  // Verify Admin Access
  useEffect(() => {
    if (initialized) {
      if (!user) {
        navigate('/auth?redirect=/admin');
      } else if (profile?.role !== 'admin') {
        navigate('/dashboard');
      }
    }
  }, [user, profile, initialized, navigate]);

  // --- Coupon Management ---
  const loadCoupons = useCallback(() => {
    const storedCoupons = JSON.parse(localStorage.getItem('animemaze_coupons') || '[]');
    const defaultCoupons = [
      { code: 'ANIME20', type: 'PERCENT', value: 20, minOrder: 0, active: true },
      { code: 'NEO10', type: 'PERCENT', value: 10, minOrder: 0, active: true },
      { code: 'SHINOBI50', type: 'PERCENT', value: 50, minOrder: 0, active: true },
      { code: 'FREE99', type: 'FIXED', value: 99, minOrder: 0, active: true }
    ];
    const allCoupons = [...defaultCoupons];
    storedCoupons.forEach((c: any) => {
      if (!allCoupons.some(ac => ac.code === c.code)) {
        allCoupons.push(c);
      } else {
        const idx = allCoupons.findIndex(ac => ac.code === c.code);
        if (idx >= 0) allCoupons[idx] = { ...allCoupons[idx], ...c };
      }
    });
    setCoupons(allCoupons);
  }, []);

  // Fetch / sync replacement requests from database + localStorage
  const loadReplacementsData = useCallback(async () => {
    const isMock = localStorage.getItem('animemaze_mock_session') === 'true';
    const localReplacements = JSON.parse(localStorage.getItem('animemaze_replacement_requests') || '[]');

    if (isMock) {
      setReplacementRequests(localReplacements.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      return;
    }

    let mergedReplacements: ReplacementRequest[] = [];
    try {
      const { data: dbReplacements } = await supabase
        .from('replacement_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (dbReplacements) {
        mergedReplacements = [...dbReplacements];
      }
    } catch (err) {
      console.warn('Failed to fetch replacement requests from database:', err);
    }

    localReplacements.forEach((localReq: any) => {
      if (!mergedReplacements.some(r => r.id === localReq.id)) {
        mergedReplacements.push(localReq);
      }
    });

    mergedReplacements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setReplacementRequests(mergedReplacements);
  }, []);

  // Load Data
  const loadAdminData = async () => {
    setLoadingData(true);
    const isMock = localStorage.getItem('animemaze_mock_session') === 'true';
    const localProds = getLocalProducts();

    // Map local orders with products so we can see names/images
    const getLocalOrdersMapped = () => {
      const rawLocalOrders = JSON.parse(localStorage.getItem('animemaze_local_orders') || '[]');
      return rawLocalOrders.map((o: any) => ({
        ...o,
        payment_proof: o.screenshot_preview ? { screenshot_url: o.screenshot_preview } : undefined,
        items: o.items?.map((item: any) => {
          const product = localProds.find(p => p.id === item.product_id);
          return {
            ...item,
            product: product || {
              id: item.product_id,
              name: item.product_name || 'Anime Product',
              price: item.price,
              main_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=400',
              slug: ''
            },
            selected_variant: item.selected_variant || null
          };
        })
      }));
    };

    if (isMock) {
      setCategories(getLocalCategories());
      setProducts(getLocalProducts());
      setOrders(getLocalOrdersMapped());
      
      const localQuestions = JSON.parse(localStorage.getItem('animemaze_local_questions') || '[]');
      localQuestions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setQuestions(localQuestions);
      
      const localReviews = JSON.parse(localStorage.getItem('animemaze_local_reviews') || '[]');
      localReviews.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReviews(localReviews);
      
      setSubscribers([]);
      await loadReplacementsData();
      loadCoupons();
      setLoadingData(false);
      return;
    }

    try {
      // 1. Fetch categories
      try {
        const { data: dbCats } = await supabase.from('categories').select('*');
        const localCats = getLocalCategories();
        const mergedCats = [...localCats];
        if (dbCats) {
          dbCats.forEach((c: any) => {
            if (!mergedCats.some(mc => mc.id === c.id)) {
              mergedCats.push(c);
            }
          });
        }
        setCategories(mergedCats);
      } catch (err) {
        console.error('Error loading categories:', err);
        setCategories(getLocalCategories());
      }

      // 2. Fetch products
      try {
        const { data: dbProds } = await supabase.from('products').select('*, category:categories(*)');
        const mergedProds = [...localProds];
        if (dbProds) {
          dbProds.forEach((p: any) => {
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
        setProducts(mergedProds);
      } catch (err) {
        console.error('Error loading products:', err);
        setProducts(getLocalProducts());
      }

      // 3. Fetch orders
      try {
        const { data: dbOrders } = await supabase.from('orders').select(`
          *,
          payment_proof:payment_proofs (screenshot_url),
          items:order_items (
            *,
            product:products (*)
          )
        `).order('created_at', { ascending: false });

        const localMappedOrders = getLocalOrdersMapped();
        const mergedOrders = [...localMappedOrders];

        if (dbOrders) {
          dbOrders.forEach((o: any) => {
            if (!mergedOrders.some((lo: any) => lo.id === o.id)) {
              mergedOrders.push(o);
            }
          });
        }

        // Map the selected variant from shipping_address JSON so it's loaded for all orders
        const ordersWithVariantsMapped = mergedOrders.map((order: any) => {
          const itemVariants = order.shipping_address?.item_variants || [];
          return {
            ...order,
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
        setOrders(getLocalOrdersMapped());
      }

      // 4. Fetch questions
      try {
        const localQuestions = JSON.parse(localStorage.getItem('animemaze_local_questions') || '[]');
        const { data: dbQuestions, error: qnaError } = await supabase.from('product_questions').select('*').order('created_at', { ascending: false });
        if (qnaError) throw qnaError;
        
        const mergedQuestions = [...localQuestions];
        if (dbQuestions) {
          dbQuestions.forEach((q: any) => {
            if (!mergedQuestions.some(mq => mq.id === q.id)) {
              mergedQuestions.push(q);
            }
          });
        }
        mergedQuestions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setQuestions(mergedQuestions as ProductQuestion[]);
      } catch (err) {
        console.error('Error loading questions:', err);
        const localQuestions = JSON.parse(localStorage.getItem('animemaze_local_questions') || '[]');
        localQuestions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setQuestions(localQuestions as ProductQuestion[]);
      }

      // 5. Fetch reviews
      try {
        const localReviews = JSON.parse(localStorage.getItem('animemaze_local_reviews') || '[]');
        const { data: dbReviews, error: revError } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (revError) throw revError;

        const mergedReviews = [...localReviews];
        if (dbReviews) {
          dbReviews.forEach((r: any) => {
            if (!mergedReviews.some(mr => mr.id === r.id)) {
              mergedReviews.push(r);
            }
          });
        }
        mergedReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setReviews(mergedReviews as Review[]);
      } catch (err) {
        console.error('Error loading reviews:', err);
        const localReviews = JSON.parse(localStorage.getItem('animemaze_local_reviews') || '[]');
        localReviews.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setReviews(localReviews as Review[]);
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

  const saveCouponsToStorage = (newCoupons: any[]) => {
    localStorage.setItem('animemaze_coupons', JSON.stringify(newCoupons));
    setCoupons(newCoupons);
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponForm.code.trim().toUpperCase();
    if (!code) return;
    
    let updatedCoupons = [...coupons];
    if (editingCoupon) {
      updatedCoupons = updatedCoupons.map(c => c.code === editingCoupon.code ? { ...couponForm, code } : c);
    } else {
      if (updatedCoupons.some(c => c.code === code)) {
        alert('Coupon code already exists!');
        return;
      }
      updatedCoupons.push({ ...couponForm, code });
    }
    saveCouponsToStorage(updatedCoupons);
    setIsCouponModalOpen(false);
    setEditingCoupon(null);
    alert(editingCoupon ? 'Coupon updated!' : 'Coupon created!');
  };

  const handleDeleteCoupon = (code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    const updatedCoupons = coupons.filter(c => c.code !== code);
    saveCouponsToStorage(updatedCoupons);
  };

  const handleToggleCoupon = (code: string) => {
    const updatedCoupons = coupons.map(c => c.code === code ? { ...c, active: !c.active } : c);
    saveCouponsToStorage(updatedCoupons);
  };

  // --- Announcement Management ---
  const handleSaveAnnouncement = () => {
    localStorage.setItem('animemaze_announcement', announcementText);
    window.dispatchEvent(new Event('announcement_updated'));
    alert('Announcement updated successfully!');
  };

  const handleClearAnnouncement = () => {
    setAnnouncementText('');
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

      const isMock = localStorage.getItem('animemaze_mock_session') === 'true';
      let dbWritten = false;

      if (!isMock) {
        try {
          if (editingProduct) {
            const { error } = await supabase
              .from('products')
              .update(payload)
              .eq('id', editingProduct.id);
            
            if (!error) {
              dbWritten = true;
              // Sync local copy
              saveLocalProduct({
                ...payload,
                id: editingProduct.id,
                created_at: editingProduct.created_at || new Date().toISOString()
              } as Product);
            }
          } else {
            const { data, error } = await supabase
              .from('products')
              .insert(payload)
              .select()
              .single();
            
            if (!error && data) {
              dbWritten = true;
              // Sync local copy with database UUID
              saveLocalProduct(data as Product);
            }
          }
        } catch (dbErr) {
          console.warn('Supabase product write failed, using LocalStorage fallback.', dbErr);
        }
      }

      if (!dbWritten) {
        const localProduct: Product = {
          ...payload,
          id: editingProduct?.id || `local-prod-${Date.now()}`,
          created_at: editingProduct?.created_at || new Date().toISOString()
        } as Product;
        saveLocalProduct(localProduct);
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
      const isMock = localStorage.getItem('animemaze_mock_session') === 'true';
      if (!isMock) {
        await supabase.from('products').delete().eq('id', id);
      }
    } catch (err: any) {
      console.warn('Failed to delete product in database, deleting locally.', err);
    }
    deleteLocalProduct(id);
    alert('Product deleted!');
    loadAdminData();
  };

  // --- CRUD: Categories ---
  const handleCategorySubmit = async (e: React.FormEvent) => {
    if (submittingCategory) return;
    e.preventDefault();
    setSubmittingCategory(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        image_url: categoryForm.image_url.trim()
      };

      const isMock = localStorage.getItem('animemaze_mock_session') === 'true';
      let dbWritten = false;

      if (!isMock) {
        try {
          if (editingCategory) {
            const { error } = await supabase
              .from('categories')
              .update(payload)
              .eq('id', editingCategory.id);
            
            if (!error) {
              dbWritten = true;
              saveLocalCategory({
                ...payload,
                id: editingCategory.id,
                created_at: editingCategory.created_at || new Date().toISOString()
              });
            }
          } else {
            const { data, error } = await supabase
              .from('categories')
              .insert(payload)
              .select()
              .single();
            
            if (!error && data) {
              dbWritten = true;
              saveLocalCategory(data as Category);
            }
          }
        } catch (dbErr) {
          console.warn('Supabase category write failed, using LocalStorage fallback.', dbErr);
        }
      }

      if (!dbWritten) {
        const localCategory: Category = {
          ...payload,
          id: editingCategory?.id || `local-cat-${Date.now()}`,
          created_at: editingCategory?.created_at || new Date().toISOString()
        };
        saveLocalCategory(localCategory);
      }

      alert(editingCategory ? 'Category updated!' : 'Category created!');
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      loadAdminData();
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
      image_url: cat.image_url
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? (Products inside will set category to null)')) return;
    try {
      const isMock = localStorage.getItem('animemaze_mock_session') === 'true';
      if (!isMock) {
        await supabase.from('categories').delete().eq('id', id);
      }
    } catch (err: any) {
      console.warn('Failed to delete category in database, deleting locally.', err);
    }
    deleteLocalCategory(id);
    alert('Category deleted!');
    loadAdminData();
  };

  // --- Actions: Order Payment Verification ---
  const handleVerifyPayment = async (orderId: string, approve: boolean) => {
    const confirmation = window.confirm(`Are you sure you want to ${approve ? 'APPROVE' : 'REJECT'} payment for this order?`);
    if (!confirmation) return;

    const paymentStatus = approve ? 'PAID' : 'REJECTED';
    const orderStatus = approve ? 'PAID' : 'CANCELLED';

    // Handle local orders
    const localOrders = JSON.parse(localStorage.getItem('animemaze_local_orders') || '[]');
    const isLocal = localOrders.some((lo: any) => lo.id === orderId);

    if (isLocal) {
      const updatedLocalOrders = localOrders.map((lo: any) => {
        if (lo.id === orderId) {
          return { ...lo, payment_status: paymentStatus, status: orderStatus };
        }
        return lo;
      });
      localStorage.setItem('animemaze_local_orders', JSON.stringify(updatedLocalOrders));
      alert(`Local order payment was successfully ${approve ? 'Approved' : 'Rejected'}.`);
      loadAdminData();
      return;
    }

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
      console.error(err);
      alert(err.message || 'Failed to verify payment.');
    }
  };

  // --- Actions: Update Order Status ---
  const performOrderStatusUpdate = async (orderId: string, status: string, trackingInfo?: { carrier: string; tracking_number: string; shipped_at: string }) => {
    // Handle local orders
    const localOrders = JSON.parse(localStorage.getItem('animemaze_local_orders') || '[]');
    const isLocal = localOrders.some((lo: any) => lo.id === orderId);

    if (isLocal) {
      const updatedLocalOrders = localOrders.map((lo: any) => {
        if (lo.id === orderId) {
          const updatedShipping = {
            ...lo.shipping_address,
            ...(trackingInfo ? { tracking_info: trackingInfo } : {})
          };
          return { ...lo, status, shipping_address: updatedShipping };
        }
        return lo;
      });
      localStorage.setItem('animemaze_local_orders', JSON.stringify(updatedLocalOrders));
      alert('Local order status updated!');
      loadAdminData();
      return;
    }

    try {
      // Fetch current shipping address to merge tracking details
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
      console.error(err);
      alert(err.message || 'Failed to update order status.');
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

  // --- Actions: Q&A ---
  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!answer.trim()) return;

    // Try updating localStorage first if it exists there
    const localQuestions = JSON.parse(localStorage.getItem('animemaze_local_questions') || '[]');
    const isLocal = localQuestions.some((q: any) => q.id === questionId) || questionId.startsWith('qna-');

    if (isLocal) {
      const updated = localQuestions.map((q: any) => {
        if (q.id === questionId) {
          return { ...q, answer: answer.trim() };
        }
        return q;
      });
      localStorage.setItem('animemaze_local_questions', JSON.stringify(updated));
      alert('Answer submitted!');
      loadAdminData();
      return;
    }

    try {
      const { error } = await supabase
        .from('product_questions')
        .update({ answer: answer.trim() })
        .eq('id', questionId);

      if (error) throw error;
      alert('Answer submitted!');
      loadAdminData();
    } catch (err: any) {
      console.warn('Supabase answer submit failed, updating locally:', err);
      const updated = localQuestions.map((q: any) => {
        if (q.id === questionId) {
          return { ...q, answer: answer.trim() };
        }
        return q;
      });
      localStorage.setItem('animemaze_local_questions', JSON.stringify(updated));
      alert('Answer submitted!');
      loadAdminData();
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;

    const localQuestions = JSON.parse(localStorage.getItem('animemaze_local_questions') || '[]');
    const isLocal = localQuestions.some((q: any) => q.id === id) || id.startsWith('qna-');

    if (isLocal) {
      const filtered = localQuestions.filter((q: any) => q.id !== id);
      localStorage.setItem('animemaze_local_questions', JSON.stringify(filtered));
      loadAdminData();
      return;
    }

    try {
      const { error } = await supabase.from('product_questions').delete().eq('id', id);
      if (error) throw error;
      loadAdminData();
    } catch (err: any) {
      console.warn('Supabase delete failed, deleting locally:', err);
      const filtered = localQuestions.filter((q: any) => q.id !== id);
      localStorage.setItem('animemaze_local_questions', JSON.stringify(filtered));
      loadAdminData();
    }
  };

  // --- Actions: Review Moderation ---
  const handleModerateReview = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    const localReviews = JSON.parse(localStorage.getItem('animemaze_local_reviews') || '[]');
    const isLocal = localReviews.some((r: any) => r.id === reviewId) || reviewId.startsWith('rev-');

    if (isLocal) {
      const updated = localReviews.map((r: any) => {
        if (r.id === reviewId) {
          return { ...r, status };
        }
        return r;
      });
      localStorage.setItem('animemaze_local_reviews', JSON.stringify(updated));
      alert(`Review status updated to ${status}.`);
      loadAdminData();
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status })
        .eq('id', reviewId);

      if (error) throw error;
      alert(`Review status updated to ${status}.`);
      loadAdminData();
    } catch (err: any) {
      console.warn('Supabase moderate failed, moderating locally:', err);
      const updated = localReviews.map((r: any) => {
        if (r.id === reviewId) {
          return { ...r, status };
        }
        return r;
      });
      localStorage.setItem('animemaze_local_reviews', JSON.stringify(updated));
      alert(`Review status updated to ${status}.`);
      loadAdminData();
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      loadAdminData();
    } catch (err) {
      console.error(err);
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
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-danger" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Manage payments, inventory, catalogs, Q&A, and reviews</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadAdminData}>
          Refresh Dashboard Data
        </Button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/5 overflow-x-auto pb-2 mb-8 gap-2">
        {(['verification', 'products', 'categories', 'orders', 'inventory', 'questions', 'reviews', 'subscribers', 'replacements', 'coupons', 'announcement'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 border ${
              activeTab === tab
                ? 'bg-danger/25 border-danger/45 text-danger'
                : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <CreditCard className="h-5.5 w-5.5 text-secondary-light" />
                <span>UPI Screenshot Verification</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/2 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer Details</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-center">Payment Proof</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
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
                          <tr key={order.id} className="hover:bg-white/1">
                            <td className="px-6 py-4 font-bold text-xs truncate max-w-[120px]">{order.id}</td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-white">{order.shipping_address?.fullName}</p>
                              <p className="text-xs text-gray-500">{order.shipping_address?.phone}</p>
                              {order.shipping_address?.transactionId && (
                                <p className="text-xs text-amber-400 font-mono mt-1 select-all">TXID: {order.shipping_address.transactionId}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 font-extrabold text-white">₹{order.total_amount}</td>
                            <td className="px-6 py-4 text-center">
                              {order.payment_proof?.screenshot_url || (order as any).screenshot_preview ? (
                                <button
                                  onClick={() => setViewScreenshotUrl(order.payment_proof?.screenshot_url || (order as any).screenshot_preview || null)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary-light hover:bg-primary/25 rounded-lg text-xs font-semibold"
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <ShoppingBag className="h-5.5 w-5.5 text-secondary-light" />
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
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/2 text-xs font-bold uppercase text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Image</th>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-white/1">
                        <td className="px-6 py-3">
                          <img src={prod.main_image_url} alt="" className="w-10 h-12 object-cover rounded bg-surface border border-white/5" />
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-bold text-white text-sm">{prod.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{prod.slug}</p>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-400">{prod.category?.name || 'Unassigned'}</td>
                        <td className="px-6 py-3 font-extrabold text-white">₹{prod.price}</td>
                        <td className="px-6 py-3">
                          {prod.stock <= 5 ? (
                            <span className="text-xs font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded">
                              {prod.stock} (LOW)
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-300">{prod.stock}</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditProduct(prod)}
                            className="p-1.5 bg-white/5 border border-white/10 hover:border-primary/40 text-primary-light rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 bg-white/5 border border-white/10 hover:border-danger/40 text-danger rounded-lg"
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <List className="h-5.5 w-5.5 text-secondary-light" />
                  <span>Collections / Categories</span>
                </h2>
                <Button size="sm" onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: '', image_url: '' });
                  setIsCategoryModalOpen(true);
                }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Category
                </Button>
              </div>

              {/* Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/2 text-xs font-bold uppercase text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Image</th>
                      <th className="px-6 py-4">Category Name</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-white/1">
                        <td className="px-6 py-3">
                          <img src={cat.image_url} alt="" className="w-12 h-12 object-cover rounded-xl bg-surface border border-white/5" />
                        </td>
                        <td className="px-6 py-3 font-bold text-white">{cat.name}</td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="p-1.5 bg-white/5 border border-white/10 text-primary-light rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 bg-white/5 border border-white/10 text-danger rounded-lg"
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <ShoppingBag className="h-5.5 w-5.5 text-secondary-light" />
                <span>Customer Orders</span>
              </h2>

              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/2 text-xs font-bold uppercase text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Shipping Info</th>
                      <th className="px-6 py-4">Ordered Items</th>
                      <th className="px-6 py-4">Grand Total</th>
                      <th className="px-6 py-4">Fulfillment Status</th>
                      <th className="px-6 py-4">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/1">
                        <td className="px-6 py-4 font-bold text-xs truncate max-w-[120px]">{order.id}</td>
                        <td className="px-6 py-4 text-xs">
                          <p className="font-bold text-white">{order.shipping_address?.fullName}</p>
                          <p className="text-gray-500">{order.shipping_address?.phone}</p>
                          <p className="text-gray-500">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                          {order.shipping_address?.transactionId && (
                            <p className="text-[10px] text-amber-400 font-mono mt-1 select-all">TXID: {order.shipping_address.transactionId}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={item.id || `${order.id}-item-${idx}`} className="flex items-center space-x-2.5">
                              <div className="w-8 h-10 bg-white/5 rounded overflow-hidden flex-shrink-0 border border-white/10">
                                <img
                                  src={item.product?.main_image_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-white max-w-[150px] truncate leading-tight">{item.product?.name || 'Product'}</p>
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                                  <span>Qty: {item.quantity}</span>
                                  {item.selected_variant && (
                                    <span className="px-1 py-0.2 rounded bg-primary/10 border border-primary/20 text-primary-light font-extrabold text-[9px]">
                                      Size: {item.selected_variant}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-white">₹{order.total_amount}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="bg-white/5 border border-white/10 text-xs text-white rounded-lg p-1 focus:outline-none"
                            >
                              <option value="PENDING_VERIFICATION" className="bg-surface">Pending Verification</option>
                              <option value="PAID" className="bg-surface">Paid</option>
                              <option value="PROCESSING" className="bg-surface">Processing</option>
                              <option value="SHIPPED" className="bg-surface">Shipped</option>
                              <option value="DELIVERED" className="bg-surface">Delivered</option>
                              <option value="CANCELLED" className="bg-surface">Cancelled</option>
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="h-5.5 w-5.5 text-danger animate-bounce" />
                <span>Inventory & Low Stock Warnings</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/2 text-xs font-bold uppercase text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Pricing</th>
                      <th className="px-6 py-4">Available Stock</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-white/1">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{prod.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{prod.slug}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">₹{prod.price}</td>
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <MessageSquare className="h-5.5 w-5.5 text-secondary-light" />
                <span>Customer Questions</span>
              </h2>

              <div className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No questions asked by customers yet.</p>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider text-secondary">Question Details:</p>
                          <p className="text-sm font-semibold text-white">"{q.question}"</p>
                          <p className="text-[10px] text-gray-500">Asked on: {new Date(q.created_at).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-gray-500 hover:text-danger p-1"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      <div className="space-y-2 border-t border-white/5 pt-3">
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
                            className="flex-grow px-3 py-1.5 rounded-lg text-xs glass-input focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:brightness-115"
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Star className="h-5.5 w-5.5 text-yellow-500 fill-current" />
                <span>Reviews Moderation</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/2 text-xs font-bold uppercase text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Rating</th>
                      <th className="px-6 py-4">Comment</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-white/1">
                        <td className="px-6 py-4 text-xs">
                          <p className="font-bold text-white">{rev.user_name}</p>
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
                            className="p-1 bg-white/5 text-gray-400 hover:text-white rounded border border-white/10"
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Mail className="h-5.5 w-5.5 text-secondary-light" />
                  <span>Newsletter Drops List ({subscribers.length})</span>
                </h2>
                <Button size="sm" variant="outline" onClick={exportSubscribersCSV}>
                  <Download className="mr-1.5 h-4 w-4" /> Export CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/2 text-xs font-bold uppercase text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Subscriber Email</th>
                      <th className="px-6 py-4">Subscribed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/1">
                        <td className="px-6 py-4 font-bold text-white text-sm">{sub.email}</td>
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
              <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
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
                      <div key={req.id} className="bg-white/2 border border-white/5 rounded-xl p-5 space-y-4">
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
                            <p className="text-white font-medium">{req.reason}</p>
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
                              <img src={req.photo_url} alt="Replacement proof" className="w-24 h-24 object-cover rounded-xl border border-white/10 hover:border-primary/50 transition-all" />
                            </a>
                          </div>
                        )}

                        {req.admin_notes && (
                          <div className="bg-white/3 rounded-lg p-3 border border-white/5">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Admin Notes</p>
                            <p className="text-sm text-gray-300">{req.admin_notes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                          <select
                            value={req.status}
                            onChange={(e) => handleUpdateReplacement(req.id, e.target.value)}
                            className="bg-white/5 border border-white/10 text-xs text-white rounded-lg py-2 px-3 focus:outline-none focus:border-primary/50"
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
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white rounded-lg transition-all"
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
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
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/2 text-xs font-bold uppercase text-gray-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Min Order</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {coupons.map((coupon) => (
                      <tr key={coupon.code} className="hover:bg-white/1">
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-white bg-white/5 px-2.5 py-1 rounded-lg text-xs tracking-wider">{coupon.code}</span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className={`px-2 py-0.5 rounded border font-bold uppercase ${
                            coupon.type === 'PERCENT' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                          }`}>
                            {coupon.type === 'PERCENT' ? 'Percentage' : 'Fixed Amount'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
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
                            className="p-1.5 bg-white/5 border border-white/10 hover:border-primary/40 text-primary-light rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.code)}
                            className="p-1.5 bg-white/5 border border-white/10 hover:border-danger/40 text-danger rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white/2 rounded-xl border border-white/5 p-4 text-xs text-gray-400 space-y-1">
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
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
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
                    className="w-full px-4 py-3 rounded-xl text-sm glass-input placeholder-gray-500 focus:outline-none resize-none"
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
                    <div className="bg-gradient-to-r from-primary via-[#ff4757] to-secondary text-white text-center py-2.5 px-4 text-xs font-bold tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md">
                      <div className="animate-pulse w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
                      <span>{announcementText}</span>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 italic text-sm border border-dashed border-white/10 rounded-xl">
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

                <div className="bg-white/2 rounded-xl border border-white/5 p-4 text-xs text-gray-400 space-y-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-surface border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Category Selection
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-background border border-white/10 text-white focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-surface text-white">
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
                    className="h-4.5 w-4.5 rounded border-white/10 accent-primary"
                  />
                  <label htmlFor="featuredCheckbox" className="text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer">
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
                  className="w-full px-4 py-3 rounded-xl text-sm glass-input placeholder-gray-500 focus:outline-none resize-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-surface border border-white/5 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-6">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative max-w-xl w-full bg-surface border border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <button
              onClick={() => setViewScreenshotUrl(null)}
              className="absolute top-4 right-4 p-2 bg-[#0B0F19] text-gray-400 hover:text-white rounded-full border border-white/10 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4">Payment Screenshot Details</h3>
            <div className="w-full bg-[#0B0F19] rounded-xl overflow-hidden border border-white/5 max-h-[70vh] flex justify-center items-center">
              <img src={viewScreenshotUrl} alt="UPI Payment screenshot proof" className="max-w-full h-auto object-contain max-h-[68vh]" />
            </div>
          </div>
        </div>
      )}

      {/* COURIER TRACKING DETAILS MODAL */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-surface border border-white/5 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setIsTrackingModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-[#0B0F19] text-gray-400 hover:text-white rounded-full border border-white/10 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-6">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-surface border border-white/5 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => {
                setIsCouponModalOpen(false);
                setEditingCoupon(null);
              }}
              className="absolute top-4 right-4 p-2 bg-[#0B0F19] text-gray-400 hover:text-white rounded-full border border-white/10 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-6">
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
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-[#0B0F19] border border-white/10 text-white focus:outline-none"
                >
                  <option value="PERCENT" className="bg-surface text-white">Percentage (%)</option>
                  <option value="FIXED" className="bg-surface text-white">Fixed Amount (₹)</option>
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
                  className="h-4.5 w-4.5 rounded border-white/10 accent-primary"
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
