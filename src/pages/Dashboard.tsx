import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/database';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { User, ShoppingBag, Heart, Settings, CreditCard, ChevronDown, ChevronUp, RefreshCcw, X } from 'lucide-react';
import { TrackingStepper } from '../components/order/TrackingStepper';


export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const { user, profile, updateProfile, initialized } = useAuthStore();
  const { items: wishlistItems, fetchWishlist, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Edit Profile States
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Replacement Request States
  const [replacementOrderId, setReplacementOrderId] = useState<string | null>(null);
  const [replacementReason, setReplacementReason] = useState('Damaged Item');
  const [replacementDesc, setReplacementDesc] = useState('');
  const [replacementPhoto, setReplacementPhoto] = useState<File | null>(null);
  const [replacementSubmitting, setReplacementSubmitting] = useState(false);
  const [replacementSuccess, setReplacementSuccess] = useState(false);

  useEffect(() => {
    if (initialized && !user) {
      navigate('/auth?redirect=/dashboard');
    }
  }, [user, initialized, navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Fetch wishlist & orders
  useEffect(() => {
    if (!user) return;

    fetchWishlist(user.id);

    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items (
              *,
              product:products (*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const dbOrders = data || [];

        const ordersWithVariantsMapped = dbOrders.map((order: any) => {
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
        console.error('Error fetching user orders:', err);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Sync profile details if store changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim()
      });
      setProfileMsg('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      setProfileMsg('Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleReplacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replacementOrderId) return;
    setReplacementSubmitting(true);
    try {
      let photoUrl: string | null = null;

      // Upload photo if provided
      if (replacementPhoto) {
        const fileExt = replacementPhoto.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        try {
          const { error: uploadErr } = await supabase.storage
            .from('replacement-photos')
            .upload(filePath, replacementPhoto);
          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from('replacement-photos')
              .getPublicUrl(filePath);
            photoUrl = publicUrl;
          }
        } catch (_) {}
      }

      const dbPayload = {
        order_id: replacementOrderId,
        user_id: user.id,
        reason: replacementReason,
        description: replacementDesc,
        photo_url: photoUrl,
        status: 'PENDING',
        admin_notes: null
      };

      // Try DB insertion
      const { error: dbErr } = await supabase
        .from('replacement_requests')
        .insert(dbPayload);

      if (dbErr) throw dbErr;

      // Spinner stays active during delay, then modal closes
      setTimeout(() => {
        setReplacementSubmitting(false);
        setReplacementOrderId(null);
        setReplacementDesc('');
        setReplacementPhoto(null);
        setReplacementSuccess(false);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit replacement request.');
      setReplacementSubmitting(false);
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'PAID': return 'text-success bg-success/10 border-success/20';
      case 'PROCESSING': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'SHIPPED': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'DELIVERED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'CANCELLED': return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'PAID': return 'text-success bg-success/10 border-success/20';
      case 'REJECTED': return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
            
            {/* User Profile Header */}
            <div className="text-center space-y-3 pb-6 border-b border-white/5">
              <div className="h-16 w-16 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center text-primary font-bold text-2xl mx-auto overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (profile.full_name || user.email || 'U')[0].toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-bold text-white text-base truncate">{profile.full_name || 'Anime Fan'}</h3>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Tab buttons */}
            <nav className="flex flex-row lg:flex-col gap-1 w-full overflow-x-auto pb-2 lg:pb-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                  activeTab === 'profile' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <User className="h-4.5 w-4.5" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                  activeTab === 'orders' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                <span>My Orders</span>
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                  activeTab === 'wishlist' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Heart className="h-4.5 w-4.5" />
                <span>Wishlist</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                  activeTab === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings className="h-4.5 w-4.5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-grow">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <User className="h-5.5 w-5.5 text-primary" />
                <span>Profile Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email Address</span>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                
                <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">User Role</span>
                  <p className="text-white font-medium capitalize">{profile.role}</p>
                </div>

                <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Account Created</span>
                  <p className="text-white font-medium">
                    {profile.created_at && !isNaN(Date.parse(profile.created_at))
                      ? new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Orders */}
          {activeTab === 'orders' && (
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <ShoppingBag className="h-5.5 w-5.5 text-primary" />
                <span>My Orders</span>
              </h2>

              {ordersLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-4">You have not placed any orders yet.</p>
                  <Button size="sm" onClick={() => navigate('/shop')}>Browse Merch</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const itemsList = order.items || [];
                    return (
                      <div key={order.id} className="border border-white/5 rounded-xl bg-white/1 overflow-hidden transition-all">
                        {/* Summary Header */}
                        <div
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-white/2"
                        >
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Order ID: <span className="font-bold text-gray-300">{order.id}</span></p>
                            <p className="text-xs text-gray-400">Placed on: {order.created_at && !isNaN(Date.parse(order.created_at)) ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${getOrderStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                            
                            <span className="text-sm font-extrabold text-white">₹{order.total_amount}</span>
                            {isExpanded ? <ChevronUp className="h-4.5 w-4.5 text-gray-400" /> : <ChevronDown className="h-4.5 w-4.5 text-gray-400" />}
                          </div>
                        </div>

                        {/* Order Items Details */}
                        {isExpanded && (
                          <div className="p-5 bg-black/20 border-t border-white/5 space-y-6 text-sm">
                            {/* Visual Shipment Tracking Stepper */}
                            <div className="border-b border-white/5 pb-6">
                              <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-wider text-gray-400">Order Shipment Progress:</h4>
                              <TrackingStepper 
                                status={order.status} 
                                trackingInfo={(order.shipping_address as any)?.tracking_info} 
                              />
                            </div>

                            <div>
                              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider text-gray-400">Shipping Details:</h4>
                              <p className="text-xs text-gray-300">{order.shipping_address?.fullName} | {order.shipping_address?.phone}</p>
                              <p className="text-xs text-gray-400">{order.shipping_address?.address}, {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
                              {order.shipping_address?.transactionId && (
                                <p className="text-xs text-amber-400 font-mono mt-1 select-all">UPI Transaction ID: {order.shipping_address.transactionId}</p>
                              )}
                            </div>

                            <div className="space-y-2.5">
                              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-gray-400">Order Items:</h4>
                              {itemsList.map((item, idx) => (
                                <div key={item.id || `${order.id}-item-${idx}`} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-12 bg-surface rounded overflow-hidden flex-shrink-0">
                                      <img src={item.product?.main_image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-white text-xs sm:text-sm line-clamp-1">{item.product?.name || 'Anime Product'}</p>
                                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                                        <span>Qty: {item.quantity} x ₹{item.price}</span>
                                        {(item as any).selected_variant && (
                                          <span className="px-1.5 py-0.5 rounded bg-primary/15 border border-primary/25 text-primary-light font-extrabold text-[9px]">
                                            Size: {(item as any).selected_variant}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="font-bold text-xs sm:text-sm text-white">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2">
                              <span className="text-gray-500 flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5" /> Payment Status:
                              </span>
                              <span className={`font-semibold px-2 py-0.5 rounded border uppercase text-[10px] ${getPaymentStatusColor(order.payment_status)}`}>
                                {order.payment_status.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Request Replacement Button - only for DELIVERED orders */}
                            {order.status === 'DELIVERED' && (
                              <div className="pt-3 border-t border-white/5">
                                <button
                                  onClick={() => {
                                    setReplacementOrderId(order.id);
                                    setReplacementReason('Damaged Item');
                                    setReplacementDesc('');
                                    setReplacementPhoto(null);
                                    setReplacementSuccess(false);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/25 rounded-lg hover:bg-amber-400/20 transition-all"
                                >
                                  <RefreshCcw className="h-3.5 w-3.5" />
                                  Request Replacement
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Heart className="h-5.5 w-5.5 text-primary" />
                <span>My Wishlist</span>
              </h2>

              {wishlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-4">Your wishlist is empty.</p>
                  <Button size="sm" onClick={() => navigate('/shop')}>Browse Merch</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {wishlistItems.map((product) => (
                    <div key={product.id} className="border border-white/5 rounded-xl bg-white/1 overflow-hidden flex flex-col group">
                      <div className="aspect-[4/5] bg-surface relative overflow-hidden">
                        <img src={product.main_image_url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => toggleWishlist(user.id, product)}
                          className="absolute top-3 right-3 p-2 bg-danger/25 text-danger rounded-full border border-danger/30"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                      </div>

                      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-primary-light">
                            <Link to={`/product/${product.slug}`}>{product.name}</Link>
                          </h4>
                          <p className="font-bold text-xs text-gray-400 mt-1">₹{product.price}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            fullWidth
                            onClick={() => {
                              addItem(product, 1);
                              alert('Added to cart!');
                            }}
                          >
                            Add To Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Settings (Edit Profile) */}
          {activeTab === 'settings' && (
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/5 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Settings className="h-5.5 w-5.5 text-primary" />
                <span>Account Settings</span>
              </h2>

              {profileMsg && (
                <div className="p-4 bg-primary/10 border border-primary/20 text-primary-light text-sm font-semibold rounded-xl">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                <Input
                  label="Display Name"
                  type="text"
                  required
                  placeholder="Naruto Uzumaki"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <Input
                  label="Avatar Image URL"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  helperText="Leave empty to use default initials icon."
                />

                <Button type="submit" loading={profileSaving}>
                  Save Changes
                </Button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Replacement Request Modal */}
      {replacementOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setReplacementOrderId(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full border border-white/10 bg-background/50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
                <RefreshCcw className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Request Replacement</h3>
                <p className="text-xs text-gray-500">Order #{replacementOrderId.slice(-8)}</p>
              </div>
            </div>

            {replacementSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto">
                  <svg className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-bold">Request Submitted!</p>
                <p className="text-xs text-gray-400">Our team will review your request and get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleReplacementSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Reason for Replacement</label>
                  <select
                    value={replacementReason}
                    onChange={(e) => setReplacementReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                  >
                    <option className="bg-surface">Damaged Item</option>
                    <option className="bg-surface">Wrong Item Received</option>
                    <option className="bg-surface">Missing Item</option>
                    <option className="bg-surface">Poor Quality</option>
                    <option className="bg-surface">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Describe the Issue</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Please describe what went wrong in detail..."
                    value={replacementDesc}
                    onChange={(e) => setReplacementDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Attach Photo (Optional)</label>
                  {replacementPhoto ? (
                    <div className="flex items-center gap-3">
                      <img src={URL.createObjectURL(replacementPhoto)} alt="" className="w-16 h-16 object-cover rounded-xl border border-white/10" />
                      <button type="button" onClick={() => setReplacementPhoto(null)} className="text-xs text-danger hover:underline">Remove</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/15 hover:border-white/30 cursor-pointer bg-white/2 hover:bg-white/5 transition-all">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-400">Click to upload a photo of the issue</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setReplacementPhoto(e.target.files[0])} />
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setReplacementOrderId(null)} fullWidth>Cancel</Button>
                  <Button type="submit" loading={replacementSubmitting} fullWidth>Submit Request</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
